import { t } from './i18n.js';

export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];

export function h(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'text') el.textContent = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()) if (kid != null) el.append(kid.nodeType ? kid : document.createTextNode(kid));
  return el;
}

export const sleep = ms => new Promise(r => setTimeout(r, ms));
export const tick = () => new Promise(r => requestAnimationFrame(() => setTimeout(r, 0)));

export function fmtBytes(n) {
  if (n < 1024) return n + ' B';
  if (n < 1048576) return (n / 1024).toFixed(1) + ' KB';
  return (n / 1048576).toFixed(2) + ' MB';
}

export function stripExt(name) { return name.replace(/\.[^.]+$/, ''); }

/** "1-3, 5, 8-" -> sorted unique 0-based indices (clamped to count). */
export function parseRanges(str, count) {
  const out = new Set();
  for (const part of String(str || '').split(/[,;\s]+/).filter(Boolean)) {
    const m = part.match(/^(\d*)-(\d*)$/);
    if (m) {
      const a = m[1] ? +m[1] : 1, b = m[2] ? +m[2] : count;
      for (let i = Math.min(a, b); i <= Math.max(a, b); i++) if (i >= 1 && i <= count) out.add(i - 1);
    } else if (/^\d+$/.test(part)) { const n = +part; if (n >= 1 && n <= count) out.add(n - 1); }
  }
  return [...out].sort((a, b) => a - b);
}

export function download(data, name, type = 'application/octet-stream') {
  const blob = data instanceof Blob ? data : new Blob([data], { type });
  const a = h('a', { href: URL.createObjectURL(blob), download: name });
  document.body.append(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
}

export const readBuf = file => file.arrayBuffer();

export function toast(msg, kind = 'info', ms = 4200) {
  const box = $('#toasts');
  const el = h('div', { class: 'toast ' + kind, role: 'status' }, msg);
  box.append(el);
  setTimeout(() => el.classList.add('out'), ms);
  setTimeout(() => el.remove(), ms + 400);
}

export function fail(err) {
  console.error(err);
  toast(t('msg.error') + ': ' + (err?.message || err), 'error', 7000);
  progress.hide();
}

// ---- global progress bar ----
export const progress = {
  show(label = '') { const p = $('#progress'); p.hidden = false; $('#progress-label').textContent = label; this.set(null); },
  set(frac, label) {
    const bar = $('#progress-bar');
    if (label != null) $('#progress-label').textContent = label;
    if (frac == null) { bar.removeAttribute('value'); } else bar.value = Math.max(0, Math.min(1, frac));
  },
  hide() { $('#progress').hidden = true; },
};

/** Mount a drop zone on `el` (which carries data-accept / data-multiple / data-hint). */
export function mountDrop(el, onFiles) {
  const accept = el.dataset.accept || '*';
  const multiple = 'multiple' in el.dataset;
  const input = h('input', { type: 'file', accept, multiple, hidden: true });
  const hint = h('span', { 'data-i18n': el.dataset.hint || 'drop.generic' });
  hint.textContent = t(el.dataset.hint || 'drop.generic');
  el.classList.add('drop');
  el.tabIndex = 0;
  el.append(h('span', { class: 'drop-icon', 'aria-hidden': 'true' }, '⬆'), hint, input);
  const accepts = f => {
    if (accept === '*') return true;
    return accept.split(',').some(a => {
      a = a.trim().toLowerCase();
      if (a.startsWith('.')) return f.name.toLowerCase().endsWith(a);
      if (a.endsWith('/*')) return f.type.startsWith(a.slice(0, -1));
      return f.type === a;
    });
  };
  const handle = files => {
    files = [...files].filter(accepts);
    if (!files.length) return toast(t('msg.badtype'), 'warn');
    onFiles(multiple ? files : files.slice(0, 1));
  };
  el.addEventListener('click', e => { if (e.target !== input) input.click(); });
  el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); } });
  input.addEventListener('change', () => { if (input.files.length) handle(input.files); input.value = ''; });
  ['dragenter', 'dragover'].forEach(ev => el.addEventListener(ev, e => { e.preventDefault(); el.classList.add('over'); }));
  ['dragleave', 'drop'].forEach(ev => el.addEventListener(ev, e => { e.preventDefault(); el.classList.remove('over'); }));
  el.addEventListener('drop', e => handle(e.dataTransfer.files));
}

export function canvasToBlob(canvas, type = 'image/png', quality) {
  return new Promise(res => canvas.toBlob(res, type, quality));
}

export function loadImageEl(src) {
  return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
}

export function hexToRgb01(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
}

export function newZip() { return new window.JSZip(); }

export const imgExt = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' };

/** Load a bytes image into a PDFLib PDFImage (png/jpg; others converted via canvas). */
export async function embedAnyImage(pdfDoc, file) {
  const buf = new Uint8Array(await file.arrayBuffer());
  if (file.type === 'image/png') return pdfDoc.embedPng(buf);
  if (file.type === 'image/jpeg') return pdfDoc.embedJpg(buf);
  const bmp = await createImageBitmap(file);
  const c = h('canvas'); c.width = bmp.width; c.height = bmp.height;
  c.getContext('2d').drawImage(bmp, 0, 0);
  const blob = await canvasToBlob(c, 'image/png');
  return pdfDoc.embedPng(new Uint8Array(await blob.arrayBuffer()));
}
