import { $, h, mountDrop, download, stripExt, fail, progress, toast, parseRanges, newZip, canvasToBlob, embedAnyImage, fmtBytes, imgExt, tick } from './util.js';
import { t, onLang } from './i18n.js';
import { openPdf, closePdf, renderPage, rasterizePdf, PAGE_SIZES } from './pdfcore.js';
import { makeFontSet, wrapParagraph, baseDirection } from './textengine.js';

const PDFLib = window.PDFLib;
const { PDFDocument, rgb } = PDFLib;
const C = { imgs: [], p2i: null, cmp: null };

export function init() {
  // ---- images -> pdf
  mountDrop($('#i2p-drop'), files => { C.imgs.push(...files); listImgs(); });
  $('#i2p-go').onclick = imagesToPdf;
  // ---- pdf -> images
  mountDrop($('#p2i-drop'), async files => { C.p2i = files[0]; $('#p2i-name').textContent = files[0].name; });
  $('#p2i-go').onclick = pdfToImages;
  // ---- text -> pdf
  $('#t2p-go').onclick = textToPdf;
  // ---- compress
  mountDrop($('#cmp-drop'), files => { C.cmp = files[0]; $('#cmp-name').textContent = `${files[0].name} · ${fmtBytes(files[0].size)}`; $('#cmp-result').textContent = ''; });
  $('#cmp-go').onclick = compress;
  onLang(listImgs);
}

function listImgs() {
  const ol = $('#i2p-list'); if (!ol) return; ol.replaceChildren();
  C.imgs.forEach((f, i) => {
    const mv = (d) => () => { const j = i + d; if (j < 0 || j >= C.imgs.length) return; [C.imgs[i], C.imgs[j]] = [C.imgs[j], C.imgs[i]]; listImgs(); };
    ol.append(h('li', {}, h('span', { dir: 'auto' }, f.name), h('button', { onclick: mv(-1), 'aria-label': 'Up' }, '↑'), h('button', { onclick: mv(1), 'aria-label': 'Down' }, '↓'),
      h('button', { onclick: () => { C.imgs.splice(i, 1); listImgs(); }, title: t('cv.remove'), 'aria-label': t('cv.remove') }, '✕')));
  });
}

async function imagesToPdf() {
  if (!C.imgs.length) return toast(t('ocr.nofile'), 'warn');
  try {
    progress.show(t('msg.working'));
    const doc = await PDFDocument.create();
    const mode = $('#i2p-size').value, margin = +$('#i2p-margin').value || 0, orient = $('#i2p-orient').value;
    for (let i = 0; i < C.imgs.length; i++) {
      const img = await embedAnyImage(doc, C.imgs[i]);
      const iw = img.width * 0.75, ih = img.height * 0.75; // px -> pt
      let pw, ph;
      if (mode === 'fit') { pw = iw + margin * 2; ph = ih + margin * 2; }
      else {
        [pw, ph] = PAGE_SIZES[mode];
        const land = orient === 'l' || (orient === 'auto' && img.width > img.height);
        if (land) [pw, ph] = [ph, pw];
      }
      const page = doc.addPage([pw, ph]);
      const k = Math.min((pw - margin * 2) / iw, (ph - margin * 2) / ih, mode === 'fit' ? 1 : Infinity);
      const w = iw * k, hgt = ih * k;
      page.drawImage(img, { x: (pw - w) / 2, y: (ph - hgt) / 2, width: w, height: hgt });
      progress.set((i + 1) / C.imgs.length); await tick();
    }
    doc.setProducer('Pagecraft');
    download(await doc.save(), 'images.pdf', 'application/pdf');
    toast(t('msg.done'));
  } catch (e) { fail(e); } finally { progress.hide(); }
}

async function pdfToImages() {
  if (!C.p2i) return toast(t('msg.nopdf'), 'warn');
  try {
    progress.show(t('msg.working'));
    const doc = await openPdf(await C.p2i.arrayBuffer());
    const type = $('#p2i-fmt').value, ext = imgExt[type], dpi = +$('#p2i-dpi').value;
    const txt = $('#p2i-pages').value.trim();
    const idx = txt ? parseRanges(txt, doc.numPages) : [...Array(doc.numPages).keys()];
    const base = stripExt(C.p2i.name), zip = newZip(), blobs = [];
    for (let k = 0; k < idx.length; k++) {
      const page = await doc.getPage(idx[k] + 1);
      const canvas = h('canvas');
      await renderPage(page, dpi / 72, canvas).done;
      const blob = await canvasToBlob(canvas, type, 0.92);
      blobs.push(blob); zip.file(`${base}-${String(idx[k] + 1).padStart(String(doc.numPages).length, '0')}.${ext}`, blob);
      canvas.width = canvas.height = 0; page.cleanup();
      progress.set((k + 1) / idx.length); await tick();
    }
    if (blobs.length === 1) download(blobs[0], `${base}-${idx[0] + 1}.${ext}`);
    else download(await zip.generateAsync({ type: 'blob' }), `${base}-images.zip`);
    await closePdf(doc); toast(t('msg.done'));
  } catch (e) { fail(e); } finally { progress.hide(); }
}

async function textToPdf() {
  const text = $('#t2p-text').value;
  if (!text.trim()) return;
  try {
    progress.show(t('msg.working'));
    const doc = await PDFDocument.create();
    const fonts = await makeFontSet(doc, PDFLib, window.fontkit);
    const size = +$('#t2p-size').value || 14, [pw, ph] = PAGE_SIZES[$('#t2p-page').value], margin = 56, lh = size * 1.45;
    const forced = $('#t2p-dir').value === 'auto' ? undefined : $('#t2p-dir').value;
    let page = doc.addPage([pw, ph]), y = ph - margin - size;
    for (const para of text.replace(/\r/g, '').split('\n')) {
      const dir = baseDirection(para, forced);
      for (const line of await wrapParagraph(para, size, pw - margin * 2, fonts, forced)) {
        if (y < margin) { page = doc.addPage([pw, ph]); y = ph - margin - size; }
        if (line) {
          const w = await fonts.measureLine(line, size, forced);
          const x = dir === 'rtl' ? pw - margin - w : margin;
          await fonts.drawLine(page, line, { x, y, size, color: rgb(0.08, 0.08, 0.1), forceDir: forced });
        }
        y -= lh;
      }
    }
    doc.setProducer('Pagecraft');
    download(await doc.save(), 'text.pdf', 'application/pdf');
    toast(t('msg.done'));
  } catch (e) { fail(e); } finally { progress.hide(); }
}

async function compress() {
  if (!C.cmp) return toast(t('msg.nopdf'), 'warn');
  try {
    progress.show(t('msg.working'));
    const bytes = new Uint8Array(await C.cmp.arrayBuffer());
    let out;
    if ($('#cmp-mode').value === 'lossless') {
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true, updateMetadata: false });
      out = await doc.save({ useObjectStreams: true, addDefaultPage: false });
    } else {
      out = await rasterizePdf(bytes, { dpi: +$('#cmp-dpi').value, quality: +$('#cmp-q').value / 100, onProgress: f => progress.set(f) });
    }
    const before = C.cmp.size, after = out.length;
    if (after < before) {
      $('#cmp-result').textContent = t('cv.result', { before: fmtBytes(before), after: fmtBytes(after), pct: Math.round((1 - after / before) * 100) });
      download(out, stripExt(C.cmp.name) + '-compressed.pdf', 'application/pdf');
    } else {
      $('#cmp-result').textContent = t('cv.result_bigger', { before: fmtBytes(before), after: fmtBytes(after) });
    }
  } catch (e) { fail(e); } finally { progress.hide(); }
}
