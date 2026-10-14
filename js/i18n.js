// UI translations. Add a language by adding a block here and an <option> in index.html.
const D = {
  en: {
    'app.skip': 'Skip to content', 'app.language': 'Language', 'app.theme': 'Toggle light / dark theme',
    'app.privacy': 'Everything runs in your browser — your files are never uploaded. (OCR downloads language models on first use.)',
    'app.footer': 'Pagecraft · open source · runs locally with WebAssembly',
    'tab.read': 'Read', 'tab.organize': 'Organize', 'tab.edit': 'Edit', 'tab.convert': 'Convert', 'tab.ocr': 'OCR', 'tab.images': 'Images',
    'drop.generic': 'Drop a file here or click to choose', 'drop.pdf': 'Drop a PDF here or click to choose', 'drop.pdfs': 'Drop one or more PDFs here or click to choose',
    'drop.images': 'Drop images here or click to choose', 'drop.ocr': 'Drop images or a PDF here or click to choose',
    'nav.prev': '← Prev', 'nav.next': 'Next →', 'nav.fit': 'Fit width',
    'read.search': 'Search text in document…', 'read.find': 'Search', 'read.results': 'Search results', 'read.text': 'Extracted text',
    'read.extract': 'Extract all text', 'read.download_txt': 'Download .txt', 'read.info': 'Document info',
    'read.noresults': 'No matches', 'read.hits': '{n} matches', 'read.searching': 'Searching…', 'read.notext': 'No text layer found — try the OCR tab.',
    'info.pages': 'Pages', 'info.size': 'File size', 'info.title': 'Title', 'info.author': 'Author', 'info.producer': 'Producer', 'info.created': 'Created', 'info.version': 'PDF version', 'info.name': 'File',
    'org.select_all': 'Select all', 'org.select_none': 'Clear selection', 'org.range_ph': 'e.g. 1-3, 5, 8-', 'org.select': 'Select',
    'org.rot_left': '⟲ Rotate left', 'org.rot_right': '⟳ Rotate right', 'org.duplicate': 'Duplicate', 'org.blank': 'Insert blank', 'org.reverse': 'Reverse order', 'org.delete': 'Delete',
    'org.export_all': 'Export PDF', 'org.export_sel': 'Export selected', 'org.split_every': 'Split every', 'org.split_zip': 'Split → ZIP', 'org.ranges_ph': 'Ranges: 1-3; 4-6; 7-', 'org.split_ranges': 'Split by ranges → ZIP',
    'org.status': '{pages} pages · {files} file(s) · {sel} selected', 'org.drag_hint': 'Drag pages to reorder.', 'org.nosel': 'Select some pages first.',
    'edit.t_select': 'Select', 'edit.t_text': 'Text', 'edit.t_image': 'Image', 'edit.t_sign': 'Signature', 'edit.t_rect': 'Rectangle', 'edit.t_highlight': 'Highlight', 'edit.t_whiteout': 'White-out', 'edit.t_redact': 'Redact',
    'edit.color': 'Color', 'edit.size': 'Size', 'edit.opacity': 'Opacity', 'edit.delete_obj': 'Delete object', 'edit.text_edit': 'Text', 'edit.text_ph': 'Select a text object, then type here…',
    'edit.dir_auto': 'Auto direction', 'edit.dir': 'Direction', 'edit.default_text': 'Text', 'edit.watermark': 'Watermark', 'edit.wm_text': 'Text', 'edit.wm_ph': 'e.g. CONFIDENTIAL',
    'edit.angle': 'Angle', 'edit.numbers': 'Page numbers', 'edit.numbers_on': 'Add page numbers', 'edit.pos': 'Position', 'edit.start': 'Start at', 'edit.format': 'Format ({n}, {total})',
    'edit.metadata': 'Metadata', 'edit.flatten': 'Flatten to images (makes redactions permanent)', 'edit.redact_hint': 'Tip: black “Redact” boxes only hide content visually unless you flatten the PDF on export.',
    'edit.export': 'Apply edits & download', 'edit.sign_title': 'Draw your signature', 'edit.clear': 'Clear', 'edit.pick_image': 'Choose an image…',
    'pos.bc': 'Bottom center', 'pos.br': 'Bottom right', 'pos.bl': 'Bottom left', 'pos.tc': 'Top center', 'pos.tr': 'Top right', 'pos.tl': 'Top left', 'pos.c': 'Center',
    'meta.title': 'Title', 'meta.author': 'Author', 'meta.subject': 'Subject', 'meta.keywords': 'Keywords',
    'cv.img2pdf': 'Images → PDF', 'cv.pdf2img': 'PDF → Images', 'cv.txt2pdf': 'Text → PDF (any language)', 'cv.compress': 'Compress PDF',
    'cv.pagesize': 'Page size', 'cv.fit_image': 'Fit to image', 'cv.margin': 'Margin (pt)', 'cv.orientation': 'Orientation', 'cv.auto': 'Auto', 'cv.portrait': 'Portrait', 'cv.landscape': 'Landscape',
    'cv.make_pdf': 'Create PDF', 'cv.format': 'Format', 'cv.dpi': 'Resolution (DPI)', 'cv.pages': 'Pages', 'cv.pages_ph': 'All, or e.g. 1-3, 5', 'cv.export_images': 'Export images',
    'cv.txt_ph': 'Type or paste text — English, العربية, Français, Русский, Ελληνικά…', 'cv.mode': 'Mode', 'cv.lossless': 'Optimize (keeps text)', 'cv.raster': 'Shrink (converts pages to images)',
    'cv.quality': 'Quality', 'cv.compress_hint': 'Optimize rewrites the file without quality loss. Shrink gives the smallest files but pages become images (text is no longer selectable).',
    'cv.compress_go': 'Compress & download', 'cv.result': '{before} → {after} ({pct}% smaller)', 'cv.result_bigger': 'No saving: {before} → {after}. Try “Shrink”.', 'cv.sel_images': '{n} image(s) selected', 'cv.remove': 'Remove',
    'ocr.languages': 'Recognition languages', 'ocr.filter_langs': 'Filter languages…', 'ocr.lang_hint': 'Pick every language that appears in the document. Language data (~1–15 MB each) is downloaded once and cached by your browser.',
    'ocr.scale': 'Render scale', 'ocr.pre': 'Pre-processing', 'ocr.pre_none': 'None', 'ocr.pre_gray': 'Grayscale + contrast', 'ocr.pre_bw': 'Black & white (scans)',
    'ocr.make_pdf': 'Also build a searchable PDF', 'ocr.run': 'Run OCR', 'ocr.cancel': 'Cancel', 'ocr.copy': 'Copy text', 'ocr.dl_pdf': 'Download searchable PDF', 'ocr.out_ph': 'Recognized text appears here…',
    'ocr.loading': 'Loading OCR engine and language data…', 'ocr.page': 'Page {n}', 'ocr.progress': 'Recognizing {n} of {total}', 'ocr.done': 'OCR finished', 'ocr.copied': 'Copied to clipboard', 'ocr.nolang': 'Choose at least one language.', 'ocr.nofile': 'Add an image or PDF first.',
    'img.resize': 'Resize', 'img.width': 'Width', 'img.height': 'Height', 'img.percent': 'Scale %', 'img.lock': 'Keep aspect ratio', 'img.crop': 'Crop', 'img.aspect': 'Aspect ratio', 'img.free': 'Free',
    'img.transform': 'Rotate & flip', 'img.flip_h': '⇋ Flip horizontal', 'img.flip_v': '⇅ Flip vertical', 'img.adjust': 'Adjust & filters', 'img.brightness': 'Brightness', 'img.contrast': 'Contrast', 'img.saturation': 'Saturation', 'img.blur': 'Blur',
    'img.gray': 'Grayscale', 'img.sepia': 'Sepia', 'img.invert': 'Invert', 'img.watermark': 'Text watermark', 'img.output': 'Output', 'img.target_kb': 'Max size (KB)', 'img.target_hint': 'Set a max size to auto-tune quality (JPG/WebP). 0 = off. Metadata (EXIF/GPS) is always removed.',
    'img.reset': 'Reset adjustments', 'img.export_one': 'Download this image', 'img.export_all': 'Download all (ZIP)', 'img.info': '{w}×{h} px · {size}', 'img.result': 'Output: {w}×{h} px · {size}',
    'msg.error': 'Something went wrong', 'msg.badtype': 'Unsupported file type', 'msg.ok': 'OK', 'msg.cancel': 'Cancel', 'msg.done': 'Done', 'msg.nopdf': 'Open a PDF first.', 'msg.working': 'Working…', 'msg.encrypted': 'This PDF is password-protected and cannot be opened.', 'msg.page': 'Page',
  },

  ar: {
    'app.skip': 'انتقل إلى المحتوى', 'app.language': 'اللغة', 'app.theme': 'تبديل المظهر الفاتح / الداكن',
    'app.privacy': 'كل شيء يعمل داخل متصفحك — لا يتم رفع ملفاتك أبدًا. (يقوم التعرف الضوئي بتنزيل نماذج اللغة عند أول استخدام.)',
    'app.footer': 'Pagecraft · مفتوح المصدر · يعمل محليًا باستخدام WebAssembly',
    'tab.read': 'قراءة', 'tab.organize': 'تنظيم', 'tab.edit': 'تحرير', 'tab.convert': 'تحويل', 'tab.ocr': 'التعرف الضوئي', 'tab.images': 'الصور',
    'drop.generic': 'أفلت ملفًا هنا أو انقر للاختيار', 'drop.pdf': 'أفلت ملف PDF هنا أو انقر للاختيار', 'drop.pdfs': 'أفلت ملف PDF واحدًا أو أكثر هنا أو انقر للاختيار',
    'drop.images': 'أفلت الصور هنا أو انقر للاختيار', 'drop.ocr': 'أفلت صورًا أو ملف PDF هنا أو انقر للاختيار',
    'nav.prev': '← السابق', 'nav.next': 'التالي →', 'nav.fit': 'ملاءمة العرض',
    'read.search': 'ابحث في نص المستند…', 'read.find': 'بحث', 'read.results': 'نتائج البحث', 'read.text': 'النص المستخرج',
    'read.extract': 'استخراج كل النص', 'read.download_txt': 'تنزيل ‎.txt', 'read.info': 'معلومات المستند',
    'read.noresults': 'لا توجد نتائج', 'read.hits': '{n} نتيجة', 'read.searching': 'جارٍ البحث…', 'read.notext': 'لا توجد طبقة نصية — جرّب تبويب التعرف الضوئي.',
    'info.pages': 'الصفحات', 'info.size': 'حجم الملف', 'info.title': 'العنوان', 'info.author': 'المؤلف', 'info.producer': 'المنتِج', 'info.created': 'تاريخ الإنشاء', 'info.version': 'إصدار PDF', 'info.name': 'الملف',
    'org.select_all': 'تحديد الكل', 'org.select_none': 'إلغاء التحديد', 'org.range_ph': 'مثال: 1-3, 5, 8-', 'org.select': 'تحديد',
    'org.rot_left': '⟲ تدوير لليسار', 'org.rot_right': '⟳ تدوير لليمين', 'org.duplicate': 'تكرار', 'org.blank': 'إدراج صفحة فارغة', 'org.reverse': 'عكس الترتيب', 'org.delete': 'حذف',
    'org.export_all': 'تصدير PDF', 'org.export_sel': 'تصدير المحدد', 'org.split_every': 'تقسيم كل', 'org.split_zip': 'تقسيم ← ZIP', 'org.ranges_ph': 'نطاقات: 1-3; 4-6; 7-', 'org.split_ranges': 'تقسيم حسب النطاقات ← ZIP',
    'org.status': '{pages} صفحة · {files} ملف · {sel} محددة', 'org.drag_hint': 'اسحب الصفحات لإعادة ترتيبها.', 'org.nosel': 'حدّد بعض الصفحات أولًا.',
    'edit.t_select': 'تحديد', 'edit.t_text': 'نص', 'edit.t_image': 'صورة', 'edit.t_sign': 'توقيع', 'edit.t_rect': 'مستطيل', 'edit.t_highlight': 'تمييز', 'edit.t_whiteout': 'طمس أبيض', 'edit.t_redact': 'حجب',
    'edit.color': 'اللون', 'edit.size': 'الحجم', 'edit.opacity': 'الشفافية', 'edit.delete_obj': 'حذف العنصر', 'edit.text_edit': 'النص', 'edit.text_ph': 'حدّد عنصر نص ثم اكتب هنا…',
    'edit.dir_auto': 'اتجاه تلقائي', 'edit.dir': 'الاتجاه', 'edit.default_text': 'نص', 'edit.watermark': 'علامة مائية', 'edit.wm_text': 'النص', 'edit.wm_ph': 'مثال: سري',
    'edit.angle': 'الزاوية', 'edit.numbers': 'ترقيم الصفحات', 'edit.numbers_on': 'إضافة أرقام الصفحات', 'edit.pos': 'الموضع', 'edit.start': 'البدء من', 'edit.format': 'الصيغة ({n}، {total})',
    'edit.metadata': 'البيانات الوصفية', 'edit.flatten': 'تسطيح إلى صور (يجعل الحجب دائمًا)', 'edit.redact_hint': 'ملاحظة: مربعات «الحجب» السوداء تخفي المحتوى بصريًا فقط ما لم تُسطّح الملف عند التصدير.',
    'edit.export': 'تطبيق التعديلات وتنزيل', 'edit.sign_title': 'ارسم توقيعك', 'edit.clear': 'مسح', 'edit.pick_image': 'اختر صورة…',
    'pos.bc': 'أسفل الوسط', 'pos.br': 'أسفل اليمين', 'pos.bl': 'أسفل اليسار', 'pos.tc': 'أعلى الوسط', 'pos.tr': 'أعلى اليمين', 'pos.tl': 'أعلى اليسار', 'pos.c': 'الوسط',
    'meta.title': 'العنوان', 'meta.author': 'المؤلف', 'meta.subject': 'الموضوع', 'meta.keywords': 'الكلمات المفتاحية',
    'cv.img2pdf': 'صور ← PDF', 'cv.pdf2img': 'PDF ← صور', 'cv.txt2pdf': 'نص ← PDF (بأي لغة)', 'cv.compress': 'ضغط PDF',
    'cv.pagesize': 'حجم الصفحة', 'cv.fit_image': 'ملاءمة الصورة', 'cv.margin': 'الهامش (نقطة)', 'cv.orientation': 'الاتجاه', 'cv.auto': 'تلقائي', 'cv.portrait': 'عمودي', 'cv.landscape': 'أفقي',
    'cv.make_pdf': 'إنشاء PDF', 'cv.format': 'الصيغة', 'cv.dpi': 'الدقة (DPI)', 'cv.pages': 'الصفحات', 'cv.pages_ph': 'الكل، أو مثل 1-3, 5', 'cv.export_images': 'تصدير الصور',
    'cv.txt_ph': 'اكتب أو الصق نصًا — English، العربية، Français، Русский، Ελληνικά…', 'cv.mode': 'الوضع', 'cv.lossless': 'تحسين (يحتفظ بالنص)', 'cv.raster': 'تقليص (يحوّل الصفحات إلى صور)',
    'cv.quality': 'الجودة', 'cv.compress_hint': 'التحسين يعيد كتابة الملف دون فقدان الجودة. التقليص يعطي أصغر الملفات لكن تتحول الصفحات إلى صور (لا يمكن تحديد النص).',
    'cv.compress_go': 'ضغط وتنزيل', 'cv.result': '{before} ← {after} (أصغر بنسبة {pct}٪)', 'cv.result_bigger': 'لا توفير: {before} ← {after}. جرّب «تقليص».', 'cv.sel_images': '{n} صورة محددة', 'cv.remove': 'إزالة',
    'ocr.languages': 'لغات التعرف', 'ocr.filter_langs': 'تصفية اللغات…', 'ocr.lang_hint': 'اختر كل اللغات الموجودة في المستند. تُنزَّل بيانات اللغة (حوالي 1–15 ميغابايت لكل لغة) مرة واحدة ويحتفظ بها المتصفح.',
    'ocr.scale': 'مقياس العرض', 'ocr.pre': 'المعالجة المسبقة', 'ocr.pre_none': 'بدون', 'ocr.pre_gray': 'تدرّج رمادي + تباين', 'ocr.pre_bw': 'أبيض وأسود (للمسح الضوئي)',
    'ocr.make_pdf': 'إنشاء PDF قابل للبحث أيضًا', 'ocr.run': 'تشغيل التعرف الضوئي', 'ocr.cancel': 'إلغاء', 'ocr.copy': 'نسخ النص', 'ocr.dl_pdf': 'تنزيل PDF قابل للبحث', 'ocr.out_ph': 'يظهر النص المُتعرَّف عليه هنا…',
    'ocr.loading': 'جارٍ تحميل محرك التعرف وبيانات اللغة…', 'ocr.page': 'صفحة {n}', 'ocr.progress': 'جارٍ التعرف على {n} من {total}', 'ocr.done': 'اكتمل التعرف الضوئي', 'ocr.copied': 'تم النسخ', 'ocr.nolang': 'اختر لغة واحدة على الأقل.', 'ocr.nofile': 'أضف صورة أو ملف PDF أولًا.',
    'img.resize': 'تغيير الحجم', 'img.width': 'العرض', 'img.height': 'الارتفاع', 'img.percent': 'النسبة ٪', 'img.lock': 'الحفاظ على النسبة', 'img.crop': 'اقتصاص', 'img.aspect': 'نسبة الأبعاد', 'img.free': 'حرة',
    'img.transform': 'تدوير وقلب', 'img.flip_h': '⇋ قلب أفقي', 'img.flip_v': '⇅ قلب رأسي', 'img.adjust': 'ضبط ومرشحات', 'img.brightness': 'السطوع', 'img.contrast': 'التباين', 'img.saturation': 'التشبع', 'img.blur': 'تمويه',
    'img.gray': 'تدرج رمادي', 'img.sepia': 'سيبيا', 'img.invert': 'عكس الألوان', 'img.watermark': 'علامة مائية نصية', 'img.output': 'المخرجات', 'img.target_kb': 'الحجم الأقصى (ك.ب)', 'img.target_hint': 'حدّد حجمًا أقصى لضبط الجودة تلقائيًا (JPG/WebP). 0 = معطّل. تُزال البيانات الوصفية (EXIF/GPS) دائمًا.',
    'img.reset': 'إعادة ضبط التعديلات', 'img.export_one': 'تنزيل هذه الصورة', 'img.export_all': 'تنزيل الكل (ZIP)', 'img.info': '{w}×{h} بكسل · {size}', 'img.result': 'الناتج: {w}×{h} بكسل · {size}',
    'msg.error': 'حدث خطأ ما', 'msg.badtype': 'نوع ملف غير مدعوم', 'msg.ok': 'موافق', 'msg.cancel': 'إلغاء', 'msg.done': 'تم', 'msg.nopdf': 'افتح ملف PDF أولًا.', 'msg.working': 'جارٍ العمل…', 'msg.encrypted': 'ملف PDF هذا محمي بكلمة مرور ولا يمكن فتحه.', 'msg.page': 'صفحة',
  },

  fr: {
    'app.skip': 'Aller au contenu', 'app.language': 'Langue', 'app.theme': 'Basculer thème clair / sombre',
    'app.privacy': 'Tout s’exécute dans votre navigateur — vos fichiers ne sont jamais envoyés. (L’OCR télécharge des modèles de langue à la première utilisation.)',
    'app.footer': 'Pagecraft · open source · fonctionne en local avec WebAssembly',
    'tab.read': 'Lire', 'tab.organize': 'Organiser', 'tab.edit': 'Éditer', 'tab.convert': 'Convertir', 'tab.ocr': 'OCR', 'tab.images': 'Images',
    'drop.generic': 'Déposez un fichier ici ou cliquez pour choisir', 'drop.pdf': 'Déposez un PDF ici ou cliquez pour choisir', 'drop.pdfs': 'Déposez un ou plusieurs PDF ici ou cliquez pour choisir',
    'drop.images': 'Déposez des images ici ou cliquez pour choisir', 'drop.ocr': 'Déposez des images ou un PDF ici ou cliquez pour choisir',
    'nav.prev': '← Préc.', 'nav.next': 'Suiv. →', 'nav.fit': 'Ajuster à la largeur',
    'read.search': 'Rechercher dans le document…', 'read.find': 'Rechercher', 'read.results': 'Résultats', 'read.text': 'Texte extrait',
    'read.extract': 'Extraire tout le texte', 'read.download_txt': 'Télécharger .txt', 'read.info': 'Infos du document',
    'read.noresults': 'Aucun résultat', 'read.hits': '{n} résultats', 'read.searching': 'Recherche…', 'read.notext': 'Aucune couche texte — essayez l’onglet OCR.',
    'info.pages': 'Pages', 'info.size': 'Taille', 'info.title': 'Titre', 'info.author': 'Auteur', 'info.producer': 'Producteur', 'info.created': 'Création', 'info.version': 'Version PDF', 'info.name': 'Fichier',
    'org.select_all': 'Tout sélectionner', 'org.select_none': 'Désélectionner', 'org.range_ph': 'ex. 1-3, 5, 8-', 'org.select': 'Sélectionner',
    'org.rot_left': '⟲ Pivoter à gauche', 'org.rot_right': '⟳ Pivoter à droite', 'org.duplicate': 'Dupliquer', 'org.blank': 'Insérer page vierge', 'org.reverse': 'Inverser l’ordre', 'org.delete': 'Supprimer',
    'org.export_all': 'Exporter le PDF', 'org.export_sel': 'Exporter la sélection', 'org.split_every': 'Diviser tous les', 'org.split_zip': 'Diviser → ZIP', 'org.ranges_ph': 'Plages : 1-3; 4-6; 7-', 'org.split_ranges': 'Diviser par plages → ZIP',
    'org.status': '{pages} pages · {files} fichier(s) · {sel} sélectionnée(s)', 'org.drag_hint': 'Glissez les pages pour les réorganiser.', 'org.nosel': 'Sélectionnez d’abord des pages.',
    'edit.t_select': 'Sélection', 'edit.t_text': 'Texte', 'edit.t_image': 'Image', 'edit.t_sign': 'Signature', 'edit.t_rect': 'Rectangle', 'edit.t_highlight': 'Surligner', 'edit.t_whiteout': 'Effacer (blanc)', 'edit.t_redact': 'Caviarder',
    'edit.color': 'Couleur', 'edit.size': 'Taille', 'edit.opacity': 'Opacité', 'edit.delete_obj': 'Supprimer l’objet', 'edit.text_edit': 'Texte', 'edit.text_ph': 'Sélectionnez un texte puis tapez ici…',
    'edit.dir_auto': 'Direction auto', 'edit.dir': 'Direction', 'edit.default_text': 'Texte', 'edit.watermark': 'Filigrane', 'edit.wm_text': 'Texte', 'edit.wm_ph': 'ex. CONFIDENTIEL',
    'edit.angle': 'Angle', 'edit.numbers': 'Numéros de page', 'edit.numbers_on': 'Ajouter les numéros de page', 'edit.pos': 'Position', 'edit.start': 'Début à', 'edit.format': 'Format ({n}, {total})',
    'edit.metadata': 'Métadonnées', 'edit.flatten': 'Aplatir en images (rend le caviardage définitif)', 'edit.redact_hint': 'Astuce : les cases noires « Caviarder » ne masquent que visuellement, sauf si vous aplatissez le PDF à l’export.',
    'edit.export': 'Appliquer et télécharger', 'edit.sign_title': 'Dessinez votre signature', 'edit.clear': 'Effacer', 'edit.pick_image': 'Choisir une image…',
    'pos.bc': 'Bas centre', 'pos.br': 'Bas droite', 'pos.bl': 'Bas gauche', 'pos.tc': 'Haut centre', 'pos.tr': 'Haut droite', 'pos.tl': 'Haut gauche', 'pos.c': 'Centre',
    'meta.title': 'Titre', 'meta.author': 'Auteur', 'meta.subject': 'Sujet', 'meta.keywords': 'Mots-clés',
    'cv.img2pdf': 'Images → PDF', 'cv.pdf2img': 'PDF → Images', 'cv.txt2pdf': 'Texte → PDF (toutes langues)', 'cv.compress': 'Compresser un PDF',
    'cv.pagesize': 'Taille de page', 'cv.fit_image': 'Ajuster à l’image', 'cv.margin': 'Marge (pt)', 'cv.orientation': 'Orientation', 'cv.auto': 'Auto', 'cv.portrait': 'Portrait', 'cv.landscape': 'Paysage',
    'cv.make_pdf': 'Créer le PDF', 'cv.format': 'Format', 'cv.dpi': 'Résolution (DPI)', 'cv.pages': 'Pages', 'cv.pages_ph': 'Toutes, ou ex. 1-3, 5', 'cv.export_images': 'Exporter les images',
    'cv.txt_ph': 'Saisissez ou collez du texte — English, العربية, Français, Русский, Ελληνικά…', 'cv.mode': 'Mode', 'cv.lossless': 'Optimiser (garde le texte)', 'cv.raster': 'Réduire (pages converties en images)',
    'cv.quality': 'Qualité', 'cv.compress_hint': 'Optimiser réécrit le fichier sans perte. Réduire donne les fichiers les plus légers, mais les pages deviennent des images (texte non sélectionnable).',
    'cv.compress_go': 'Compresser et télécharger', 'cv.result': '{before} → {after} ({pct} % de moins)', 'cv.result_bigger': 'Aucun gain : {before} → {after}. Essayez « Réduire ».', 'cv.sel_images': '{n} image(s) sélectionnée(s)', 'cv.remove': 'Retirer',
    'ocr.languages': 'Langues de reconnaissance', 'ocr.filter_langs': 'Filtrer les langues…', 'ocr.lang_hint': 'Cochez toutes les langues présentes dans le document. Les données de langue (~1–15 Mo chacune) sont téléchargées une fois puis mises en cache.',
    'ocr.scale': 'Échelle de rendu', 'ocr.pre': 'Prétraitement', 'ocr.pre_none': 'Aucun', 'ocr.pre_gray': 'Gris + contraste', 'ocr.pre_bw': 'Noir et blanc (scans)',
    'ocr.make_pdf': 'Créer aussi un PDF interrogeable', 'ocr.run': 'Lancer l’OCR', 'ocr.cancel': 'Annuler', 'ocr.copy': 'Copier le texte', 'ocr.dl_pdf': 'Télécharger le PDF interrogeable', 'ocr.out_ph': 'Le texte reconnu apparaît ici…',
    'ocr.loading': 'Chargement du moteur OCR et des langues…', 'ocr.page': 'Page {n}', 'ocr.progress': 'Reconnaissance {n} sur {total}', 'ocr.done': 'OCR terminé', 'ocr.copied': 'Copié', 'ocr.nolang': 'Choisissez au moins une langue.', 'ocr.nofile': 'Ajoutez d’abord une image ou un PDF.',
    'img.resize': 'Redimensionner', 'img.width': 'Largeur', 'img.height': 'Hauteur', 'img.percent': 'Échelle %', 'img.lock': 'Conserver les proportions', 'img.crop': 'Recadrer', 'img.aspect': 'Format', 'img.free': 'Libre',
    'img.transform': 'Rotation et miroir', 'img.flip_h': '⇋ Miroir horizontal', 'img.flip_v': '⇅ Miroir vertical', 'img.adjust': 'Réglages et filtres', 'img.brightness': 'Luminosité', 'img.contrast': 'Contraste', 'img.saturation': 'Saturation', 'img.blur': 'Flou',
    'img.gray': 'Niveaux de gris', 'img.sepia': 'Sépia', 'img.invert': 'Inverser', 'img.watermark': 'Filigrane texte', 'img.output': 'Sortie', 'img.target_kb': 'Taille max (Ko)', 'img.target_hint': 'Définissez une taille max pour ajuster la qualité (JPG/WebP). 0 = désactivé. Les métadonnées (EXIF/GPS) sont toujours supprimées.',
    'img.reset': 'Réinitialiser', 'img.export_one': 'Télécharger cette image', 'img.export_all': 'Tout télécharger (ZIP)', 'img.info': '{w}×{h} px · {size}', 'img.result': 'Sortie : {w}×{h} px · {size}',
    'msg.error': 'Une erreur est survenue', 'msg.badtype': 'Type de fichier non pris en charge', 'msg.ok': 'OK', 'msg.cancel': 'Annuler', 'msg.done': 'Terminé', 'msg.nopdf': 'Ouvrez d’abord un PDF.', 'msg.working': 'Traitement…', 'msg.encrypted': 'Ce PDF est protégé par mot de passe et ne peut pas être ouvert.', 'msg.page': 'Page',
  },

  es: {
    'app.skip': 'Saltar al contenido', 'app.language': 'Idioma', 'app.theme': 'Cambiar tema claro / oscuro',
    'app.privacy': 'Todo se ejecuta en tu navegador: tus archivos nunca se suben. (El OCR descarga modelos de idioma la primera vez.)',
    'app.footer': 'Pagecraft · código abierto · funciona en local con WebAssembly',
    'tab.read': 'Leer', 'tab.organize': 'Organizar', 'tab.edit': 'Editar', 'tab.convert': 'Convertir', 'tab.ocr': 'OCR', 'tab.images': 'Imágenes',
    'drop.generic': 'Suelta un archivo aquí o haz clic para elegir', 'drop.pdf': 'Suelta un PDF aquí o haz clic para elegir', 'drop.pdfs': 'Suelta uno o varios PDF aquí o haz clic para elegir',
    'drop.images': 'Suelta imágenes aquí o haz clic para elegir', 'drop.ocr': 'Suelta imágenes o un PDF aquí o haz clic para elegir',
    'nav.prev': '← Anterior', 'nav.next': 'Siguiente →', 'nav.fit': 'Ajustar al ancho',
    'read.search': 'Buscar texto en el documento…', 'read.find': 'Buscar', 'read.results': 'Resultados', 'read.text': 'Texto extraído',
    'read.extract': 'Extraer todo el texto', 'read.download_txt': 'Descargar .txt', 'read.info': 'Información del documento',
    'read.noresults': 'Sin coincidencias', 'read.hits': '{n} coincidencias', 'read.searching': 'Buscando…', 'read.notext': 'No hay capa de texto — prueba la pestaña OCR.',
    'info.pages': 'Páginas', 'info.size': 'Tamaño', 'info.title': 'Título', 'info.author': 'Autor', 'info.producer': 'Productor', 'info.created': 'Creado', 'info.version': 'Versión PDF', 'info.name': 'Archivo',
    'org.select_all': 'Seleccionar todo', 'org.select_none': 'Quitar selección', 'org.range_ph': 'p. ej. 1-3, 5, 8-', 'org.select': 'Seleccionar',
    'org.rot_left': '⟲ Girar a la izquierda', 'org.rot_right': '⟳ Girar a la derecha', 'org.duplicate': 'Duplicar', 'org.blank': 'Insertar en blanco', 'org.reverse': 'Invertir orden', 'org.delete': 'Eliminar',
    'org.export_all': 'Exportar PDF', 'org.export_sel': 'Exportar selección', 'org.split_every': 'Dividir cada', 'org.split_zip': 'Dividir → ZIP', 'org.ranges_ph': 'Rangos: 1-3; 4-6; 7-', 'org.split_ranges': 'Dividir por rangos → ZIP',
    'org.status': '{pages} páginas · {files} archivo(s) · {sel} seleccionada(s)', 'org.drag_hint': 'Arrastra las páginas para reordenarlas.', 'org.nosel': 'Selecciona primero algunas páginas.',
    'edit.t_select': 'Seleccionar', 'edit.t_text': 'Texto', 'edit.t_image': 'Imagen', 'edit.t_sign': 'Firma', 'edit.t_rect': 'Rectángulo', 'edit.t_highlight': 'Resaltar', 'edit.t_whiteout': 'Tapar en blanco', 'edit.t_redact': 'Censurar',
    'edit.color': 'Color', 'edit.size': 'Tamaño', 'edit.opacity': 'Opacidad', 'edit.delete_obj': 'Eliminar objeto', 'edit.text_edit': 'Texto', 'edit.text_ph': 'Selecciona un texto y escribe aquí…',
    'edit.dir_auto': 'Dirección auto', 'edit.dir': 'Dirección', 'edit.default_text': 'Texto', 'edit.watermark': 'Marca de agua', 'edit.wm_text': 'Texto', 'edit.wm_ph': 'p. ej. CONFIDENCIAL',
    'edit.angle': 'Ángulo', 'edit.numbers': 'Números de página', 'edit.numbers_on': 'Añadir números de página', 'edit.pos': 'Posición', 'edit.start': 'Empezar en', 'edit.format': 'Formato ({n}, {total})',
    'edit.metadata': 'Metadatos', 'edit.flatten': 'Aplanar a imágenes (hace permanente la censura)', 'edit.redact_hint': 'Consejo: los recuadros negros de «Censurar» solo ocultan visualmente salvo que aplanes el PDF al exportar.',
    'edit.export': 'Aplicar y descargar', 'edit.sign_title': 'Dibuja tu firma', 'edit.clear': 'Borrar', 'edit.pick_image': 'Elegir imagen…',
    'pos.bc': 'Abajo centro', 'pos.br': 'Abajo derecha', 'pos.bl': 'Abajo izquierda', 'pos.tc': 'Arriba centro', 'pos.tr': 'Arriba derecha', 'pos.tl': 'Arriba izquierda', 'pos.c': 'Centro',
    'meta.title': 'Título', 'meta.author': 'Autor', 'meta.subject': 'Asunto', 'meta.keywords': 'Palabras clave',
    'cv.img2pdf': 'Imágenes → PDF', 'cv.pdf2img': 'PDF → Imágenes', 'cv.txt2pdf': 'Texto → PDF (cualquier idioma)', 'cv.compress': 'Comprimir PDF',
    'cv.pagesize': 'Tamaño de página', 'cv.fit_image': 'Ajustar a la imagen', 'cv.margin': 'Margen (pt)', 'cv.orientation': 'Orientación', 'cv.auto': 'Auto', 'cv.portrait': 'Vertical', 'cv.landscape': 'Horizontal',
    'cv.make_pdf': 'Crear PDF', 'cv.format': 'Formato', 'cv.dpi': 'Resolución (DPI)', 'cv.pages': 'Páginas', 'cv.pages_ph': 'Todas, o p. ej. 1-3, 5', 'cv.export_images': 'Exportar imágenes',
    'cv.txt_ph': 'Escribe o pega texto — English, العربية, Français, Русский, Ελληνικά…', 'cv.mode': 'Modo', 'cv.lossless': 'Optimizar (conserva el texto)', 'cv.raster': 'Reducir (convierte páginas en imágenes)',
    'cv.quality': 'Calidad', 'cv.compress_hint': 'Optimizar reescribe el archivo sin pérdida. Reducir da los archivos más pequeños, pero las páginas pasan a ser imágenes (el texto deja de ser seleccionable).',
    'cv.compress_go': 'Comprimir y descargar', 'cv.result': '{before} → {after} ({pct} % menos)', 'cv.result_bigger': 'Sin ahorro: {before} → {after}. Prueba «Reducir».', 'cv.sel_images': '{n} imagen(es) seleccionada(s)', 'cv.remove': 'Quitar',
    'ocr.languages': 'Idiomas de reconocimiento', 'ocr.filter_langs': 'Filtrar idiomas…', 'ocr.lang_hint': 'Marca todos los idiomas que aparecen en el documento. Los datos de idioma (~1–15 MB cada uno) se descargan una vez y se guardan en caché.',
    'ocr.scale': 'Escala de render', 'ocr.pre': 'Preprocesado', 'ocr.pre_none': 'Ninguno', 'ocr.pre_gray': 'Grises + contraste', 'ocr.pre_bw': 'Blanco y negro (escaneos)',
    'ocr.make_pdf': 'Crear también un PDF con texto buscable', 'ocr.run': 'Ejecutar OCR', 'ocr.cancel': 'Cancelar', 'ocr.copy': 'Copiar texto', 'ocr.dl_pdf': 'Descargar PDF buscable', 'ocr.out_ph': 'El texto reconocido aparece aquí…',
    'ocr.loading': 'Cargando el motor OCR y los idiomas…', 'ocr.page': 'Página {n}', 'ocr.progress': 'Reconociendo {n} de {total}', 'ocr.done': 'OCR terminado', 'ocr.copied': 'Copiado', 'ocr.nolang': 'Elige al menos un idioma.', 'ocr.nofile': 'Añade primero una imagen o un PDF.',
    'img.resize': 'Redimensionar', 'img.width': 'Ancho', 'img.height': 'Alto', 'img.percent': 'Escala %', 'img.lock': 'Mantener proporción', 'img.crop': 'Recortar', 'img.aspect': 'Relación de aspecto', 'img.free': 'Libre',
    'img.transform': 'Girar y voltear', 'img.flip_h': '⇋ Voltear horizontal', 'img.flip_v': '⇅ Voltear vertical', 'img.adjust': 'Ajustes y filtros', 'img.brightness': 'Brillo', 'img.contrast': 'Contraste', 'img.saturation': 'Saturación', 'img.blur': 'Desenfoque',
    'img.gray': 'Escala de grises', 'img.sepia': 'Sepia', 'img.invert': 'Invertir', 'img.watermark': 'Marca de agua de texto', 'img.output': 'Salida', 'img.target_kb': 'Tamaño máx. (KB)', 'img.target_hint': 'Fija un tamaño máximo para ajustar la calidad (JPG/WebP). 0 = desactivado. Los metadatos (EXIF/GPS) siempre se eliminan.',
    'img.reset': 'Restablecer ajustes', 'img.export_one': 'Descargar esta imagen', 'img.export_all': 'Descargar todo (ZIP)', 'img.info': '{w}×{h} px · {size}', 'img.result': 'Salida: {w}×{h} px · {size}',
    'msg.error': 'Algo salió mal', 'msg.badtype': 'Tipo de archivo no admitido', 'msg.ok': 'Aceptar', 'msg.cancel': 'Cancelar', 'msg.done': 'Listo', 'msg.nopdf': 'Abre primero un PDF.', 'msg.working': 'Procesando…', 'msg.encrypted': 'Este PDF está protegido con contraseña y no se puede abrir.', 'msg.page': 'Página',
  },
};

export const LANGS = Object.keys(D);
export const DICT = D;
let cur = 'en';
const listeners = new Set();

export function t(key, vars) {
  let s = D[cur]?.[key] ?? D.en[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll('{' + k + '}', v);
  return s;
}
export const lang = () => cur;
export const isRtl = () => cur === 'ar';
export const onLang = fn => listeners.add(fn);

export function applyI18n(root = document) {
  root.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  root.querySelectorAll('[data-i18n-ph]').forEach(el => { el.placeholder = t(el.dataset.i18nPh); });
  root.querySelectorAll('[data-i18n-title]').forEach(el => { el.title = t(el.dataset.i18nTitle); });
}

export function setLang(l) {
  if (!D[l]) l = 'en';
  cur = l;
  document.documentElement.lang = l;
  document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr';
  try { localStorage.setItem('pc.lang', l); } catch { /* storage may be blocked */ }
  applyI18n();
  listeners.forEach(fn => fn(l));
}

export function initialLang() {
  try { const s = localStorage.getItem('pc.lang'); if (s && D[s]) return s; } catch { /* ignore */ }
  const n = (navigator.language || 'en').slice(0, 2).toLowerCase();
  return D[n] ? n : 'en';
}
