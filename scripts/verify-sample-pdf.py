"""Render the three sample PDF pages and verify their original text; local only."""
from pathlib import Path
import sys, json, re, hashlib
root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(root / '.cache/pdf-tools'))
import pymupdf
out = root / 'output/blue-professional-review'
inventory = json.loads((root / 'assets/redesign/original-inventory.json').read_text(encoding='utf-8'))
doc = pymupdf.open(out / 'samples.pdf')
normalize = lambda s: re.sub(r'\s+', '', s)
report = {'pageCount': len(doc), 'pages': [], 'failures': []}
if len(doc) != 3:
    report['failures'].append('Expected exactly 3 pages')
for index, original in enumerate([1, 18, 25]):
    page = doc[index]
    text = page.get_text()
    missing = [p['text'] for p in inventory['slides'][original - 1]['textParagraphs'] if normalize(p['text']) not in normalize(text)]
    item = {'samplePage': index + 1, 'originalPage': original, 'width': page.rect.width, 'height': page.rect.height, 'textLength': len(text), 'missingText': missing, 'fonts': [f[3] for f in page.get_fonts()]}
    if missing: report['failures'].append({'originalPage': original, 'missing': missing})
    if abs(page.rect.width / page.rect.height - 16 / 9) > 0.001:
        report['failures'].append({'originalPage': original, 'aspectRatio': 'incorrect'})
    page.get_pixmap(matrix=pymupdf.Matrix(1600 / page.rect.width, 1600 / page.rect.width), alpha=False).save(out / 'verification' / f'pdf-sample-{index+1}.png')
    report['pages'].append(item)
actual = hashlib.sha256((root / inventory['source']['path']).read_bytes()).hexdigest()
report['originalPptxUnchanged'] = actual == inventory['source']['sha256']
if not report['originalPptxUnchanged']: report['failures'].append('Original PPTX changed')
(out / 'verification/pdf-report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps(report, ensure_ascii=False, indent=2))
sys.exit(1 if report['failures'] else 0)
