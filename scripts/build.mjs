import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { loadProject, projectRoot } from '../src/content.mjs';
import { renderDeck } from '../src/render.mjs';
import { formatTiming, slideNotes, sourceLines } from '../src/notes.mjs';

const html = value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
function visibleCopy(slide) {
  const lines = [];
  if (slide.subtitle) lines.push(slide.subtitle);
  if (slide.lead) lines.push(slide.lead);
  if (slide.prompt) lines.push('输入：' + slide.prompt);
  if (slide.response) lines.push((slide.caption ?? '输出示意') + '：' + slide.response);
  lines.push(...(slide.bullets ?? []));
  for (const item of slide.items ?? []) lines.push(item.label + '：' + item.description);
  for (const column of slide.columns ?? []) lines.push(column.title + '：' + column.bullets.join('；'));
  if (slide.headers) lines.push(slide.headers.join(' / '), ...slide.rows.map(row => row.join(' / ')));
  if (slide.layout === 'image') lines.push(slide.caption);
  return lines;
}
if (process.argv.includes('--html-samples')) {
  await import('./build-html-samples.mjs');
} else try {
  const content = await loadProject();
  const { deck, sources } = content;
  const outputDir = path.join(projectRoot, 'output');
  const outputFile = path.join(outputDir, 'ai-history-to-agents-50min.pptx');
  await mkdir(outputDir, { recursive: true });
  await renderDeck({ ...content, outputFile });
  const sourceMap = new Map(sources.sources.map(source => [source.id, source]));
  const lines = ['# ' + deck.title, '', '听众：' + deck.audience, '建议时长：' + deck.durationMinutes + ' 分钟', ''];
  const sections = [];
  let elapsed = 0;
  deck.slides.forEach((slide, index) => {
    const start = elapsed;
    elapsed += slide.timingSeconds;
    const timing = `${formatTiming(start)} – ${formatTiming(elapsed)}　建议 ${slide.timingSeconds} 秒`;
    lines.push('## ' + (index + 1) + '. ' + slide.title, '', timing, '', ...slideNotes(slide, sourceMap), '');
    const citations = slide.sourceIds.map(id => '<li>' + sourceLines(sourceMap.get(id)).map(line => html(line)).join('<br>') + '</li>').join('');
    sections.push(`<article><div class="meta">${String(index + 1).padStart(2, '0')} / ${deck.slides.length}　${html(slide.section)}　${timing}</div><h2>${html(slide.title)}</h2><div class="copy">${visibleCopy(slide).map(line => `<p>${html(line).replace(/\n/g, '<br>')}</p>`).join('')}</div>${slide.takeaway ? `<p class="takeaway">${html(slide.takeaway)}</p>` : ''}<h3>讲解</h3>${slide.notes.map(note => `<p>${html(note).replace(/\n/g, '<br>')}</p>`).join('')}${slide.footnote ? `<p class="small">${html(slide.footnote)}</p>` : ''}${citations ? `<details><summary>本页来源与核验记录</summary><ul>${citations}</ul></details>` : ''}</article>`);
  });
  await writeFile(path.join(outputDir, 'speaker-notes.md'), lines.join('\n') + '\n', 'utf8');
  const document = `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${html(deck.title)} · 讲稿</title><style>*{box-sizing:border-box}body{margin:0;background:#f7f5ef;color:#152c40;font:17px/1.8 'Microsoft YaHei',sans-serif}main{max-width:920px;margin:auto;padding:48px 32px}header{margin-bottom:56px}h1{font-size:36px;line-height:1.35}h2{font-size:29px;line-height:1.4;margin:14px 0 24px}h3{font-size:18px;color:#007f79;margin:28px 0 8px}article{padding:32px 0 56px;border-top:1px solid #b6c8c3}.meta,.small,details{font-size:13px;color:#617477}.copy{padding:4px 0 4px 20px;border-left:3px solid #007f79}.copy p{margin:7px 0}.takeaway{font-weight:bold;color:#007f79}summary{cursor:pointer}li{margin-bottom:18px;overflow-wrap:anywhere}@media print{body{background:white;font-size:11pt}main{max-width:none;padding:0}h1{font-size:24pt}h2{font-size:20pt}article{break-before:page;border:0;padding:0}header{break-after:page}details>summary{display:none}details>*{display:block}details{font-size:8.5pt}.copy{padding-left:12px}p{orphans:3;widows:3}}</style><main><header><h1>${html(deck.title)}</h1><p>${html(deck.subtitle)}</p><p>${html(deck.audience)}　${deck.durationMinutes} 分钟　${deck.slides.length} 页</p></header>${sections.join('')}</main></html>`;
  await writeFile(path.join(outputDir, 'speaker-notes.html'), document, 'utf8');
  console.log(`已生成 output/ai-history-to-agents-50min.pptx（${deck.slides.length} 页）及 Markdown、离线打印 HTML 讲稿。`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}

