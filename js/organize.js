import { $, h, mountDrop, download, stripExt, fail, progress, toast, parseRanges, newZip, tick } from './util.js';
import { t, onLang } from './i18n.js';
import { openPdf, renderPage, PAGE_SIZES } from './pdfcore.js';

const { PDFDocument, degrees } = window.PDFLib;
// sources: [{name, bytes, doc (pdf.js), lib (pdf-lib, lazy)}]   items: [{id, src, page, rot, blank, sel}]
const S = { sources: [], items: [], nextId: 1, last: -1 };
let io;

export function init() {
  mountDrop($('#org-drop'), addFiles);
  $('#o-all').onclick = () => { S.items.forEach(i => (i.sel = true)); refresh(); };
  $('#o-none').onclick = () => { S.items.forEach(i => (i.sel = false)); refresh(); };
  $('#o-rangebtn').onclick = () => {
    const idx = parseRanges($('#o-range').value, S.items.length);
    S.items.forEach((it, i) => (it.sel = idx.includes(i))); refresh();
  };
  $('#o-rl').onclick = () => rotate(-90);
  $('#o-rr').onclick = () => rotate(90);
  $('#o-del').onclick = () => { S.items = S.items.filter(i => !i.sel); render(); };
  $('#o-dup').onclick = () => {
    const out = [];
    for (const it of S.items) { out.push(it); if (it.sel) out.push({ ...it, id: S.nextId++, sel: false }); }
    S.items = out; render();
  };
  $('#o-blank').onclick = () => {
    const at = S.items.findLastIndex(i => i.sel);
    S.items.splice(at + 1 || S.items.length, 0, { id: S.nextId++, blank: true, rot: 0, sel: false }); render();
  };
  $('#o-rev').onclick = () => { S.items.reverse(); render(); };
  $('#o-export').onclick = () => exportPdf(S.items, 'merged.pdf');
  $('#o-export-sel').onclick = () => {
    const sel = S.items.filter(i => i.sel);
    if (!sel.length) return toast(t('org.nosel'), 'warn');
    exportPdf(sel, 'selected.pdf');
  };
  $('#o-split-n').onclick = () => {
    const n = Math.max(1, +$('#o-every').value || 1), groups = [];
    for (let i = 0; i < S.items.length; i += n) groups.push(S.items.slice(i, i + n));
    splitZip(groups);
  };
  $('#o-split-r').onclick = () => {
    const groups = $('#o-ranges').value.split(/;/).map(s => parseRanges(s, S.items.length).map(i => S.items[i])).filter(g => g.length);
    if (!groups.length) return toast(t('org.nosel'), 'warn');
    splitZip(groups);
  };
  onLang(status);
  io = new IntersectionObserver(entries => {
    for (const e of entries) if (e.isIntersecting) { io.unobserve(e.target); paintThumb(e.target); }
  }, { rootMargin: '300px' });
}

async function addFiles(files) {
  try {
    progress.show(t('msg.working'));
    for (const f of files) {
      const bytes = new Uint8Array(await f.arrayBuffer());
      const doc = await openPdf(bytes);
      const si = S.sources.push({ name: f.name, bytes, doc, lib: null }) - 1;
      for (let p = 0; p < doc.numPages; p++) S.items.push({ id: S.nextId++, src: si, page: p, rot: 0, sel: false });
    }
    $('#org-ui').hidden = false;
    render();
  } catch (e) { fail(e); } finally { progress.hide(); }
}

function rotate(deg) {
  const sel = S.items.filter(i => i.sel);
  (sel.length ? sel : S.items).forEach(i => (i.rot = (i.rot + deg + 360) % 360));
  render();
}

function status() {
  if ($('#o-status')) $('#o-status').textContent = t('org.status', { pages: S.items.length, files: S.sources.length, sel: S.items.filter(i => i.sel).length }) + ' · ' + t('org.drag_hint');
}
function refresh() {
  document.querySelectorAll('#o-grid .thumb').forEach(el => el.classList.toggle('sel', !!S.items.find(i => i.id === +el.dataset.id)?.sel));
  status();
}

function render() {
  const grid = $('#o-grid'); grid.replaceChildren();
  S.items.forEach((it, idx) => {
    const cv = h('canvas');
    const el = h('div', { class: 'thumb' + (it.sel ? ' sel' : ''), draggable: 'true', dataset: { id: it.id } },
      h('span', { class: 'num' }, idx + 1), h('div', { class: 'cv' }, cv),
      h('div', { class: 'cap' }, it.blank ? '∅' : `${S.sources[it.src].name} · ${it.page + 1}`));
    cv.style.transform = `rotate(${it.rot}deg)`;
    el.addEventListener('click', e => {
      if (e.shiftKey && S.last >= 0) {
        const [a, b] = [Math.min(S.last, idx), Math.max(S.last, idx)];
        S.items.forEach((x, i) => { if (i >= a && i <= b) x.sel = true; });
      } else if (e.ctrlKey || e.metaKey) it.sel = !it.sel;
      else it.sel = !it.sel;
      S.last = idx; refresh();
    });
    el.addEventListener('dragstart', e => {
      if (!it.sel) { S.items.forEach(x => (x.sel = false)); it.sel = true; refresh(); }
      e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(it.id));
      requestAnimationFrame(() => grid.querySelectorAll('.thumb.sel').forEach(x => x.classList.add('drag')));
    });
    el.addEventListener('dragend', () => grid.querySelectorAll('.thumb').forEach(x => x.classList.remove('drag', 'dropbefore')));
    el.addEventListener('dragover', e => { e.preventDefault(); grid.querySelectorAll('.dropbefore').forEach(x => x.classList.remove('dropbefore')); el.classList.add('dropbefore'); });
    el.addEventListener('drop', e => {
      e.preventDefault();
      const moving = S.items.filter(x => x.sel);
      if (moving.includes(it)) return;
      const rest = S.items.filter(x => !x.sel);
      const at = rest.indexOf(it);
      rest.splice(at, 0, ...moving); S.items = rest; render();
    });
    grid.append(el);
    el._item = it; el._cv = cv; io.observe(el);
  });
  status();
}

async function paintThumb(el) {
  const it = el._item; const cv = el._cv;
  if (it.blank) { cv.width = 100; cv.height = 140; cv.getContext('2d').fillStyle = '#fff'; cv.getContext('2d').fillRect(0, 0, 100, 140); return; }
  try {
    const page = await S.sources[it.src].doc.getPage(it.page + 1);
    const base = page.getViewport({ scale: 1 });
    renderPage(page, 170 / Math.max(base.width, base.height) * (window.devicePixelRatio > 1 ? 1.6 : 1.1), cv);
    cv.style.width = ''; cv.style.height = '';
  } catch { /* ignore render cancellations */ }
}

async function libOf(si) { const s = S.sources[si]; return (s.lib ||= await PDFDocument.load(s.bytes, { ignoreEncryption: true })); }

async function buildPdf(items) {
  const out = await PDFDocument.create();
  let lastSize = PAGE_SIZES.a4;
  for (const it of items) {
    if (it.blank) { const p = out.addPage(lastSize); if (it.rot) p.setRotation(degrees(it.rot)); continue; }
    const [p] = await out.copyPages(await libOf(it.src), [it.page]);
    if (it.rot) p.setRotation(degrees((p.getRotation().angle + it.rot) % 360));
    out.addPage(p);
    const { width, height } = p.getSize(); lastSize = [width, height];
  }
  out.setProducer('Pagecraft'); out.setCreator('Pagecraft');
  return out.save();
}

async function exportPdf(items, name) {
  if (!items.length) return;
  try {
    progress.show(t('msg.working'));
    const bytes = await buildPdf(items);
    const base = S.sources.length === 1 ? stripExt(S.sources[0].name) : null;
    download(bytes, base ? `${base}-edited.pdf` : name, 'application/pdf');
    toast(t('msg.done'));
  } catch (e) { fail(e); } finally { progress.hide(); }
}

async function splitZip(groups) {
  try {
    progress.show(t('msg.working'));
    const zip = newZip(); const base = S.sources.length === 1 ? stripExt(S.sources[0].name) : 'part';
    for (let i = 0; i < groups.length; i++) {
      zip.file(`${base}-${String(i + 1).padStart(2, '0')}.pdf`, await buildPdf(groups[i]));
      progress.set((i + 1) / groups.length); await tick();
    }
    download(await zip.generateAsync({ type: 'blob' }), `${base}-split.zip`);
    toast(t('msg.done'));
  } catch (e) { fail(e); } finally { progress.hide(); }
}
