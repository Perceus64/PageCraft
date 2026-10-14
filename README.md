# Pagecraft — PDF & Image Studio

Read, organize, edit, convert, OCR and optimise **PDFs and images entirely in the browser**.
No server, no uploads, no build step — it is a static site that runs on **GitHub Pages**.

UI languages: **English, العربية (RTL), Français, Español**. OCR: **39 languages**. PDF text/annotations: **Latin, Cyrillic, Greek, Arabic & Persian/Urdu** (with correct shaping and bidirectional layout).

## Features

| Tab | What it does |
|---|---|
| **Read** | Fast viewer (pdf.js) with zoom, selectable text, full-text search with highlights, text extraction → `.txt`, document info |
| **Organize** | Merge several PDFs, drag-and-drop reorder, rotate, delete, duplicate, insert blank pages, extract selection, split every *N* pages or by ranges (ZIP) |
| **Edit** | **Edit existing text** (click a line, retype), click-to-place **text** with a **font picker** (Sans / Serif / Monospace / Handwriting, bold; any supported script, LTR/RTL), **images**, drawn **signature**, rectangles, **highlight**, **white-out**, **redact**; **watermark**, **page numbers**, **metadata**; optional *flatten* to make redactions permanent |
| **Convert** | Images → PDF (A4 / Letter / fit-to-image), PDF → PNG/JPG/WebP (ZIP), **Text → PDF in any supported language**, **Compress PDF** (lossless optimise, or shrink by rasterising) |
| **OCR** | Tesseract (WebAssembly) on images or PDF pages, multi-language at once (e.g. Arabic + English + French), pre-processing, **searchable-PDF output** |
| **Images** | Batch resize, crop (free / aspect presets), rotate/flip, brightness/contrast/saturation/blur, grayscale/sepia/invert, text watermark (any script), PNG/JPG/WebP, **“max size in KB” auto-tuning**, EXIF/GPS stripped, ZIP export |

## Fonts

* **Built-in families** (regular + bold): Sans, Serif, Monospace, Handwriting — each covering Latin, Latin-Ext, Cyrillic and Greek (Handwriting: no Greek), plus Arabic via Noto Sans Arabic / Noto Naskh Arabic. Missing glyphs fall back to Sans automatically.
* **Your own fonts:** click **＋ Fonts** to upload `.ttf`, TrueType-flavoured `.otf` or `.woff` files, or (Chrome/Edge) pick an installed system font. They appear in every font menu (editor, watermark, Text → PDF, image watermark). Fonts live in the current tab only and are never uploaded; characters a font lacks fall back to the built-in font.
* **Not supported:** OpenType fonts with CFF outlines, WOFF2 and `.ttc` collections (pdf-lib cannot embed them correctly, so they are rejected with a message — use the `.ttf` version). CJK fonts are too large to bundle; add one via **＋ Fonts**.

## Where WebAssembly is used

* **Tesseract OCR** — the OCR engine is a WebAssembly build (`vendor/tesseract/core/*.wasm.js`).
* **pdf.js** — image decoders for JPEG 2000 and JBIG2 are WebAssembly (`vendor/pdfjs/wasm`).
* Everything else (pdf-lib, canvas image processing) is plain JavaScript.

## Run locally

```bash
npm run serve        # python3 -m http.server 8080  → http://localhost:8080
```

ES modules and Web Workers need `http://`, so don't open `index.html` via `file://`.

## Deploy to GitHub Pages

1. Push this folder to a GitHub repo (default branch `main`).
2. **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. The included workflow (`.github/workflows/pages.yml`) publishes `index.html`, `css/`, `js/`, `vendor/` on every push.

All paths are relative, so it works under `https://<user>.github.io/<repo>/`.

## OCR language data (important)

Tesseract downloads a language model (~1–15 MB) the first time you use a language, then caches it in the browser.
By default it comes from a public CDN, so OCR needs internet on first use. To **self-host** (offline / stricter privacy):

1. Download `<lang>.traineddata.gz` files (e.g. from the `@tesseract.js-data/*` npm packages, folder `4.0.0_best_int`) into `./tessdata/`.
2. In `index.html`, uncomment `<meta name="ocr-lang-path" content="./tessdata">` (or open the site with `?langPath=./tessdata`).

The workflow copies a `tessdata/` folder if present. GitHub Pages limits: 1 GB site, 100 MB per file.

## How multi-language PDF text works

PDF libraries don't shape Arabic or do bidi on their own. `js/textengine.js` does it:

1. A small **bidi pass** splits a line into LTR/RTL runs and reorders them visually.
2. Arabic runs are **shaped to Unicode presentation forms** (initial / medial / final / ligatures such as لا), covering Arabic, Persian (پ چ ژ گ ک ی) and common Urdu letters.
3. Characters are routed to the right embedded **Noto Sans** subset (Latin, Latin-Ext, Cyrillic, Greek, Arabic).

Limitations: Arabic diacritics (tashkeel) are dropped when *writing* text; CJK/Hebrew/Indic scripts need a font added via **＋ Fonts** for editing/Text→PDF (OCR supports them out of the box).

## Other limitations

* PDFs can't have their **existing text edited** in place (that needs a full PDF engine) — you can cover it (white-out) and add new text.
* **Password protect / encrypted PDFs**: encrypted PDFs can't be opened, and encryption isn't offered (pdf-lib has no encryption).
* **Redact** boxes only hide visually unless **“Flatten to images”** is ticked on export (then the text underneath is truly gone).
* “Shrink” compression rasterises pages, so text is no longer selectable (use OCR → searchable PDF to get it back).
* Very large PDFs (hundreds of MB) are limited by browser memory.

## Project layout

```
index.html            app shell (all tabs)
css/style.css         light/dark theme, RTL-aware (logical properties)
js/app.js             tab routing, theme, language switch
js/i18n.js            UI translations — add a language here + an <option> in index.html
js/textengine.js      Arabic shaping, bidi, per-script/per-family font selection for pdf-lib
js/fonts.js           font registry: built-in families, uploaded & system fonts, WOFF→TTF
js/pdfcore.js         pdf.js helpers (open, render, text layer, rasterize)
js/{read,organize,edit,convert,ocr,images}.js   one module per tab (lazy-loaded)
vendor/               pdf-lib, fontkit, JSZip, pdf.js (legacy build), Tesseract + WASM cores, Noto fonts
scripts/vendor.mjs    `npm install && npm run vendor` refreshes vendor/ from node_modules
scripts/build_fonts.py  regenerates vendor/fonts + css/fonts.css (needs `pip install fonttools brotli`)
```

Font files in `vendor/fonts` come from `@fontsource` (Noto Sans/Serif/Sans Mono/Naskh Arabic, Caveat; SIL OFL). The `.woff` files drive the on-screen editor; matching `.ttf` copies (converted by `scripts/build_fonts.py`) are embedded in exported PDFs, because pdf-lib's subsetter mishandles Arabic composite glyphs.

## Licences

Pagecraft code: MIT. Bundled: pdf-lib (MIT), pdf.js (Apache-2.0), Tesseract.js & core (Apache-2.0), JSZip (MIT/GPL), fontkit (MIT), Noto fonts and Caveat (SIL OFL 1.1).
