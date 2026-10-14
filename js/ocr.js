import { $, $$, h, mountDrop, download, stripExt, fail, progress, toast, parseRanges, canvasToBlob, tick } from './util.js';
import { t, lang, onLang } from './i18n.js';
import { openPdf, closePdf, renderPage } from './pdfcore.js';

// code, English name, native name
const LANGS = [
  ['eng', 'English', 'English'], ['ara', 'Arabic', 'العربية'], ['fra', 'French', 'Français'], ['spa', 'Spanish', 'Español'],
  ['deu', 'German', 'Deutsch'], ['ita', 'Italian', 'Italiano'], ['por', 'Portuguese', 'Português'], ['nld', 'Dutch', 'Nederlands'],
  ['rus', 'Russian', 'Русский'], ['ukr', 'Ukrainian', 'Українська'], ['pol', 'Polish', 'Polski'], ['tur', 'Turkish', 'Türkçe'],
  ['ell', 'Greek', 'Ελληνικά'], ['heb', 'Hebrew', 'עברית'], ['fas', 'Persian', 'فارسی'], ['urd', 'Urdu', 'اردو'],
  ['hye', 'Armenian', 'Հայերեն'], ['kat', 'Georgian', 'ქართული'], ['hin', 'Hindi', 'हिन्दी'], ['ben', 'Bengali', 'বাংলা'],
  ['chi_sim', 'Chinese (Simplified)', '简体中文'], ['chi_tra', 'Chinese (Traditional)', '繁體中文'], ['jpn', 'Japanese', '日本語'], ['kor', 'Korean', '한국어'],
  ['tha', 'Thai', 'ไทย'], ['vie', 'Vietnamese', 'Tiếng Việt'], ['ind', 'Indonesian', 'Bahasa Indonesia'], ['msa', 'Malay', 'Bahasa Melayu'],
  ['swe', 'Swedish', 'Svenska'], ['nor', 'Norwegian', 'Norsk'], ['dan', 'Danish', 'Dansk'], ['fin', 'Finnish', 'Suomi'],
  ['ces', 'Czech', 'Čeština'], ['hun', 'Hungarian', 'Magyar'], ['ron', 'Romanian', 'Română'], ['bul', 'Bulgarian', 'Български'],
  ['srp', 'Serbian', 'Српски'], ['hrv', 'Croatian', 'Hrvatski'], ['cat', 'Catalan', 'Català'],
];
const UI_TO_OCR = { ar: 'ara', fr: 'fra', es: 'spa' };
// Language data defaults to tesseract.js' CDN. To self-host (offline / privacy), put <lang>.traineddata.gz files in a folder
// and point to it with <meta name="ocr-lang-path" content="./tessdata"> or ?langPath=./tessdata
const LANG_PATH = new URLSearchParams(location.search).get('langPath') || document.querySelector('meta[name="ocr-lang-path"]')?.content || undefined;
const O = { files: [], chosen: new Set(['eng']), text: '', pdf: null, cancel: false, worker: null };

export function init() {
  if (UI_TO_OCR[lang()]) O.chosen.add(UI_TO_OCR[lang()]);
  mountDrop($('#ocr-drop'), files => { O.files = files; $('#ocr-files').textContent = files.map(f => f.name).join(' · '); });
  $('#ocr-lq').addEventListener('input', renderLangs);
  $('#ocr-go').onclick = run;
  $('#ocr-cancel').onclick = async () => { O.cancel = true; try { await O.worker?.terminate(); } catch { /* ignore */ } };
  $('#ocr-copy').onclick = async () => { try { await navigator.clipboard.writeText($('#ocr-out').value); toast(t('ocr.copied')); } catch { $('#ocr-out').select(); document.execCommand('copy'); } };
  $('#ocr-dltxt').onclick = () => download(new Blob([$('#ocr-out').value], { type: 'text/plain;charset=utf-8' }), (O.files[0] ? stripExt(O.files[0].name) : 'ocr') + '.txt');
  $('#ocr-dlpdf').onclick = () => O.pdf && download(O.pdf, (O.files[0] ? stripExt(O.files[0].name) : 'ocr') + '-searchable.pdf', 'application/pdf');
  renderLangs();
  onLang(renderLangs);
}

function renderLangs() {
  const q = $('#ocr-lq').value.trim().toLowerCase();
  const box = $('#ocr-langs'); box.replaceChildren();
  const rows = LANGS.filter(([c, en, nat]) => !q || c.includes(q) || en.toLowerCase().includes(q) || nat.toLowerCase().includes(q));
  // chosen first
  rows.sort((a, b) => (O.chosen.has(b[0]) - O.chosen.has(a[0])));
  for (const [code, en, nat] of rows) {
    const cb = h('input', { type: 'checkbox' }); cb.checked = O.chosen.has(code);
    cb.onchange = () => { cb.checked ? O.chosen.add(code) : O.chosen.delete(code); };
    box.append(h('label', { title: en + ' (' + code + ')' }, cb, h('span', { dir: 'auto' }, nat), h('small', { class: 'muted' }, lang() === 'en' ? '' : en)));
  }
}

function preprocess(canvas, mode) {
  if (mode === 'none') return canvas;
  const ctx = canvas.getContext('2d'); const img = ctx.getImageData(0, 0, canvas.width, canvas.height); const d = img.data;
  const hist = new Uint32Array(256);
  for (let i = 0; i < d.length; i += 4) { const g = (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) | 0; d[i] = d[i + 1] = d[i + 2] = g; hist[g]++; }
  if (mode === 'gray') { // stretch contrast between 1st and 99th percentile
    const total = d.length / 4; let lo = 0, hi = 255, acc = 0;
    for (let i = 0; i < 256; i++) { acc += hist[i]; if (acc > total * 0.01) { lo = i; break; } }
    acc = 0; for (let i = 255; i >= 0; i--) { acc += hist[i]; if (acc > total * 0.01) { hi = i; break; } }
    const k = 255 / Math.max(1, hi - lo);
    for (let i = 0; i < d.length; i += 4) d[i] = d[i + 1] = d[i + 2] = Math.max(0, Math.min(255, (d[i] - lo) * k));
  } else { // Otsu threshold
    const total = d.length / 4; let sum = 0; for (let i = 0; i < 256; i++) sum += i * hist[i];
    let sumB = 0, wB = 0, best = 0, thr = 128;
    for (let i = 0; i < 256; i++) { wB += hist[i]; if (!wB) continue; const wF = total - wB; if (!wF) break; sumB += i * hist[i]; const mB = sumB / wB, mF = (sum - sumB) / wF, v = wB * wF * (mB - mF) ** 2; if (v > best) { best = v; thr = i; } }
    for (let i = 0; i < d.length; i += 4) d[i] = d[i + 1] = d[i + 2] = d[i] > thr ? 255 : 0;
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

async function* pagesOf(files, rangeText, scale) {
  for (const f of files) {
    if (f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')) {
      const doc = await openPdf(await f.arrayBuffer());
      const idx = rangeText.trim() ? parseRanges(rangeText, doc.numPages) : [...Array(doc.numPages).keys()];
      for (const i of idx) {
        const page = await doc.getPage(i + 1), canvas = h('canvas');
        await renderPage(page, scale * 96 / 72, canvas).done; page.cleanup();
        yield { canvas, label: `${f.name} · ${t('msg.page')} ${i + 1}`, name: f.name };
      }
      await closePdf(doc);
    } else {
      const bmp = await createImageBitmap(f), canvas = h('canvas');
      const k = Math.min(1, 4000 / Math.max(bmp.width, bmp.height));      // cap huge photos
      canvas.width = Math.round(bmp.width * k); canvas.height = Math.round(bmp.height * k);
      canvas.getContext('2d').drawImage(bmp, 0, 0, canvas.width, canvas.height);
      yield { canvas, label: f.name, name: f.name };
    }
  }
}

async function countPages(files, rangeText) {
  let n = 0;
  for (const f of files) {
    if (f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')) {
      const doc = await openPdf(await f.arrayBuffer());
      n += rangeText.trim() ? parseRanges(rangeText, doc.numPages).length : doc.numPages; await closePdf(doc);
    } else n++;
  }
  return n;
}

async function run() {
  if (!O.files.length) return toast(t('ocr.nofile'), 'warn');
  if (!O.chosen.size) return toast(t('ocr.nolang'), 'warn');
  const { PDFDocument } = window.PDFLib;
  const wantPdf = $('#ocr-pdf').checked, rangeText = $('#ocr-pages').value, scale = +$('#ocr-scale').value, pre = $('#ocr-pre').value;
  O.cancel = false; $('#ocr-go').hidden = true; $('#ocr-cancel').hidden = false;
  ['#ocr-copy', '#ocr-dltxt', '#ocr-dlpdf'].forEach(s => ($(s).disabled = true));
  $('#ocr-out').value = ''; O.pdf = null;
  let total = 1, done = 0;
  try {
    progress.show(t('ocr.loading'));
    total = await countPages(O.files, rangeText);
    const langs = [...O.chosen];
    let cur = 0;
    O.worker = await window.Tesseract.createWorker(langs, 1, {
      workerPath: new URL('../vendor/tesseract/worker.min.js', import.meta.url).href,
      corePath: new URL('../vendor/tesseract/core/', import.meta.url).href,
      ...(LANG_PATH ? { langPath: LANG_PATH } : {}),
      logger: m => {
        if (m.status === 'recognizing text') progress.set((done + m.progress) / total, t('ocr.progress', { n: done + 1, total }));
        else if (m.progress != null && done === 0) progress.set(m.progress, t('ocr.loading') + ' ' + (m.status || ''));
      },
    });
    const parts = []; const out = wantPdf ? await PDFDocument.create() : null;
    for await (const pg of pagesOf(O.files, rangeText, scale)) {
      if (O.cancel) break;
      const blob = await canvasToBlob(preprocess(pg.canvas, pre), 'image/png');
      const { data } = await O.worker.recognize(blob, { pdfTitle: pg.name }, { text: true, pdf: wantPdf });
      parts.push(total > 1 ? `--- ${pg.label} ---\n${data.text.trim()}` : data.text.trim());
      $('#ocr-out').value = parts.join('\n\n');
      if (wantPdf && data.pdf) { const src = await PDFDocument.load(new Uint8Array(data.pdf)); (await out.copyPages(src, src.getPageIndices())).forEach(p => out.addPage(p)); }
      pg.canvas.width = pg.canvas.height = 0;
      done++; cur++; await tick();
    }
    if (out && out.getPageCount()) { out.setProducer('Pagecraft (Tesseract OCR)'); O.pdf = await out.save(); }
    if (!O.cancel) toast(t('ocr.done'));
  } catch (e) { if (!O.cancel) fail(e); }
  finally {
    try { await O.worker?.terminate(); } catch { /* ignore */ }
    O.worker = null; progress.hide();
    $('#ocr-go').hidden = false; $('#ocr-cancel').hidden = true;
    const has = !!$('#ocr-out').value;
    $('#ocr-copy').disabled = $('#ocr-dltxt').disabled = !has; $('#ocr-dlpdf').disabled = !O.pdf;
  }
}
