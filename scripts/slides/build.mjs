import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { root, loadSample } from './check.mjs';
import { renderDeck, speakerNotes } from '../../src/slides/render.mjs';

const out = path.join(root, 'output/lip-sample');
const { deck, sources } = await loadSample();
const read = file => fs.readFile(path.join(root, file), 'utf8');
const [referenceCss, adaptations, runtime] = await Promise.all(['src/slides/reference.css', 'src/slides/adaptations.css', 'src/slides/runtime.js'].map(read));
await fs.mkdir(path.join(out, 'media'), { recursive: true });
const media = [...new Set(deck.slides.filter(s => s.imagePath).map(s => s.imagePath))];
media.push('assets/fonts/NotoSansSC.ttf', 'assets/fonts/JetBrainsMono.ttf', 'assets/fonts/notosanssc-OFL.txt', 'assets/fonts/jetbrainsmono-OFL.txt');
if (new Set(media.map(file => path.basename(file).toLowerCase())).size !== media.length) throw new Error('媒体文件名冲突：请使用唯一文件名，避免导出覆盖。');
for (const file of media) await fs.copyFile(path.join(root, file), path.join(out, 'media', path.basename(file)));
await fs.writeFile(path.join(out, 'deck.html'), renderDeck(deck, sources, { css: referenceCss + '\n' + adaptations, runtime }));
await fs.writeFile(path.join(out, 'speaker-notes.json'), JSON.stringify(speakerNotes(deck, sources), null, 2) + '\n');
await fs.writeFile(path.join(out, 'build-manifest.json'), JSON.stringify({
  generatedAt: new Date().toISOString(), slideCount: deck.slides.length, canvas: { width: 1920, height: 1080 },
  styleReference: deck.styleReference, referenceCssSha256: crypto.createHash('sha256').update(referenceCss).digest('hex'),
  content: 'content/decks/sample.json', contentSha256: crypto.createHash('sha256').update(await read('content/decks/sample.json')).digest('hex'),
  implementation: 'Static HTML + CSS + SVG + native JavaScript; local media and fonts',
  adaptations: ['Local font fallbacks', 'Unique SVG ids', 'Accessible navigation buttons', 'Hash change handling', 'Speaker notes and full source references', 'Paged print CSS'],
}, null, 2) + '\n');
await fs.writeFile(path.join(out, '使用说明.txt'), `三页 HTML 幻灯片样例\n\n双击 deck.html，用 Chrome 或 Edge 打开；请保留同目录 media 文件夹。无需联网。\n方向键/空格/鼠标点击翻页；Home/End 首尾；F 全屏；G 目录；C 页码；数字跳页。\n地址 #2 可直接跳到第二页，?nav=1 打开目录。\nPDF 与总览图由 npm run verify 生成，也可用浏览器打印；选择横向、零边距、背景图形。\n讲者备注与完整引用在 speaker-notes.json，HTML 的 template 元素中也有保留。\n修改 content/decks/sample.json 和 src/slides 后运行 npm run build。\n样例只展示3页，原39页讲稿尚未整体迁移。\n视觉参考：${deck.styleReference.repository}，提交 ${deck.styleReference.commit}。\n原样继承 1920×1080 画布、配色、字体层级、卡片、SVG透视网格与播放习惯。\n字体离线打包与PDF分页属于本项目适配。封面使用本项目原有AI概念插画。\n`);
console.log('已生成 output/lip-sample/deck.html：3页；CSS/JS内联，本地媒体与字体。');
