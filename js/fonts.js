// Font registry: built-in families + user-supplied fonts (upload / system fonts), shared by every tab.
import { $, h, toast, fail } from './util.js';
import { t, onLang } from './i18n.js';
import { DEFAULT_FONT } from './textengine.js';

const FAMILIES = ['sans', 'serif', 'mono', 'hand'];
const custom = new Map();      // id -> { id, name, bytes, cps, whole }
const selects = new Set();
let seq = 0;

/** "sans" | "custom:3"  +  bold  ->  font spec understood by the text engine */
export function resolveFont(value, bold = false) {
  if (value?.startsWith('custom:')) { const c = custom.get(+value.slice(7)); if (c) return { family: 'sans', bold, custom: c }; }
  return { ...DEFAULT_FONT, family: FAMILIES.includes(value) ? value : 'sans', bold };
}

/** CSS font-family list for the on-screen preview */
export function cssFamily(value) {
  if (value?.startsWith('custom:') && custom.has(+value.slice(7))) return `'PCc${value.slice(7)}', 'PC-sans', sans-serif`;
  return `'PC-${FAMILIES.includes(value) ? value : 'sans'}', 'PC-sans', sans-serif`;
}

/** Fill a <select> with built-in + custom fonts and keep it in sync. */
export function fillFontSelect(sel) { selects.add(sel); refresh(sel); }
function refresh(sel) {
  const cur = sel.value;
  sel.replaceChildren(...FAMILIES.map(f => h('option', { value: f }, t('font.' + f))),
    ...[...custom.values()].map(c => h('option', { value: 'custom:' + c.id }, '★ ' + c.name)));
  if ([...sel.options].some(o => o.value === cur)) sel.value = cur;
}
function refreshAll() { selects.forEach(refresh); renderList(); }

/** Preload every unicode-range sub-face of a family so canvas drawing finds glyphs immediately. */
export function preloadFont(value, weight = 400, sample = '') {
  const fam = cssFamily(value).split(',')[0];
  return document.fonts.load(`${weight} 16px ${fam}`, sample || 'Aa Ж α ع').catch(() => {});
}

// ---- WOFF1 -> sfnt (so pdf-lib can embed it); WOFF2 would need brotli and is rejected
async function woffToSfnt(u8) {
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
  const flavor = dv.getUint32(4), n = dv.getUint16(12);
  const tabs = [];
  for (let i = 0; i < n; i++) { const o = 44 + i * 20; tabs.push({ tag: dv.getUint32(o), off: dv.getUint32(o + 4), comp: dv.getUint32(o + 8), orig: dv.getUint32(o + 12), sum: dv.getUint32(o + 16) }); }
  for (const tb of tabs) {
    const slice = u8.subarray(tb.off, tb.off + tb.comp);
    tb.data = tb.comp === tb.orig ? slice : new Uint8Array(await new Response(new Blob([slice]).stream().pipeThrough(new DecompressionStream('deflate'))).arrayBuffer());
  }
  tabs.sort((a, b) => a.tag - b.tag);
  let size = 12 + 16 * n; tabs.forEach(tb => { tb.pos = size; size += (tb.orig + 3) & ~3; });
  const out = new Uint8Array(size), o = new DataView(out.buffer);
  const es = Math.floor(Math.log2(n)), sr = 16 * 2 ** es;
  o.setUint32(0, flavor); o.setUint16(4, n); o.setUint16(6, sr); o.setUint16(8, es); o.setUint16(10, n * 16 - sr);
  tabs.forEach((tb, i) => { const p = 12 + i * 16; o.setUint32(p, tb.tag); o.setUint32(p + 4, tb.sum); o.setUint32(p + 8, tb.pos); o.setUint32(p + 12, tb.orig); out.set(tb.data, tb.pos); });
  return out;
}

export async function addCustomFont(name, buf) {
  let u8 = new Uint8Array(buf);
  const sig = String.fromCharCode(...u8.subarray(0, 4));
  if (sig === 'wOFF') u8 = await woffToSfnt(u8);
  else if (sig === 'wOF2' || sig === 'ttcf') throw new Error(t('font.bad'));
  // OpenType with CFF outlines ('OTTO') can't be embedded by pdf-lib (the PDF would render without text)
  if (String.fromCharCode(...u8.subarray(0, 4)) === 'OTTO') throw new Error(t('font.cff'));
  let f;
  try { f = window.fontkit.create(u8); } catch { throw new Error(t('font.bad')); }
  if (f.fonts) throw new Error(t('font.bad'));
  const cps = new Set(f.characterSet);
  const isTTF = (u8[0] === 0 && u8[1] === 1 && u8[2] === 0 && u8[3] === 0) || sig === 'true';
  const id = ++seq;
  const face = new FontFace('PCc' + id, u8.slice().buffer);
  await face.load(); document.fonts.add(face);
  // pdf-lib's subsetter drops Arabic composite glyphs, so fonts carrying Arabic presentation forms are embedded whole
  const entry = { id, name: f.fullName || f.familyName || name, bytes: u8, cps, whole: isTTF && cps.has(0xFE8F) };
  custom.set(id, entry); refreshAll();
  toast(t('font.added', { name: entry.name }));
  return entry;
}

function renderList() {
  const ul = $('#font-list'); if (!ul) return; ul.replaceChildren();
  if (!custom.size) ul.append(h('li', { class: 'muted' }, t('font.none')));
  for (const c of custom.values()) ul.append(h('li', {}, h('span', { style: `font-family:'PCc${c.id}'` }, c.name + '  —  Aa Bb 123'), h('small', { class: 'muted' }, c.cps.size + ' glyphs')));
}

export function initFonts() {
  const sysBtn = $('#font-system');
  $('#font-add').onclick = () => { $('#fontdlg').hidden = false; renderList(); };
  $('#font-close').onclick = () => { $('#fontdlg').hidden = true; };
  $('#fontdlg').addEventListener('pointerdown', e => { if (e.target === $('#fontdlg')) $('#fontdlg').hidden = true; });
  $('#font-upload').onclick = () => $('#font-file').click();
  $('#font-file').addEventListener('change', async e => {
    for (const f of e.target.files) { try { await addCustomFont(f.name, await f.arrayBuffer()); } catch (err) { fail(err); } }
    e.target.value = '';
  });
  if ('queryLocalFonts' in window) {
    sysBtn.hidden = false;
    let all = null;
    const show = () => {
      const q = $('#font-q').value.trim().toLowerCase(), box = $('#font-syslist'); box.replaceChildren(); box.hidden = false; $('#font-q').hidden = false;
      all.filter(f => !q || f.fullName.toLowerCase().includes(q)).slice(0, 80).forEach(fd =>
        box.append(h('button', { onclick: async () => { try { await addCustomFont(fd.fullName, await (await fd.blob()).arrayBuffer()); } catch (err) { fail(err); } } }, fd.fullName)));
    };
    sysBtn.onclick = async () => { try { all ||= await window.queryLocalFonts(); show(); } catch { toast(t('font.sys_denied'), 'warn', 6000); } };
    $('#font-q').addEventListener('input', () => all && show());
  }
  onLang(refreshAll);
}
