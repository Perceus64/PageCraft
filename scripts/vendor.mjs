// Refreshes ./vendor from node_modules after `npm install` / upgrades.  Usage: npm run vendor
// (Fonts in vendor/fonts were converted woff -> ttf once with fontTools; see README.)
import { cpSync, mkdirSync, rmSync } from 'node:fs';
const nm = 'node_modules/', v = 'vendor/';
const cp = (from, to) => cpSync(nm + from, v + to, { recursive: true });
rmSync(v + 'pdfjs', { recursive: true, force: true }); rmSync(v + 'tesseract', { recursive: true, force: true });
mkdirSync(v + 'pdfjs', { recursive: true }); mkdirSync(v + 'tesseract/core', { recursive: true });
cp('pdf-lib/dist/pdf-lib.min.js', 'pdf-lib.min.js');
cp('@pdf-lib/fontkit/dist/fontkit.umd.min.js', 'fontkit.umd.min.js');
cp('jszip/dist/jszip.min.js', 'jszip.min.js');
// pdf.js: the *legacy* build runs on older browsers too
cp('pdfjs-dist/legacy/build/pdf.min.mjs', 'pdfjs/pdf.min.mjs');
cp('pdfjs-dist/legacy/build/pdf.worker.min.mjs', 'pdfjs/pdf.worker.min.mjs');
for (const d of ['wasm', 'cmaps', 'standard_fonts', 'iccs']) cp('pdfjs-dist/' + d, 'pdfjs/' + d);
cp('tesseract.js/dist/tesseract.min.js', 'tesseract/tesseract.min.js');
cp('tesseract.js/dist/worker.min.js', 'tesseract/worker.min.js');
for (const f of ['tesseract-core-lstm', 'tesseract-core-simd-lstm', 'tesseract-core-relaxedsimd-lstm']) cp(`tesseract.js-core/${f}.wasm.js`, `tesseract/core/${f}.wasm.js`);
console.log('vendor/ refreshed');
