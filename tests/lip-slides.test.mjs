import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { renderDeck, speakerNotes } from '../src/slides/render.mjs';
import { validateDeck } from '../src/slides/validate.mjs';

const deck = JSON.parse(await fs.readFile(new URL('../content/decks/sample.json', import.meta.url), 'utf8'));
const sources = JSON.parse(await fs.readFile(new URL('../content/sources.json', import.meta.url), 'utf8'));
const fixture = () => ({ deck: structuredClone(deck), sources: structuredClone(sources) });

test('三页样例的布局、引用和讲稿通过内容校验', () => {
  assert.equal(deck.slides.length, 3);
  assert.deepEqual(deck.slides.map(slide => slide.layout), ['cover', 'loop', 'comparison']);
  assert.deepEqual(validateDeck(deck, sources), []);
});

test('不支持的布局和重复页面 ID 阻止构建', () => {
  const { deck: invalid, sources: refs } = fixture();
  invalid.slides[1].layout = 'unknown-layout';
  invalid.slides[1].id = invalid.slides[0].id;
  const errors = validateDeck(invalid, refs).join('\n');
  assert.match(errors, /unsupported layout/);
  assert.match(errors, /duplicate id/);
  assert.throws(() => renderDeck(invalid, refs), /unsupported layout/);
});

test('未登记来源、无核验日期和不安全 URL 均不能进入讲稿', () => {
  const { deck: invalid, sources: refs } = fixture();
  invalid.slides[0].sourceIds.push('source-does-not-exist');
  const used = refs.sources.find(source => source.id === invalid.slides[1].sourceIds[0]);
  used.verifiedOn = '';
  used.url = 'javascript:alert(1)';
  const errors = validateDeck(invalid, refs).join('\n');
  assert.match(errors, /unknown source source-does-not-exist/);
  assert.match(errors, /missing URL or verification date/);
});

test('封面媒体路径必须保持在本地 assets 目录中', () => {
  for (const imagePath of ['assets/../secret.png', '../secret.png', 'https://example.test/image.png', 'C:/secret.png']) {
    const { deck: invalid, sources: refs } = fixture();
    invalid.slides[0].imagePath = imagePath;
    assert.match(validateDeck(invalid, refs).join('\n'), /imagePath must stay inside assets/, imagePath);
  }
});

test('循环图项目数量与配色、对比表格列数不匹配时给出错误', () => {
  const { deck: invalid, sources: refs } = fixture();
  invalid.slides[1].inputs.pop();
  invalid.slides[1].outputs[0].tone = 'pink';
  invalid.slides[2].rows[0].pop();
  const errors = validateDeck(invalid, refs).join('\n');
  assert.match(errors, /inputs: expected 3 items/);
  assert.match(errors, /unknown tone/);
  assert.match(errors, /table row must have three text cells/);
});

test('空白正文、空备注与空引用不会静默导出', () => {
  const { deck: invalid, sources: refs } = fixture();
  invalid.slides[0].title = '  ';
  invalid.slides[1].notes = [];
  invalid.slides[2].sourceIds = [];
  const errors = validateDeck(invalid, refs).join('\n');
  assert.match(errors, /title: nonempty text required/);
  assert.match(errors, /notes required/);
  assert.match(errors, /sourceIds required/);
});

test('正文、属性、讲稿和来源 URL 按文本转义，避免 HTML 内容注入', () => {
  const { deck: changed, sources: refs } = fixture();
  changed.title = 'A & B <demo>';
  changed.slides[0].title = '<img src=x onerror="alert(1)">';
  changed.slides[0].section = '\" data-untrusted=\"yes';
  changed.slides[0].notes = ['</template><script>alert(1)</script>'];
  refs.sources.find(source => source.id === changed.slides[0].sourceIds[0]).url = 'https://example.test/?a="quoted"&b=<tag>';
  const html = renderDeck(changed, refs);
  assert.ok(html.includes('<title>A &amp; B &lt;demo&gt;</title>'));
  assert.ok(html.includes('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;'));
  assert.ok(html.includes('data-sec="&quot; data-untrusted=&quot;yes"'));
  assert.ok(html.includes('&lt;/template&gt;&lt;script&gt;alert(1)&lt;/script&gt;'));
  assert.ok(html.includes('href="https://example.test/?a=&quot;quoted&quot;&amp;b=&lt;tag&gt;"'));
  assert.ok(!html.includes('<img src=x'));
  assert.ok(!html.includes('<script>alert(1)</script>'));
});

test('每页独立 SVG 渐变标识，防止同名 defs 串色', () => {
  const html = renderDeck(deck, sources);
  const ids = [...html.matchAll(/<linearGradient id="([^"]+)"/g)].map(match => match[1]);
  assert.equal(ids.length, deck.slides.length);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) assert.ok(html.includes(`stroke="url(#${id})"`));
});

test('讲者备注保留原文并为每页补全来源与核验日期', () => {
  const notes = speakerNotes(deck, sources);
  const html = renderDeck(deck, sources);
  assert.equal(notes.length, deck.slides.length);
  assert.equal((html.match(/<template data-speaker-notes>/g) ?? []).length, deck.slides.length);
  for (const [index, entry] of notes.entries()) {
    assert.deepEqual(entry.notes, deck.slides[index].notes);
    assert.deepEqual(entry.sources.map(source => source.id), deck.slides[index].sourceIds);
    assert.ok(entry.sources.every(source => source.url && source.verifiedOn && source.title));
  }
});
