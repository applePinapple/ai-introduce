import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { renderDeck, speakerNotes } from '../src/slides/render.mjs';
import { validateDeck } from '../src/slides/validate.mjs';

const deck = JSON.parse(await fs.readFile(new URL('../content/decks/sample.json', import.meta.url), 'utf8'));
const sources = JSON.parse(await fs.readFile(new URL('../content/sources.json', import.meta.url), 'utf8'));
const fixture = () => ({ deck: structuredClone(deck), sources: structuredClone(sources) });
const full = JSON.parse(await fs.readFile(new URL('../content/decks/ai-history.json', import.meta.url), 'utf8'));
const wavesFixture = () => {
  const changed = structuredClone(deck);
  Object.assign(changed.slides[1], {
    layout: 'waves',
    eras: ['rules', 'learning', 'network', 'language'].map((icon, index) => ({
      period: `时期 ${index + 1}`, title: `浪潮 ${index + 1}`, description: '技术特点', application: '应用示例', icon
    }))
  });
  return changed;
};
const galleryFixture = (count = 2) => ({
  title: '图片演示测试',
  slides: [{
    ...structuredClone(deck.slides[1]),
    layout: 'gallery',
    title: '图片章节标题',
    subtitle: '',
    images: Array.from({ length: count }, (_, index) => ({ path: `assets/gallery-${index + 1}.png`, alt: `图像 ${index + 1}` })),
    notes: ['这段演讲解释只应保留在讲稿中。']
  }]
});
const relationshipFixture = () => ({
  title: '关系图测试',
  slides: [{
    ...structuredClone(deck.slides[1]),
    layout: 'relationship',
    taxonomy: { ai: '人工智能 AI', rules: '规则与符号 AI', learning: '机器学习', traditional: '传统机器学习', deep: '深度学习' },
    columnLabels: ['技术包含关系', '模型与能力', '应用场景'],
    relations: ['rules', 'learning', 'deep', 'deep', 'deep', 'deep', 'deep'].map((route, index) => ({
      route, capability: `能力 ${index + 1}`, scenarios: `场景 ${index + 1}`
    }))
  }]
});

test('四次浪潮布局无需定义，要求四个完整阶段与受支持的图标', () => {
  const changed = wavesFixture();
  assert.deepEqual(validateDeck(changed, sources), []);
  for (const missing of ['eras']) {
    const invalid = structuredClone(changed);
    delete invalid.slides[1][missing];
    assert.ok(validateDeck(invalid, sources).some(error => error.includes(`.${missing}:`)), missing);
  }
  for (const count of [0, 3, 5]) {
    const invalid = structuredClone(changed);
    invalid.slides[1].eras = Array.from({ length: count }, () => structuredClone(changed.slides[1].eras[0]));
    assert.match(validateDeck(invalid, sources).join('\n'), /eras: expected 4 items/, `${count} eras`);
  }
  for (const key of ['period', 'title', 'description', 'application', 'icon']) {
    for (const value of [undefined, '  ']) {
      const invalid = structuredClone(changed);
      invalid.slides[1].eras[0][key] = value;
      assert.ok(validateDeck(invalid, sources).some(error => error.includes(`.eras[0].${key}: nonempty text required`)), key);
    }
  }
  const invalid = structuredClone(changed);
  invalid.slides[1].eras[0].icon = 'unknown';
  assert.match(validateDeck(invalid, sources).join('\n'), /icon: unsupported wave icon/);
  invalid.slides[1].eras[0] = null;
  assert.match(validateDeck(invalid, sources).join('\n'), /eras\[0\].title: nonempty text required/);
});

test('独立定义页需要非空定义，品牌主题可选且只接受 reinbee', () => {
  const changed = structuredClone(deck);
  Object.assign(changed.slides[1], {
    layout: 'definition',
    definition: 'AI 是让机器执行学习、推理与问题求解等智能任务的技术。'
  });
  assert.deepEqual(validateDeck(changed, sources), []);
  changed.slides[1].theme = 'reinbee';
  assert.deepEqual(validateDeck(changed, sources), []);
  for (const value of [undefined, '', '  ', null]) {
    const invalid = structuredClone(changed);
    invalid.slides[1].definition = value;
    assert.match(validateDeck(invalid, sources).join('\n'), /definition: nonempty text required/);
  }
  for (const value of ['', '  ', null, 'unknown']) {
    const invalid = structuredClone(changed);
    invalid.slides[1].theme = value;
    assert.match(validateDeck(invalid, sources).join('\n'), /theme: unsupported theme/);
  }
});

test('代表性产物布局需要完整媒体、三个事实与三个步骤', () => {
  const changed = structuredClone(deck);
  Object.assign(changed.slides[1], {
    layout: 'product',
    productName: '代表性产物',
    productMeta: '年代与背景',
    imagePath: deck.slides[0].imagePath,
    imageAlt: '产物图片说明',
    imageCredit: '图片来源',
    caption: '图片内容说明',
    facts: Array.from({ length: 3 }, (_, index) => ({ label: `事实 ${index + 1}`, text: '事实内容' })),
    steps: Array.from({ length: 3 }, (_, index) => ({ label: `步骤 ${index + 1}`, text: '步骤内容' }))
  });
  assert.deepEqual(validateDeck(changed, sources), []);
  for (const key of ['productName', 'productMeta', 'imagePath', 'imageAlt', 'imageCredit', 'caption']) {
    for (const value of [undefined, '  ', null]) {
      const invalid = structuredClone(changed);
      invalid.slides[1][key] = value;
      assert.ok(validateDeck(invalid, sources).some(error => error.includes(`.${key}: nonempty text required`)), key);
    }
  }
  for (const name of ['facts', 'steps']) {
    for (const value of [undefined, [], changed.slides[1][name].slice(0, 2), [...changed.slides[1][name], changed.slides[1][name][0]]]) {
      const invalid = structuredClone(changed);
      invalid.slides[1][name] = value;
      assert.ok(validateDeck(invalid, sources).some(error => error.includes(`.${name}: expected 3 items`)), name);
    }
    for (const key of ['label', 'text']) {
      for (const value of [undefined, '  ']) {
        const invalid = structuredClone(changed);
        invalid.slides[1][name][0][key] = value;
        assert.ok(validateDeck(invalid, sources).some(error => error.includes(`.${name}[0].${key}: nonempty text required`)), `${name}.${key}`);
      }
    }
    const invalid = structuredClone(changed);
    invalid.slides[1][name][0] = null;
    assert.ok(validateDeck(invalid, sources).some(error => error.includes(`.${name}[0].label: nonempty text required`)), name);
  }
  for (const imagePath of ['assets/../secret.png', '../secret.png', 'https://example.test/image.png', 'C:/secret.png']) {
    const invalid = structuredClone(changed);
    invalid.slides[1].imagePath = imagePath;
    assert.match(validateDeck(invalid, sources).join('\n'), /imagePath must stay inside assets/, imagePath);
  }
  changed.slides[1].detailImagePath = changed.slides[1].imagePath;
  changed.slides[1].detailImageAlt = '补充截图说明';
  assert.deepEqual(validateDeck(changed, sources), []);
  for (const key of ['detailImagePath', 'detailImageAlt']) {
    const invalid = structuredClone(changed);
    delete invalid.slides[1][key];
    assert.match(validateDeck(invalid, sources).join('\n'), /detailImagePath and detailImageAlt must be supplied together/);
    invalid.slides[1][key] = '  ';
    assert.ok(validateDeck(invalid, sources).some(error => error.includes(`.${key}: nonempty text required`)), key);
  }
  for (const detailImagePath of ['assets/../secret.png', '../secret.png', 'https://example.test/image.png', 'C:/secret.png']) {
    const invalid = structuredClone(changed);
    invalid.slides[1].detailImagePath = detailImagePath;
    assert.match(validateDeck(invalid, sources).join('\n'), /imagePath must stay inside assets/, detailImagePath);
  }
});

test('图集布局接受2–5张图片，拒绝缺字段、不安全路径和无效显示选项', () => {
  for (const count of [2, 3, 4, 5]) assert.deepEqual(validateDeck(galleryFixture(count), sources), []);
  for (const count of [0, 1, 6]) assert.match(validateDeck(galleryFixture(count), sources).join('\n'), /images: expected 2-5 items/);
  for (const value of [undefined, null, {}]) {
    const invalid = galleryFixture();
    invalid.slides[0].images = value;
    assert.match(validateDeck(invalid, sources).join('\n'), /images: expected 2-5 items/);
  }
  for (const key of ['path', 'alt']) {
    for (const value of [undefined, '  ', null]) {
      const invalid = galleryFixture();
      invalid.slides[0].images[0][key] = value;
      assert.ok(validateDeck(invalid, sources).some(error => error.includes(`.images[0].${key}: nonempty text required`)), key);
    }
  }
  for (const imagePath of ['assets/../secret.png', '../secret.png', 'https://example.test/image.png', 'C:/secret.png']) {
    const invalid = galleryFixture();
    invalid.slides[0].images[0].path = imagePath;
    assert.match(validateDeck(invalid, sources).join('\n'), /images\[0\].path: must stay inside assets/, imagePath);
  }
  const changed = galleryFixture();
  Object.assign(changed.slides[0].images[0], { label: '讲稿识别标签', fit: 'cover', position: '50% 30%' });
  changed.slides[0].images[1].fit = 'contain';
  assert.deepEqual(validateDeck(changed, sources), []);
  for (const key of ['label', 'position']) {
    const invalid = structuredClone(changed);
    invalid.slides[0].images[0][key] = '  ';
    assert.ok(validateDeck(invalid, sources).some(error => error.includes(`.images[0].${key}: nonempty text required`)), key);
  }
  changed.slides[0].images[0].fit = 'stretch';
  assert.match(validateDeck(changed, sources).join('\n'), /fit: expected contain or cover/);
  changed.slides[0].images[0] = null;
  assert.match(validateDeck(changed, sources).join('\n'), /images\[0\].alt: nonempty text required/);
});

test('图集投屏保留图片与标题，演讲段落和识别标签不投屏', () => {
  const changed = galleryFixture();
  changed.slides[0].images[0].label = '仅用于讲稿识别的标签';
  const html = renderDeck(changed, sources);
  const projected = html.replace(/<template data-speaker-notes>[\s\S]*?<\/template>/g, '');
  const projectedText = projected.replace(/<[^>]*>/g, '');
  assert.equal((projected.match(/<img\b/g) || []).length, changed.slides[0].images.length);
  assert.ok(projectedText.includes(changed.slides[0].title));
  assert.ok(!projectedText.includes(changed.slides[0].images[0].label));
  for (const paragraph of changed.slides[0].notes) {
    assert.ok(html.includes(paragraph));
    assert.ok(!projectedText.includes(paragraph));
  }
  assert.deepEqual(speakerNotes(changed, sources)[0].notes, changed.slides[0].notes);
});

test('关系图需要完整分类与七项关系，拒绝非法路线和缺失正文', () => {
  const changed = relationshipFixture();
  assert.deepEqual(validateDeck(changed, sources), []);
  changed.slides[0].relations[0].route = 'deep';
  assert.deepEqual(validateDeck(changed, sources), []);
  for (const key of ['ai', 'rules', 'learning', 'traditional', 'deep']) {
    for (const value of [undefined, '  ', null]) {
      const invalid = relationshipFixture();
      invalid.slides[0].taxonomy[key] = value;
      assert.ok(validateDeck(invalid, sources).some(error => error.includes(`.taxonomy.${key}: nonempty text required`)), key);
    }
  }
  for (const taxonomy of [undefined, null, {}]) {
    const invalid = relationshipFixture();
    invalid.slides[0].taxonomy = taxonomy;
    assert.match(validateDeck(invalid, sources).join('\n'), /taxonomy.ai: nonempty text required/);
  }
  for (const columnLabels of [undefined, [], ['一', '二'], ['一', '二', '三', '四'], ['一', '  ', '三']]) {
    const invalid = relationshipFixture();
    invalid.slides[0].columnLabels = columnLabels;
    assert.match(validateDeck(invalid, sources).join('\n'), /columnLabels: expected 3-3 text items/);
  }
  for (const relations of [undefined, null, [], changed.slides[0].relations.slice(0, 6), [...changed.slides[0].relations, changed.slides[0].relations[0]]]) {
    const invalid = relationshipFixture();
    invalid.slides[0].relations = relations;
    assert.match(validateDeck(invalid, sources).join('\n'), /relations: expected 7 items/);
  }
  for (const route of [undefined, '', 'unknown']) {
    const invalid = relationshipFixture();
    invalid.slides[0].relations[0].route = route;
    assert.match(validateDeck(invalid, sources).join('\n'), /route: unsupported relationship route/);
  }
  for (const key of ['capability', 'scenarios']) {
    for (const value of [undefined, '  ', null]) {
      const invalid = relationshipFixture();
      invalid.slides[0].relations[0][key] = value;
      assert.ok(validateDeck(invalid, sources).some(error => error.includes(`.relations[0].${key}: nonempty text required`)), key);
    }
  }
  const invalid = relationshipFixture();
  invalid.slides[0].relations[0] = null;
  assert.match(validateDeck(invalid, sources).join('\n'), /relations\[0\].capability: nonempty text required/);
});

test('关系图的分类、能力与场景按文本转义', () => {
  const changed = relationshipFixture();
  changed.slides[0].taxonomy.ai = '<svg onload="alert(1)">';
  changed.slides[0].taxonomy.rules = '<b>显式规则</b>';
  changed.slides[0].taxonomy.deep = 'A & B';
  changed.slides[0].columnLabels[0] = '<i>技术标题</i>';
  changed.slides[0].relations[0].capability = '<img src=x onerror="alert(1)">';
  changed.slides[0].relations[0].scenarios = '</div><script>alert(1)</script>';
  const html = renderDeck(changed, sources);
  assert.ok(html.includes('&lt;svg onload=&quot;alert(1)&quot;&gt;'));
  assert.ok(html.includes('&lt;b&gt;显式规则&lt;/b&gt;'));
  assert.ok(html.includes('A &amp; B'));
  assert.ok(html.includes('&lt;i&gt;技术标题&lt;/i&gt;'));
  assert.ok(html.includes('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;'));
  assert.ok(html.includes('&lt;/div&gt;&lt;script&gt;alert(1)&lt;/script&gt;'));
  assert.ok(!html.includes('<svg onload='));
  assert.ok(!html.includes('<b>显式规则</b>'));
  assert.ok(!html.includes('<i>技术标题</i>'));
  assert.ok(!html.includes('<img src=x'));
  assert.ok(!html.includes('<script>alert(1)</script>'));
});

test('完整演讲覆盖47页和58分钟，全部新布局可渲染并保留正文', () => {
  assert.equal(full.slides.length, 47);
  assert.equal(full.durationMinutes, 58);
  assert.equal(full.slides.reduce((n,s) => n+s.timingSeconds,0), 3480);
  assert.equal(full.slides[1].layout, 'definition');
  assert.equal(full.slides[1].timingSeconds, 30);
  assert.equal(full.slides[2].layout, 'waves');
  assert.equal(full.slides[2].timingSeconds, 60);
  const galleries = full.slides.slice(3, 14);
  for (const slide of galleries) {
    assert.equal(slide.layout, 'gallery');
  }
  assert.deepEqual(galleries.map(slide => slide.timingSeconds), [90, 90, 45, 45, 90, 60, 60, 60, 60, 60, 60]);
  assert.equal(galleries[2].id, 'wave-product-dl');
  assert.equal(galleries[3].id, 'wave-product-dl-control');
  assert.equal(galleries[2].images.length, 3);
  assert.equal(galleries[3].images.length, 2);
  assert.equal(full.slides[14].id, 'ai-relationships');
  assert.equal(full.slides[14].layout, 'relationship');
  assert.equal(full.slides[14].timingSeconds, 105);
  for (const id of ['concepts', 'neural-example', 'train-infer']) assert.ok(!full.slides.some(slide => slide.id === id), id);
  assert.deepEqual(validateDeck(full,sources), []);
  const html=renderDeck(full,sources);
  assert.equal((html.match(/<section class="slide/g)||[]).length,47);
  assert.equal((html.match(/data-speaker-notes/g)||[]).length,47);
  for(const s of full.slides) assert.ok(html.includes(s.id));
  assert.ok(html.includes('diagram-feedback'));
  assert.ok(!html.includes('undefined'));
  assert.ok(full.slides.some(s=>s.evidencePaths?.some(p=>p.includes('/002/'))));
  assert.ok(full.slides.some(s=>s.evidencePaths?.some(p=>p.includes('/004/'))));
  assert.ok(full.slides.some(s=>s.evidencePaths?.some(p=>p.includes('/005/'))));
});

test('完整演讲拒绝错列、缺失图解内容、不安全证据路径和不一致时长', () => {
  const d=structuredClone(full);
  d.slides.find(s=>s.layout==='table').rows[0].pop();
  const diagram=d.slides.find(s=>s.layout==='diagram');
  diagram.nodes[0].description='';diagram.evidencePaths=['assets/../secret.jpg'];
  d.slides[0].timingSeconds++;
  const errors=validateDeck(d,sources).join('\n');
  assert.match(errors,/table column mismatch/);assert.match(errors,/item.description/);
  assert.match(errors,/must stay inside assets/);assert.match(errors,/durations must equal/);
});

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

test('封面汇报信息成对出现且日期有效，型号保持原文并仅用于封面', () => {
  const { deck: changed, sources: refs } = fixture();
  Object.assign(changed.slides[0], { presenter: '刘汉轩', reportDate: '2026.10', robotModel: 'Z100l' });
  assert.deepEqual(validateDeck(changed, refs), []);
  assert.equal(changed.slides[0].robotModel, 'Z100l');
  for (const key of ['presenter', 'reportDate']) {
    const invalid = structuredClone(changed);
    delete invalid.slides[0][key];
    assert.match(validateDeck(invalid, refs).join('\n'), /must be supplied together/);
  }
  for (const date of ['2026.00', '2026.13', '2026-10']) {
    const invalid = structuredClone(changed);
    invalid.slides[0].reportDate = date;
    assert.match(validateDeck(invalid, refs).join('\n'), /expected YYYY.MM/);
  }
  for (const key of ['presenter', 'reportDate', 'robotModel']) {
    const invalid = structuredClone(changed);
    invalid.slides[1][key] = changed.slides[0][key];
    assert.match(validateDeck(invalid, refs).join('\n'), /only supported on cover slides/);
    invalid.slides[0][key] = '  ';
    assert.match(validateDeck(invalid, refs).join('\n'), new RegExp(`${key}: nonempty text required`));
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
