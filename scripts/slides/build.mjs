import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { root, loadDeck, selectedDeck, outputDir } from './check.mjs';
import { renderDeck, speakerNotes, escapeHtml } from '../../src/slides/render.mjs';
import { renderPresenter } from '../../src/slides/presenter.mjs';

const out = path.join(root, outputDir);
const { deck, sources } = await loadDeck();
const read = file => fs.readFile(path.join(root, file), 'utf8');
const [referenceCss, adaptations, runtime, fullCss, neuralWhiteCss, neuralBlackCss, llmEmbeddingCss, llmAttentionCss, llmGenerationCss, applicationsCss, agentCss, harnessCss] = await Promise.all(['src/slides/reference.css', 'src/slides/adaptations.css', 'src/slides/runtime.js', 'src/slides/full.css', 'src/slides/neural-white.css', 'src/slides/neural-black.css', 'src/slides/llm-embedding.css', 'src/slides/llm-attention.css', 'src/slides/llm-generation.css', 'src/slides/applications.css', 'src/slides/agent.css', 'src/slides/harness.css'].map(read));
await fs.mkdir(path.join(out, 'media'), { recursive: true });
const media = [...new Set(deck.slides.flatMap(s => [s.imagePath, s.detailImagePath, s.logoPath, ...(s.images ?? []).map(image => image.path)]).filter(Boolean))];
media.push('assets/fonts/NotoSansSC.ttf', 'assets/fonts/JetBrainsMono.ttf', 'assets/fonts/notosanssc-OFL.txt', 'assets/fonts/jetbrainsmono-OFL.txt');
if (new Set(media.map(file => path.basename(file).toLowerCase())).size !== media.length) throw new Error('媒体文件名冲突：请使用唯一文件名，避免导出覆盖。');
for (const file of media) await fs.copyFile(path.join(root, file), path.join(out, 'media', path.basename(file)));
await fs.writeFile(path.join(out, 'deck.html'), renderDeck(deck, sources, { css: referenceCss + '\n' + adaptations + (selectedDeck === 'sample' ? '' : '\n' + fullCss + '\n' + neuralWhiteCss + '\n' + neuralBlackCss + '\n' + llmEmbeddingCss + '\n' + llmAttentionCss + '\n' + llmGenerationCss + '\n' + applicationsCss + '\n' + agentCss + '\n' + harnessCss), runtime }));
await fs.writeFile(path.join(out, 'speaker-notes.json'), JSON.stringify(speakerNotes(deck, sources), null, 2) + '\n');
await fs.writeFile(path.join(out, 'build-manifest.json'), JSON.stringify({
  generatedAt: new Date().toISOString(), slideCount: deck.slides.length, canvas: { width: 1920, height: 1080 },
  styleReference: deck.styleReference, referenceCssSha256: crypto.createHash('sha256').update(referenceCss).digest('hex'),
  content: `content/decks/${selectedDeck}.json`, contentSha256: crypto.createHash('sha256').update(await read(`content/decks/${selectedDeck}.json`)).digest('hex'),
  implementation: 'Static HTML + CSS + SVG + native JavaScript; local media and fonts',
  adaptations: ['Local font fallbacks', 'Unique SVG ids', 'Accessible navigation buttons', 'Hash change handling', 'Speaker notes and full source references', 'Paged print CSS'],
}, null, 2) + '\n');

const notes = speakerNotes(deck, sources);
await fs.writeFile(path.join(out, 'presenter.html'), renderPresenter(deck.title, notes));
await fs.writeFile(path.join(out, 'speaker-notes.html'), '<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>讲稿</title><style>body{max-width:1000px;margin:40px auto;font:20px/1.8 Arial,"Microsoft YaHei",sans-serif;color:#0b1220}section{padding:30px 0;border-bottom:1px solid #d3dbe5}a{overflow-wrap:anywhere}h2{color:#2457f5}small{color:#5b6b7f}</style>' + notes.map(n => '<section><h2>'+n.page+'. '+escapeHtml(n.title)+'</h2><small>建议 '+(n.timingSeconds || '—')+' 秒</small>'+n.notes.map(t=>'<p>'+escapeHtml(t)+'</p>').join('')+'<ul>'+n.sources.map(r=>'<li><a href="'+escapeHtml(r.url)+'">'+escapeHtml(r.title)+'</a> · '+escapeHtml(r.publisher)+' · 核验 '+r.verifiedOn+'</li>').join('')+'</ul></section>').join('')+'</html>');
await fs.writeFile(path.join(out, '使用说明.txt'), deck.title+' · '+deck.slides.length+' 页\n\n打开 deck.html，保留相邻 media 文件夹。无需联网。\n方向键/空格/鼠标翻页；Home/End 首尾；F 全屏；G 目录；C 页码；数字跳页；P 打开讲者窗口。\nPDF、逐页 PNG 与总览由 npm run verify 生成。\n讲者模式：从 deck.html 按 P 打开 presenter.html，讲稿和翻页双向同步。使用扩展屏幕，观众屏仅显示 deck.html；远程会议只共享观众窗口。\n完整讲稿和引用：speaker-notes.html / speaker-notes.json。\n正文源：content/decks/'+selectedDeck+'.json。\n');
console.log('已生成 '+outputDir+'/deck.html：'+deck.slides.length+' 页，含本地媒体、字体和讲稿。');
