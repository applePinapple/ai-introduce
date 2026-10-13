import JSZip from 'jszip';
import { formatTiming, sourceLines } from './notes.mjs';

function xmlText(xml) {
  return [...xml.matchAll(/<a:t(?:\s[^>]*)?>([\s\S]*?)<\/a:t>/g)]
    .map((match) => match[1].replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&'))
    .join('\n');
}

export async function verifyDeck(bytes, deck, sources) {
  const zip = await JSZip.loadAsync(bytes, { checkCRC32: true });
  const required = ['[Content_Types].xml', '_rels/.rels', 'ppt/presentation.xml'];
  for (const name of required) if (!zip.file(name)) throw new Error('PPTX 缺少 ' + name);
  const slideFiles = Object.keys(zip.files).filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name));
  if (slideFiles.length !== deck.slides.length) throw new Error('PPTX 页数与内容不一致');
  const presentationXml = await zip.file('ppt/presentation.xml').async('string');
  const slideIds = [...presentationXml.matchAll(/<p:sldId\b/g)].length;
  if (slideIds !== deck.slides.length) throw new Error('PPTX 演示顺序缺少页面');
  const sourceById = new Map(sources.sources.map((source) => [source.id, source]));
  for (const [index, slide] of deck.slides.entries()) {
    const number = index + 1;
    const page = zip.file('ppt/slides/slide' + number + '.xml');
    const notes = zip.file('ppt/notesSlides/notesSlide' + number + '.xml');
    if (!page || !notes) throw new Error('第 ' + number + ' 页缺少幻灯片或备注');
    const pageText = xmlText(await page.async('string'));
    const visibleText = [slide.title];
    if (slide.subtitle) visibleText.push(slide.subtitle);
    else if (slide.layout === 'cover') visibleText.push(deck.subtitle);
    visibleText.push(...(slide.bullets ?? []));
    for (const item of slide.items ?? []) visibleText.push(item.label, item.description);
    for (const column of slide.columns ?? []) visibleText.push(column.title, ...column.bullets);
    visibleText.push(...(slide.headers ?? []), ...(slide.rows ?? []).flat());
    for (const key of ['lead', 'prompt', 'response', 'caption', 'takeaway', 'footnote']) if (slide[key]) visibleText.push(slide[key]);
    for (const text of visibleText) if (!pageText.includes(text)) throw new Error('第 ' + number + ' 页缺少可编辑正文：' + text);
    const notesText = xmlText(await notes.async('string'));
    if (!notesText.includes(formatTiming(slide.timingSeconds))) throw new Error('第 ' + number + ' 页未导出讲解时长');
    for (const note of slide.notes) if (!notesText.includes(note)) throw new Error('第 ' + number + ' 页讲稿未完整导出');
    for (const id of slide.sourceIds) {
      for (const line of sourceLines(sourceById.get(id))) if (!notesText.includes(line)) throw new Error('第 ' + number + ' 页未完整导出资料 ' + id);
    }
    if (slide.imagePath && !/<p:pic>/.test(await page.async('string'))) throw new Error('第 ' + number + ' 页缺少图片');
    if (slide.layout === 'table' && !/<a:tbl>/.test(await page.async('string'))) throw new Error('第 ' + number + ' 页缺少可编辑表格');
  }
  return { slideCount: slideFiles.length, notesCount: deck.slides.length };
}
