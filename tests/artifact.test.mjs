import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import JSZip from 'jszip';
import { loadProject, projectRoot } from '../src/content.mjs';
import { renderDeck } from '../src/render.mjs';
import { verifyDeck } from '../src/artifact.mjs';

test('真实导出保留正文与备注，正文丢失时产物检查拒绝通过', async () => {
  const content = structuredClone(await loadProject());
  content.deck.slides = [{ id: 'editable-body-test', section: '验证', title: '可编辑正文', layout: 'bullets', bullets: ['正文需要完整保留', '引用进入备注区'], timingSeconds: 60, notes: ['完整导出的演讲备注。'], sourceIds: [content.sources.sources[0].id] }];
  const outputDir = path.join(projectRoot, '.cache/tests');
  const outputFile = path.join(outputDir, 'verification.pptx');
  await mkdir(outputDir, { recursive: true });
  await renderDeck({ ...content, outputFile });
  const bytes = await readFile(outputFile);
  assert.deepEqual(await verifyDeck(bytes, content.deck, content.sources), { slideCount: 1, notesCount: 1 });

  const zip = await JSZip.loadAsync(bytes);
  const slidePath = 'ppt/slides/slide1.xml';
  const xml = await zip.file(slidePath).async('string');
  const target = content.deck.slides[0].bullets[0];
  const escaped = target.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  assert.ok(xml.includes(escaped), '变异前正文应在实际 PPTX 中');
  zip.file(slidePath, xml.replace(escaped, ''));
  const broken = await zip.generateAsync({ type: 'nodebuffer' });
  await assert.rejects(verifyDeck(broken, content.deck, content.sources), /缺少可编辑正文/);
});

test('新布局导出可编辑正文、原生表格、原始图片比例与视频时间段', async () => {
  const content = structuredClone(await loadProject());
  const common = { section: '验证', title: '验证内容', notes: ['讲解时保留关键边界。'], sourceIds: [content.sources.sources[0].id], timingSeconds: 60 };
  content.sources.sources[0].timeRanges = ['02:00–03:15：视频例子'];
  content.sources.sources[0].evidence = '按时间段核对原始画面';
  content.deck.slides = [
    { ...common, id: 'test-table', layout: 'table', headers: ['任务', '验收'], rows: [['检索', '附原文'], ['执行', '可撤回']] },
    { ...common, id: 'test-spotlight', layout: 'spotlight', lead: '模型负责生成建议', bullets: ['工具负责执行动作'], takeaway: '权限决定系统能做什么' },
    { ...common, id: 'test-example', layout: 'example', prompt: '查找订单状态', response: '返回真实查询结果和时间', caption: '教学示例' },
    { ...common, id: 'test-image', layout: 'image', imagePath: 'assets/design/ai-language-tools-cover.png', caption: '概念插画' },
  ];
  const outputFile = path.join(projectRoot, '.cache/tests/new-layouts.pptx');
  await mkdir(path.dirname(outputFile), { recursive: true });
  await renderDeck({ ...content, outputFile });
  const bytes = await readFile(outputFile);
  assert.deepEqual(await verifyDeck(bytes, content.deck, content.sources), { slideCount: 4, notesCount: 4 });
  const zip = await JSZip.loadAsync(bytes);
  const imageBytes = await readFile(path.join(projectRoot, 'assets/design/ai-language-tools-cover.png'));
  const originalRatio = imageBytes.readUInt32BE(16) / imageBytes.readUInt32BE(20);
  const imageXml = await zip.file('ppt/slides/slide4.xml').async('string');
  const imageExtent = imageXml.match(/<p:pic>[\s\S]*?<a:ext cx="(\d+)" cy="(\d+)"\/>/);
  assert.ok(imageExtent, '图片必须作为原生图片进入 PPTX');
  assert.ok(Math.abs(Number(imageExtent[1]) / Number(imageExtent[2]) - originalRatio) < 0.0001, '图片不应被拉伸');
  const notesPath = 'ppt/notesSlides/notesSlide1.xml';
  zip.file(notesPath, (await zip.file(notesPath).async('string')).replace('02:00–03:15：视频例子', ''));
  await assert.rejects(verifyDeck(await zip.generateAsync({ type: 'nodebuffer' }), content.deck, content.sources), /未完整导出资料/);
});
