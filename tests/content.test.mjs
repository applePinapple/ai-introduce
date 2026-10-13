import test from 'node:test';
import assert from 'node:assert/strict';
import { loadProject, validateContent } from '../src/content.mjs';

test('草稿引用、布局与主题可以通过检查', async () => {
  const { deck, sources, theme } = await loadProject();
  assert.doesNotThrow(() => validateContent(deck, sources, theme));
});

test('未登记的来源不能进入讲稿', async () => {
  const { deck, sources, theme } = structuredClone(await loadProject());
  deck.slides[0].sourceIds = ['missing-source'];
  assert.throws(() => validateContent(deck, sources, theme), /找不到资料 missing-source/);
});

test('重复的页面 ID 与无效日期会报告具体位置', async () => {
  const { deck, sources, theme } = structuredClone(await loadProject());
  deck.slides[1].id = deck.slides[0].id;
  sources.sources[0].verifiedOn = '2026-02-30';
  assert.throws(() => validateContent(deck, sources, theme), (error) => {
    assert.match(error.message, /deck.slides\[1\].id: ID 重复/);
    assert.match(error.message, /verifiedOn/);
    return true;
  });
});

test('变更布局时必须同步内容字段，避免静默丢失正文', async () => {
  const { deck, sources, theme } = structuredClone(await loadProject());
  deck.slides[0].layout = 'bullets';
  deck.slides[0].items = [{ label: '步骤', description: '此字段会被 bullets 布局忽略' }];
  assert.throws(() => validateContent(deck, sources, theme), /此布局不使用 items/);
});

test('过长的正文在导出前给出错误', async () => {
  const { deck, sources, theme } = structuredClone(await loadProject());
  const slide = deck.slides.find((entry) => ['bullets', 'closing'].includes(entry.layout));
  slide.bullets[0] = '长'.repeat(41);
  assert.throws(() => validateContent(deck, sources, theme), /超过 40 字/);
});

test('未支持的正文字段不会静默丢失', async () => {
  const { deck, sources, theme } = structuredClone(await loadProject());
  deck.slides[0].body = '用户新增的正文';
  assert.throws(() => validateContent(deck, sources, theme), /body: 未知字段/);
});

test('逐页时长必须覆盖整场演讲', async () => {
  const { deck, sources, theme } = structuredClone(await loadProject());
  deck.slides[0].timingSeconds += 1;
  assert.throws(() => validateContent(deck, sources, theme), /累计.*需等于/);
});

test('表格缺列和越界图片路径会给出具体错误', async () => {
  const { deck, sources, theme } = structuredClone(await loadProject());
  const old = deck.slides[0];
  deck.slides[0] = { id: old.id, section: old.section, title: '示例表格', layout: 'table', notes: old.notes, sourceIds: old.sourceIds, timingSeconds: old.timingSeconds, headers: ['任务', '边界'], rows: [['检索', '只读'], ['发送']], imagePath: '../secret.png' };
  assert.throws(() => validateContent(deck, sources, theme), error => {
    assert.match(error.message, /rows\[1\]/);
    assert.match(error.message, /imagePath/);
    return true;
  });
});
