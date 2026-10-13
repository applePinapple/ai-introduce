import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const projectRoot = fileURLToPath(new URL('../', import.meta.url));
export const layouts = ['cover', 'bullets', 'timeline', 'comparison', 'process', 'closing', 'table', 'spotlight', 'example', 'image'];

export function validateContent(deck, sources, theme) {
  const errors = [];
  const fail = (location, message) => errors.push(location + ': ' + message);
  const fields = (value, allowed, location) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return;
    for (const key of Object.keys(value)) if (!allowed.includes(key)) fail(location + '.' + key, '未知字段，可能无法导出');
  };
  const text = (value, location, max = Infinity) => {
    if (typeof value !== 'string' || !value.trim()) fail(location, '需要非空字符串');
    else if ([...value].length > max) fail(location, '超过 ' + max + ' 字，请精简内容');
  };
  const texts = (value, location, min, max, length) => {
    if (!Array.isArray(value)) return fail(location, '需要数组');
    if (value.length < min || value.length > max) fail(location, '条数应为 ' + min + ' 至 ' + max);
    value.forEach((entry, i) => text(entry, location + '[' + i + ']', length));
  };
  const unique = (entries, location) => {
    const ids = new Set();
    entries.forEach((entry, i) => {
      const id = entry?.id;
      if (typeof id !== 'string' || !/^[a-z0-9][a-z0-9-]*$/.test(id)) fail(location + '[' + i + '].id', '需要小写字母、数字或连字符的稳定 ID');
      if (ids.has(id)) fail(location + '[' + i + '].id', 'ID 重复');
      ids.add(id);
    });
    return ids;
  };

  fields(deck, ['$schema', 'title', 'subtitle', 'language', 'audience', 'durationMinutes', 'status', 'slides'], 'deck');
  fields(sources, ['sources'], 'sources');
  fields(theme, ['name', 'fontFace', 'slideSize', 'titleFontSize', 'bodyFontSize', 'colors'], 'theme');
  fields(theme?.colors, ['background', 'text', 'muted', 'accent', 'coverBackground', 'coverText'], 'theme.colors');
  text(deck?.title, 'deck.title', 40);
  text(deck?.subtitle, 'deck.subtitle', 72);
  text(deck?.audience, 'deck.audience', 60);
  if (deck?.language !== 'zh-CN') fail('deck.language', '当前支持 zh-CN');
  if (!['draft', 'ready'].includes(deck?.status)) fail('deck.status', '应为 draft 或 ready');
  if (!Number.isInteger(deck?.durationMinutes) || deck.durationMinutes <= 0) fail('deck.durationMinutes', '需要正整数');

  const sourceEntries = sources?.sources;
  if (!Array.isArray(sourceEntries) || sourceEntries.length === 0) fail('sources.sources', '至少需要一项资料');
  const sourceIds = unique(Array.isArray(sourceEntries) ? sourceEntries : [], 'sources.sources');
  for (const [index, source] of (Array.isArray(sourceEntries) ? sourceEntries : []).entries()) {
    const at = 'sources.sources[' + index + ']';
    fields(source, ['id', 'title', 'url', 'publisher', 'verifiedOn', 'supports', 'localPath', 'evidence', 'timeRanges'], at);
    text(source?.title, at + '.title');
    text(source?.publisher, at + '.publisher');
    try {
      const url = new URL(source?.url);
      if (!['https:', 'http:'].includes(url.protocol)) fail(at + '.url', '需要 HTTP 或 HTTPS 资料地址');
    } catch { fail(at + '.url', '资料地址无效'); }
    const verified = source?.verifiedOn;
    if (typeof verified !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(verified) || Number.isNaN(Date.parse(verified)) || new Date(verified).toISOString().slice(0, 10) !== verified) fail(at + '.verifiedOn', '需要有效 YYYY-MM-DD 核验日期');
    texts(source?.supports, at + '.supports', 1, 20, 200);
    if (source?.localPath !== undefined) text(source.localPath, at + '.localPath', 500);
    if (source?.evidence !== undefined) text(source.evidence, at + '.evidence', 2000);
    if (source?.timeRanges !== undefined) texts(source.timeRanges, at + '.timeRanges', 1, 30, 160);
  }

  const slides = Array.isArray(deck?.slides) ? deck.slides : [];
  if (slides.length === 0 || slides.length > 40) fail('deck.slides', '幻灯片数量应为 1 至 40');
  unique(slides, 'deck.slides');
  for (const [index, slide] of slides.entries()) {
    const at = 'deck.slides[' + index + ']';
    const layoutFields = { cover: [], bullets: ['bullets'], closing: ['bullets'], timeline: ['items'], process: ['items'], comparison: ['columns'], table: ['headers', 'rows'], spotlight: ['lead', 'bullets'], example: ['prompt', 'response', 'caption'], image: ['caption', 'bullets'] };
    fields(slide, ['id', 'section', 'layout', 'title', 'subtitle', 'notes', 'sourceIds', 'timingSeconds', 'takeaway', 'footnote', 'imagePath', ...(layoutFields[slide?.layout] ?? [])], at);
    text(slide?.title, at + '.title', 25);
    text(slide?.section, at + '.section', 30);
    if (slide?.subtitle !== undefined) text(slide.subtitle, at + '.subtitle', 72);
    if (!Number.isInteger(slide?.timingSeconds) || slide.timingSeconds < 1 || slide.timingSeconds > 600) fail(at + '.timingSeconds', '需要 1 至 600 秒的整数');
    if (slide?.takeaway !== undefined) text(slide.takeaway, at + '.takeaway', 60);
    if (slide?.footnote !== undefined) text(slide.footnote, at + '.footnote', 120);
    if (slide?.imagePath !== undefined) {
      text(slide.imagePath, at + '.imagePath', 500);
      if (path.isAbsolute(slide.imagePath) || slide.imagePath.split(/[\\/]/).includes('..') || !/^assets[\\/]/.test(slide.imagePath)) fail(at + '.imagePath', '图片必须使用 assets 内的相对路径');
    }
    if (!layouts.includes(slide?.layout)) fail(at + '.layout', '不支持的布局');
    texts(slide?.notes, at + '.notes', 1, 30, 2000);
    texts(slide?.sourceIds, at + '.sourceIds', 0, 20, 100);
    if (Array.isArray(slide?.sourceIds)) {
      if (new Set(slide.sourceIds).size !== slide.sourceIds.length) fail(at + '.sourceIds', '引用重复');
      for (const id of slide.sourceIds) if (!sourceIds.has(id)) fail(at + '.sourceIds', '找不到资料 ' + id);
    }
    if (['bullets', 'closing'].includes(slide?.layout)) texts(slide.bullets, at + '.bullets', 1, 4, 40);
    else if (['spotlight', 'image'].includes(slide?.layout)) {
      if (slide?.bullets !== undefined) texts(slide.bullets, at + '.bullets', 1, 4, 40);
    } else if (slide?.bullets !== undefined) fail(at + '.bullets', '此布局不使用 bullets');
    if (['timeline', 'process'].includes(slide?.layout)) {
      if (!Array.isArray(slide.items) || slide.items.length < 2 || slide.items.length > 4) fail(at + '.items', '需要 2 至 4 个步骤或事件');
      for (const [i, item] of (Array.isArray(slide.items) ? slide.items : []).entries()) {
        fields(item, ['label', 'description'], at + '.items[' + i + ']');
        text(item?.label, at + '.items[' + i + '].label', 14);
        text(item?.description, at + '.items[' + i + '].description', 40);
      }
    } else if (slide?.items !== undefined) fail(at + '.items', '此布局不使用 items');
    if (slide?.layout === 'comparison') {
      if (!Array.isArray(slide.columns) || slide.columns.length !== 2) fail(at + '.columns', '需要两列比较');
      for (const [i, column] of (Array.isArray(slide.columns) ? slide.columns : []).entries()) {
        fields(column, ['title', 'bullets'], at + '.columns[' + i + ']');
        text(column?.title, at + '.columns[' + i + '].title', 18);
        texts(column?.bullets, at + '.columns[' + i + '].bullets', 1, 3, 28);
      }
    } else if (slide?.columns !== undefined) fail(at + '.columns', '此布局不使用 columns');
    if (slide?.layout === 'table') {
      texts(slide.headers, at + '.headers', 2, 5, 20);
      if (!Array.isArray(slide.rows) || slide.rows.length < 2 || slide.rows.length > 6) fail(at + '.rows', '需要 2 至 6 行');
      for (const [i, row] of (Array.isArray(slide.rows) ? slide.rows : []).entries()) texts(row, at + '.rows[' + i + ']', slide.headers?.length ?? 2, slide.headers?.length ?? 5, 60);
    }
    if (slide?.layout === 'spotlight') text(slide.lead, at + '.lead', 100);
    if (slide?.layout === 'example') {
      text(slide.prompt, at + '.prompt', 160);
      text(slide.response, at + '.response', 280);
      if (slide.caption !== undefined) text(slide.caption, at + '.caption', 50);
    }
    if (slide?.layout === 'image') {
      text(slide.imagePath, at + '.imagePath', 500);
      text(slide.caption, at + '.caption', 80);
    }
  }
  const totalSeconds = slides.reduce((sum, slide) => sum + (Number.isInteger(slide.timingSeconds) ? slide.timingSeconds : 0), 0);
  if (Number.isInteger(deck?.durationMinutes) && totalSeconds !== deck.durationMinutes * 60) fail('deck.slides.timingSeconds', '累计 ' + totalSeconds + ' 秒，需等于 ' + (deck.durationMinutes * 60) + ' 秒');

  text(theme?.name, 'theme.name', 40);
  text(theme?.fontFace, 'theme.fontFace', 80);
  if (theme?.slideSize !== 'LAYOUT_WIDE') fail('theme.slideSize', '当前支持 LAYOUT_WIDE');
  for (const key of ['background', 'text', 'muted', 'accent', 'coverBackground', 'coverText']) {
    if (typeof theme?.colors?.[key] !== 'string' || !/^[0-9a-fA-F]{6}$/.test(theme.colors[key])) fail('theme.colors.' + key, '需要六位十六进制颜色');
  }
  for (const key of ['titleFontSize', 'bodyFontSize']) {
    const min = key === 'titleFontSize' ? 32 : 20;
    if (!Number.isFinite(theme?.[key]) || theme[key] < min || theme[key] > 40) fail('theme.' + key, '字号应为 ' + min + ' 至 40 pt');
  }
  if (errors.length) throw new Error('内容检查失败：\n' + errors.map((error) => '- ' + error).join('\n'));
}

export async function loadProject(root = projectRoot) {
  const files = ['content/deck.json', 'content/sources.json', 'config/theme.json'];
  const [deck, sources, theme] = await Promise.all(files.map(async (file) => {
    try { return JSON.parse(await readFile(path.join(root, file), 'utf8')); }
    catch (error) { throw new Error('无法读取 ' + file + '：' + error.message, { cause: error }); }
  }));
  validateContent(deck, sources, theme);
  return { deck, sources, theme };
}
