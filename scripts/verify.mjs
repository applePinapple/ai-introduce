import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { loadProject, projectRoot } from '../src/content.mjs';
import { verifyDeck } from '../src/artifact.mjs';

try {
  const { deck, sources } = await loadProject();
  const bytes = await readFile(path.join(projectRoot, 'output/ai-history-to-agents-50min.pptx'));
  const result = await verifyDeck(bytes, deck, sources);
  console.log('产物检查通过：' + result.slideCount + ' 页，可编辑正文、完整讲稿及引用均已导出。');
  console.log('此检查不替代 PowerPoint 中的逐页视觉检查。');
} catch (error) {
  console.error(error.code === 'ENOENT' ? '尚未找到 PPTX，请先运行 npm run build。' : error.message);
  process.exitCode = 1;
}

