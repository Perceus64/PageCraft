import { $, $$, h, mountDrop, download, stripExt, fail, progress, toast, hexToRgb01, embedAnyImage, canvasToBlob } from './util.js';
import { t } from './i18n.js';
import { openPdf, closePdf, renderPage, rasterizePdf } from './pdfcore.js';
import { makeFontSet } from './textengine.js';
import { resolveFont, cssFamily, fillFontSelect, preloadFont } from './fonts.js';

const PDFLib = window.PDFLib;
const { PDFDocument, rgb, degrees } = PDFLib;
const PX = 96 / 72;
const BASE = 0.988;   // text baseline offset (em) for line-height 1.2 with Noto metrics
const LH = 1.2;

// objs live in *displayed* page points (top-left origin)
const E = { textCache: {}, doc: null, bytes: null, file: null, n: 1, zoom: 1.25, scale: 1, vp1: [], objs: [], sel: null, tool: 'select', nextId: 1, pending: null, token: 0, task: null };

export function init() {
  mountDrop($('#edit-drop'), files => load(files[0]));
  $$('#e-tools .tool').forEach(b => b.onclick = () => setTool(b.dataset.tool));
  $('#e-prev').onclick = () => go(E.n - 1); $('#e-next').onclick = () => go(E.n + 1);
  $('#e-page').onchange = e => go(+e.target.value);
  $('#e-zin').onclick = () => zoom(E.zoom * 1.2); $('#e-zout').onclick = () => zoom(E.zoom / 1.2);
  $('#e-del').onclick = delSel;
  $('#e-export').onclick = exportPdf;
  for (const id of ['e-color', 'e-size', 'e-opacity']) $('#' + id).addEventListener('input', applyProps);
  $('#e-text').addEventListener('input', () => { const o = sel(); if (o?.type === 'text') { o.text = $('#e-text').value; paint(o); } });
  fillFontSelect($('#e-font')); fillFontSelect($('#w-font'));
  const fontChanged = () => { const o = sel(); if (o?.type === 'text') { o.font = $('#e-font').value; o.bold = $('#e-bold').checked; preloadFont(o.font, o.bold ? 700 : 400, o.text); paint(o); } };
  $('#e-font').addEventListener('change', fontChanged); $('#e-bold').addEventListener('change', fontChanged);
  $('#e-dir').addEventListener('change', () => { const o = sel(); if (o?.type === 'text') { o.dir = $('#e-dir').value; paint(o); } });
  document.addEventListener('keydown', e => {
    if (document.body.dataset.tab !== 'edit' || !E.doc) return;
    if ((e.key === 'Delete' || e.key === 'Backspace') && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName) && !document.activeElement?.isContentEditable) delSel();
    if (e.key === 'Escape') { setTool('select'); select(null); }
  });
  const ov = $('#e-overlay');
  ov.addEventListener('pointerdown', onOverlayDown);
  $('#e-imgpick').addEventListener('change', onImagePicked);
  initSignature();
}

// ------------------------------------------------------------------ load / render
async function load(file) {
  try {
    progress.show(t('msg.working'));
    closePdf(E.doc);
    E.file = file; E.bytes = new Uint8Array(await file.arrayBuffer());
    E.doc = await openPdf(E.bytes);
    E.objs = []; E.sel = null; E.n = 1; E.textCache = {};
    E.vp1 = [];
    for (let i = 1; i <= E.doc.numPages; i++) E.vp1.push((await E.doc.getPage(i)).getViewport({ scale: 1 }));
    $('#edit-ui').hidden = false;
    $('#e-count').textContent = E.doc.numPages; $('#e-page').max = E.doc.numPages;
    const lib = await PDFDocument.load(E.bytes, { ignoreEncryption: true, updateMetadata: false });
    $('#m-title').value = lib.getTitle() || ''; $('#m-author').value = lib.getAuthor() || '';
    $('#m-subject').value = lib.getSubject() || ''; $('#m-keywords').value = lib.getKeywords() || '';
    const w = $('#e-stage').clientWidth - 40;
    E.zoom = Math.max(0.3, Math.min(2, w / (E.vp1[0].width * PX)));
    setTool('select');
    await draw();
  } catch (e) { fail(e); } finally { progress.hide(); }
}

function zoom(z) { E.zoom = Math.max(0.3, Math.min(3, z)); draw(); }
function go(n) { if (!E.doc) return; E.n = Math.max(1, Math.min(E.doc.numPages, n || 1)); $('#e-page').value = E.n; select(null); draw(); }

async function draw() {
  const token = ++E.token;
  E.task?.cancel?.();
  const page = await E.doc.getPage(E.n);
  if (token !== E.token) return;
  const r = renderPage(page, E.zoom * PX, $('#e-canvas'), { dpr: Math.min(devicePixelRatio || 1, 2) });
  E.task = r.task;
  try { await r.done; } catch { return; }
  if (token !== E.token) return;
  E.scale = (E.zoom * PX);
  $('#e-zoom').textContent = Math.round(E.zoom * 100) + '%';
  const ov = $('#e-overlay');
  ov.style.width = $('#e-canvas').style.width; ov.style.height = $('#e-canvas').style.height;
  ov.replaceChildren();
  E.objs.filter(o => o.page === E.n).forEach(o => ov.append(build(o)));
  select(E.sel);
}

// ------------------------------------------------------------------ objects
const sel = () => E.objs.find(o => o.id === E.sel);

function build(o) {
  const el = h('div', { class: 'obj ' + o.type, dataset: { id: o.id } });
  o.el = el;
  if (o.type === 'image') { o.url ||= URL.createObjectURL(o.blob); el.append(h('img', { src: o.url, alt: '' })); }
  el.append(h('span', { class: 'rz' }));
  el.addEventListener('pointerdown', e => onObjDown(e, o));
  if (o.type === 'text') el.addEventListener('dblclick', () => editInPlace(o));
  paint(o);
  return el;
}

function paint(o) {
  const el = o.el; if (!el) return;
  const s = E.scale;
  el.style.left = o.x * s + 'px'; el.style.top = o.y * s + 'px';
  el.style.opacity = o.opacity;
  if (o.type === 'text') {
    const txt = el.childNodes[0]?.nodeType === 3 ? el.childNodes[0] : null;
    if (!el.isContentEditable) { if (txt) txt.nodeValue = o.text; else el.prepend(document.createTextNode(o.text)); }
    el.style.fontSize = o.size * s + 'px'; el.style.color = o.color; el.style.lineHeight = LH; el.setAttribute('dir', o.dir || 'auto');
    el.style.fontFamily = cssFamily(o.font); el.style.fontWeight = o.bold ? 700 : 400;
  } else {
    el.style.width = o.w * s + 'px'; el.style.height = o.h * s + 'px';
    if (o.type === 'rect') { el.style.border = `${Math.max(1, 2 * s)}px solid ${o.color}`; }
    else if (o.type !== 'image') el.style.background = o.color;
  }
}

function select(id) {
  E.sel = id;
  $$('#e-overlay .obj').forEach(el => el.classList.toggle('sel', +el.dataset.id === id));
  const o = sel();
  if (o) {
    if (o.color) $('#e-color').value = o.color;
    $('#e-opacity').value = Math.round(o.opacity * 100);
    if (o.type === 'text') { $('#e-size').value = Math.round(o.size); $('#e-text').value = o.text; $('#e-dir').value = o.dir || 'auto'; $('#e-font').value = o.font || 'sans'; $('#e-bold').checked = !!o.bold; }
  }
}

function delSel() {
  const o = sel(); if (!o) return;
  if (o.url) URL.revokeObjectURL(o.url);
  E.objs = E.objs.filter(x => x !== o); o.el?.remove(); E.sel = null;
}

function applyProps() {
  const o = sel(); if (!o) return;
  o.opacity = +$('#e-opacity').value / 100;
  if (o.color && !['whiteout', 'redact'].includes(o.kind)) o.color = $('#e-color').value;
  if (o.type === 'text') o.size = Math.max(4, +$('#e-size').value || 12);
  paint(o);
}

function editInPlace(o) {
  const el = o.el; el.contentEditable = 'true'; el.focus();
  const range = document.createRange(); range.selectNodeContents(el); const sl = getSelection(); sl.removeAllRanges(); sl.addRange(range);
  const done = () => { el.contentEditable = 'false'; o.text = el.innerText.replace(/\n$/, '') || ' '; el.replaceChildren(); el.append(h('span', { class: 'rz' })); paint(o); select(o.id); el.removeEventListener('blur', done); };
  el.addEventListener('blur', done);
}

function setTool(tool) {
  E.tool = tool;
  $$('#e-tools .tool').forEach(b => b.classList.toggle('active', b.dataset.tool === tool));
  $('#e-overlay').className = 'overlay tool-' + tool;
  if (tool === 'edittext') toast(t('edit.edittext_tip'), 'info', 6500);
  if (tool === 'text') { $('#e-color').value = '#000000'; $('#e-opacity').value = 100; }
  if (tool === 'rect') { $('#e-color').value = '#d93025'; $('#e-opacity').value = 100; }
  if (tool === 'highlight') { $('#e-color').value = '#ffd400'; $('#e-opacity').value = 40; }
}

function pt(e) {
  const r = $('#e-overlay').getBoundingClientRect();
  return { x: (e.clientX - r.left) / E.scale, y: (e.clientY - r.top) / E.scale };
}

function onObjDown(e, o) {
  if (o.el.isContentEditable) return;
  e.stopPropagation();
  select(o.id);
  const start = pt(e); const orig = { x: o.x, y: o.y, w: o.w, h: o.h };
  const resizing = e.target.classList.contains('rz') && o.type !== 'text';
  const move = ev => {
    const p = pt(ev);
    if (resizing) { o.w = Math.max(6, orig.w + p.x - start.x); o.h = o.type === 'image' ? o.w * (orig.h / orig.w) : Math.max(6, orig.h + p.y - start.y); }
    else { o.x = orig.x + p.x - start.x; o.y = orig.y + p.y - start.y; }
    paint(o);
  };
  const up = () => { removeEventListener('pointermove', move); removeEventListener('pointerup', up); };
  addEventListener('pointermove', move); addEventListener('pointerup', up);
}

function add(o) {
  const full = { id: E.nextId++, page: E.n, opacity: 1, ...o };
  E.objs.push(full);
  $('#e-overlay').append(build(full));
  select(full.id);
  return full;
}

function onOverlayDown(e) {
  if (e.target !== $('#e-overlay')) return;
  const p = pt(e);
  const tool = E.tool;
  if (tool === 'select') return select(null);
  if (tool === 'edittext') return editExistingText(p);
  if (tool === 'text') {
    const size = +$('#e-size').value || 18;
    const o = add({ type: 'text', kind: 'text', text: t('edit.default_text'), x: p.x, y: p.y - size * 0.5, size, color: $('#e-color').value, opacity: +$('#e-opacity').value / 100, dir: $('#e-dir').value, font: $('#e-font').value, bold: $('#e-bold').checked });
    setTool('select'); $('#e-text').focus(); $('#e-text').select(); return o;
  }
  if (tool === 'image') { E.pending = p; $('#e-imgpick').click(); return; }
  if (tool === 'sign') { E.pending = p; openSignature(); return; }
  // drag-to-draw rectangles
  const kind = tool;
  const color = kind === 'whiteout' ? '#ffffff' : kind === 'redact' ? '#000000' : $('#e-color').value;
  const opacity = kind === 'whiteout' || kind === 'redact' ? 1 : +$('#e-opacity').value / 100;
  const o = add({ type: kind === 'rect' ? 'rect' : 'box', kind, x: p.x, y: p.y, w: 1, h: 1, color, opacity });
  const move = ev => { const q = pt(ev); o.x = Math.min(p.x, q.x); o.y = Math.min(p.y, q.y); o.w = Math.abs(q.x - p.x); o.h = Math.abs(q.y - p.y); paint(o); };
  const up = () => { removeEventListener('pointermove', move); removeEventListener('pointerup', up); if (o.w < 4 || o.h < 4) delSel(); };
  addEventListener('pointermove', move); addEventListener('pointerup', up);
}

async function onImagePicked(e) {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  try { await placeImage(f); } catch (err) { fail(err); }
}

async function placeImage(blobOrFile) {
  const bmp = await createImageBitmap(blobOrFile);
  const pw = E.vp1[E.n - 1].width;
  const w = Math.min(pw * 0.4, bmp.width), h2 = w * bmp.height / bmp.width;
  const p = E.pending || { x: 20, y: 20 };
  const blob = blobOrFile instanceof File ? blobOrFile : new File([blobOrFile], 'sig.png', { type: 'image/png' });
  add({ type: 'image', kind: 'image', blob, x: p.x, y: p.y, w, h: h2 });
  setTool('select');
}

// ------------------------------------------------------------------ signature pad
let sigInk = [];
function initSignature() {
  const c = $('#sig-pad'); const ctx = c.getContext('2d');
  let drawing = false;
  const pos = e => { const r = c.getBoundingClientRect(); return [(e.clientX - r.left) * c.width / r.width, (e.clientY - r.top) * c.height / r.height]; };
  c.addEventListener('pointerdown', e => { drawing = true; c.setPointerCapture(e.pointerId); const [x, y] = pos(e); sigInk.push([x, y]); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineWidth = 3; ctx.lineCap = ctx.lineJoin = 'round'; ctx.strokeStyle = '#111'; });
  c.addEventListener('pointermove', e => { if (!drawing) return; const [x, y] = pos(e); sigInk.push([x, y]); ctx.lineTo(x, y); ctx.stroke(); });
  c.addEventListener('pointerup', () => { drawing = false; });
  $('#sig-clear').onclick = () => { ctx.clearRect(0, 0, c.width, c.height); sigInk = []; };
  $('#sig-cancel').onclick = () => { $('#sigdlg').hidden = true; };
  $('#sig-ok').onclick = async () => {
    $('#sigdlg').hidden = true;
    if (sigInk.length < 3) return;
    const xs = sigInk.map(p => p[0]), ys = sigInk.map(p => p[1]);
    const x0 = Math.max(0, Math.min(...xs) - 6), y0 = Math.max(0, Math.min(...ys) - 6), x1 = Math.min(c.width, Math.max(...xs) + 6), y1 = Math.min(c.height, Math.max(...ys) + 6);
    const out = h('canvas'); out.width = x1 - x0; out.height = y1 - y0;
    out.getContext('2d').drawImage(c, x0, y0, out.width, out.height, 0, 0, out.width, out.height);
    await placeImage(await canvasToBlob(out, 'image/png'));
  };
}
function openSignature() { const c = $('#sig-pad'); c.getContext('2d').clearRect(0, 0, c.width, c.height); sigInk = []; $('#sigdlg').hidden = false; }

// ------------------------------------------------------------------ export
const col = hex => { const c = hexToRgb01(hex); return rgb(c.r, c.g, c.b); };

async function exportPdf() {
  if (!E.doc) return toast(t('msg.nopdf'), 'warn');
  try {
    progress.show(t('msg.working'));
    const doc = await PDFDocument.load(E.bytes, { ignoreEncryption: true });
    const fonts = await makeFontSet(doc, PDFLib, window.fontkit);
    const pages = doc.getPages();
    const dirOf = d => (d === 'ltr' || d === 'rtl' ? d : undefined);

    // draw (multi-line) text at a displayed point, honouring the page's /Rotate
    const drawText = async (page, vp, text, x, yBase, size, color, opacity, forceDir, font) => {
      const lines = String(text).split('\n');
      for (let i = 0; i < lines.length; i++) {
        const [lx, ly] = vp.convertToPdfPoint(x, yBase + i * LH * size);
        await fonts.drawLine(page, lines[i], { x: lx, y: ly, size, color, opacity, angle: vp.rotation, forceDir, font });
      }
    };

    for (const o of E.objs) {
      const page = pages[o.page - 1], vp = E.vp1[o.page - 1];
      if (o.type === 'text') {
        await drawText(page, vp, o.text, o.x, o.y + BASE * o.size, o.size, col(o.color), o.opacity, dirOf(o.dir), resolveFont(o.font, o.bold));
      } else if (o.type === 'image') {
        const img = await embedAnyImage(doc, o.blob);
        const [bx, by] = vp.convertToPdfPoint(o.x, o.y + o.h);
        page.drawImage(img, { x: bx, y: by, width: o.w, height: o.h, rotate: degrees(vp.rotation), opacity: o.opacity });
      } else {
        const [ax, ay] = vp.convertToPdfPoint(o.x, o.y), [bx, by] = vp.convertToPdfPoint(o.x + o.w, o.y + o.h);
        const rect = { x: Math.min(ax, bx), y: Math.min(ay, by), width: Math.abs(bx - ax), height: Math.abs(by - ay) };
        if (o.type === 'rect') page.drawRectangle({ ...rect, borderColor: col(o.color), borderWidth: 2, borderOpacity: o.opacity });
        else page.drawRectangle({ ...rect, color: col(o.color), opacity: o.opacity });
      }
    }

    // watermark
    const wm = $('#w-text').value.trim();
    if (wm) {
      const size = +$('#w-size').value || 64, ang = +$('#w-angle').value || 0, op = (+$('#w-op').value || 25) / 100, color = col($('#w-color').value);
      const wmFont = resolveFont($('#w-font').value, $('#w-bold').checked);
      const w = await fonts.measureLine(wm, size, undefined, wmFont);
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i], vp = E.vp1[i];
        const cx = vp.width / 2, cy = vp.height / 2;
        const a = (ang * Math.PI) / 180;           // displayed, counter-clockwise
        const sx = cx - Math.cos(a) * w / 2 + Math.sin(a) * size * 0.35;
        const sy = cy + Math.sin(a) * w / 2 + Math.cos(a) * size * 0.35;   // displayed coords are y-down
        const [ux, uy] = vp.convertToPdfPoint(sx, sy);
        await fonts.drawLine(page, wm, { x: ux, y: uy, size, color, opacity: op, angle: ang + vp.rotation, font: wmFont });
      }
    }

    // page numbers
    if ($('#n-on').checked) {
      const size = +$('#n-size').value || 11, start = +$('#n-start').value || 1, fmt = $('#n-fmt').value || '{n}', pos = $('#n-pos').value;
      for (let i = 0; i < pages.length; i++) {
        const vp = E.vp1[i];
        const txt = fmt.replaceAll('{n}', start + i).replaceAll('{total}', start + pages.length - 1);
        const w = await fonts.measureLine(txt, size);
        const m = 28;
        const x = pos[1] === 'c' ? (vp.width - w) / 2 : pos[1] === 'l' ? m : vp.width - m - w;
        const y = pos[0] === 't' ? m + size * 0.8 : vp.height - m;
        await drawText(pages[i], vp, txt, x, y, size, rgb(.2, .2, .2), 1);
      }
    }

    // metadata
    doc.setTitle($('#m-title').value); doc.setAuthor($('#m-author').value); doc.setSubject($('#m-subject').value);
    doc.setKeywords($('#m-keywords').value.split(/[,;]\s*/).filter(Boolean)); doc.setProducer('Pagecraft'); doc.setModificationDate(new Date());

    let out = await doc.save();
    if ($('#e-flatten').checked) {
      progress.set(0, t('msg.working'));
      out = await rasterizePdf(out, { dpi: 170, quality: 0.9, onProgress: f => progress.set(f) });
    }
    download(out, stripExt(E.file.name) + '-edited.pdf', 'application/pdf');
    toast(t('msg.done'));
  } catch (e) { fail(e); } finally { progress.hide(); }
}

// ------------------------------------------------------------------ edit existing text
const ARABIC = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/;

/** Text runs of the current page in displayed points: {str, x, base, w, size} */
async function runsOf(pageNum) {
  if (E.textCache[pageNum]) return E.textCache[pageNum];
  const page = await E.doc.getPage(pageNum), vp = E.vp1[pageNum - 1];
  const tc = await page.getTextContent();
  const runs = [];
  for (const it of tc.items) {
    if (!it.str || !it.str.trim()) continue;
    const [a, b, , d, e, f] = it.transform;
    const [x, base] = vp.convertToViewportPoint(e, f);
    const ff = (tc.styles?.[it.fontName]?.fontFamily || '').toLowerCase();
    runs.push({ font: /mono|courier/.test(ff) ? 'mono' : /serif/.test(ff) && !/sans/.test(ff) ? 'serif' : 'sans', str: it.str, x, base, w: it.width, size: Math.max(4, Math.hypot(a, b) || Math.abs(d)), upright: Math.abs(b) < 0.01 });
  }
  return (E.textCache[pageNum] = runs);
}

function sampleColors(x, y, w, size) {
  // background = pixel just left of / above the run; text colour = pixel with most contrast inside the run
  const cv = $('#e-canvas'), k = cv.width / parseFloat(cv.style.width), ctx = cv.getContext('2d', { willReadFrequently: true });
  const s = E.scale * k, cl = (v, m) => Math.max(0, Math.min(m - 1, Math.round(v)));
  const px = (X, Y) => ctx.getImageData(cl(X * s, cv.width), cl(Y * s, cv.height), 1, 1).data;
  const bg = px(x - 2, y - size * 0.4);
  const img = ctx.getImageData(cl(x * s, cv.width), cl((y - size * 0.8) * s, cv.height), Math.max(1, Math.min(cv.width - 1, Math.round(w * s))), Math.max(1, Math.round(size * s)));
  let best = 0, fg = [0, 0, 0];
  for (let i = 0; i < img.data.length; i += 4) {
    const dist = Math.abs(img.data[i] - bg[0]) + Math.abs(img.data[i + 1] - bg[1]) + Math.abs(img.data[i + 2] - bg[2]);
    if (dist > best) { best = dist; fg = [img.data[i], img.data[i + 1], img.data[i + 2]]; }
  }
  const hex = c => '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
  return { bg: hex([bg[0], bg[1], bg[2]]), fg: best > 60 ? hex(fg) : '#000000' };
}

async function editExistingText(p) {
  try {
    if (E.vp1[E.n - 1].rotation) return toast(t('edit.edittext_rot'), 'warn', 6000);
    const runs = (await runsOf(E.n)).filter(r => r.upright);
    // run under the click
    const hit = runs.find(r => p.x >= r.x - 2 && p.x <= r.x + r.w + 2 && p.y >= r.base - r.size * 1.0 && p.y <= r.base + r.size * 0.35);
    if (!hit) return toast(t('edit.edittext_none'), 'warn');
    // grow to the whole line (same baseline, small gaps)
    const line = runs.filter(r => Math.abs(r.base - hit.base) < hit.size * 0.25).sort((a, b) => a.x - b.x);
    let i = line.indexOf(hit), lo = i, hi = i;
    while (lo > 0 && line[lo].x - (line[lo - 1].x + line[lo - 1].w) < hit.size * 0.8) lo--;
    while (hi < line.length - 1 && line[hi + 1].x - (line[hi].x + line[hi].w) < hit.size * 0.8) hi++;
    let seg = line.slice(lo, hi + 1);
    const rtl = seg.some(r => ARABIC.test(r.str));
    if (rtl) seg = [...seg].reverse();               // pdf.js gives visual order; logical order is right-to-left
    let text = '';
    seg.forEach((r, k) => {
      if (k) { const prev = seg[k - 1], gap = rtl ? prev.x - (r.x + r.w) : r.x - (prev.x + prev.w); if (gap > hit.size * 0.2 && !/\s$/.test(text) && !/^\s/.test(r.str)) text += ' '; }
      text += r.str;
    });
    if (rtl) text = text.normalize('NFKC');           // presentation forms -> plain Arabic letters
    const x0 = line[lo].x, x1 = line[hi].x + line[hi].w, size = hit.size, base = hit.base;
    const { bg, fg } = sampleColors(x0, base, x1 - x0, size);
    add({ type: 'box', kind: 'whiteout', x: x0 - 1.5, y: base - size * 0.95, w: x1 - x0 + 3, h: size * 1.5, color: bg, opacity: 1 });
    const o = add({ type: 'text', kind: 'text', text, x: x0, y: base - BASE * size, size, color: fg, opacity: 1, dir: 'auto', font: hit.font || 'sans', bold: false });
    setTool('select');
    select(o.id);
    editInPlace(o);
  } catch (e) { fail(e); }
}
