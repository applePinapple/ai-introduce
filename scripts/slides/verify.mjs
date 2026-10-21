import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';

import { outputDir, selectedDeck, loadDeck } from './check.mjs';
const { deck } = await loadDeck();
const out = path.resolve(outputDir);
const shots = path.join(out, 'slides');
const verification = path.join(out, 'verification');
await fs.mkdir(shots, { recursive: true });
await fs.mkdir(verification, { recursive: true });
const expectedCount = deck.slides.length;
// Remove only numbered images owned by this exporter that exceed the new deck.
// Keep media and every unrelated artifact in the output directory intact.
for (const [directory, pattern, maximum] of [
  [shots, /^slide-(\d+)\.png$/, expectedCount],
  [verification, /^slide-(\d+)-\d+\.png$/, expectedCount],
  [out, /^overview-(\d+)\.png$/, Math.ceil(expectedCount / 6)],
]) {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const match = entry.name.match(pattern);
    if (entry.isFile() && match && Number(match[1]) > maximum) await fs.unlink(path.join(directory, entry.name));
  }
}
const failures = [], errors = [], externalRequests = [], resourceFailures = [], reports = [];
const interactions = {};
const candidates = [
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  chromium.executablePath(),
].filter(Boolean);
let executablePath;
for (const candidate of candidates) {
  try { await fs.access(candidate); executablePath = candidate; break; } catch { /* Try the next installed browser. */ }
}
if (!executablePath) throw new Error('找不到 Chromium。请运行 npx playwright-core install chromium，或设置 PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH。');

// Verify ordinary offline browser behavior, without relaxing file origin rules.
const browser = await chromium.launch({ executablePath, headless: true });
const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
const page = await context.newPage();
page.on('pageerror', error => errors.push(error.message));
page.on('requestfailed', request => resourceFailures.push({ url: request.url(), error: request.failure()?.errorText }));
await context.route(/^https?:/, route => {
  externalRequests.push(route.request().url());
  return route.abort();
});
const url = pathToFileURL(path.join(out, 'deck.html')).href;
const settle = async () => {
  await page.evaluate(async () => { await Promise.all(Array.from(document.fonts, font => font.load())); await document.fonts.ready; await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))); });
  await page.waitForTimeout(180);
};
const activeNumber = () => page.evaluate(() => Array.from(document.querySelectorAll('.slide')).indexOf(document.querySelector('.slide.active')) + 1);
const assertSlide = async (number, label) => {
  await page.waitForFunction(n => Array.from(document.querySelectorAll('.slide')).indexOf(document.querySelector('.slide.active')) + 1 === n, number);
  const hash = await page.evaluate(() => location.hash);
  interactions[label] = { page: await activeNumber(), hash, passed: hash === `#${number}` };
  if (!interactions[label].passed) failures.push(`${label}: URL hash 应为 #${number}，实际为 ${hash}`);
};

try {
  await page.goto(url);
  await settle();
  const slideCount = await page.locator('.slide').count();
  if (slideCount !== expectedCount) failures.push(`应有 ${expectedCount} 页，实际 ${slideCount} 页`);
  for (const viewport of [{ width: 1920, height: 1080 }, { width: 1280, height: 720 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    for (let index = 0; index < expectedCount; index++) {
      await page.evaluate(n => { location.hash = `#${n}`; }, index + 1);
      await page.waitForFunction(n => Array.from(document.querySelectorAll('.slide')).indexOf(document.querySelector('.slide.active')) + 1 === n, index + 1);
      await settle();
      const result = await page.evaluate(() => {
        const stage = document.querySelector('#stage');
        const slide = document.querySelector('.slide.active');
        const rect = stage.getBoundingClientRect();
        const styles = getComputedStyle(stage);
        const fields = Array.from(slide.querySelectorAll('[data-fit]')).map(el => {
          const box = el.getBoundingClientRect();
          const range = document.createRange(); range.selectNodeContents(el);
          const text = range.getBoundingClientRect();
          // The reference intentionally uses tight line heights. CJK font
          // metrics may exceed that line box without clipping visible glyphs.
          // Check actual clipping ancestors instead of treating every such
          // font metric as a text overflow.
          const clippedBy = [];
          for (let ancestor = el; ancestor; ancestor = ancestor.parentElement) {
            const style = getComputedStyle(ancestor);
            const bounds = ancestor.getBoundingClientRect();
            const clipsX = ['hidden', 'clip', 'auto', 'scroll'].includes(style.overflowX);
            const clipsY = ['hidden', 'clip', 'auto', 'scroll'].includes(style.overflowY);
            if (text.width > 0 && ((clipsX && (text.left < bounds.left - 3 || text.right > bounds.right + 3)) || (clipsY && (text.top < bounds.top - 3 || text.bottom > bounds.bottom + 3)))) clippedBy.push(ancestor.id || ancestor.className || ancestor.tagName);
          }
          return {
            text: el.textContent.trim(), tag: el.tagName, fontSize: getComputedStyle(el).fontSize,
            bounds: { x: box.x, y: box.y, width: box.width, height: box.height },
            overflow: getComputedStyle(el).display !== 'inline' && el.scrollWidth > el.clientWidth + 2,
            outsideStage: box.left < rect.left - 2 || box.top < rect.top - 2 || box.right > rect.right + 2 || box.bottom > rect.bottom + 2 || (text.width > 0 && (text.left < rect.left - 3 || text.right > rect.right + 3 || text.top < rect.top - 3 || text.bottom > rect.bottom + 3)),
            clippedText: clippedBy.length > 0, clippedBy,
          };
        });
        const applicationLayout = [];
        const application = slide.querySelector('.application-body');
        if (application) {
          const scale = rect.width / 1920;
          const box = application.getBoundingClientRect();
          const near = (actual, expected) => Math.abs(actual - expected) <= 2 * scale;
          if (!near(box.left - rect.left, 104 * scale) || !near(box.top - rect.top, 240 * scale)
              || !near(box.width, 1712 * scale) || !near(box.height, 770 * scale)) {
            applicationLayout.push('应用内容画布尺寸或位置不一致');
          }
          const lastMessage = application.querySelector('.app-chat-message:last-child');
          const composer = application.querySelector('.app-composer');
          if (lastMessage && composer && lastMessage.getBoundingClientRect().bottom > composer.getBoundingClientRect().top - 8 * scale) {
            applicationLayout.push('最后一条聊天消息侵入输入区');
          }
          for (const card of application.querySelectorAll('.app-concept,.app-responsibility,.app-chat-message,.app-hybrid-steps article')) {
            const bounds = card.getBoundingClientRect();
            for (const field of card.querySelectorAll('[data-fit]')) {
              const range = document.createRange(); range.selectNodeContents(field);
              const text = range.getBoundingClientRect();
              if (text.left < bounds.left - 3 * scale || text.right > bounds.right + 3 * scale
                  || text.top < bounds.top - 3 * scale || text.bottom > bounds.bottom + 3 * scale) {
                applicationLayout.push(`卡片内容越界：${field.textContent.trim().slice(0, 30)}`);
              }
            }
          }
          const caption = application.querySelector('.app-caption').getBoundingClientRect();
          for (const ending of application.querySelectorAll('.app-generation-stages,.app-boundary,.app-principle,.app-hybrid-boundary,.app-sequence-bottom,.app-summary-closing')) {
            if (ending.getBoundingClientRect().bottom > caption.top - 4 * scale) applicationLayout.push('主要内容与底部图注重叠');
          }
        }
        const moduleLayouts = { agent: [], harness: [], robot: [] };
        for (const kind of ['agent', 'harness', 'robot']) {
          const body = slide.querySelector(`.${kind}-body`);
          if (!body) continue;
          const layoutIssues = moduleLayouts[kind];
          const scale = rect.width / 1920;
          const box = body.getBoundingClientRect();
          const near = (actual, expected) => Math.abs(actual - expected) <= 2 * scale;
          if (!near(box.left - rect.left, 104 * scale) || !near(box.top - rect.top, 240 * scale)
              || !near(box.width, 1712 * scale) || !near(box.height, 770 * scale)) {
            layoutIssues.push(`${kind}内容画布尺寸或位置不一致`);
          }
          for (const card of body.querySelectorAll(`[data-${kind}-card]`)) {
            const bounds = card.getBoundingClientRect();
            for (const field of card.querySelectorAll('[data-fit]')) {
              const range = document.createRange(); range.selectNodeContents(field);
              const text = range.getBoundingClientRect();
              if (text.left < bounds.left - 3 * scale || text.right > bounds.right + 3 * scale
                  || text.top < bounds.top - 3 * scale || text.bottom > bounds.bottom + 3 * scale) {
                layoutIssues.push(`${kind}卡片内容越界：${field.textContent.trim().slice(0, 30)}`);
              }
            }
          }
          const caption = body.querySelector(`.${kind}-caption`)?.getBoundingClientRect();
          if (!caption) layoutIssues.push(`${kind}图注缺失`);
          else for (const ending of body.querySelectorAll(`.${kind}-bottom`)) {
            if (ending.getBoundingClientRect().bottom > caption.top - 4 * scale) layoutIssues.push(`${kind}主要内容与底部图注重叠`);
          }
        }
        return {
          page: Array.from(document.querySelectorAll('.slide')).indexOf(slide) + 1,
          activeCount: document.querySelectorAll('.slide.active').length,
          hash: location.hash,
          stage: { width: rect.width, height: rect.height, x: rect.x, y: rect.y, cssWidth: styles.width, cssHeight: styles.height },
          viewportOverflow: document.documentElement.scrollWidth > innerWidth + 1 || document.documentElement.scrollHeight > innerHeight + 1,
          stageOutsideViewport: rect.left < -1 || rect.top < -1 || rect.right > innerWidth + 1 || rect.bottom > innerHeight + 1,
          fields,
          applicationLayout,
          agentLayout: moduleLayouts.agent,
          harnessLayout: moduleLayouts.harness,
          robotLayout: moduleLayouts.robot,
          notes: slide.querySelector('template[data-speaker-notes]')?.content.textContent.trim() ?? '',
          notesInert: Array.from(slide.querySelectorAll('template[data-speaker-notes]')).every(template => getComputedStyle(template).display === 'none' && Array.from(template.content.childNodes).every(node => !node.isConnected)),
          visibleNoteText: Array.from(slide.querySelector('template[data-speaker-notes]')?.content.querySelectorAll('p') ?? []).filter(p => p.textContent.trim() && slide.innerText.includes(p.textContent.trim())).map(p => p.textContent.trim()),
          fontStatus: document.fonts.status,
          fonts: Array.from(document.fonts).map(font => ({ family: font.family, status: font.status })),
          badImages: Array.from(slide.querySelectorAll('img')).filter(img => !img.complete || !img.naturalWidth).map(img => img.src),
          imageCount: slide.querySelectorAll('img').length,
        };
      });
      result.viewport = viewport;
      reports.push(result);
      const tag = `${index + 1}@${viewport.width}x${viewport.height}`;
      if (result.activeCount !== 1) failures.push(`${tag}: 激活页数错误`);
      if (result.stage.cssWidth !== '1920px' || result.stage.cssHeight !== '1080px') failures.push(`${tag}: 舞台逻辑尺寸应为 1920×1080`);
      if (Math.abs(result.stage.width / result.stage.height - 16 / 9) > 0.001) failures.push(`${tag}: 舞台宽高比失真`);
      if (result.viewportOverflow || result.stageOutsideViewport) failures.push(`${tag}: 未完整适配屏幕`);
      if (!result.fields.length && !result.imageCount) failures.push(`${tag}: 没有可见文字或图片内容`);
      for (const field of result.fields) if (field.overflow || field.outsideStage || field.clippedText) failures.push(`${tag}: 文本越界 ${field.text.slice(0, 45)}`);
      for (const issue of result.applicationLayout) failures.push(`${tag}: ${issue}`);
      for (const issue of result.agentLayout) failures.push(`${tag}: ${issue}`);
      for (const issue of result.harnessLayout) failures.push(`${tag}: ${issue}`);
      for (const issue of result.robotLayout) failures.push(`${tag}: ${issue}`);
      if (!result.notes) failures.push(`${tag}: 缺少讲者备注`);
      if (!result.notesInert || result.visibleNoteText.length) failures.push(`${tag}: 讲者备注出现在观众画面`);
      if (result.fontStatus !== 'loaded' || result.fonts.some(font => font.status !== 'loaded')) failures.push(`${tag}: 字体加载未完成`);
      if (result.badImages.length) failures.push(`${tag}: 图片加载失败`);
      await page.screenshot({ path: path.join(verification, `slide-${String(index + 1).padStart(2, '0')}-${viewport.width}.png`) });
      if (viewport.width === 1920) {
        await page.evaluate(() => document.documentElement.classList.add('exporting'));
        await page.locator('#stage').screenshot({ path: path.join(shots, `slide-${String(index + 1).padStart(2, '0')}.png`) });
        await page.evaluate(() => document.documentElement.classList.remove('exporting'));
      }
    }
  }

  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.keyboard.press('Home'); await assertSlide(1, 'home');
  await page.keyboard.press('ArrowRight'); await assertSlide(2, 'arrowRight');
  await page.keyboard.press('ArrowLeft'); await assertSlide(1, 'arrowLeft');
  await page.keyboard.press('End'); await assertSlide(expectedCount, 'end');
  await page.keyboard.press('1'); await assertSlide(1, 'numberJump');
  await page.keyboard.press('g');
  await page.waitForFunction(() => document.querySelector('#nav-panel').classList.contains('open'));
  interactions.directoryKeyboard = true;
  if (selectedDeck === 'ai-history') {
    const sections = await page.locator('#nav-panel .sec-title').allTextContents();
    const expectedSections = ['封面', 'AI 基础', '神经网络原理', '大语言模型', 'Agent基础', '机器人Agent'];
    interactions.directorySections = sections;
    if (JSON.stringify(sections) !== JSON.stringify(expectedSections)) failures.push('目录章节应依次包含统一的 Agent基础 与 机器人Agent');
  }
  await page.locator('#nav-panel .it[data-k="2"]').click(); await assertSlide(3, 'directoryClick');
  await page.locator('#nb-prev').click(); await assertSlide(2, 'previousButton');
  await page.locator('#nb-next').click(); await assertSlide(3, 'nextButton');
  await page.locator('#nb-list').click();
  interactions.directoryButton = await page.locator('#nav-panel').evaluate(el => el.classList.contains('open'));
  await page.keyboard.press('Escape');
  interactions.escapeClosesDirectory = await page.locator('#nav-panel').evaluate(el => !el.classList.contains('open'));
  await page.keyboard.press('f');
  await page.waitForFunction(() => Boolean(document.fullscreenElement));
  interactions.fullscreen = true;
  await page.evaluate(() => document.exitFullscreen());
  await page.evaluate(() => { location.hash = '#2'; }); await assertSlide(2, 'hashNavigation');
  await page.reload(); await settle(); await assertSlide(2, 'reloadKeepsPage');

  // A real popup with an explicit opener works on file:// without storage APIs.
  const popupPromise = page.waitForEvent('popup');
  await page.keyboard.press('p');
  const presenter = await popupPromise;
  presenter.on('pageerror', error => errors.push(`presenter: ${error.message}`));
  presenter.on('requestfailed', request => resourceFailures.push({ url: request.url(), error: request.failure()?.errorText }));
  await presenter.waitForLoadState('load');
  const assertPresenter = async (number, label) => {
    await presenter.waitForFunction(n => document.querySelector('#presenter-status')?.dataset.connected === 'true' && document.querySelector('#presenter-jump')?.value === String(n - 1), number);
    const state = await presenter.evaluate(() => ({
      page: document.querySelector('#presenter-page').textContent,
      title: document.querySelector('#presenter-title').textContent,
      notes: Array.from(document.querySelectorAll('#presenter-notes p')).map(p => p.textContent),
    }));
    const expected = deck.slides[number - 1];
    interactions[label] = state.page === `${number} / ${expectedCount}` && state.title === expected.title.replace(/\n/g, ' ') && JSON.stringify(state.notes) === JSON.stringify(expected.notes);
    if (!interactions[label]) failures.push(`${label}: 讲者页码、标题或讲稿不同步`);
  };
  await assertPresenter(2, 'presenterOpensOnCurrentSlide');
  await page.keyboard.press('ArrowRight'); await assertSlide(3, 'audienceToPresenter');
  await assertPresenter(3, 'presenterFollowsAudience');
  await presenter.locator('#presenter-prev').click(); await assertSlide(2, 'presenterPreviousControlsAudience');
  await assertPresenter(2, 'presenterPreviousSync');
  await presenter.locator('#presenter-next').click(); await assertSlide(3, 'presenterNextControlsAudience');
  await assertPresenter(3, 'presenterNextSync');
  if (selectedDeck === 'ai-history') {
    for (const number of [45, 56, 62, 63]) {
      await presenter.locator('#presenter-jump').selectOption(String(number - 1));
      await assertSlide(number, `integratedPresenterJump${number}`);
      await assertPresenter(number, `integratedPresenterNotes${number}`);
    }
  }
  await presenter.locator('#presenter-jump').selectOption('0'); await assertSlide(1, 'presenterJumpControlsAudience');
  await assertPresenter(1, 'presenterJumpSync');
  interactions.presenterFirstPageBoundary = await presenter.locator('#presenter-prev').isDisabled();
  await presenter.locator('#presenter-jump').blur();
  await presenter.keyboard.press('End'); await assertSlide(expectedCount, 'presenterKeyboardEnd');
  await assertPresenter(expectedCount, 'presenterLastPageSync');
  interactions.presenterLastPageBoundary = await presenter.locator('#presenter-next').isDisabled();
  await presenter.keyboard.press('Home'); await assertSlide(1, 'presenterKeyboardHome');
  await assertPresenter(1, 'presenterHomeSync');
  const channel = new URL(presenter.url()).hash.slice(1);
  await page.evaluate(channel => window.postMessage({ type: 'lip-presenter-command', channel, action: 'jump', index: 1 }, '*'), channel);
  await presenter.evaluate(({ channel, count }) => {
    window.postMessage({ type: 'lip-presenter-state', channel, index: 1, count }, '*');
    window.opener.postMessage({ type: 'lip-presenter-command', channel: 'untrusted-channel', action: 'jump', index: 1 }, '*');
  }, { channel, count: expectedCount });
  await page.waitForTimeout(150);
  interactions.presenterRejectsUntrustedMessages = await activeNumber() === 1 && await presenter.locator('#presenter-jump').inputValue() === '0';
  await presenter.reload(); await presenter.waitForLoadState('load');
  await assertPresenter(1, 'presenterReloadReconnects');
  const pagesBeforeReopen = context.pages().length;
  await page.keyboard.press('p');
  await assertPresenter(1, 'presenterKeyboardReusesWindow');
  interactions.presenterSingleWindow = context.pages().length === pagesBeforeReopen;
  const audienceNotesVisible = await page.evaluate(() => {
    const visible = document.body.innerText;
    return Array.from(document.querySelectorAll('template[data-speaker-notes]')).some(template => Array.from(template.content.querySelectorAll('p')).some(p => p.textContent.trim() && visible.includes(p.textContent.trim())));
  });
  interactions.presenterNotesStayOffAudience = !audienceNotesVisible;
  await presenter.setViewportSize({ width: 1120, height: 900 });
  await presenter.screenshot({ path: path.join(verification, 'presenter-window.png'), fullPage: true });
  await presenter.close();
  const reopenedPromise = page.waitForEvent('popup');
  await page.locator('#nb-presenter').click();
  const reopened = await reopenedPromise;
  await reopened.waitForFunction(() => document.querySelector('#presenter-status')?.dataset.connected === 'true');
  interactions.presenterButtonReopensClosedWindow = await reopened.locator('#presenter-jump').inputValue() === '0';
  await reopened.close();
  for (const [name, passed] of Object.entries(interactions)) if (passed === false) failures.push(`${name}: 交互检查失败`);

  await page.emulateMedia({ media: 'print' });
  const print = await page.evaluate(() => ({
    slides: Array.from(document.querySelectorAll('.slide')).map(slide => ({
      visible: getComputedStyle(slide).display !== 'none', width: slide.getBoundingClientRect().width, height: slide.getBoundingClientRect().height,
    })),
    navHidden: getComputedStyle(document.querySelector('#nav-btn')).display === 'none',
    notesHidden: Array.from(document.querySelectorAll('template[data-speaker-notes]')).every(template => getComputedStyle(template).display === 'none' && !Array.from(template.content.querySelectorAll('p')).some(p => p.textContent.trim() && document.body.innerText.includes(p.textContent.trim()))),
  }));
  if (print.slides.some(slide => !slide.visible || slide.width !== 1920 || slide.height !== 1080) || !print.navHidden) failures.push('打印布局尺寸或导航隐藏错误');
  if (!print.notesHidden) failures.push('打印观众画面中出现讲者备注');
  const pdfPath = path.join(out, 'deck.pdf');
  await page.pdf({ path: pdfPath, width: '1920px', height: '1080px', printBackground: true, preferCSSPageSize: true, margin: { top: 0, right: 0, bottom: 0, left: 0 }, displayHeaderFooter: false });
  const pdf = await fs.readFile(pdfPath);
  const pdfPages = (pdf.toString('latin1').match(/\/Type\s*\/Page\b/g) ?? []).length;
  if (pdfPages !== expectedCount) failures.push(`PDF 应有 ${expectedCount} 页，实际 ${pdfPages} 页`);

  const images = await Promise.all(Array.from({ length: expectedCount }, (_, index) => fs.readFile(path.join(shots, `slide-${String(index + 1).padStart(2, '0')}.png`))));
  const contact = await context.newPage();
  await contact.setViewportSize({ width: 1240, height: 752 });
  await contact.setContent(`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>演讲总览</title><style>*{box-sizing:border-box}body{margin:0;padding:28px;background:#e8edf3;color:#10243d;font-family:Arial,"Microsoft YaHei",sans-serif}h1{margin:0 0 20px;font-size:22px;font-weight:600}.grid{display:grid;grid-template-columns:1fr 1fr;gap:20px}figure{margin:0}img{display:block;width:100%;aspect-ratio:16/9;background:#fff;box-shadow:0 3px 14px #0b12201b}figcaption{padding:7px 2px;font-size:13px;color:#516077}</style><h1>${deck.title} · ${expectedCount} 页</h1><div class="grid">${images.map((data, index) => `<figure><img src="data:image/png;base64,${data.toString('base64')}"><figcaption>${String(index + 1).padStart(2, '0')} / ${expectedCount}</figcaption></figure>`).join('')}</div></html>`);
  await contact.evaluate(async () => { await Promise.all(Array.from(document.images).map(img => img.decode())); await document.fonts.ready; });
  await contact.screenshot({ path: path.join(out, '预览-全部页面.png'), fullPage: true });
  for (let start=0; start<expectedCount; start+=6) {
    await contact.evaluate(({start}) => { document.querySelectorAll('figure').forEach((f,i) => f.style.display = i >= start && i < start+6 ? '' : 'none'); window.scrollTo(0,0); }, {start});
    await contact.screenshot({path:path.join(out, 'overview-'+String(Math.floor(start/6)+1).padStart(2,'0')+'.png'),fullPage:true});
  }
  await contact.close();
  const report = { checkedAt: new Date().toISOString(), browser: await browser.version(), executablePath, slideCount, viewports: 3, pdfPages, print, interactions, reports, errors, externalRequests, resourceFailures, failures: [...new Set(failures)] };
  await fs.writeFile(path.join(out, 'verification.json'), `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ slideCount, viewports: 3, pdfPages, failures: report.failures, errors, externalRequests, resourceFailures }, null, 2));
  if (failures.length || errors.length || externalRequests.length || resourceFailures.length) process.exitCode = 1;
} catch (error) {
  await fs.writeFile(path.join(out, 'verification.json'), `${JSON.stringify({ checkedAt: new Date().toISOString(), error: error.stack, reports, interactions, errors, externalRequests, resourceFailures, failures }, null, 2)}\n`);
  throw error;
} finally {
  await browser.close();
}
