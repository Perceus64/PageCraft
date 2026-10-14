import { $, h, mountDrop, fmtBytes, download, stripExt, fail, progress, toast, tick } from './util.js';
import { t, onLang } from './i18n.js';
import { openPdf, closePdf, renderPage, buildTextLayer, pageText } from './pdfcore.js';

const S = { doc: null, file: null, n: 1, zoom: 1, texts: null, query: '', task: null, token: 0 };
const PX = 96 / 72; // CSS px per PDF point at 100%

export function init() {
  mountDrop($('#read-drop'), files => load(files[0]));
  $('#r-prev').onclick = () => go(S.n - 1);
  $('#r-next').onclick = () => go(S.n + 1);
  $('#r-page').onchange = e => go(+e.target.value);
  $('#r-zin').onclick = () => setZoom(S.zoom * 1.2);
  $('#r-zout').onclick = () => setZoom(S.zoom / 1.2);
  $('#r-fit').onclick = fit;
  $('#r-search').onclick = search;
  $('#r-q').addEventListener('keydown', e => { if (e.key === 'Enter') search(); });
  $('#r-extract').onclick = extract;
  $('#r-dltext').onclick = async () => {
    if (!$('#r-textout').value) await extract();
    download(new Blob([$('#r-textout').value], { type: 'text/plain;charset=utf-8' }), stripExt(S.file.name) + '.txt');
  };
  document.addEventListener('keydown', e => {
    if (document.body.dataset.tab !== 'read' || !S.doc || /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName)) return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown') go(S.n + (document.dir === 'rtl' ? -1 : 1));
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') go(S.n + (document.dir === 'rtl' ? 1 : -1));
  });
  onLang(() => { if (S.doc) info(); });
}

async function load(file) {
  try {
    progress.show(t('msg.working'));
    closePdf(S.doc);
    S.doc = await openPdf(await file.arrayBuffer());
    S.file = file; S.n = 1; S.texts = null; S.query = '';
    $('#r-textout').value = ''; $('#r-results').replaceChildren(); $('#r-q').value = '';
    $('#read-ui').hidden = false;
    $('#r-count').textContent = S.doc.numPages;
    $('#r-page').max = S.doc.numPages;
    await info();
    await fit();
  } catch (e) { fail(e); } finally { progress.hide(); }
}

async function info() {
  const { info: i } = await S.doc.getMetadata().catch(() => ({ info: {} }));
  const dl = $('#r-info'); dl.replaceChildren();
  const rows = [['info.name', S.file.name], ['info.pages', S.doc.numPages], ['info.size', fmtBytes(S.file.size)],
    ['info.title', i?.Title], ['info.author', i?.Author], ['info.producer', i?.Producer], ['info.version', i?.PDFFormatVersion]];
  for (const [k, v] of rows) if (v) dl.append(h('dt', {}, t(k)), h('dd', { dir: 'auto' }, String(v)));
}

async function fit() {
  const page = await S.doc.getPage(S.n);
  const w = $('#r-stage').clientWidth - 36;
  setZoom(Math.max(0.2, Math.min(3, w / (page.getViewport({ scale: 1 }).width * PX))));
}

function setZoom(z) { S.zoom = Math.max(0.2, Math.min(4, z)); $('#r-zoom').textContent = Math.round(S.zoom * 100) + '%'; draw(); }
function go(n) { if (!S.doc) return; S.n = Math.max(1, Math.min(S.doc.numPages, n || 1)); $('#r-page').value = S.n; draw(); $('#r-stage').scrollTop = 0; }

async function draw() {
  if (!S.doc) return;
  const token = ++S.token;
  S.task?.cancel?.();
  const page = await S.doc.getPage(S.n);
  if (token !== S.token) return;
  const canvas = $('#r-canvas');
  const r = renderPage(page, S.zoom * PX, canvas, { dpr: Math.min(window.devicePixelRatio || 1, 2) });
  S.task = r.task;
  try { await r.done; } catch { return; /* cancelled */ }
  if (token !== S.token) return;
  const layer = await buildTextLayer(page, r.viewport, $('#r-text'));
  if (S.query && token === S.token) {
    const q = S.query.toLowerCase();
    layer.textDivs?.forEach(d => { if (d.textContent.toLowerCase().includes(q)) d.classList.add('hl'); });
  }
}

async function allText() {
  if (S.texts) return S.texts;
  const out = [];
  progress.show(t('read.searching'));
  for (let i = 1; i <= S.doc.numPages; i++) {
    out.push(await pageText(await S.doc.getPage(i)));
    progress.set(i / S.doc.numPages);
    if (i % 5 === 0) await tick();
  }
  progress.hide();
  return (S.texts = out);
}

async function search() {
  const q = $('#r-q').value.trim();
  if (!S.doc || !q) return;
  try {
    S.query = q;
    const texts = await allText();
    const needle = q.toLowerCase();
    const box = $('#r-results'); box.replaceChildren();
    let hits = 0;
    for (let p = 0; p < texts.length && hits < 300; p++) {
      const flat = texts[p].replace(/\s+/g, ' ');
      const low = flat.toLowerCase();
      for (let i = low.indexOf(needle); i !== -1 && hits < 300; i = low.indexOf(needle, i + needle.length)) {
        hits++;
        const pre = flat.slice(Math.max(0, i - 30), i), mid = flat.slice(i, i + needle.length), post = flat.slice(i + needle.length, i + needle.length + 40);
        box.append(h('button', { dir: 'auto', onclick: () => go(p + 1) }, h('small', { class: 'muted' }, t('msg.page') + ' ' + (p + 1) + ' · '), pre, h('b', {}, mid), post));
      }
    }
    if (!hits) box.append(h('p', { class: 'muted' }, t('read.noresults')));
    else box.prepend(h('p', { class: 'muted' }, t('read.hits', { n: hits })));
    $('#r-results').closest('details').open = true;
    draw();
  } catch (e) { fail(e); }
}

async function extract() {
  if (!S.doc) return toast(t('msg.nopdf'), 'warn');
  try {
    const texts = await allText();
    const joined = texts.map((s, i) => `--- ${t('msg.page')} ${i + 1} ---\n${s.trim()}`).join('\n\n');
    $('#r-textout').value = joined;
    $('#r-textout').closest('details').open = true;
    if (!texts.some(s => s.trim())) toast(t('read.notext'), 'warn', 6000);
  } catch (e) { fail(e); }
}
