"""Inspect an existing PPTX as source evidence, without rebuilding or modifying it.

Uses only Python's standard library. Paragraphs, native tables, image relations,
shape geometry, connectors, notes and hyperlink evidence come from OOXML parts.
A separate comparison may read deck.json; it is never used to fill the inventory.
"""
from __future__ import annotations
import argparse
from collections import Counter
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path, PurePosixPath
import posixpath
import re
import xml.etree.ElementTree as ET
import zipfile

ROOT = Path(__file__).resolve().parents[1]
EMU_PER_INCH = 914400
NS = {'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
      'p': 'http://schemas.openxmlformats.org/presentationml/2006/main',
      'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
      'rel': 'http://schemas.openxmlformats.org/package/2006/relationships'}
RID = '{' + NS['r'] + '}id'
R_EMBED = '{' + NS['r'] + '}embed'
R_LINK = '{' + NS['r'] + '}link'

def local(tag):
    return tag.rsplit('}', 1)[-1]

def sha(data):
    return hashlib.sha256(data).hexdigest()

def root_relative(p):
    try:
        return p.resolve().relative_to(ROOT).as_posix()
    except ValueError:
        return str(p.resolve())

def plain(element):
    return ''.join(element.itertext()) if element is not None else ''

def attr(element):
    return dict(element.attrib) if element is not None else None

def relationships(archive, part):
    folder, name = posixpath.split(part)
    rel_part = posixpath.join(folder, '_rels', name + '.rels')
    if rel_part not in archive.namelist():
        return []
    result = []
    for relationship in ET.fromstring(archive.read(rel_part)):
        item = dict(relationship.attrib)
        item['kind'] = item['Type'].rsplit('/', 1)[-1]
        item['resolvedPart'] = None if item.get('TargetMode') == 'External' else posixpath.normpath(posixpath.join(folder, item['Target']))
        result.append(item)
    return result

def paragraph_list(body, rels):
    if body is None:
        return []
    by_id = {r['Id']: r for r in rels}
    result = []
    for paragraph in body.findall('a:p', NS):
        runs = []
        for child in paragraph:
            kind = local(child.tag)
            if kind in ('r', 'fld'):
                props = child.find('a:rPr', NS)
                text = child.find('a:t', NS)
                run = {'kind': kind, 'text': text.text if text is not None and text.text is not None else '', 'attributes': dict(child.attrib), 'formatting': attr(props)}
                if props is not None:
                    run['fontFaces'] = {local(font.tag): font.get('typeface') for font in props if local(font.tag) in ('latin', 'ea', 'cs')}
                    links = []
                    for hlink in props:
                        if local(hlink.tag) in ('hlinkClick', 'hlinkMouseOver'):
                            relation = by_id.get(hlink.get(RID))
                            links.append({'kind': local(hlink.tag), 'attributes': dict(hlink.attrib), 'relationship': relation})
                    if links:
                        run['hyperlinks'] = links
                runs.append(run)
            elif kind == 'br':
                runs.append({'kind': 'break', 'text': '\n'})
        result.append({'text': ''.join(run['text'] for run in runs), 'properties': attr(paragraph.find('a:pPr', NS)), 'endFormatting': attr(paragraph.find('a:endParaRPr', NS)), 'runs': runs})
    return result

def transform(element):
    xfrm = element.find('p:spPr/a:xfrm', NS)
    if xfrm is None:
        xfrm = element.find('p:xfrm', NS)
    if xfrm is None:
        xfrm = element.find('p:grpSpPr/a:xfrm', NS)
    if xfrm is None:
        return None
    result = {'attributes': dict(xfrm.attrib)}
    for child in xfrm:
        result[local(child.tag)] = {key: int(value) for key, value in child.attrib.items()}
    offset, extent = result.get('off', {}), result.get('ext', {})
    if offset and extent:
        result['inches'] = {'x': offset.get('x', 0) / EMU_PER_INCH, 'y': offset.get('y', 0) / EMU_PER_INCH, 'w': extent.get('cx', 0) / EMU_PER_INCH, 'h': extent.get('cy', 0) / EMU_PER_INCH}
    return result

def line_details(element):
    line = element.find('p:spPr/a:ln', NS)
    if line is None:
        return None
    return {'attributes': dict(line.attrib), 'headEnd': attr(line.find('a:headEnd', NS)), 'tailEnd': attr(line.find('a:tailEnd', NS)), 'xml': ET.tostring(line, encoding='unicode')}

def shape_list(tree, rels, media_lookup, parent_id=None):
    if tree is None:
        return []
    result = []
    by_id = {r['Id']: r for r in rels}
    for index, element in enumerate(tree):
        kind = local(element.tag)
        if kind not in ('sp', 'pic', 'graphicFrame', 'cxnSp', 'grpSp', 'contentPart'):
            continue
        info = element.find('.//p:cNvPr', NS)
        placeholder = element.find('.//p:nvPr/p:ph', NS)
        geometry = element.find('p:spPr/a:prstGeom', NS)
        item = {'id': info.get('id') if info is not None else None, 'name': info.get('name') if info is not None else None, 'description': info.get('descr') if info is not None else None, 'objectType': kind, 'stackingOrder': index, 'parentGroupId': parent_id, 'nonVisualProperties': attr(info), 'placeholder': attr(placeholder), 'transform': transform(element), 'presetGeometry': geometry.get('prst') if geometry is not None else None, 'line': line_details(element)}
        item['paragraphs'] = paragraph_list(element.find('p:txBody', NS), rels)
        item['text'] = '\n'.join(paragraph['text'] for paragraph in item['paragraphs'])
        if kind == 'graphicFrame':
            graphic_data = element.find('a:graphic/a:graphicData', NS)
            item['graphicDataUri'] = graphic_data.get('uri') if graphic_data is not None else None
            table = element.find('a:graphic/a:graphicData/a:tbl', NS)
            if table is not None:
                cols = table.findall('a:tblGrid/a:gridCol', NS)
                native_table = {'properties': attr(table.find('a:tblPr', NS)), 'columnWidthsEmu': [int(c.get('w')) for c in cols], 'rows': []}
                for row_index, row in enumerate(table.findall('a:tr', NS)):
                    cells = []
                    for col_index, cell in enumerate(row.findall('a:tc', NS)):
                        paragraphs = paragraph_list(cell.find('a:txBody', NS), rels)
                        cells.append({'row': row_index, 'column': col_index, 'attributes': dict(cell.attrib), 'properties': attr(cell.find('a:tcPr', NS)), 'paragraphs': paragraphs, 'text': '\n'.join(p['text'] for p in paragraphs)})
                    native_table['rows'].append({'heightEmu': int(row.get('h')), 'cells': cells})
                native_table['rowCount'] = len(native_table['rows'])
                native_table['columnCount'] = len(cols)
                item['table'] = native_table
        if kind == 'pic':
            blip = element.find('p:blipFill/a:blip', NS)
            if blip is not None:
                rel_id = blip.get(R_EMBED) or blip.get(R_LINK)
                rel = by_id.get(rel_id)
                item['image'] = {'relationshipId': rel_id, 'relationship': rel, 'media': media_lookup.get(rel.get('resolvedPart')) if rel else None, 'sourceRectangle': attr(element.find('p:blipFill/a:srcRect', NS)), 'stretchRectangle': attr(element.find('p:blipFill/a:stretch/a:fillRect', NS)), 'tile': attr(element.find('p:blipFill/a:tile', NS))}
        if kind == 'cxnSp' or item['presetGeometry'] == 'line' or 'arrow' in (item['presetGeometry'] or '').lower():
            item['connector'] = {'isNativeConnector': kind == 'cxnSp', 'startConnection': attr(element.find('p:nvCxnSpPr/p:cNvCxnSpPr/a:stCxn', NS)), 'endConnection': attr(element.find('p:nvCxnSpPr/p:cNvCxnSpPr/a:endCxn', NS)), 'presetGeometry': item['presetGeometry'], 'headEnd': (item['line'] or {}).get('headEnd'), 'tailEnd': (item['line'] or {}).get('tailEnd')}
        if kind == 'grpSp':
            item['children'] = shape_list(element, rels, media_lookup, item['id'])
        result.append(item)
    return result

def flatten(shapes):
    for shape in shapes:
        yield shape
        yield from flatten(shape.get('children', []))

def all_paragraphs(shapes):
    result = []
    for shape in flatten(shapes):
        for index, paragraph in enumerate(shape['paragraphs']):
            result.append({'shapeId': shape['id'], 'paragraphIndex': index, 'text': paragraph['text']})
        if 'table' in shape:
            for row in shape['table']['rows']:
                for cell in row['cells']:
                    for index, paragraph in enumerate(cell['paragraphs']):
                        result.append({'shapeId': shape['id'], 'cellRow': cell['row'], 'cellColumn': cell['column'], 'paragraphIndex': index, 'text': paragraph['text']})
    return result

def hyperlinks(text, rels):
    textual = [url.rstrip('。，；、）)]') for url in re.findall(r'https?://[^\s<>"\u3000]+', text)]
    relation_links = [r['Target'] for r in rels if r['kind'] == 'hyperlink']
    return {'textualUrls': sorted(set(textual)), 'relationshipLinks': sorted(set(relation_links)), 'allUrls': sorted(set(textual + relation_links))}

def native_sections(presentation):
    result = []
    for element in presentation.iter():
        if local(element.tag) == 'section' and 'name' in element.attrib:
            ids = [child.get('id') for child in element.iter() if local(child.tag) == 'sldId']
            result.append({'name': element.get('name'), 'id': element.get('id'), 'slideIds': ids, 'attributes': dict(element.attrib)})
    return result

def comparison(inventory, deck_file):
    if not deck_file.exists():
        return {'available': False, 'reason': 'content/deck.json not found'}
    deck_bytes = deck_file.read_bytes()
    deck = json.loads(deck_bytes.decode('utf-8-sig'))
    records = []
    for index, expected in enumerate(deck.get('slides', [])):
        if index >= len(inventory['slides']):
            records.append({'slideNumber': index + 1, 'contentId': expected.get('id'), 'missingSlideInPptx': True})
            continue
        actual = inventory['slides'][index]
        actual_text = actual['allText']
        expected_fields = [expected['title']]
        if expected.get('subtitle'):
            expected_fields.append(expected['subtitle'])
        elif expected.get('layout') == 'cover':
            expected_fields.append(deck.get('subtitle', ''))
        expected_fields += expected.get('bullets', [])
        for item in expected.get('items', []):
            expected_fields += [item['label'], item['description']]
        for column in expected.get('columns', []):
            expected_fields += [column['title'], *column['bullets']]
        expected_fields += expected.get('headers', [])
        expected_fields += [value for row in expected.get('rows', []) for value in row]
        for key in ('lead', 'prompt', 'response', 'caption', 'takeaway', 'footnote'):
            if expected.get(key):
                expected_fields.append(expected[key])
        normalize = lambda text: re.sub(r'\s+', '', text)
        normalized_actual = normalize(actual_text)
        missing_visible = [text for text in expected_fields if normalize(text) not in normalized_actual]
        notes_text = actual['notes']['allText'] if actual.get('notes') else ''
        missing_notes = [note for note in expected.get('notes', []) if normalize(note) not in normalize(notes_text)]
        tables = [shape for shape in flatten(actual['shapes']) if 'table' in shape]
        native_table_cells = [[cell['text'] for cell in row['cells']] for row in tables[0]['table']['rows']] if tables else None
        expected_table = [expected['headers'], *expected['rows']] if expected.get('layout') == 'table' else None
        records.append({'slideNumber': index + 1, 'contentId': expected.get('id'), 'contentLayout': expected.get('layout'), 'expectedVisibleFieldCount': len(expected_fields), 'missingVisibleFields': missing_visible, 'missingNoteParagraphs': missing_notes, 'nativeTableMatchesContent': native_table_cells == expected_table if expected_table is not None else None, 'imageObjectCount': len(actual['images']), 'expectedImagePath': expected.get('imagePath'), 'expectedSourceIds': expected.get('sourceIds', [])})
    discrepancies = [row for row in records if row.get('missingSlideInPptx') or row.get('missingVisibleFields') or row.get('missingNoteParagraphs') or row.get('nativeTableMatchesContent') is False]
    return {'available': True, 'comparisonFile': root_relative(deck_file), 'comparisonFileSha256': sha(deck_bytes), 'inventoryWasBuiltFromPptxOnly': True, 'method': 'Whitespace-normalized inclusion of every authored visible field and note paragraph; exact native table cell comparison. Page numbers and structural labels are permitted extra PPTX text.', 'contentSlideCount': len(deck.get('slides', [])), 'pptxSlideCount': len(inventory['slides']), 'slideCountMatches': len(deck.get('slides', [])) == len(inventory['slides']), 'discrepancyCount': len(discrepancies), 'slides': records}

def inspect(source, destination):
    source_bytes = source.read_bytes()
    media_dir = destination.parent / 'original-media'
    media_dir.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(source) as archive:
        presentation = ET.fromstring(archive.read('ppt/presentation.xml'))
        presentation_rels = relationships(archive, 'ppt/presentation.xml')
        presentation_rel_by_id = {rel['Id']: rel for rel in presentation_rels}
        size = presentation.find('p:sldSz', NS)
        cx, cy = int(size.get('cx')), int(size.get('cy'))
        inventory = {'schemaVersion': 1, 'extractedAtUtc': datetime.now(timezone.utc).isoformat(), 'extractionMethod': 'Direct ZIP and XML parsing of the supplied PPTX with Python standard library. No slide content is synthesized from content/deck.json.', 'source': {'path': root_relative(source), 'absolutePath': str(source.resolve()), 'sha256': sha(source_bytes), 'bytes': len(source_bytes), 'modifiedAtUtc': datetime.fromtimestamp(source.stat().st_mtime, timezone.utc).isoformat()}, 'slideSize': {'widthEmu': cx, 'heightEmu': cy, 'widthInches': cx / EMU_PER_INCH, 'heightInches': cy / EMU_PER_INCH, 'widthPoints': cx / 12700, 'heightPoints': cy / 12700, 'aspectRatio': cx / cy, 'is16to9': abs(cx / cy - 16 / 9) < 0.0001, 'attributes': dict(size.attrib)}, 'nativeSections': native_sections(presentation), 'coreProperties': {}, 'media': [], 'slides': []}
        if 'docProps/core.xml' in archive.namelist():
            inventory['coreProperties'] = {local(child.tag): child.text for child in ET.fromstring(archive.read('docProps/core.xml'))}
        for part in sorted(name for name in archive.namelist() if name.startswith('ppt/media/') and not name.endswith('/')):
            data = archive.read(part)
            target = media_dir / PurePosixPath(part).name
            target.write_bytes(data)
            record = {'part': part, 'extractedPath': root_relative(target), 'sha256': sha(data), 'bytes': len(data)}
            if data[:8] == b'\x89PNG\r\n\x1a\n' and len(data) >= 24:
                record['pixelWidth'] = int.from_bytes(data[16:20], 'big')
                record['pixelHeight'] = int.from_bytes(data[20:24], 'big')
                record['format'] = 'PNG'
            inventory['media'].append(record)
        media_lookup = {item['part']: item for item in inventory['media']}
        for index, slide_id in enumerate(presentation.findall('p:sldIdLst/p:sldId', NS)):
            relation_id = slide_id.get(RID)
            part = presentation_rel_by_id[relation_id]['resolvedPart']
            xml = ET.fromstring(archive.read(part))
            rels = relationships(archive, part)
            shapes = shape_list(xml.find('p:cSld/p:spTree', NS), rels, media_lookup)
            paragraphs = all_paragraphs(shapes)
            slide = {'number': index + 1, 'presentationSlideId': slide_id.get('id'), 'relationshipId': relation_id, 'part': part, 'xmlAttributes': dict(xml.attrib), 'hidden': xml.get('show', '1') in ('0', 'false'), 'showAttributeExplicit': 'show' in xml.attrib, 'nativeSectionNames': [section['name'] for section in inventory['nativeSections'] if slide_id.get('id') in section['slideIds']], 'relationships': rels, 'shapes': shapes, 'textParagraphs': paragraphs, 'allText': '\n'.join(p['text'] for p in paragraphs), 'notes': None}
            slide['images'] = [shape for shape in flatten(shapes) if 'image' in shape]
            slide['connectorsAndLines'] = [shape for shape in flatten(shapes) if 'connector' in shape]
            slide['hyperlinks'] = hyperlinks(slide['allText'], rels)
            notes_relation = next((r for r in rels if r['kind'] == 'notesSlide'), None)
            if notes_relation:
                notes_part = notes_relation['resolvedPart']
                notes_xml = ET.fromstring(archive.read(notes_part))
                notes_rels = relationships(archive, notes_part)
                note_shapes = shape_list(notes_xml.find('p:cSld/p:spTree', NS), notes_rels, media_lookup)
                note_paragraphs = all_paragraphs(note_shapes)
                note_text = '\n'.join(p['text'] for p in note_paragraphs)
                body_text = '\n'.join(shape['text'] for shape in flatten(note_shapes) if (shape.get('placeholder') or {}).get('type') == 'body')
                slide['notes'] = {'part': notes_part, 'relationships': notes_rels, 'shapes': note_shapes, 'textParagraphs': note_paragraphs, 'allText': note_text, 'bodyText': body_text, 'hyperlinks': hyperlinks(note_text, notes_rels)}
            preview = ROOT / '.cache/slide-preview' / f'slide-{index + 1:02}.png'
            slide['existingWpsPreview'] = {'path': root_relative(preview), 'exists': preview.exists(), 'sha256': sha(preview.read_bytes()) if preview.exists() else None, 'provenance': 'Existing WPS render. The image is recorded for visual reference; it is not used as the source of extracted text.'}
            inventory['slides'].append(slide)
        all_shapes = [shape for slide in inventory['slides'] for shape in flatten(slide['shapes'])]
        inventory['summary'] = {'slideCount': len(inventory['slides']), 'hiddenSlideCount': sum(slide['hidden'] for slide in inventory['slides']), 'nativeSectionCount': len(inventory['nativeSections']), 'shapeCount': len(all_shapes), 'objectTypes': dict(Counter(shape['objectType'] for shape in all_shapes)), 'nativeTableCount': sum('table' in shape for shape in all_shapes), 'imageObjectCount': sum('image' in shape for shape in all_shapes), 'mediaFileCount': len(inventory['media']), 'connectorAndLineCount': sum('connector' in shape for shape in all_shapes), 'nativeConnectorCount': sum(shape['objectType'] == 'cxnSp' for shape in all_shapes), 'notesSlideCount': sum(slide['notes'] is not None for slide in inventory['slides']), 'visibleTextParagraphCount': sum(len(slide['textParagraphs']) for slide in inventory['slides']), 'notesTextParagraphCount': sum(len(slide['notes']['textParagraphs']) for slide in inventory['slides'] if slide['notes'])}
        inventory['summary']['uniqueNotesUrlCount'] = len({url for slide in inventory['slides'] if slide['notes'] for url in slide['notes']['hyperlinks']['allUrls']})
        inventory['summary']['notesBodyCharacterCount'] = sum(len(slide['notes']['bodyText']) for slide in inventory['slides'] if slide['notes'])
        inventory['summary']['arrowObjectCount'] = sum(any((shape['connector'].get(key) or {}).get('type', 'none') != 'none' for key in ('headEnd', 'tailEnd')) or 'arrow' in (shape['presetGeometry'] or '').lower() for shape in all_shapes if 'connector' in shape)
        report = ROOT / '.cache/slide-preview/render-report.json'
        inventory['existingWpsRenderReport'] = {'path': root_relative(report), 'exists': report.exists(), 'report': json.loads(report.read_text(encoding='utf-8-sig')) if report.exists() else None}
        inventory['contentComparison'] = comparison(inventory, ROOT / 'content/deck.json')
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(json.dumps(inventory, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'inventory': root_relative(destination), 'sourceSha256': inventory['source']['sha256'], 'slideSize': inventory['slideSize'], 'summary': inventory['summary'], 'contentComparisonDiscrepancies': inventory['contentComparison'].get('discrepancyCount')}, ensure_ascii=False, indent=2))

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--source', default='output/ai-history-to-agents-50min.pptx')
    parser.add_argument('--destination', default='assets/redesign/original-inventory.json')
    args = parser.parse_args()
    source = (ROOT / args.source).resolve()
    destination = (ROOT / args.destination).resolve()
    if not destination.is_relative_to(ROOT):
        raise SystemExit('Destination must remain inside the project workspace')
    inspect(source, destination)
