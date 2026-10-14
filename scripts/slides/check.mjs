import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateDeck } from '../../src/slides/validate.mjs';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const selectedDeck = process.argv.includes('--sample') ? 'sample' : 'ai-history';
export const outputDir = selectedDeck === 'sample' ? 'output/lip-sample' : 'output/ai-history';
export async function loadDeck(name = selectedDeck) {
  const [deck, sources] = await Promise.all([`content/decks/${name}.json`, 'content/sources.json'].map(async file => JSON.parse(await fs.readFile(path.join(root, file), 'utf8'))));
  const errors = validateDeck(deck, sources);
  if (name === 'sample' && deck.slides?.length !== 3) errors.push('当前样例必须恰好三页。');
  for (const slide of deck.slides ?? []) for (const file of [slide.imagePath, slide.detailImagePath, slide.logoPath, ...(Array.isArray(slide.images) ? slide.images.map(image => image?.path) : []), ...(slide.evidencePaths ?? [])].filter(file => typeof file === 'string' && file)) {
    const resolved = path.resolve(root, file);
    if (!resolved.startsWith(path.join(root, 'assets') + path.sep)) errors.push('媒体路径超出 assets。');
    else try { await fs.access(resolved); } catch { errors.push(`媒体不存在：${file}`); }
  }
  if (errors.length) throw new Error(errors.join('\n'));
  return { deck, sources };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { const { deck } = await loadDeck(); await loadDeck('sample'); console.log(`检查通过：${deck.slides.length} 页 HTML 演讲，来源与本地媒体完整；三页样例亦通过。`); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
