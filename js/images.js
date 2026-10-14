import { $, h, mountDrop, download, stripExt, fail, progress, toast, canvasToBlob, newZip, fmtBytes, imgExt, tick } from './util.js';
import { t, onLang } from './i18n.js';

const I = { items: [], cur: 0, raf: 0 };
const DEF = () => ({ rot: 0, fh: false, fv: false, w: null, h: null, pct: 100, ct: 0, cb: 0, cl: 0, cr: 0, aspect: '', br: 0, co: 0, sa: 0, bl: 0, gray: false, sepia: false, invert: false, wm: '', wms: 5, wmo: 50, wmp: 'br' });
let set = DEF();

export function init() {
  mountDrop($('#img-drop'), addFiles);
  const bind = (id, key, num = true, after) => $('#' + id).addEventListener('input', e => {
    const el = e.target; set[key] = el.type === 'checkbox' ? el.checked : num ? (el.value === '' ? null : +el.value) : el.value;
    after?.(); schedule();
  });
  bind('im-w', 'w', true, () => { set.pct = 100; $('#im-pct').value = 100; if ($('#im-lock').checked) set.h = null; });
  bind('im-h', 'h', true, () => { set.pct = 100; $('#im-pct').value = 100; if ($('#im-lock').checked) set.w = null; });
  bind('im-pct', 'pct', true, () => { set.w = set.h = null; $('#im-w').value = $('#im-h').value = ''; });
  for (const [id, k] of [['im-ct', 'ct'], ['im-cb', 'cb'], ['im-cl', 'cl'], ['im-cr', 'cr']]) bind(id, k, true, () => { set.aspect = ''; $('#im-aspect').value = ''; });
  bind('im-aspect', 'aspect', false, () => { if (set.aspect) { set.ct = set.cb = set.cl = set.cr = 0; ['ct', 'cb', 'cl', 'cr'].forEach(k => ($('#im-' + k).value = 0)); } });
  for (const [id, k] of [['im-br', 'br'], ['im-co', 'co'], ['im-sa', 'sa'], ['im-bl', 'bl']]) bind(id, k);
  for (const [id, k] of [['im-gray', 'gray'], ['im-sepia', 'sepia'], ['im-invert', 'invert']]) bind(id, k);
  bind('im-wm', 'wm', false); bind('im-wms', 'wms'); bind('im-wmo', 'wmo'); bind('im-wmp', 'wmp', false);
  $('#im-rl').onclick = () => { set.rot = (set.rot + 270) % 360; schedule(); };
  $('#im-rr').onclick = () => { set.rot = (set.rot + 90) % 360; schedule(); };
  $('#im-fh').onclick = () => { set.fh = !set.fh; schedule(); };
  $('#im-fv').onclick = () => { set.fv = !set.fv; schedule(); };
  $('#im-reset').onclick = () => { set = DEF(); syncInputs(); schedule(); };
  $('#im-fmt').addEventListener('change', () => { $('#im-q').disabled = $('#im-fmt').value === 'image/png'; });
  $('#im-export').onclick = exportOne;
  $('#im-export-all').onclick = exportAll;
  onLang(updateInfo);
}

function syncInputs() {
  const set2 = (id, v) => { const el = $('#' + id); if (el.type === 'checkbox') el.checked = !!v; else el.value = v ?? ''; };
  Object.entries({ 'im-w': set.w, 'im-h': set.h, 'im-pct': set.pct, 'im-ct': set.ct, 'im-cb': set.cb, 'im-cl': set.cl, 'im-cr': set.cr, 'im-aspect': set.aspect, 'im-br': set.br, 'im-co': set.co, 'im-sa': set.sa, 'im-bl': set.bl, 'im-gray': set.gray, 'im-sepia': set.sepia, 'im-invert': set.invert, 'im-wm': set.wm, 'im-wms': set.wms, 'im-wmo': set.wmo, 'im-wmp': set.wmp }).forEach(([k, v]) => set2(k, v));
}

async function addFiles(files) {
  try {
    for (const f of files) {
      const bmp = await createImageBitmap(f);
      I.items.push({ file: f, bmp, url: URL.createObjectURL(f) });
    }
    $('#img-ui').hidden = false;
    strip(); selectImg(I.items.length - files.length);
  } catch (e) { fail(e); }
}

function strip() {
  const box = $('#img-strip'); box.replaceChildren();
  I.items.forEach((it, i) => box.append(h('button', { class: i === I.cur ? 'on' : '', onclick: () => selectImg(i), title: it.file.name }, h('img', { src: it.url, alt: it.file.name }))));
}
function selectImg(i) { I.cur = i; strip(); updateInfo(); schedule(); }
function updateInfo() {
  const it = I.items[I.cur]; if (!it) return;
  $('#img-info').textContent = `${it.file.name} — ` + t('img.info', { w: it.bmp.width, h: it.bmp.height, size: fmtBytes(it.file.size) });
  $('#im-w').placeholder = it.bmp.width; $('#im-h').placeholder = it.bmp.height;
}

// ------------------------------------------------------------ pipeline
function aspectCrop(w, h2, aspect) {
  const [a, b] = aspect.split(':').map(Number); const target = a / b;
  let cw = w, ch = h2;
  if (w / h2 > target) cw = Math.round(h2 * target); else ch = Math.round(w / target);
  const l = Math.floor((w - cw) / 2), tp = Math.floor((h2 - ch) / 2);
  return { l, t: tp, cw, ch };
}

export function process(bmp, s, maxDim = Infinity) {
  // 1) rotate/flip
  const swap = s.rot % 180 !== 0;
  const aw = swap ? bmp.height : bmp.width, ah = swap ? bmp.width : bmp.height;
  const A = document.createElement('canvas'); A.width = aw; A.height = ah;
  const a = A.getContext('2d');
  a.translate(aw / 2, ah / 2); a.rotate((s.rot * Math.PI) / 180); a.scale(s.fh ? -1 : 1, s.fv ? -1 : 1);
  a.drawImage(bmp, -bmp.width / 2, -bmp.height / 2);
  // 2) crop
  let c = s.aspect ? aspectCrop(aw, ah, s.aspect) : { l: s.cl || 0, t: s.ct || 0, cw: aw - (s.cl || 0) - (s.cr || 0), ch: ah - (s.ct || 0) - (s.cb || 0) };
  c.cw = Math.max(1, Math.min(aw - c.l, c.cw)); c.ch = Math.max(1, Math.min(ah - c.t, c.ch));
  // 3) resize
  let ow, oh;
  if (s.w || s.h) {
    if ($('#im-lock')?.checked ?? true) { const k = s.w ? s.w / c.cw : s.h / c.ch; ow = c.cw * k; oh = c.ch * k; }
    else { ow = s.w || c.cw; oh = s.h || c.ch; }
  } else { const k = (s.pct || 100) / 100; ow = c.cw * k; oh = c.ch * k; }
  const full = { w: Math.max(1, Math.round(ow)), h: Math.max(1, Math.round(oh)) };
  const f = Math.min(1, maxDim / Math.max(full.w, full.h));
  const W = Math.max(1, Math.round(full.w * f)), H = Math.max(1, Math.round(full.h * f));
  const B = document.createElement('canvas'); B.width = W; B.height = H;
  const b = B.getContext('2d'); b.imageSmoothingQuality = 'high';
  if (s.bl > 0 && 'filter' in b) b.filter = `blur(${(s.bl * Math.max(W, H)) / 800}px)`;
  b.drawImage(A, c.l, c.t, c.cw, c.ch, 0, 0, W, H);
  b.filter = 'none';
  // 4) color adjustments
  if (s.br || s.co || s.sa || s.gray || s.sepia || s.invert) {
    const img = b.getImageData(0, 0, W, H), d = img.data;
    const bright = s.br * 2.55, cc = s.co * 2.55, cf = (259 * (cc + 255)) / (255 * (259 - cc)), sat = 1 + s.sa / 100;
    for (let i = 0; i < d.length; i += 4) {
      let r = d[i] + bright, g = d[i + 1] + bright, bl = d[i + 2] + bright;
      if (s.co) { r = (r - 128) * cf + 128; g = (g - 128) * cf + 128; bl = (bl - 128) * cf + 128; }
      if (s.sa) { const y = 0.299 * r + 0.587 * g + 0.114 * bl; r = y + (r - y) * sat; g = y + (g - y) * sat; bl = y + (bl - y) * sat; }
      if (s.gray) { r = g = bl = 0.299 * r + 0.587 * g + 0.114 * bl; }
      if (s.sepia) { const R = 0.393 * r + 0.769 * g + 0.189 * bl, G = 0.349 * r + 0.686 * g + 0.168 * bl, Bv = 0.272 * r + 0.534 * g + 0.131 * bl; r = R; g = G; bl = Bv; }
      if (s.invert) { r = 255 - r; g = 255 - g; bl = 255 - bl; }
      d[i] = r; d[i + 1] = g; d[i + 2] = bl;
    }
    b.putImageData(img, 0, 0);
  }
  // 5) watermark
  if (s.wm) {
    const fs = Math.max(8, (H * s.wms) / 100), pad = fs * 0.6;
    b.font = `600 ${fs}px NotoPDF, system-ui, sans-serif`; b.textBaseline = 'alphabetic';
    const w = b.measureText(s.wm).width;
    const pos = { br: [W - w - pad, H - pad], bl: [pad, H - pad], tr: [W - w - pad, pad + fs], tl: [pad, pad + fs], c: [(W - w) / 2, (H + fs * 0.7) / 2] }[s.wmp];
    b.globalAlpha = s.wmo / 100; b.shadowColor = 'rgba(0,0,0,.6)'; b.shadowBlur = fs * 0.12; b.fillStyle = '#fff';
    b.fillText(s.wm, pos[0], pos[1]); b.globalAlpha = 1; b.shadowBlur = 0;
  }
  B.dataset.fullW = full.w; B.dataset.fullH = full.h;
  return B;
}

function schedule() { cancelAnimationFrame(I.raf); I.raf = requestAnimationFrame(preview); }
function preview() {
  const it = I.items[I.cur]; if (!it) return;
  try {
    const out = process(it.bmp, set, 1400);
    const cv = $('#img-canvas'); cv.width = out.width; cv.height = out.height;
    cv.getContext('2d').drawImage(out, 0, 0);
    // show resulting size in fields as placeholders
    $('#im-w').placeholder = out.dataset.fullW; $('#im-h').placeholder = out.dataset.fullH;
    if (!set.w && $('#im-w') !== document.activeElement) $('#im-w').value = '';
    if (set.w && !set.h && $('#im-lock').checked) $('#im-h').value = out.dataset.fullH;
    if (set.h && !set.w && $('#im-lock').checked) $('#im-w').value = out.dataset.fullW;
  } catch (e) { fail(e); }
}

async function encode(canvas) {
  const type = $('#im-fmt').value, q = Math.max(0.1, Math.min(1, (+$('#im-q').value || 85) / 100)), kb = +$('#im-kb').value || 0;
  if (!kb || type === 'image/png') return canvasToBlob(canvas, type, q);
  let lo = 0.1, hi = 0.97, best = await canvasToBlob(canvas, type, lo);
  if (best.size > kb * 1024) return best; // can't go smaller via quality alone
  for (let i = 0; i < 7; i++) {
    const mid = (lo + hi) / 2, blob = await canvasToBlob(canvas, type, mid);
    if (blob.size <= kb * 1024) { best = blob; lo = mid; } else hi = mid;
  }
  return best;
}

async function exportOne() {
  const it = I.items[I.cur]; if (!it) return;
  try {
    progress.show(t('msg.working'));
    const out = process(it.bmp, set), blob = await encode(out), type = $('#im-fmt').value;
    $('#im-result').textContent = t('img.result', { w: out.width, h: out.height, size: fmtBytes(blob.size) });
    download(blob, `${stripExt(it.file.name)}-edited.${imgExt[type] || 'png'}`);
  } catch (e) { fail(e); } finally { progress.hide(); }
}

async function exportAll() {
  if (!I.items.length) return;
  try {
    progress.show(t('msg.working'));
    const zip = newZip(), type = $('#im-fmt').value, used = new Set(); let total = 0;
    for (let i = 0; i < I.items.length; i++) {
      const out = process(I.items[i].bmp, set), blob = await encode(out); total += blob.size;
      let name = `${stripExt(I.items[i].file.name)}.${imgExt[type] || 'png'}`; while (used.has(name)) name = name.replace(/(\.\w+)$/, `-${i}$1`);
      used.add(name); zip.file(name, blob);
      progress.set((i + 1) / I.items.length); await tick();
    }
    $('#im-result').textContent = `${I.items.length} × · ${fmtBytes(total)}`;
    download(await zip.generateAsync({ type: 'blob' }), 'images.zip');
  } catch (e) { fail(e); } finally { progress.hide(); }
}
