import { $, $$, fail } from './util.js';
import { setLang, initialLang, applyI18n } from './i18n.js';
import { initFonts } from './fonts.js';

const TABS = {
  read: () => import('./read.js'),
  organize: () => import('./organize.js'),
  edit: () => import('./edit.js'),
  convert: () => import('./convert.js'),
  ocr: () => import('./ocr.js'),
  images: () => import('./images.js'),
};
const loaded = new Set();

async function show(tab) {
  if (!TABS[tab]) tab = 'read';
  $$('#tabs [role=tab]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.tab === tab)));
  $$('.panel').forEach(p => { p.hidden = p.id !== 'tab-' + tab; });
  document.body.dataset.tab = tab;
  if (!loaded.has(tab)) {
    loaded.add(tab);
    try { (await TABS[tab]()).init(); applyI18n($('#tab-' + tab)); } catch (e) { loaded.delete(tab); fail(e); }
  }
  if (location.hash !== '#' + tab) history.replaceState(null, '', '#' + tab);
}

function initTheme() {
  let saved = null;
  try { saved = localStorage.getItem('pc.theme'); } catch { /* ignore */ }
  if (saved) document.documentElement.dataset.theme = saved;
  $('#theme').addEventListener('click', () => {
    const dark = matchMedia('(prefers-color-scheme: dark)').matches;
    const cur = document.documentElement.dataset.theme || (dark ? 'dark' : 'light');
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('pc.theme', next); } catch { /* ignore */ }
  });
}

window.addEventListener('unhandledrejection', e => fail(e.reason));

$('#tabs').addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (b) show(b.dataset.tab); });
window.addEventListener('hashchange', () => show(location.hash.slice(1)));
$('#lang').addEventListener('change', e => setLang(e.target.value));

initTheme();
initFonts();
const l = initialLang();
$('#lang').value = l;
setLang(l);
show(location.hash.slice(1) || 'read');
