import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateDeck } from '../../src/slides/validate.mjs';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export async function loadSample() {
  const [deck, sources] = await Promise.all(['content/decks/sample.json', 'content/sources.json'].map(async file => JSON.parse(await fs.readFile(path.join(root, file), 'utf8'))));
  const errors = validateDeck(deck, sources);
  if (deck.slides?.length !== 3) errors.push('当前样例必须恰好三页；完整迁移应使用独立内容文件。');
  for (const slide of deck.slides ?? []) if (slide.imagePath) {
    const resolved = path.resolve(root, slide.imagePath);
    if (!resolved.startsWith(path.join(root, 'assets') + path.sep)) errors.push('媒体路径超出 assets。');
    else try { await fs.access(resolved); } catch { errors.push(`媒体不存在：${slide.imagePath}`); }
  }
  if (errors.length) throw new Error(errors.join('\n'));
  return { deck, sources };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { const { deck } = await loadSample(); console.log(`检查通过：${deck.slides.length} 页 HTML 样例，来源与本地媒体完整。`); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
