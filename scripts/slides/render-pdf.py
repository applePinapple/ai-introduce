"""Render the exported PDF independently for visual review.

Run with Python containing pypdfium2 and Pillow. These are available in the
Codex bundled Python runtime; they are not production build dependencies.
"""
import json
import sys
from pathlib import Path
import pypdfium2 as pdfium
from PIL import Image, ImageDraw

out = Path(sys.argv[1] if len(sys.argv) > 1 else 'output/ai-history')
target = out / 'pdf-review'
target.mkdir(parents=True, exist_ok=True)
deck = pdfium.PdfDocument(str(out / 'deck.pdf'))
images = []
for index in range(len(deck)):
    page = deck[index]
    image = page.render(scale=1).to_pil().convert('RGB')
    image.save(target / f'page-{index+1:02}.png')
    images.append(image)
    page.close()
for start in range(0, len(images), 6):
    sheet = Image.new('RGB', (1240, 1145), '#e8edf3')
    draw = ImageDraw.Draw(sheet)
    for offset, image in enumerate(images[start:start+6]):
        tile = image.copy()
        tile.thumbnail((580, 327))
        x, y = 30 + (offset % 2) * 600, 30 + (offset // 2) * 370
        sheet.paste(tile, (x, y))
        draw.text((x, y+333), f'{start+offset+1:02} / {len(images)}', fill='#2457f5')
    sheet.save(target / f'overview-{start//6+1:02}.png')
report = {'pdfPages': len(deck), 'renderer': 'PDFium', 'renderedEveryPage': True,
          'dimensions': [list(image.size) for image in images]}
(target / 'render-report.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
deck.close()
print(json.dumps({'pdfPages':len(images),'directory':str(target)}))
