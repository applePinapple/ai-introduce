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
const neuralFixture = (neuralKind = 'white-layers') => {
  const white = neuralKind.startsWith('white-');
  const strings = count => Array.from({ length: count }, (_, index) => `标签 ${index + 1}`);
  const pairs = count => strings(count).map(label => ({ label, text: '解释内容' }));
  return {
    title: '神经网络组件测试',
    slides: [{
      ...structuredClone(deck.slides[1]),
      layout: 'neural',
      theme: white ? 'neural-light' : 'neural-dark',
      neuralKind,
      imagePath: 'assets/neural/test.png',
      imageAlt: '生物神经元示意',
      neuralData: white ? {
        lead: [{ text: '通过连接的神经元计算输出。', emphasis: true }],
        network: { alt: '网络结构图', layers: strings(4), inputs: strings(3), output: '输出', weights: strings(6) },
        neuron: { alt: '神经元计算图', inputs: strings(4), weights: strings(4), labels: strings(5), sumSymbol: 'Σ', activationSymbol: 'g', output: 'y' },
        layerDescriptions: pairs(3),
        showFormula: true,
        formula: { alt: '计算公式', result: 'y', activation: 'g', index: 'i', upper: 'n', weight: 'w', input: 'x', threshold: 'b' },
        calculationSteps: strings(3),
        stepNumbers: ['1', '2', '3'],
        visibleSteps: 4,
        flowIntro: '重复以下训练过程。',
        trainingSteps: pairs(4),
        showCallouts: true,
        callouts: [{ alt: '前向传播', label: '前向传播', english: 'Forward' }, { alt: '反向传播', label: '反向传播', english: 'Backward' }]
      } : {
        description: '灰度像素与神经网络示意',
        labels: { dimension: '28', pixelEquation: '28 × 28 = 784' },
        grids: { nine: Array(784).fill(0.5) },
        architecture: [784, 16, 16, 10],
        weights: [0.3, -0.4, 0, 1, -1, 0.2, 0.7, 0.9],
        formulaTokens: [{ text: 'w × a', color: 'green' }]
      }
    }]
  };
};
const llmFixture = (llmKind = 'attention-context') => ({
  title: '大语言模型组件测试',
  slides: [{
    ...structuredClone(deck.slides[1]),
    layout: 'llm', theme: 'reinbee', chapter: '03', section: '大语言模型', sectionLabel: '大语言模型',
    logoPath: 'assets/brand/reinbee-logo-light.png', logoAlt: 'ReinBee 浅色标志', llmKind,
    llmData: {
      description: '上下文与注意力的教学示意',
      paragraphs: ['第一段内容。', '第二段内容。', '第三段内容。', '第四段内容。'],
      badge: '上下文', lead: '上下文使表示发生变化。', caption: '教学示意',
      vectors: [{ label: '艺人', from: [0, 0], to: [-1, 1], labelPosition: [-1, 1.2], tone: 'blue' }]
    }
  }]
});
const llmEmbeddingFixture = (llmKind = 'embedding-high-d') => {
  const changed = llmFixture(llmKind);
  changed.slides[0].llmData = {
    lead: [{ text: '文本转换为数值表示。', tone: 'blue' }], bullets: [], qualifier: '',
    tokens: Array.from({ length: 8 }, (_, i) => ({ text: `片段 ${i}`, values: ['1.0', '⋮', '0.5'] })), selectedToken: 7,
    coordinateExamples: [2, 3].map(dimensions => ({ dimensions, values: Array(dimensions).fill(1), vectorLabel: '向量', axisLabels: ['x', 'y', 'z'].slice(0, dimensions) })),
    dimensionLabel: 'd', dimensionCaption: '维度依模型而定',
    cloud: { words: [{ text: '语言', point: [1, 2, 3], tone: 'yellow', labelOffset: [2, -1] }], axisLabels: ['x', 'y', 'z'], caption: '方向示意' },
    analogy: {
      vectors: ['a', 'b', 'c', 'd'].map((key, i) => ({ key, label: `词 ${i}`, point: [i, i + 1], tone: 'blue' })),
      differences: [{ from: 'a', to: 'b' }], formula: [{ text: 'A − B ≈ C − D' }], qualifier: '类比示意'
    }, showOffsets: false
  };
  return changed;
};
const llmGenerationFixture = (llmKind = 'generation-distribution') => {
  const changed = llmFixture(llmKind);
  const probabilities = () => [0.5, 0.2, 0.1, 0.1, 0.05, 0.05].map((probability, i) => ({ token: `候选 ${i}`, probability }));
  changed.slides[0].llmData = {
    description: '下一 token 概率的教学示意', lead: '根据已有文本预测下一步。', caption: '课堂构造数据',
    modelLabel: 'Transformer', promptLines: ['早餐有什么推荐的？'], probabilities: probabilities(), stageLabel: '预测',
    temperatureCases: [0.5, 1, 2].map(temperature => ({ label: `T = ${temperature}`, temperature, probabilities: probabilities() })), temperatureFormula: 'softmax(z/T)',
    plotLabels: { parameterAxis: '参数量' }, tableHeaders: ['模型', '参数', '训练 token', '维度'], tableCaption: '公开历史数据',
    models: Array.from({ length: 3 }, (_, i) => ({ name: `模型 ${i}`, year: 2020 + i, parametersB: i + 1, trainingTokens: '1B', dimension: '128' })),
    vectors: Array.from({ length: 7 }, (_, i) => ({ token: `位置 ${i}`, values: ['1', '2', '3', '4', '5', '⋯', '6'] })), dimensionLabel: 'd',
    windowLabel: '上下文容量 L', windowParagraphs: ['第一段。', '第二段。', '第三段。'], excludedText: '窗口外内容'
  };
  return changed;
};

test('大语言模型布局需要统一品牌、章节及结构化正文', () => {
  assert.deepEqual(validateDeck(llmFixture(), sources), []);
  for (const [key, value, expected] of [
    ['theme', 'neural-dark', /llm requires reinbee/],
    ['chapter', '02', /llm requires chapter 03/],
    ['section', '神经网络原理', /section: llm requires/],
    ['sectionLabel', '神经网络原理', /sectionLabel: llm requires/],
    ['logoPath', undefined, /logoPath: nonempty/],
    ['logoAlt', '', /logoAlt: nonempty/],
    ['llmKind', 'unknown-llm', /unsupported llm kind/],
    ['llmData', [], /llmData: object required/]
  ]) {
    const changed = llmFixture();
    changed.slides[0][key] = value;
    assert.match(validateDeck(changed, sources).join('\n'), expected, key);
  }
  const changed = llmFixture();
  changed.slides[0].layout = 'loop';
  assert.match(validateDeck(changed, sources).join('\n'), /llmKind and llmData require llm layout/);
});

test('注意力图拒绝缺失说明、错误段落数和无效向量坐标', () => {
  for (const [kind, mutate, expected] of [
    ['attention-context', s => { s.llmData.description = ' '; }, /description: nonempty/],
    ['attention-context', s => { s.llmData.paragraphs.pop(); }, /paragraphs: expected 4-4/],
    ['attention-intro', s => { s.llmData.vectors[0].to = [1]; }, /to: expected 2 finite numbers/],
    ['attention-intro', s => { s.llmData.vectors[0].from[0] = NaN; }, /from: expected 2 finite numbers/],
    ['attention-base-vector', s => { s.llmData.vectors[0].tone = 'pink'; }, /tone: unsupported/],
    ['attention-singing', s => {}, /vectors: expected 2 items/],
    ['attention-composite', s => {}, /vectors: expected 5 items/]
  ]) {
    const changed = llmFixture(kind);
    mutate(changed.slides[0]);
    assert.match(validateDeck(changed, sources).join('\n'), expected, kind);
  }
});

test('嵌入图要求有效 token 索引、匹配的坐标维度与可解析的关系引用', () => {
  for (const kind of ['embedding-definition', 'embedding-tokens', 'embedding-high-d', 'embedding-cloud', 'embedding-arithmetic']) assert.deepEqual(validateDeck(llmEmbeddingFixture(kind), sources), [], kind);
  for (const [kind, mutate, expected] of [
    ['embedding-definition', s => { s.llmData.qualifier = null; }, /qualifier: text required/],
    ['embedding-tokens', s => { s.llmData.tokens.pop(); }, /tokens: expected 8-8 items/],
    ['embedding-single', s => { s.llmData.selectedToken = 8; }, /selectedToken: valid token index/],
    ['embedding-high-d', s => { s.llmData.coordinateExamples[1].values.pop(); }, /values: expected 3 finite numbers/],
    ['embedding-high-d', s => { s.llmData.dimensionCaption = ''; }, /dimensionCaption: nonempty/],
    ['embedding-cloud', s => { s.llmData.cloud.words[0].point = [1, Infinity, 2]; }, /point: expected 3 finite numbers/],
    ['embedding-cloud', s => { s.llmData.cloud.words[0].tone = 'purple'; }, /tone: unsupported/],
    ['embedding-royalty', s => { s.llmData.analogy.differences[0].to = 'missing'; }, /to: known vector key/],
    ['embedding-parents', s => { s.llmData.analogy.vectors[1].key = 'a'; }, /duplicate vector key/],
    ['embedding-offset', s => { s.llmData.showOffsets = 1; }, /showOffsets: boolean/]
  ]) {
    const changed = llmEmbeddingFixture(kind);
    mutate(changed.slides[0]);
    assert.match(validateDeck(changed, sources).join('\n'), expected, kind);
  }
});

test('Transformer 层板顺序与显示标签必须完整', () => {
  const changed = llmFixture('transformer-softmax');
  Object.assign(changed.slides[0].llmData, {
    flowLabel: '数据流', embeddingRows: ['[1, 2, …]'], ellipsis: '…',
    boards: ['embedding', 'attention', 'mlp', 'attention', 'mlp', 'softmax'].map(kind => ({ kind, label: kind }))
  });
  assert.deepEqual(validateDeck(changed, sources), []);
  changed.slides[0].llmData.boards[1].kind = 'mlp';
  changed.slides[0].llmData.embeddingRows = [];
  const errors = validateDeck(changed, sources).join('\n');
  assert.match(errors, /boards\[1\].kind: expected attention/);
  assert.match(errors, /embeddingRows: expected 1-Infinity text items/);
});

test('生成概率、温度和反馈必须可解释为完整的下一步分布', () => {
  for (const kind of ['generation-distribution', 'generation-temperature', 'generation-repeat', 'scale-public', 'context-matrix', 'context-shift']) assert.deepEqual(validateDeck(llmGenerationFixture(kind), sources), [], kind);
  for (const [kind, mutate, expected] of [
    ['generation-distribution', s => { s.llmData.probabilities[0].probability = 1.1; }, /probability: number in 0-1/],
    ['generation-selected', s => { s.llmData.probabilities[0].probability = NaN; }, /probability: number in 0-1/],
    ['generation-append', s => { s.llmData.probabilities[0].probability = 0.4; }, /probabilities must sum to 1/],
    ['generation-repeat', s => { s.llmData.showFeedback = true; delete s.llmData.feedbackLabel; }, /feedbackLabel: nonempty/],
    ['generation-english', s => { s.llmData.probabilities[0].token = ''; }, /token: nonempty/],
    ['generation-temperature', s => { s.llmData.temperatureCases[0].temperature = 0; }, /temperature: positive number/],
    ['generation-temperature', s => { s.llmData.temperatureCases[1].probabilities[1].probability = 0.1; }, /probabilities must sum to 1/],
    ['generation-temperature', s => { s.llmData.temperatureCases.pop(); }, /temperatureCases: expected 3-3 items/]
  ]) {
    const changed = llmGenerationFixture(kind);
    mutate(changed.slides[0]);
    assert.match(validateDeck(changed, sources).join('\n'), expected, kind);
  }
});

test('规模表与上下文图拒绝缺失数值、矩阵单元和窗口说明', () => {
  for (const [kind, mutate, expected] of [
    ['scale-public', s => { s.llmData.models[0].parametersB = -1; }, /parametersB: positive number/],
    ['scale-capabilities', s => { s.llmData.models[0].dimension = ''; }, /dimension: nonempty/],
    ['context-matrix', s => { s.llmData.vectors[0].values.pop(); }, /values: expected 7-7 text items/],
    ['context-window', s => { s.llmData.windowParagraphs.pop(); }, /windowParagraphs: expected 3-3 text items/],
    ['context-shift', s => { delete s.llmData.excludedText; }, /excludedText: nonempty/]
  ]) {
    const changed = llmGenerationFixture(kind);
    mutate(changed.slides[0]);
    assert.match(validateDeck(changed, sources).join('\n'), expected, kind);
  }
});

test('大语言模型各组件按文本转义正文、向量标签和候选 token', () => {
  const embedding = llmEmbeddingFixture('embedding-definition').slides[0];
  const attention = llmFixture().slides[0];
  const generation = llmGenerationFixture().slides[0];
  embedding.id = 'llm-escape-embedding'; attention.id = 'llm-escape-attention'; generation.id = 'llm-escape-generation';
  embedding.llmData.lead[0].text = '<b>嵌入</b>';
  attention.llmData.paragraphs[0] = '<img src=x onerror="alert(1)">';
  generation.llmData.probabilities[0].token = '<script>alert(1)</script>';
  const html = renderDeck({ title: '转义测试', slides: [embedding, attention, generation] }, sources);
  for (const expected of ['&lt;b&gt;嵌入&lt;/b&gt;', '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;', '&lt;script&gt;alert(1)&lt;/script&gt;']) assert.ok(html.includes(expected), expected);
  for (const forbidden of ['<b>嵌入</b>', '<img src=x', '<script>alert(1)</script>']) assert.ok(!html.includes(forbidden), forbidden);
});

test('神经网络布局按 kind 匹配图示类型，拒绝缺失和无效正文', () => {
  for (const kind of ['white-layers', 'white-neuron-steps', 'white-train-summary', 'black-pixels', 'black-network', 'black-weights', 'black-weighted-sum']) {
    const changed = neuralFixture(kind);
    assert.deepEqual(validateDeck(changed, sources), [], kind);
    changed.slides[0].theme = kind.startsWith('white-') ? 'neural-dark' : 'neural-light';
    assert.match(validateDeck(changed, sources).join('\n'), /theme does not match neuralKind/);
  }
  for (const theme of [undefined, 'reinbee']) {
    const changed = neuralFixture();
    changed.slides[0].theme = theme;
    assert.match(validateDeck(changed, sources).join('\n'), /neural-light or neural-dark required/);
  }
  for (const neuralData of [undefined, null, [], '正文']) {
    const changed = neuralFixture();
    changed.slides[0].neuralData = neuralData;
    assert.match(validateDeck(changed, sources).join('\n'), /neuralData: object required/);
  }
  const changed = neuralFixture();
  changed.slides[0].neuralKind = 'white-unknown';
  assert.match(validateDeck(changed, sources).join('\n'), /unsupported neural kind/);
  changed.slides[0].layout = 'loop';
  assert.match(validateDeck(changed, sources).join('\n'), /neural themes require neural layout/);
  assert.match(validateDeck(changed, sources).join('\n'), /neuralKind and neuralData require neural layout/);
});

test('结构网络图校验标签数量、公式、训练步骤及本地媒体', () => {
  for (const [kind, mutate, expected] of [
    ['white-layers', d => { d.neuralData.lead = []; }, /lead: nonempty array/],
    ['white-layers', d => { d.neuralData.lead[0].emphasis = 'true'; }, /emphasis: boolean/],
    ['white-layers', d => { d.neuralData.network.layers.pop(); }, /network.layers: expected 4-4/],
    ['white-layers', d => { d.neuralData.layerDescriptions[0].text = ' '; }, /layerDescriptions\[0\].text: nonempty/],
    ['white-neuron-formula', d => { d.neuralData.showFormula = false; }, /showFormula: true/],
    ['white-neuron-formula', d => { delete d.neuralData.formula.threshold; }, /formula.threshold: nonempty/],
    ['white-neuron-steps', d => { d.neuralData.calculationSteps.pop(); }, /calculationSteps: expected 3-3/],
    ['white-train-summary', d => { d.neuralData.visibleSteps = 5; }, /visibleSteps: integer 0-4/],
    ['white-train-summary', d => { d.neuralData.trainingSteps.pop(); }, /trainingSteps: expected 4/],
    ['white-train-summary', d => { d.neuralData.callouts[0].english = ''; }, /callouts\[0\].english: nonempty/],
    ['white-neuron', d => { delete d.imageAlt; }, /imageAlt: nonempty/],
    ['white-network', d => { d.imagePath = 'assets/../secret.png'; }, /imagePath must stay inside assets/]
  ]) {
    const changed = neuralFixture(kind);
    mutate(changed.slides[0]);
    assert.match(validateDeck(changed, sources).join('\n'), expected, kind);
  }
});

test('数字识别图拒绝无效像素、架构、权重与公式标记', () => {
  for (const [kind, mutate, expected] of [
    ['black-pixels', d => { d.neuralData.description = ''; }, /description: nonempty/],
    ['black-pixels', d => { d.neuralData.labels.dimension = []; }, /labels.dimension: text or nonempty text array/],
    ['black-pixels', d => { d.neuralData.grids.nine.pop(); }, /grids.nine: expected 784/],
    ['black-pixels', d => { d.neuralData.grids.nine[0] = 1.01; }, /grids.nine: expected 784/],
    ['black-pixels', d => { d.neuralData.grids.nine[0] = NaN; }, /grids.nine: expected 784/],
    ['black-network', d => { delete d.neuralData.architecture; }, /architecture: expected/],
    ['black-network', d => { d.neuralData.architecture[1] = 12; }, /architecture: expected/],
    ['black-weights', d => { d.neuralData.weights.pop(); }, /weights: expected 8 finite/],
    ['black-weighted-sum', d => { delete d.neuralData.formulaTokens; }, /formulaTokens: nonempty array/],
    ['black-feature-match', d => { d.neuralData.formulaTokens[0].color = 'red'; }, /color: unsupported/],
    ['black-bias-activation', d => { d.neuralData.formulaTokens[0].text = ' '; }, /formulaTokens\[0\].text: nonempty/],
    ['black-pixels', d => { d.neuralData.activations = { hidden1: [-0.1] }; }, /activations.hidden1: expected nonempty numbers in 0-1/]
  ]) {
    const changed = neuralFixture(kind);
    mutate(changed.slides[0]);
    assert.match(validateDeck(changed, sources).join('\n'), expected, kind);
  }
});

test('神经网络 SVG 标签、正文与辅助说明按文本转义', () => {
  const changed = neuralFixture();
  changed.slides[0].title = '<b>标题</b>';
  changed.slides[0].neuralData.lead[0].text = '<img src=x onerror="alert(1)">';
  changed.slides[0].neuralData.network.alt = '" onload="alert(1)';
  changed.slides[0].neuralData.network.layers[0] = 'A & B';
  const black = neuralFixture('black-pixels').slides[0];
  black.id = 'black-escape';
  black.neuralData.description = '<script>alert(1)</script>';
  black.neuralData.labels.pixelEquation = '<i>像素</i>';
  changed.slides.push(black);
  const html = renderDeck(changed, sources);
  for (const text of ['&lt;b&gt;标题&lt;/b&gt;', '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;', '&quot; onload=&quot;alert(1)', 'A &amp; B', '&lt;script&gt;alert(1)&lt;/script&gt;', '&lt;i&gt;像素&lt;/i&gt;']) assert.ok(html.includes(text), text);
  assert.ok(!html.includes('<img src=x'));
  assert.ok(!html.includes('<script>alert(1)</script>'));
  assert.ok(!html.includes('<i>像素</i>'));
});

test('演讲时长支持分钟小数并以秒数合计校验', () => {
  const changed = neuralFixture();
  changed.slides[0].timingSeconds = 61;
  changed.durationMinutes = 61 / 60;
  assert.deepEqual(validateDeck(changed, sources), []);
  changed.durationMinutes += 1e-9;
  assert.deepEqual(validateDeck(changed, sources), []);
  changed.durationMinutes += 1 / 60;
  assert.match(validateDeck(changed, sources).join('\n'), /durations must equal/);
  for (const durationMinutes of [0, '1', NaN, Infinity]) {
    changed.durationMinutes = durationMinutes;
    assert.match(validateDeck(changed, sources).join('\n'), /durationMinutes: number >= 1 required/);
  }
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

test('合并稿保持模块顺序、来源与讲稿，全部布局可渲染', () => {
  assert.deepEqual(full.slides.slice(0, 15).map(slide => slide.id), ['opening', 'ai-definition', 'history', 'wave-product-rules', 'wave-product-ml', 'wave-product-dl', 'wave-product-dl-control', 'wave-product-llm', 'wave-product-imagegen', 'wave-product-videogen', 'wave-product-audiogen', 'wave-product-3dgen', 'wave-product-embodied', 'wave-product-science', 'ai-relationships']);
  assert.equal(full.slides.slice(0, 15).reduce((n,s) => n+s.timingSeconds,0), 960);
  assert.ok(Math.abs(full.slides.reduce((n,s) => n+s.timingSeconds,0) - full.durationMinutes * 60) < 1e-6);
  const neuralSlides = full.slides.filter(s => s.layout === 'neural');
  assert.equal(neuralSlides.length, 14);
  assert.deepEqual(neuralSlides.map(slide => slide.neuralKind), ["white-neuron","white-layers","white-neuron-steps","black-network","black-pixels","black-recognition","black-strokes","black-features","black-pixel-neuron","black-feature-match","black-sigmoid","black-bias-activation","black-parameters","white-train-summary"]);
  assert.equal(full.slides.slice(0, 29).reduce((sum, slide) => sum + slide.timingSeconds, 0), 1845);
  assert.equal(full.slides[15].neuralKind, 'white-neuron');
  assert.equal(neuralSlides.at(-1).neuralKind, 'white-train-summary');
  for (const slide of neuralSlides) {
    assert.equal(slide.layout, 'neural');
    assert.ok(slide.evidencePaths.some(path => path.includes('/003/')));
  }
  const llmSlides = full.slides.filter(s => s.layout === 'llm');
  assert.ok(llmSlides.length > 0);
  assert.equal(llmSlides[0].llmKind, 'embedding-definition');
  assert.equal(llmSlides.at(-1).llmKind, 'context-shift');
  for (const slide of llmSlides) {
    assert.equal(slide.layout, 'llm');
    assert.equal(slide.theme, 'reinbee');
    assert.equal(slide.chapter, '03');
    assert.equal(slide.section, '大语言模型');
    assert.ok(slide.logoPath && slide.logoAlt);
    assert.ok(slide.evidencePaths.some(path => path.includes('/004/')));
  }
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
  assert.equal((html.match(/<section class="slide/g)||[]).length,full.slides.length);
  assert.equal((html.match(/data-speaker-notes/g)||[]).length,full.slides.length);
  for(const s of full.slides) assert.ok(html.includes(s.id));
  assert.ok(!html.includes('undefined'));
  assert.ok(full.slides.some(s=>s.evidencePaths?.some(p=>p.includes('/002/'))));
});

test('当前演讲拒绝关系图缺失正文、不安全证据路径和不一致时长', () => {
  const d=structuredClone(full);
  const relationship=d.slides.find(s=>s.id==='ai-relationships');
  relationship.relations[0].capability='';
  relationship.evidencePaths=['assets/../secret.jpg'];
  d.slides[0].timingSeconds++;
  const errors=validateDeck(d,sources).join('\n');
  assert.match(errors,/relations\[0\].capability: nonempty text required/);
  assert.match(errors,/must stay inside assets/);assert.match(errors,/durations must equal/);
});

test('大模型应用追加在完整LLM模块之后，保留视频顺序、讲稿和来源', () => {
  const slides = full.slides.slice(44, 52);
  assert.equal(slides.length, 8);
  assert.equal(full.slides[43].llmKind, 'context-shift');
  assert.deepEqual(slides.map(slide => slide.applicationKind), [
    'relationship', 'chatbot', 'generation', 'responsibilities',
    'comparison', 'hybrid', 'sequence', 'summary',
  ]);
  assert.equal(slides.reduce((sum, slide) => sum + slide.timingSeconds, 0), 750);
  assert.equal(full.slides.slice(0, 44).reduce((sum, slide) => sum + slide.timingSeconds, 0), 3075);
  for (const slide of slides) {
    assert.equal(slide.layout, 'application');
    assert.equal(slide.chapter, '04');
    assert.equal(slide.theme, 'reinbee');
    assert.ok(slide.sourceIds.includes('video-apps'));
    assert.ok(slide.evidencePaths.some(path => path.includes('/005/')));
    assert.ok(slide.notes.length >= 3);
    assert.ok(slide.notes.join('').length >= 180);
  }
  const notes = speakerNotes(full, sources).slice(44, 52);
  assert.deepEqual(notes.map(note => note.page), [45, 46, 47, 48, 49, 50, 51, 52]);
  assert.ok(notes.every(note => note.sources.every(source => source?.verifiedOn)));
});

test('大模型应用拒绝损坏的消息、比较表和API参与者引用', () => {
  const make = kind => ({
    title: '应用内容契约',
    slides: [structuredClone(full.slides.find(slide => slide.applicationKind === kind))],
  });
  for (const [kind, mutate, expected] of [
    ['relationship', s => { delete s.applicationData.model; }, /model.title: nonempty/],
    ['chatbot', s => { s.applicationData.messages[0] = null; }, /messages\[0\].role: nonempty/],
    ['generation', s => { s.applicationData.outputTokens = []; }, /outputTokens: expected/],
    ['responsibilities', s => { delete s.applicationData.app.items; }, /app.items: expected/],
    ['comparison', s => { s.applicationData.rows[0].pop(); }, /rows\[0\]: expected/],
    ['hybrid', s => { s.applicationData.steps.pop(); }, /steps: expected/],
    ['sequence', s => { s.applicationData.events[0].to = 3; }, /participant index 0-2/],
    ['sequence', s => { s.applicationData.events[0].tone = 'red'; }, /unsupported tone/],
    ['summary', s => { s.applicationData.questions[0].answer = ''; }, /answer: nonempty/],
    ['summary', s => { s.chapter = '03'; }, /application requires 04/],
    ['summary', s => { s.applicationData = null; }, /applicationData: object required/],
  ]) {
    const changed = make(kind);
    mutate(changed.slides[0]);
    assert.match(validateDeck(changed, sources).join('\n'), expected, kind);
    assert.throws(() => renderDeck(changed, sources), expected);
  }
  const changed = make('summary');
  changed.slides[0].layout = 'bullets';
  changed.slides[0].bullets = ['正文'];
  assert.match(validateDeck(changed, sources).join('\n'), /applicationKind and applicationData require application layout/);
});

test('应用图示中的教学文字均转义，讲稿保持隐藏', () => {
  const changed = { title: '应用转义', slides: structuredClone(full.slides.slice(44, 52)) };
  const marker = '<img src=x onerror="alert(1)">';
  changed.slides[0].applicationData.model.title = marker;
  changed.slides[1].applicationData.messages[0].text = marker;
  changed.slides[2].applicationData.outputTokens[0] = marker;
  changed.slides[3].applicationData.app.items[0].text = marker;
  changed.slides[4].applicationData.rows[0][1] = marker;
  changed.slides[5].applicationData.resultText = marker;
  changed.slides[6].applicationData.events[0].label = marker;
  changed.slides[7].applicationData.questions[0].answer = marker;
  const html = renderDeck(changed, sources);
  assert.ok(!html.includes(marker));
  assert.equal((html.match(/&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt;/g) || []).length, 8);
  assert.equal((html.match(/<template data-speaker-notes>/g) || []).length, 8);
  assert.equal((html.match(/ application-page/g) || []).length, 8);
  assert.ok(!html.includes('undefined'));
});

test('Agent章节保留七个原理概念、讲稿及可追溯证据', () => {
  const slides = full.slides.slice(52, 59);
  assert.equal(slides.length, 7);
  assert.deepEqual(slides.map(slide => slide.agentKind), ['weather', 'setup', 'loop', 'schema', 'messages', 'sequence', 'safeguards']);
  assert.equal(slides.reduce((sum, slide) => sum + slide.timingSeconds, 0), 690);
  assert.deepEqual(validateDeck(full, sources), []);
  for (const slide of slides) {
    assert.equal(slide.layout, 'agent');
    assert.equal(slide.chapter, '05');
    assert.equal(slide.theme, 'reinbee');
    assert.ok(slide.sourceIds.includes('video-agent'));
    assert.ok(slide.evidencePaths.length > 0);
    assert.ok(slide.notes.length >= 3);
  }
  const notes = speakerNotes(full, sources).slice(52, 59);
  assert.deepEqual(notes.map(note => note.page), [53, 54, 55, 56, 57, 58, 59]);
  assert.ok(slides.every(slide => /模拟|固定返回/.test(JSON.stringify(slide))));
  assert.match(slides[4].notes.join('\n'), /tool_call_id/);
  assert.match(slides[5].notes.join('\n'), /执行/);
});

test('Agent内容结构损坏时在绘图前给出具体错误', () => {
  const make = kind => ({ title: 'Agent契约', slides: [structuredClone(full.slides.find(slide => slide.agentKind === kind))] });
  for (const [kind, mutate, expected] of [
    ['weather', s => { s.agentData.paths[0].steps.pop(); }, /steps: expected/],
    ['setup', s => { s.agentData.codeLines = []; }, /codeLines: expected/],
    ['loop', s => { s.agentData.model = null; }, /model.label: nonempty/],
    ['schema', s => { s.agentData.fields[0].value = ''; }, /value: nonempty/],
    ['messages', s => { s.agentData.rows[1].lines = null; }, /lines: expected/],
    ['sequence', s => { s.agentData.events[0].from = 3; }, /participant index 0-2/],
    ['sequence', s => { s.agentData.events[0].tone = 'red'; }, /unsupported tone/],
    ['safeguards', s => { s.agentData.items[1] = null; }, /title: nonempty/],
    ['safeguards', s => { s.chapter = '04'; }, /agent requires 05/],
    ['safeguards', s => { s.agentData = null; }, /agentData: object required/],
  ]) {
    const changed = make(kind);
    mutate(changed.slides[0]);
    assert.match(validateDeck(changed, sources).join('\n'), expected, kind);
    assert.throws(() => renderDeck(changed, sources), expected);
  }
  const changed = make('safeguards');
  changed.slides[0].layout = 'bullets';
  changed.slides[0].bullets = ['内容'];
  assert.match(validateDeck(changed, sources).join('\n'), /agentKind and agentData require agent layout/);
});

test('Agent代码、消息和图示文本安全转义，完整讲稿留在备注', () => {
  const changed = { title: 'Agent转义', slides: structuredClone(full.slides.slice(52, 59)) };
  const marker = '<img src=x onerror="alert(1)">';
  changed.slides[0].agentData.paths[0].title = marker;
  changed.slides[1].agentData.codeLines[0] = marker;
  changed.slides[2].agentData.model.questions[0] = marker;
  changed.slides[3].agentData.fields[0].value = marker;
  changed.slides[4].agentData.rows[0].lines[0] = marker;
  changed.slides[5].agentData.events[0].label = marker;
  changed.slides[6].agentData.items[0].title = marker;
  const html = renderDeck(changed, sources);
  assert.ok(!html.includes(marker));
  assert.equal((html.match(/&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt;/g) || []).length, 7);
  assert.equal((html.match(/<template data-speaker-notes>/g) || []).length, 7);
  assert.equal((html.match(/ agent-page/g) || []).length, 7);
  assert.ok(!html.includes('undefined'));
});

test('Harness章节承接Agent，六个工程概念均关联已核验来源', () => {
  const slides = full.slides.slice(59, 65);
  assert.equal(slides.length, 6);
  assert.deepEqual(slides.map(slide => slide.harnessKind), ['anatomy', 'context', 'continuity', 'execution', 'improvement', 'case']);
  assert.equal(slides.reduce((sum, slide) => sum + slide.timingSeconds, 0), 600);
  assert.deepEqual(validateDeck(full, sources), []);
  for (const slide of slides) {
    assert.equal(slide.layout, 'harness');
    assert.equal(slide.chapter, '06');
    assert.equal(slide.theme, 'reinbee');
    assert.ok(slide.sourceIds.length >= 2);
    assert.ok(slide.sourceIds.every(id => id.startsWith('harness-')));
    assert.ok(slide.notes.length >= 4);
  }
  assert.deepEqual(speakerNotes(full, sources).slice(59, 65).map(note => note.page), [60, 61, 62, 63, 64, 65]);
  assert.match(JSON.stringify(slides[5]), /教学示例|教学示意/);
});

test('Harness拒绝缺失状态、错误循环结构与无效比较行', () => {
  const make = kind => ({ title: 'Harness契约', slides: [structuredClone(full.slides.find(slide => slide.harnessKind === kind))] });
  for (const [kind, mutate, expected] of [
    ['anatomy', s => { s.harnessData.model = null; }, /model.label: nonempty/],
    ['anatomy', s => { s.harnessData.parts.pop(); }, /parts: expected 4/],
    ['context', s => { s.harnessData.window.text = ''; }, /window.text: nonempty/],
    ['continuity', s => { s.harnessData.record.items = null; }, /record.items: expected 3/],
    ['execution', s => { s.harnessData.controls[0] = null; }, /controls\[0\].label: nonempty/],
    ['improvement', s => { s.harnessData.outer.steps.pop(); }, /outer.steps: expected 5/],
    ['case', s => { s.harnessData.rows[0].evidence = ''; }, /evidence: nonempty/],
    ['case', s => { delete s.chapter; }, /harness requires 06/],
    ['case', s => { delete s.sourceLabel; }, /sourceLabel: nonempty/],
    ['case', s => { s.harnessData = []; }, /harnessData: object required/],
  ]) {
    const changed = make(kind);
    mutate(changed.slides[0]);
    assert.match(validateDeck(changed, sources).join('\n'), expected, kind);
    assert.throws(() => renderDeck(changed, sources), expected);
  }
  const changed = make('case');
  changed.slides[0].layout = 'bullets';
  changed.slides[0].bullets = ['内容'];
  assert.match(validateDeck(changed, sources).join('\n'), /harnessKind and harnessData require harness layout/);
});

test('Harness嵌套文本安全转义且讲稿不成为投屏正文', () => {
  const changed = { title: 'Harness转义', slides: structuredClone(full.slides.slice(59, 65)) };
  const marker = '<img src=x onerror="alert(1)">';
  changed.slides[0].harnessData.parts[0].text = marker;
  changed.slides[1].harnessData.window.text = marker;
  changed.slides[2].harnessData.record.items[0] = marker;
  changed.slides[3].harnessData.controls[0].text = marker;
  changed.slides[4].harnessData.outer.steps[0] = marker;
  changed.slides[5].harnessData.rows[0].evidence = marker;
  const html = renderDeck(changed, sources);
  assert.ok(!html.includes(marker));
  assert.equal((html.match(/&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt;/g) || []).length, 6);
  assert.equal((html.match(/<template data-speaker-notes>/g) || []).length, 6);
  assert.equal((html.match(/ harness-page/g) || []).length, 6);
  assert.ok(!html.includes('undefined'));
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
