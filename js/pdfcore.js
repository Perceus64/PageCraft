import { t } from './i18n.js';
import { h, canvasToBlob, tick } from './util.js';

const base = new URL('../vendor/pdfjs/', import.meta.url).href;
let libP;

/** Lazily load pdf.js (legacy build for wide browser support). */
export function pdfjs() {
  return (libP ||= import('../vendor/pdfjs/pdf.min.mjs').then(m => {
    m.GlobalWorkerOptions.workerSrc = base + 'pdf.worker.min.mjs';
    return m;
  }));
}

/** Open a PDF with pdf.js. Always copies the buffer (pdf.js transfers it to its worker). */
export async function openPdf(buf, password) {
  const lib = await pdfjs();
  const data = buf instanceof Uint8Array ? buf.slice() : new Uint8Array(buf.slice(0));
  const task = lib.getDocument({
    data, password,
    cMapUrl: base + 'cmaps/', cMapPacked: true,
    standardFontDataUrl: base + 'standard_fonts/',
    wasmUrl: base + 'wasm/', iccUrl: base + 'iccs/',
  });
  try { return await task.promise; }
  catch (e) { if (e?.name === 'PasswordException') throw new Error(t('msg.encrypted')); throw e; }
}

/** Render a pdf.js page to a canvas. `scale` is CSS-pixel scale (1 = 72dpi*1). Returns the viewport. */
export function renderPage(page, scale, canvas, { dpr = 1, extraRotation = 0 } = {}) {
  const viewport = page.getViewport({ scale, rotation: (page.rotate + extraRotation + 360) % 360 });
  canvas.width = Math.floor(viewport.width * dpr);
  canvas.height = Math.floor(viewport.height * dpr);
  canvas.style.width = Math.floor(viewport.width) + 'px';
  canvas.style.height = Math.floor(viewport.height) + 'px';
  const ctx = canvas.getContext('2d');
  const task = page.render({ canvasContext: ctx, viewport, transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined, background: '#ffffff' });
  return { viewport, task, done: task.promise };
}

/** Render page `pageNum` (1-based) of a pdf.js doc into a fresh canvas at the given DPI. */
export async function pageToCanvas(doc, pageNum, dpi = 150) {
  const page = await doc.getPage(pageNum);
  const canvas = h('canvas');
  const r = renderPage(page, dpi / 72, canvas);
  await r.done;
  page.cleanup();
  return canvas;
}

/** Build a TextLayer on `container` for `page` at `viewport`. Returns the TextLayer instance. */
export async function buildTextLayer(page, viewport, container) {
  const lib = await pdfjs();
  container.replaceChildren();
  container.style.width = viewport.width + 'px';
  container.style.height = viewport.height + 'px';
  container.style.setProperty('--scale-factor', viewport.scale);
  container.style.setProperty('--total-scale-factor', viewport.scale);
  const layer = new lib.TextLayer({ textContentSource: page.streamTextContent(), container, viewport });
  await layer.render();
  return layer;
}

/** Release a pdf.js document (API differs across versions). */
export async function closePdf(doc) {
  try { await (doc?.loadingTask?.destroy?.() ?? doc?.destroy?.()); } catch { /* ignore */ }
}

export async function pageText(page) {
  const tc = await page.getTextContent();
  let s = '';
  for (const it of tc.items) { s += it.str; if (it.hasEOL) s += '\n'; }
  return s;
}

export async function canvasToBytes(canvas, type = 'image/jpeg', q = 0.8) {
  const blob = await canvasToBlob(canvas, type, q);
  return new Uint8Array(await blob.arrayBuffer());
}

export const PAGE_SIZES = { a4: [595.28, 841.89], letter: [612, 792] };

/** Re-build a PDF as page images (used for compression and for permanent redaction). */
export async function rasterizePdf(bytes, { dpi = 150, quality = 0.8, onProgress } = {}) {
  const { PDFDocument } = window.PDFLib;
  const doc = await openPdf(bytes);
  const out = await PDFDocument.create();
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const vp1 = page.getViewport({ scale: 1 });
    const canvas = h('canvas');
    await renderPage(page, dpi / 72, canvas).done;
    const img = await out.embedJpg(await canvasToBytes(canvas, 'image/jpeg', quality));
    const p = out.addPage([vp1.width, vp1.height]);
    p.drawImage(img, { x: 0, y: 0, width: vp1.width, height: vp1.height });
    canvas.width = canvas.height = 0; page.cleanup();
    onProgress?.(i / doc.numPages); await tick();
  }
  await closePdf(doc);
  out.setProducer('Pagecraft');
  return out.save();
}
