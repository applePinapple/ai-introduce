import PptxGenJS from 'pptxgenjs';
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';
import { projectRoot, layouts } from './content.mjs';
import { slideNotes } from './notes.mjs';

// All geometry uses inches. Content is kept in deck.json and never invented here.
const WIDTH = 40 / 3;
const HEIGHT = 7.5;
const INSET = 0.74;
const CONTENT_WIDTH = WIDTH - INSET * 2;
const BODY_TOP = 2.28;
const BODY_BOTTOM = 6.03;
const DEFAULT_THEME = {
  fontFace: 'Microsoft YaHei', titleFontSize: 34, bodyFontSize: 22,
  colors: { background: 'F7F5EF', text: '152C40', muted: '617477', accent: '007F79', coverBackground: '092331', coverText: 'F7F5EF' },
};
const fail = (slideId, message) => { throw new Error(`Slide ${slideId}: ${message}`); };
function bounds(context, label, box) {
  if (![box.x, box.y, box.w, box.h].every(Number.isFinite) || box.x < 0 || box.y < 0 || box.w < 0 || box.h < 0 || box.x + box.w > WIDTH + .001 || box.y + box.h > HEIGHT + .001) fail(context.slideId, `${label} outside the 16:9 canvas`);
}
function glyphWidth(character) {
  if (/\s/u.test(character)) return .32;
  if (/[ilI1.,:;'!|]/u.test(character)) return .35;
  if (/[MW@%]/u.test(character)) return .95;
  if (/[\x00-\x7F]/u.test(character)) return .6;
  return 1;
}
export function estimateLines(value, width, fontSize) {
  const capacity = width * 72 / fontSize * .95;
  return String(value).split('\n').reduce((sum, paragraph) => sum + Math.max(1, Math.ceil([...paragraph].reduce((total, c) => total + glyphWidth(c), 0) / capacity)), 0);
}
function addText(context, value, box, options = {}) {
  if (value === undefined || value === null || value === '') return;
  const text = String(value);
  bounds(context, text.slice(0, 24), box);
  const fontSize = options.fontSize ?? context.theme.bodyFontSize;
  const lineHeight = options.lineHeight ?? 1.16;
  const lines = estimateLines(text, box.w, fontSize);
  if (lines * fontSize * lineHeight / 72 + .03 > box.h) fail(context.slideId, `text does not fit ${fontSize}pt (${lines} lines, h=${box.h}): ${text.slice(0, 70)}`);
  const { lineHeight: _lineHeight, ...textOptions } = options;
  context.slide.addText(text, { ...box, margin: 0, fontFace: context.theme.fontFace, color: context.theme.colors.text, lang: 'zh-CN', align: 'left', valign: 'top', fontSize, lineSpacingMultiple: lineHeight, paraSpaceAfter: 0, ...textOptions });
}
function rule(context, x, y, w, color, width = .8, transparency = 0) {
  bounds(context, 'rule', { x, y, w, h: 0 });
  context.slide.addShape(context.pptx.ShapeType.line, { x, y, w, h: 0, line: { color, width, transparency } });
}
function verticalRule(context, x, y, h, color, transparency = 0) {
  bounds(context, 'rule', { x, y, w: 0, h });
  context.slide.addShape(context.pptx.ShapeType.line, { x, y, w: 0, h, line: { color, width: .7, transparency } });
}
function imageFile(content) {
  const image = path.resolve(projectRoot, content.imagePath);
  if (!image.startsWith(path.resolve(projectRoot, 'assets') + path.sep) || !existsSync(image)) throw new Error(`Missing or invalid image: ${content.imagePath}`);
  return image;
}
function imageGeometry(file, box, mode) {
  const bytes = readFileSync(file);
  if (bytes.length < 24 || bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') throw new Error(`Slide images must be PNG: ${file}`);
  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  if (width <= 0 || height <= 0) throw new Error(`Invalid PNG dimensions: ${file}`);
  const scale = mode === 'cover' ? Math.max(box.w / width, box.h / height) : Math.min(box.w / width, box.h / height);
  const w = width * scale;
  const h = height * scale;
  return { x: box.x + (box.w - w) / 2, y: box.y + (box.h - h) / 2, w, h };
}
function footer(context, content, page, count, dark = false) {
  const color = dark ? 'C2D4D7' : context.theme.colors.muted;
  if (content.footnote) addText(context, content.footnote, { x: INSET, y: 6.91, w: 10.6, h: .37 }, { fontSize: 10, color });
  addText(context, `${String(page).padStart(2, '0')} / ${count}`, { x: 11.67, y: 6.98, w: .92, h: .25 }, { fontSize: 10, color, align: 'right' });
}
function header(context, content, dark = false) {
  const { colors } = context.theme;
  addText(context, content.section, { x: INSET, y: .37, w: CONTENT_WIDTH, h: .26 }, { fontSize: 11, bold: true, color: dark ? '7ACFC6' : colors.accent });
  const titleLines = estimateLines(content.title, CONTENT_WIDTH, context.theme.titleFontSize);
  addText(context, content.title, { x: INSET, y: .87, w: CONTENT_WIDTH, h: titleLines > 1 ? 1.13 : .68 }, { fontSize: context.theme.titleFontSize, bold: true, lineHeight: 1.08, color: dark ? colors.coverText : colors.text });
  if (content.subtitle) addText(context, content.subtitle, { x: INSET, y: titleLines > 1 ? 2 : 1.69, w: CONTENT_WIDTH, h: .45 }, { fontSize: 17, color: dark ? 'C2D4D7' : colors.muted });
}
function takeaway(context, content, dark = false) {
  if (!content.takeaway) return;
  const color = dark ? 'A8E6DD' : context.theme.colors.accent;
  rule(context, INSET, 6.17, CONTENT_WIDTH, color, .7, dark ? 55 : 65);
  addText(context, content.takeaway, { x: INSET, y: 6.34, w: CONTENT_WIDTH, h: .61 }, { fontSize: 17, bold: true, color, lineHeight: 1.1 });
}
function cover(context, content, deck) {
  context.slide.background = { color: context.theme.colors.coverBackground };
  const hasImage = Boolean(content.imagePath);
  if (hasImage) {
    const image = imageFile(content);
    // A cover may intentionally bleed beyond the canvas to preserve its ratio.
    context.slide.addImage({ path: image, ...imageGeometry(image, { x: 0, y: 0, w: WIDTH, h: HEIGHT }, 'cover') });
  }
  addText(context, content.section, { x: .86, y: .63, w: 6, h: .3 }, { fontSize: 13, color: '8BCFC7' });
  addText(context, content.title, { x: .84, y: 1.75, w: hasImage ? 6.05 : 11.6, h: 2.01 }, { fontSize: 44, bold: true, color: context.theme.colors.coverText, lineHeight: 1.22 });
  addText(context, content.subtitle ?? deck.subtitle, { x: .87, y: 4.09, w: hasImage ? 6.05 : 10.5, h: 1.1 }, { fontSize: 23, color: 'C2D4D7', lineHeight: 1.24 });
  if (content.takeaway) addText(context, content.takeaway, { x: .87, y: 5.43, w: hasImage ? 6.05 : 10.5, h: .81 }, { fontSize: 17, color: 'A8E6DD' });
  addText(context, `${deck.audience}    ${deck.durationMinutes} 分钟`, { x: .87, y: 6.39, w: 10.6, h: .36 }, { fontSize: 14, color: 'B5CDD1' });
}
function bulletRows(context, bullets, box, options = {}) {
  const rowStep = box.h / bullets.length;
  bullets.forEach((bullet, index) => {
    const y = box.y + rowStep * index;
    addText(context, String(index + 1).padStart(2, '0'), { x: box.x, y: y + .02, w: .55, h: .4 }, { fontSize: 15, color: options.dark ? '7ACFC6' : context.theme.colors.accent });
    addText(context, bullet, { x: box.x + .74, y, w: box.w - .74, h: rowStep - .16 }, { fontSize: options.fontSize ?? 25, color: options.dark ? context.theme.colors.coverText : context.theme.colors.text });
    if (index < bullets.length - 1) rule(context, box.x + .74, y + rowStep - .18, box.w - .74, options.dark ? '7F9A9D' : 'BBC8C4', .6, 35);
  });
}
function bullets(context, content) {
  header(context, content);
  bulletRows(context, content.bullets, { x: INSET, y: BODY_TOP + .12, w: CONTENT_WIDTH, h: BODY_BOTTOM - BODY_TOP }, { fontSize: content.bullets.length === 4 ? 22 : 25 });
  takeaway(context, content);
}
function sequence(context, content, process) {
  header(context, content);
  const count = content.items.length;
  if (process && count <= 4) {
    const gutter = .38;
    const width = (CONTENT_WIDTH - gutter * (count - 1)) / count;
    content.items.forEach((item, i) => {
      const x = INSET + i * (width + gutter);
      addText(context, String(i + 1).padStart(2, '0'), { x, y: 2.43, w: width, h: .66 }, { fontSize: 32, color: context.theme.colors.accent, bold: true });
      rule(context, x, 3.28, width, 'B7C7C3', .8);
      addText(context, item.label, { x, y: 3.48, w: width, h: .86 }, { fontSize: 23, bold: true });
      addText(context, item.description, { x, y: 4.43, w: width, h: 1.6 }, { fontSize: 19, color: context.theme.colors.muted });
    });
  } else {
    const step = (BODY_BOTTOM - BODY_TOP) / count;
    content.items.forEach((item, i) => {
      const y = BODY_TOP + i * step;
      addText(context, item.label, { x: INSET, y: y + .01, w: 3.65, h: step - .06 }, { fontSize: 26, color: context.theme.colors.accent, bold: true });
      addText(context, item.description, { x: 4.7, y: y + .08, w: 7.87, h: step - .14 }, { fontSize: 22 });
      if (i < count - 1) rule(context, INSET, y + step - .1, CONTENT_WIDTH, 'BCC9C4', .65);
    });
  }
  takeaway(context, content);
}
function comparison(context, content) {
  header(context, content);
  const width = 5.57;
  verticalRule(context, 6.67, 2.28, 3.67, 'B5C6C1');
  content.columns.forEach((column, index) => {
    const x = index === 0 ? INSET : 7.04;
    addText(context, column.title, { x, y: 2.35, w: width, h: .89 }, { fontSize: 27, bold: true, color: context.theme.colors.accent });
    const step = 2.72 / column.bullets.length;
    column.bullets.forEach((bullet, i) => addText(context, bullet, { x, y: 3.32 + i * step, w: width, h: step - .16 }, { fontSize: 22 }));
  });
  takeaway(context, content);
}
function spotlight(context, content) {
  const { colors } = context.theme;
  context.slide.background = { color: colors.coverBackground };
  header(context, content, true);
  const hasBullets = content.bullets?.length;
  addText(context, content.lead, { x: INSET, y: 2.48, w: hasBullets ? 7.13 : CONTENT_WIDTH, h: 3.13 }, { fontSize: 33, bold: true, lineHeight: 1.26, color: colors.coverText });
  if (hasBullets) {
    const step = 3.43 / content.bullets.length;
    content.bullets.forEach((bullet, i) => addText(context, bullet, { x: 8.39, y: 2.57 + i * step, w: 4.18, h: step - .18 }, { fontSize: 21, color: 'B7D3D4' }));
  }
  takeaway(context, content, true);
}
function example(context, content) {
  header(context, content);
  addText(context, '输入', { x: INSET, y: 2.34, w: 3.92, h: .32 }, { fontSize: 15, color: context.theme.colors.accent, bold: true });
  addText(context, content.prompt, { x: INSET, y: 2.94, w: 4.09, h: 2.9 }, { fontSize: 24, lineHeight: 1.23 });
  verticalRule(context, 5.22, 2.35, 3.61, 'B5C6C1');
  addText(context, '示例解读', { x: 5.64, y: 2.34, w: 6.94, h: .58 }, { fontSize: 15, color: context.theme.colors.accent, bold: true });
  addText(context, content.response, { x: 5.64, y: 2.94, w: 6.94, h: 2.75 }, { fontSize: 22, lineHeight: 1.23 });
  if (content.caption) addText(context, content.caption, { x: INSET, y: 5.83, w: CONTENT_WIDTH, h: .3 }, { fontSize: 12, color: context.theme.colors.muted });
  takeaway(context, content);
}
function table(context, content) {
  header(context, content);
  const columns = content.headers.length;
  const fontSize = columns >= 4 ? 18 : 21;
  const rows = [content.headers, ...content.rows];
  const tableHeight = 3.8;
  const rowHeight = tableHeight / rows.length;
  const weights = content.headers.map((_, c) => Math.sqrt(Math.max(5, ...rows.map(row => [...row[c]].reduce((sum, character) => sum + glyphWidth(character), 0)))));
  const sumWeights = weights.reduce((sum, value) => sum + value, 0);
  const widths = weights.map(weight => CONTENT_WIDTH * weight / sumWeights);
  rows.forEach((row, r) => row.forEach((cell, c) => {
    if (estimateLines(cell, widths[c] - .27, r === 0 ? fontSize - 1 : fontSize) * fontSize * 1.12 / 72 + .1 > rowHeight) fail(context.slideId, `table cell is too long: ${cell}`);
  }));
  const styled = rows.map((row, r) => row.map((text, c) => ({ text, options: { bold: r === 0 || c === 0, color: r === 0 ? 'F7F5EF' : c === 0 ? context.theme.colors.accent : context.theme.colors.text, fill: r === 0 ? context.theme.colors.coverBackground : r % 2 ? 'EDF0EA' : 'F7F5EF' } })));
  context.slide.addTable(styled, { x: INSET, y: 2.29, w: CONTENT_WIDTH, h: tableHeight, colW: widths, rowH: rowHeight, fontFace: context.theme.fontFace, fontSize, margin: [.07, .12, .06, .12], border: { type: 'solid', color: 'F7F5EF', pt: 1.2 }, color: context.theme.colors.text, valign: 'mid', breakLine: false, autoPage: false, lineSpacingMultiple: 1.12, paraSpaceAfter: 0 });
  takeaway(context, content);
}
function imageLayout(context, content) {
  header(context, content);
  const image = imageFile(content);
  const hasBullets = content.bullets?.length;
  const area = { x: INSET, y: 2.21, w: hasBullets ? 8.04 : CONTENT_WIDTH, h: 3.54 };
  context.slide.addImage({ path: image, ...imageGeometry(image, area, 'contain') });
  if (hasBullets) {
    const step = 3.25 / content.bullets.length;
    content.bullets.forEach((bullet, i) => addText(context, bullet, { x: 9.06, y: 2.34 + i * step, w: 3.5, h: step - .16 }, { fontSize: 20 }));
  }
  addText(context, content.caption, { x: INSET, y: 5.82, w: CONTENT_WIDTH, h: .33 }, { fontSize: 12, color: context.theme.colors.muted });
  takeaway(context, content);
}
function closing(context, content) {
  context.slide.background = { color: context.theme.colors.coverBackground };
  header(context, content, true);
  bulletRows(context, content.bullets, { x: INSET, y: 2.43, w: CONTENT_WIDTH, h: 3.55 }, { dark: true, fontSize: content.bullets.length === 4 ? 22 : 25 });
  takeaway(context, content, true);
}
export async function renderDeck({ deck, sources, theme, outputFile }) {
  if (!deck?.slides?.length) throw new Error('deck.slides must be a nonempty array');
  if (!outputFile) throw new Error('outputFile is required');
  const resolvedTheme = { ...DEFAULT_THEME, ...theme, colors: { ...DEFAULT_THEME.colors, ...theme?.colors } };
  if (theme?.slideSize && theme.slideSize !== 'LAYOUT_WIDE') throw new Error('Only LAYOUT_WIDE (16:9) is supported');
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = 'AI Describe';
  pptx.company = '';
  pptx.title = deck.title;
  pptx.subject = 'AI 发展、大语言模型与 Agent 应用';
  pptx.lang = deck.language ?? 'zh-CN';
  pptx.theme = { headFontFace: resolvedTheme.fontFace, bodyFontFace: resolvedTheme.fontFace, lang: pptx.lang };
  const sourceMap = new Map(sources.sources.map(source => [source.id, source]));
  const renderers = { cover, bullets, timeline: (c, s) => sequence(c, s, false), process: (c, s) => sequence(c, s, true), comparison, spotlight, example, table, image: imageLayout, closing };
  deck.slides.forEach((content, index) => {
    if (!layouts.includes(content.layout)) fail(content.id, `unknown layout: ${content.layout}`);
    const slide = pptx.addSlide();
    slide.background = { color: resolvedTheme.colors.background };
    const context = { pptx, slide, slideId: content.id, theme: resolvedTheme };
    renderers[content.layout](context, content, deck);
    const dark = ['cover', 'closing', 'spotlight'].includes(content.layout);
    footer(context, content, index + 1, deck.slides.length, dark);
    slide.addNotes(slideNotes(content, sourceMap).join('\n'));
  });
  return pptx.writeFile({ fileName: outputFile, compression: true });
}
