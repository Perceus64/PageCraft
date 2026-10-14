// Multi-script text layout for pdf-lib: Arabic shaping (presentation forms), simple bidi,
// and per-script font selection. No dependencies besides a pdf-lib font loader.

// [isolated, final, initial, medial]  (right-joining letters only have the first two)
const FORMS = {
  0x621: [0xFE80], 0x622: [0xFE81, 0xFE82], 0x623: [0xFE83, 0xFE84], 0x624: [0xFE85, 0xFE86],
  0x625: [0xFE87, 0xFE88], 0x626: [0xFE89, 0xFE8A, 0xFE8B, 0xFE8C], 0x627: [0xFE8D, 0xFE8E],
  0x628: [0xFE8F, 0xFE90, 0xFE91, 0xFE92], 0x629: [0xFE93, 0xFE94],
  0x62A: [0xFE95, 0xFE96, 0xFE97, 0xFE98], 0x62B: [0xFE99, 0xFE9A, 0xFE9B, 0xFE9C],
  0x62C: [0xFE9D, 0xFE9E, 0xFE9F, 0xFEA0], 0x62D: [0xFEA1, 0xFEA2, 0xFEA3, 0xFEA4],
  0x62E: [0xFEA5, 0xFEA6, 0xFEA7, 0xFEA8], 0x62F: [0xFEA9, 0xFEAA], 0x630: [0xFEAB, 0xFEAC],
  0x631: [0xFEAD, 0xFEAE], 0x632: [0xFEAF, 0xFEB0],
  0x633: [0xFEB1, 0xFEB2, 0xFEB3, 0xFEB4], 0x634: [0xFEB5, 0xFEB6, 0xFEB7, 0xFEB8],
  0x635: [0xFEB9, 0xFEBA, 0xFEBB, 0xFEBC], 0x636: [0xFEBD, 0xFEBE, 0xFEBF, 0xFEC0],
  0x637: [0xFEC1, 0xFEC2, 0xFEC3, 0xFEC4], 0x638: [0xFEC5, 0xFEC6, 0xFEC7, 0xFEC8],
  0x639: [0xFEC9, 0xFECA, 0xFECB, 0xFECC], 0x63A: [0xFECD, 0xFECE, 0xFECF, 0xFED0],
  0x641: [0xFED1, 0xFED2, 0xFED3, 0xFED4], 0x642: [0xFED5, 0xFED6, 0xFED7, 0xFED8],
  0x643: [0xFED9, 0xFEDA, 0xFEDB, 0xFEDC], 0x644: [0xFEDD, 0xFEDE, 0xFEDF, 0xFEE0],
  0x645: [0xFEE1, 0xFEE2, 0xFEE3, 0xFEE4], 0x646: [0xFEE5, 0xFEE6, 0xFEE7, 0xFEE8],
  0x647: [0xFEE9, 0xFEEA, 0xFEEB, 0xFEEC], 0x648: [0xFEED, 0xFEEE], 0x649: [0xFEEF, 0xFEF0],
  0x64A: [0xFEF1, 0xFEF2, 0xFEF3, 0xFEF4],
  // Persian / Urdu / Kurdish extras
  0x67E: [0xFB56, 0xFB57, 0xFB58, 0xFB59], 0x686: [0xFB7A, 0xFB7B, 0xFB7C, 0xFB7D],
  0x698: [0xFB8A, 0xFB8B], 0x6A9: [0xFB8E, 0xFB8F, 0xFB90, 0xFB91],
  0x6AF: [0xFB92, 0xFB93, 0xFB94, 0xFB95], 0x6CC: [0xFBFC, 0xFBFD, 0xFBFE, 0xFBFF],
  0x679: [0xFB66, 0xFB67, 0xFB68, 0xFB69], 0x688: [0xFB88, 0xFB89], 0x691: [0xFB8C, 0xFB8D],
  0x6BA: [0xFB9E, 0xFB9F], 0x6D2: [0xFBAE, 0xFBAF], 0x6BE: [0xFBAA, 0xFBAB, 0xFBAC, 0xFBAD],
  0x6C1: [0xFBA6, 0xFBA7, 0xFBA8, 0xFBA9],
};
// lam + alef ligatures: [isolated, final]
const LAM_ALEF = { 0x622: [0xFEF5, 0xFEF6], 0x623: [0xFEF7, 0xFEF8], 0x625: [0xFEF9, 0xFEFA], 0x627: [0xFEFB, 0xFEFC] };

const isMark = c => (c >= 0x64B && c <= 0x65F) || c === 0x670 || (c >= 0x6D6 && c <= 0x6ED);
const dualJoin = c => FORMS[c] && FORMS[c].length === 4;
const canJoinNext = c => dualJoin(c) || c === 0x640;           // tatweel joins both sides
const canJoinPrev = c => !!FORMS[c] && c !== 0x621 || c === 0x640;

export function isArabicCp(c) {
  return (c >= 0x600 && c <= 0x6FF) || (c >= 0x750 && c <= 0x77F) || (c >= 0x8A0 && c <= 0x8FF) ||
    (c >= 0xFB50 && c <= 0xFDFF) || (c >= 0xFE70 && c <= 0xFEFF);
}

/** Shape a logical-order Arabic string to presentation forms (still logical order). Diacritics are dropped. */
export function shapeArabic(str) {
  const cps = [...str].map(ch => ch.codePointAt(0)).filter(c => !isMark(c));
  const out = [];
  for (let i = 0; i < cps.length; i++) {
    const c = cps[i];
    if (!FORMS[c] && c !== 0x640) { out.push(c); continue; }
    const prev = cps[i - 1], next = cps[i + 1];
    const joinsPrev = prev !== undefined && canJoinNext(prev);
    // lam + alef ligature
    if (c === 0x644 && LAM_ALEF[next]) {
      out.push(LAM_ALEF[next][joinsPrev ? 1 : 0]); i++; continue;
    }
    if (c === 0x640) { out.push(c); continue; }
    const f = FORMS[c];
    const joinsNext = f.length === 4 && next !== undefined && canJoinPrev(next);
    let idx = 0;
    if (joinsPrev && joinsNext) idx = f.length === 4 ? 3 : 1;
    else if (joinsPrev) idx = 1;
    else if (joinsNext) idx = 2;
    out.push(f[idx] ?? f[0]);
  }
  return String.fromCodePoint(...out);
}

const MIRROR = { '(': ')', ')': '(', '[': ']', ']': '[', '{': '}', '}': '{', '<': '>', '>': '<', '«': '»', '»': '«' };

// Strong-direction class of a char: 'R', 'L' or 'N' (neutral)
function dirClass(ch) {
  const c = ch.codePointAt(0);
  if (isArabicCp(c)) return (c >= 0x660 && c <= 0x669) || (c >= 0x6F0 && c <= 0x6F9) ? 'D' : 'R';
  if (/[0-9]/.test(ch)) return 'D'; // digits: keep LTR internally, don't flip neighbours
  if (/\p{L}/u.test(ch)) return 'L';
  return 'N';
}

export function baseDirection(text, forced) {
  if (forced === 'rtl' || forced === 'ltr') return forced;
  for (const ch of text) { const d = dirClass(ch); if (d === 'R') return 'rtl'; if (d === 'L') return 'ltr'; }
  return 'ltr';
}

/** Convert one logical line to visual order with Arabic shaped. Returns a string ready to draw left-to-right. */
export function visualLine(text, forced) {
  const base = baseDirection(text, forced);
  const chars = [...text];
  let cls = chars.map(dirClass);
  // resolve digits: treat as L-run (kept in order); neutrals take surrounding direction
  const eff = cls.map(c => (c === 'D' ? 'L' : c));
  for (let i = 0; i < eff.length; i++) {
    if (eff[i] !== 'N') continue;
    let j = i; while (j < eff.length && eff[j] === 'N') j++;
    const left = i > 0 ? eff[i - 1] : base === 'rtl' ? 'R' : 'L';
    const right = j < eff.length ? eff[j] : base === 'rtl' ? 'R' : 'L';
    const d = left === right ? left : base === 'rtl' ? 'R' : 'L';
    for (let k = i; k < j; k++) eff[k] = d;
    i = j - 1;
  }
  // group runs
  const runs = [];
  for (let i = 0; i < chars.length; i++) {
    const d = eff[i];
    if (runs.length && runs[runs.length - 1].d === d) runs[runs.length - 1].t += chars[i];
    else runs.push({ d, t: chars[i] });
  }
  for (const r of runs) {
    if (r.d === 'R') {
      const shaped = shapeArabic(r.t);
      r.t = [...shaped].reverse().map(ch => MIRROR[ch] ?? ch).join('');
    }
  }
  if (base === 'rtl') runs.reverse();
  return { text: runs.map(r => r.t).join(''), dir: base };
}

// ---------- font selection ----------
export function fontKeyFor(ch) {
  const c = ch.codePointAt(0);
  if (isArabicCp(c)) return 'arabic';
  if (c >= 0x400 && c <= 0x52F) return 'cyrillic';
  if (c >= 0x370 && c <= 0x3FF) return 'greek';
  if ((c >= 0x100 && c <= 0x24F) || (c >= 0x1E00 && c <= 0x1EFF)) return 'latin-ext';
  return 'latin';
}

/** A font choice: built-in family ('sans'|'serif'|'mono'|'hand'), bold flag, optional custom font {id, bytes, cps, whole}. */
export const DEFAULT_FONT = { family: 'sans', bold: false, custom: null };

/** Split a visual string into [{key, text}] runs. `key` is a script key, or 'custom' when the custom font has the glyph. */
export function fontSegments(visual, spec = DEFAULT_FONT) {
  const segs = [];
  for (const ch of visual) {
    const cp = ch.codePointAt(0);
    const key = spec.custom && spec.custom.cps.has(cp) ? 'custom' : fontKeyFor(ch);
    const last = segs[segs.length - 1];
    if (last && last.key === key) last.text += ch; else segs.push({ key, text: ch });
  }
  return segs;
}

// fontkit reverses any all-RTL-script string internally; pre-reverse Arabic runs so the final order is what we computed.
// (custom fonts: only when the run really is Arabic script)
const forFontkit = (key, text) => (key === 'arabic' || (key === 'custom' && [...text].every(c => isArabicCp(c.codePointAt(0)))) ? [...text].reverse().join('') : text);
// We shape/reorder ourselves, so switch off fontkit's own GSUB/GPOS shaping.
const NO_FEATURES = Object.fromEntries(['ccmp', 'locl', 'rlig', 'liga', 'clig', 'calt', 'init', 'medi', 'fina', 'isol', 'mark', 'mkmk', 'curs', 'kern', 'rclt', 'dlig'].map(k => [k, false]));

let manifestP;
const loadManifest = base => (manifestP ||= fetch(base + 'manifest.json').then(r => r.json()));

/** Load (and cache per PDFDocument) the embedded fonts. */
export async function makeFontSet(pdfDoc, PDFLib, fontkit, base = new URL('../vendor/fonts/', import.meta.url).href) {
  pdfDoc.registerFontkit(fontkit);
  const manifest = await loadManifest(base);
  const cache = {}, bytes = {};
  const stemFor = (family, script, bold) => {
    const pick = f => manifest.files[f]?.[script];
    const m = pick(family) || pick('sans');
    return m[bold && m['700'] ? '700' : '400'];
  };
  const get = async (key, spec = DEFAULT_FONT) => {
    if (key === 'custom') {
      const ck = 'c:' + spec.custom.id;
      if (!cache[ck]) cache[ck] = await pdfDoc.embedFont(spec.custom.bytes, { subset: !spec.custom.whole, features: NO_FEATURES });
      return cache[ck];
    }
    const stem = stemFor(spec.family, key, spec.bold);
    if (!cache[stem]) {
      bytes[stem] ||= fetch(base + stem + '.ttf').then(r => r.arrayBuffer());
      cache[stem] = await pdfDoc.embedFont(await bytes[stem], { subset: false, features: NO_FEATURES });
    }
    return cache[stem];
  };
  const widthOf = async (visual, size, spec = DEFAULT_FONT) => {
    let w = 0;
    for (const s of fontSegments(visual, spec)) w += (await get(s.key, spec)).widthOfTextAtSize(forFontkit(s.key, s.text), size);
    return w;
  };
  /** Draw a single logical line from (x, y=baseline), optionally rotated by `angle` degrees about the start. Returns width. */
  const drawLine = async (page, text, { x, y, size, color, opacity = 1, angle = 0, forceDir, font = DEFAULT_FONT }) => {
    const { text: vis } = visualLine(text, forceDir);
    const a = (angle * Math.PI) / 180, cos = Math.cos(a), sin = Math.sin(a);
    let off = 0;
    for (const s of fontSegments(vis, font)) {
      const f = await get(s.key, font);
      const opts = { x: x + cos * off, y: y + sin * off, size, font: f, color, opacity };
      if (angle) opts.rotate = PDFLib.degrees(angle);
      const t = forFontkit(s.key, s.text);
      page.drawText(t, opts);
      off += f.widthOfTextAtSize(t, size);
    }
    return off;
  };
  const measureLine = async (text, size, forceDir, font = DEFAULT_FONT) => widthOf(visualLine(text, forceDir).text, size, font);
  return { get, widthOf, drawLine, measureLine };
}

/** Wrap a paragraph (logical text) to maxWidth; returns array of logical lines. */
export async function wrapParagraph(text, size, maxWidth, fonts, forceDir, font = DEFAULT_FONT) {
  if (!text.trim()) return [''];
  const words = text.split(/(\s+)/).filter(s => s.length);
  const lines = []; let cur = '';
  for (const w of words) {
    const test = cur + w;
    if (cur && (await fonts.measureLine(test.trimEnd(), size, forceDir, font)) > maxWidth && w.trim()) {
      lines.push(cur.trimEnd()); cur = w.trimStart();
    } else cur = test;
  }
  if (cur.trim().length) lines.push(cur.trimEnd());
  return lines;
}
