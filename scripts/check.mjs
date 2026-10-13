import { loadProject } from '../src/content.mjs';

try {
  const { deck, sources } = await loadProject();
  console.log('检查通过：' + deck.slides.length + ' 页，' + sources.sources.length + ' 项资料，引用均已关联。');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
