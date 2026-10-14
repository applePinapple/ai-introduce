import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';

import { outputDir, loadDeck } from './check.mjs';
const { deck } = await loadDeck();
const out = path.resolve(outputDir);
const shots = path.join(out, 'slides');
const verification = path.join(out, 'verification');
await fs.mkdir(shots, { recursive: true });
await fs.mkdir(verification, { recursive: true });
const expectedCount = deck.slides.length;
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

const browser = await chromium.launch({ executablePath, headless: true, args: ['--allow-file-access-from-files'] });
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
        return {
          page: Array.from(document.querySelectorAll('.slide')).indexOf(slide) + 1,
          activeCount: document.querySelectorAll('.slide.active').length,
          hash: location.hash,
          stage: { width: rect.width, height: rect.height, x: rect.x, y: rect.y, cssWidth: styles.width, cssHeight: styles.height },
          viewportOverflow: document.documentElement.scrollWidth > innerWidth + 1 || document.documentElement.scrollHeight > innerHeight + 1,
          stageOutsideViewport: rect.left < -1 || rect.top < -1 || rect.right > innerWidth + 1 || rect.bottom > innerHeight + 1,
          fields,
          notes: slide.querySelector('template[data-speaker-notes]')?.content.textContent.trim() ?? '',
          fontStatus: document.fonts.status,
          fonts: Array.from(document.fonts).map(font => ({ family: font.family, status: font.status })),
          badImages: Array.from(slide.querySelectorAll('img')).filter(img => !img.complete || !img.naturalWidth).map(img => img.src),
        };
      });
      result.viewport = viewport;
      reports.push(result);
      const tag = `${index + 1}@${viewport.width}x${viewport.height}`;
      if (result.activeCount !== 1) failures.push(`${tag}: 激活页数错误`);
      if (result.stage.cssWidth !== '1920px' || result.stage.cssHeight !== '1080px') failures.push(`${tag}: 舞台逻辑尺寸应为 1920×1080`);
      if (Math.abs(result.stage.width / result.stage.height - 16 / 9) > 0.001) failures.push(`${tag}: 舞台宽高比失真`);
      if (result.viewportOverflow || result.stageOutsideViewport) failures.push(`${tag}: 未完整适配屏幕`);
      if (!result.fields.length) failures.push(`${tag}: 没有 data-fit 文本检查点`);
      for (const field of result.fields) if (field.overflow || field.outsideStage || field.clippedText) failures.push(`${tag}: 文本越界 ${field.text.slice(0, 45)}`);
      if (!result.notes) failures.push(`${tag}: 缺少讲者备注`);
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
  for (const [name, passed] of Object.entries(interactions)) if (passed === false) failures.push(`${name}: 交互检查失败`);

  await page.emulateMedia({ media: 'print' });
  const print = await page.evaluate(() => ({
    slides: Array.from(document.querySelectorAll('.slide')).map(slide => ({
      visible: getComputedStyle(slide).display !== 'none', width: slide.getBoundingClientRect().width, height: slide.getBoundingClientRect().height,
    })),
    navHidden: getComputedStyle(document.querySelector('#nav-btn')).display === 'none',
  }));
  if (print.slides.some(slide => !slide.visible || slide.width !== 1920 || slide.height !== 1080) || !print.navHidden) failures.push('打印布局尺寸或导航隐藏错误');
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
