import { validateApplication } from './validate-application.mjs';
import { validateAgent } from './validate-agent.mjs';
import { validateHarness } from './validate-harness.mjs';
import { validateRobot } from './validate-robot.mjs';

const layouts = new Set(['cover', 'loop', 'comparison', 'spotlight', 'closing', 'bullets', 'duo', 'table', 'timeline', 'definition', 'waves', 'product', 'gallery', 'relationship', 'neural', 'llm', 'application', 'agent', 'harness', 'robot', 'process', 'example', 'image', 'diagram']);
const tones = new Set(['blue', 'orange', 'green']);
const themes = new Set(['reinbee', 'neural-light', 'neural-dark']);
const whiteKinds = new Set(['white-neuron', 'white-network', 'white-layers', 'white-neuron-detail', 'white-neuron-formula', 'white-neuron-steps', 'white-backprop-history', 'white-train-forward', 'white-train-loss', 'white-train-backward', 'white-train-update', 'white-train-summary']);
const blackKinds = new Set(['black-network', 'black-pixels', 'black-recognition', 'black-strokes', 'black-features', 'black-pixel-neuron', 'black-feature-detector', 'black-weights', 'black-weighted-sum', 'black-feature-match', 'black-sigmoid', 'black-bias-activation', 'black-parameters']);
const llmAttentionKinds = new Set(['attention-context', 'attention-intro', 'attention-base-vector', 'attention-singing', 'attention-composite', 'transformer-attention', 'transformer-stack', 'transformer-softmax']);
const llmEmbeddingKinds = new Set(['embedding-definition', 'embedding-tokens', 'embedding-single', 'embedding-2d', 'embedding-3d', 'embedding-high-d', 'embedding-cloud', 'embedding-royalty', 'embedding-parents', 'embedding-offset', 'embedding-arithmetic']);
const llmGenerationKinds = new Set(['generation-distribution', 'generation-temperature', 'generation-selected', 'generation-append', 'generation-repeat', 'generation-english', 'scale-public', 'scale-capabilities', 'context-matrix', 'context-window', 'context-shift']);
const waveIcons = new Set(['rules', 'learning', 'network', 'language', 'deepseek']);
const relationRoutes = new Set(['rules', 'learning', 'deep']);
const nonempty = value => typeof value === 'string' && value.trim().length > 0;
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);

export function validateDeck(deck, sources) {
  const errors = [];
  const requireText = (value, label) => { if (!nonempty(value)) errors.push(`${label}: nonempty text required`); };
  requireText(deck?.title, 'title');
  if (!Array.isArray(deck?.slides) || !deck.slides.length) return [...errors, 'slides: nonempty array required'];
  const sourceMap = new Map((Array.isArray(sources?.sources) ? sources.sources : Array.isArray(sources) ? sources : []).map(s => [s.id, s]));
  const ids = new Set();
  for (const slide of deck.slides) {
    if (!slide || typeof slide !== 'object') { errors.push('slide: object required'); continue; }
    const label = slide.id || 'slide';
    for (const key of ['id', 'title', 'section']) requireText(slide[key], `${label}.${key}`);
    if (ids.has(slide.id)) errors.push(`${label}: duplicate id`);
    ids.add(slide.id);
    if (!layouts.has(slide.layout)) errors.push(`${label}: unsupported layout ${slide.layout}`);
    if (slide.theme !== undefined && !themes.has(slide.theme)) errors.push(`${label}.theme: unsupported theme`);
    if (['neural-light', 'neural-dark'].includes(slide.theme) && slide.layout !== 'neural') errors.push(`${label}.theme: neural themes require neural layout`);
    if (slide.layout !== 'neural' && (slide.neuralKind !== undefined || slide.neuralData !== undefined)) errors.push(`${label}: neuralKind and neuralData require neural layout`);
    if (slide.layout !== 'llm' && (slide.llmKind !== undefined || slide.llmData !== undefined)) errors.push(`${label}: llmKind and llmData require llm layout`);
    if (slide.layout !== 'application' && (slide.applicationKind !== undefined || slide.applicationData !== undefined)) errors.push(`${label}: applicationKind and applicationData require application layout`);
    if (slide.layout === 'application') errors.push(...validateApplication(slide));
    if (slide.layout !== 'agent' && (slide.agentKind !== undefined || slide.agentData !== undefined)) errors.push(`${label}: agentKind and agentData require agent layout`);
    if (slide.layout === 'agent') errors.push(...validateAgent(slide));
    if (slide.layout !== 'harness' && (slide.harnessKind !== undefined || slide.harnessData !== undefined)) errors.push(`${label}: harnessKind and harnessData require harness layout`);
    if (slide.layout === 'harness') errors.push(...validateHarness(slide));
    if (slide.layout !== 'robot' && (slide.robotKind !== undefined || slide.robotData !== undefined)) errors.push(`${label}: robotKind and robotData require robot layout`);
    if (slide.layout === 'robot') errors.push(...validateRobot(slide));
    if (!Array.isArray(slide.notes) || !slide.notes.length || slide.notes.some(n => !nonempty(n))) errors.push(`${label}: notes required`);
    if (!Array.isArray(slide.sourceIds) || (!slide.sourceIds.length && slide.contentKind !== 'presentation-plan')) errors.push(`${label}: sourceIds required`);
    else for (const id of slide.sourceIds) {
      const source = sourceMap.get(id);
      if (!source) errors.push(`${label}: unknown source ${id}`);
      else if (!/^https?:\/\//.test(source.url || '') || !/^\d{4}-\d{2}-\d{2}$/.test(source.verifiedOn || '')) errors.push(`${label}: source ${id} missing URL or verification date`);
    }
    for (const key of ['presenter', 'reportDate', 'robotModel']) {
      if (slide[key] !== undefined) {
        requireText(slide[key], `${label}.${key}`);
        if (slide.layout !== 'cover') errors.push(`${label}.${key}: only supported on cover slides`);
      }
    }
    if ((slide.presenter !== undefined) !== (slide.reportDate !== undefined)) errors.push(`${label}: presenter and reportDate must be supplied together`);
    if (slide.reportDate !== undefined && !/^\d{4}\.(0[1-9]|1[0-2])$/.test(slide.reportDate)) errors.push(`${label}.reportDate: expected YYYY.MM with month 01-12`);
    if (slide.layout === 'cover') {
      for (const key of ['eyebrow', 'subtitle', 'brand', 'imagePath', 'imageAlt', 'imageCredit']) requireText(slide[key], `${label}.${key}`);
      if (!/^assets\/[\w\s\u0080-\uFFFF./-]+$/.test(slide.imagePath || '') || slide.imagePath.split('/').includes('..')) errors.push(`${label}: imagePath must stay inside assets`);
    } else if (layouts.has(slide.layout)) {
      for (const key of ['chapter', 'sectionLabel', 'eyebrow', 'sourceLabel']) requireText(slide[key], `${label}.${key}`);
      if (typeof slide.subtitle !== 'string') errors.push(`${label}.subtitle: text required`);
    }
    if (slide.logoPath !== undefined) {
      requireText(slide.logoPath, `${label}.logoPath`);
      requireText(slide.logoAlt, `${label}.logoAlt`);
      if (typeof slide.logoPath !== 'string' || !/^assets\/[\w\s\u0080-\uFFFF./-]+$/.test(slide.logoPath) || slide.logoPath.split('/').includes('..')) errors.push(`${label}: logoPath must stay inside assets`);
    }
    for (const key of ['detailImagePath', 'detailImageAlt']) {
      if (slide[key] !== undefined) requireText(slide[key], `${label}.${key}`);
    }
    if ((slide.detailImagePath !== undefined) !== (slide.detailImageAlt !== undefined)) errors.push(`${label}: detailImagePath and detailImageAlt must be supplied together`);
    if (slide.layout === 'loop') {
      for (const key of ['model', 'modelCaption', 'feedback', 'condition']) requireText(slide[key], `${label}.${key}`);
      for (const [name, count] of [['inputs', 3], ['outputs', 2]]) {
        if (!Array.isArray(slide[name]) || slide[name].length !== count) errors.push(`${label}.${name}: expected ${count} items`);
        else for (const item of slide[name]) {
          requireText(item?.label, `${label}.${name}.label`); requireText(item?.text, `${label}.${name}.text`);
          if (!tones.has(item?.tone)) errors.push(`${label}.${name}: unknown tone`);
        }
      }
    }
    if (slide.layout === 'comparison') {
      for (const key of ['exampleLabel', 'example']) requireText(slide[key], `${label}.${key}`);
      if (!Array.isArray(slide.steps) || slide.steps.length !== 3) errors.push(`${label}: expected three steps`);
      else slide.steps.forEach(s => { requireText(s?.label, `${label}.steps.label`); requireText(s?.text, `${label}.steps.text`); });
      if (!Array.isArray(slide.headers) || slide.headers.length !== 3 || slide.headers.some(h => !nonempty(h))) errors.push(`${label}: expected three table headers`);
      if (!Array.isArray(slide.rows) || !slide.rows.length || slide.rows.some(r => !Array.isArray(r) || r.length !== 3 || r.some(c => !nonempty(c)))) errors.push(`${label}: table row must have three text cells`);
      if (!Array.isArray(slide.takeaways) || slide.takeaways.length !== 2) errors.push(`${label}: expected two takeaways`);
      else slide.takeaways.forEach(t => { requireText(t?.title, `${label}.takeaways.title`); requireText(t?.text, `${label}.takeaways.text`); if (!tones.has(t?.tone)) errors.push(`${label}: unknown tone`); });
    }
    const textArray = (items, name, min = 1, max = 4) => {
      if (!Array.isArray(items) || items.length < min || items.length > max || items.some(x => !nonempty(x))) errors.push(`${label}.${name}: expected ${min}-${max} text items`);
    };
    for (const file of [slide.imagePath, slide.detailImagePath, ...(slide.evidencePaths ?? [])].filter(Boolean)) {
      if (!/^assets\/[\w\s\u0080-\uFFFF./-]+$/.test(file) || file.split('/').includes('..')) errors.push(`${label}: imagePath must stay inside assets`);
    }
    if (slide.timingSeconds !== undefined && (!Number.isInteger(slide.timingSeconds) || slide.timingSeconds < 1)) errors.push(`${label}: invalid timingSeconds`);
    if (['spotlight', 'closing', 'bullets'].includes(slide.layout)) textArray(slide.bullets, 'bullets');
    if (slide.layout === 'spotlight') requireText(slide.lead, `${label}.lead`);
    if (slide.layout === 'duo') {
      if (!Array.isArray(slide.columns) || slide.columns.length !== 2) errors.push(`${label}: expected two columns`);
      else slide.columns.forEach(c => { requireText(c.title, `${label}.column.title`); textArray(c.bullets, 'column.bullets'); });
    }
    if (slide.layout === 'table') {
      textArray(slide.headers, 'headers', 2, 5);
      if (!Array.isArray(slide.rows) || slide.rows.length < 1 || slide.rows.length > 6 || slide.rows.some(r => !Array.isArray(r) || r.length !== slide.headers?.length || r.some(c => !nonempty(c)))) errors.push(`${label}: table column mismatch or invalid rows`);
    }
    if (slide.layout === 'definition') requireText(slide.definition, `${label}.definition`);
    if (slide.layout === 'neural') {
      const kind = slide.neuralKind;
      if (!whiteKinds.has(kind) && !blackKinds.has(kind)) errors.push(`${label}.neuralKind: unsupported neural kind`);
      if (!['neural-light', 'neural-dark'].includes(slide.theme)) errors.push(`${label}.theme: neural-light or neural-dark required`);
      if ((whiteKinds.has(kind) && slide.theme !== 'neural-light') || (blackKinds.has(kind) && slide.theme !== 'neural-dark')) errors.push(`${label}.theme: theme does not match neuralKind`);
      const data = slide.neuralData;
      if (!isObject(data)) errors.push(`${label}.neuralData: object required`);
      else if (whiteKinds.has(kind)) {
        if (!Array.isArray(data.lead) || !data.lead.length) errors.push(`${label}.neuralData.lead: nonempty array required`);
        else data.lead.forEach((segment, i) => {
          requireText(segment?.text, `${label}.neuralData.lead[${i}].text`);
          for (const key of ['emphasis', 'bold']) if (segment?.[key] !== undefined && typeof segment[key] !== 'boolean') errors.push(`${label}.neuralData.lead[${i}].${key}: boolean required`);
        });
        for (const name of ['network', 'neuron']) {
          if (!isObject(data[name])) errors.push(`${label}.neuralData.${name}: object required`);
        }
        for (const key of ['alt', 'output']) requireText(data.network?.[key], `${label}.neuralData.network.${key}`);
        textArray(data.network?.layers, 'neuralData.network.layers', 4, 4);
        textArray(data.network?.inputs, 'neuralData.network.inputs', 3, 3);
        textArray(data.network?.weights, 'neuralData.network.weights', 6, 6);
        for (const key of ['alt', 'sumSymbol', 'activationSymbol', 'output']) requireText(data.neuron?.[key], `${label}.neuralData.neuron.${key}`);
        textArray(data.neuron?.inputs, 'neuralData.neuron.inputs', 4, 4);
        textArray(data.neuron?.weights, 'neuralData.neuron.weights', 4, 4);
        textArray(data.neuron?.labels, 'neuralData.neuron.labels', 5, 5);
        const pairs = (items, name, count) => {
          if (!Array.isArray(items) || items.length !== count) errors.push(`${label}.neuralData.${name}: expected ${count} items`);
          else items.forEach((item, i) => { for (const key of ['label', 'text']) requireText(item?.[key], `${label}.neuralData.${name}[${i}].${key}`); });
        };
        if (['white-neuron', 'white-network'].includes(kind)) for (const key of ['imagePath', 'imageAlt']) requireText(slide[key], `${label}.${key}`);
        if (['white-layers', 'white-neuron-detail', 'white-neuron-formula', 'white-neuron-steps'].includes(kind)) pairs(data.layerDescriptions, 'layerDescriptions', 3);
        if (['white-neuron-formula', 'white-neuron-steps'].includes(kind)) {
          if (data.showFormula !== true) errors.push(`${label}.neuralData.showFormula: true required`);
          for (const key of ['alt', 'result', 'activation', 'index', 'upper', 'weight', 'input', 'threshold']) requireText(data.formula?.[key], `${label}.neuralData.formula.${key}`);
        }
        if (kind === 'white-neuron-steps') for (const key of ['calculationSteps', 'stepNumbers']) textArray(data[key], `neuralData.${key}`, 3, 3);
        if (kind === 'white-backprop-history' || kind.startsWith('white-train-')) {
          if (!Number.isInteger(data.visibleSteps) || data.visibleSteps < 0 || data.visibleSteps > 4) errors.push(`${label}.neuralData.visibleSteps: integer 0-4 required`);
          requireText(data.flowIntro, `${label}.neuralData.flowIntro`);
          pairs(data.trainingSteps, 'trainingSteps', 4);
        }
        if (kind === 'white-train-summary') {
          if (data.showCallouts !== true) errors.push(`${label}.neuralData.showCallouts: true required`);
          if (!Array.isArray(data.callouts) || data.callouts.length !== 2) errors.push(`${label}.neuralData.callouts: expected 2 items`);
          else data.callouts.forEach((item, i) => { for (const key of ['alt', 'label', 'english']) requireText(item?.[key], `${label}.neuralData.callouts[${i}].${key}`); });
        } else if (data.showCallouts !== undefined && typeof data.showCallouts !== 'boolean') errors.push(`${label}.neuralData.showCallouts: boolean required`);
      } else if (blackKinds.has(kind)) {
        requireText(data.description, `${label}.neuralData.description`);
        if (!isObject(data.labels)) errors.push(`${label}.neuralData.labels: object required`);
        else for (const [key, value] of Object.entries(data.labels)) {
          if (!(nonempty(value) || (Array.isArray(value) && value.length > 0 && value.every(nonempty)))) errors.push(`${label}.neuralData.labels.${key}: text or nonempty text array required`);
        }
        const unitArray = (value, name, count) => {
          if (!Array.isArray(value) || (count !== undefined && value.length !== count) || !value.length || value.some(n => typeof n !== 'number' || !Number.isFinite(n) || n < 0 || n > 1)) errors.push(`${label}.neuralData.${name}: expected ${count ?? 'nonempty'} numbers in 0-1`);
        };
        if (!isObject(data.grids)) errors.push(`${label}.neuralData.grids: object required`);
        else for (const [key, value] of Object.entries(data.grids)) unitArray(value, `grids.${key}`, 784);
        if (['black-network', 'black-recognition', 'black-features', 'black-parameters'].includes(kind) || data.architecture !== undefined) {
          if (!Array.isArray(data.architecture) || data.architecture.length !== 4 || data.architecture.some((n, i) => n !== [784, 16, 16, 10][i])) errors.push(`${label}.neuralData.architecture: expected [784,16,16,10]`);
        }
        if (kind === 'black-weights' || data.weights !== undefined) {
          if (!Array.isArray(data.weights) || data.weights.length !== 8 || data.weights.some(n => typeof n !== 'number' || !Number.isFinite(n))) errors.push(`${label}.neuralData.weights: expected 8 finite numbers`);
        }
        if (['black-weighted-sum', 'black-feature-match', 'black-bias-activation'].includes(kind) || data.formulaTokens !== undefined) {
          if (!Array.isArray(data.formulaTokens) || !data.formulaTokens.length) errors.push(`${label}.neuralData.formulaTokens: nonempty array required`);
          else data.formulaTokens.forEach((token, i) => {
            requireText(token?.text, `${label}.neuralData.formulaTokens[${i}].text`);
            if (token?.color !== undefined && !['white', 'green', 'yellow'].includes(token.color)) errors.push(`${label}.neuralData.formulaTokens[${i}].color: unsupported color`);
          });
        }
        if (data.activations !== undefined) {
          if (!isObject(data.activations)) errors.push(`${label}.neuralData.activations: object required`);
          else for (const [key, value] of Object.entries(data.activations)) {
            if (!['input', 'hidden1', 'hidden2', 'output'].includes(key)) errors.push(`${label}.neuralData.activations.${key}: unsupported layer`);
            unitArray(value, `activations.${key}`);
          }
        }
      }
    }
    if (slide.layout === 'llm') {
      const kind = slide.llmKind, data = slide.llmData;
      if (![llmEmbeddingKinds, llmAttentionKinds, llmGenerationKinds].some(kinds => kinds.has(kind))) errors.push(`${label}.llmKind: unsupported llm kind`);
      if (slide.theme !== 'reinbee') errors.push(`${label}.theme: llm requires reinbee`);
      if (slide.chapter !== '03') errors.push(`${label}.chapter: llm requires chapter 03`);
      for (const key of ['section', 'sectionLabel']) if (slide[key] !== '大语言模型') errors.push(`${label}.${key}: llm requires 大语言模型`);
      for (const key of ['logoPath', 'logoAlt']) requireText(slide[key], `${label}.${key}`);
      const llmItems = (items, name, min, max, inspect) => {
        if (!Array.isArray(items) || items.length < min || items.length > max) errors.push(`${label}.llmData.${name}: expected ${min}-${max} items`);
        else items.forEach((item, i) => inspect(item, `${name}[${i}]`));
      };
      const llmText = (value, name) => requireText(value, `${label}.llmData.${name}`);
      const llmPoint = (value, name, count) => {
        if (!Array.isArray(value) || value.length !== count || value.some(n => typeof n !== 'number' || !Number.isFinite(n))) errors.push(`${label}.llmData.${name}: expected ${count} finite numbers`);
      };
      const llmTone = (value, name) => {
        if (value !== undefined && !['blue', 'yellow', 'ink'].includes(value)) errors.push(`${label}.llmData.${name}: unsupported tone`);
      };
      if (!isObject(data)) errors.push(`${label}.llmData: object required`);
      else if (llmEmbeddingKinds.has(kind)) {
        llmItems(data.lead, 'lead', 0, Infinity, (item, name) => { llmText(item?.text, `${name}.text`); llmTone(item?.tone, `${name}.tone`); });
        llmItems(data.bullets, 'bullets', 0, Infinity, (item, name) => { for (const key of ['label', 'text']) llmText(item?.[key], `${name}.${key}`); });
        if (typeof data.qualifier !== 'string') errors.push(`${label}.llmData.qualifier: text required`);
        if (['embedding-tokens', 'embedding-single', 'embedding-2d', 'embedding-3d', 'embedding-high-d'].includes(kind)) {
          llmItems(data.tokens, 'tokens', 8, 8, (item, name) => { llmText(item?.text, `${name}.text`); textArray(item?.values, `llmData.${name}.values`, 1, Infinity); });
          if (!Number.isInteger(data.selectedToken) || data.selectedToken < 0 || data.selectedToken >= (data.tokens?.length ?? 0)) errors.push(`${label}.llmData.selectedToken: valid token index required`);
        }
        if (['embedding-2d', 'embedding-3d', 'embedding-high-d'].includes(kind)) {
          const count = kind === 'embedding-2d' ? 1 : 2;
          llmItems(data.coordinateExamples, 'coordinateExamples', count, count, (item, name) => {
            if (![2, 3].includes(item?.dimensions)) errors.push(`${label}.llmData.${name}.dimensions: expected 2 or 3`);
            llmPoint(item?.values, `${name}.values`, item?.dimensions);
            llmText(item?.vectorLabel, `${name}.vectorLabel`);
            textArray(item?.axisLabels, `llmData.${name}.axisLabels`, item?.dimensions ?? 2, item?.dimensions ?? 3);
          });
        }
        if (kind === 'embedding-high-d') for (const key of ['dimensionLabel', 'dimensionCaption']) llmText(data[key], key);
        if (kind === 'embedding-cloud') {
          if (!isObject(data.cloud)) errors.push(`${label}.llmData.cloud: object required`);
          llmItems(data.cloud?.words, 'cloud.words', 1, Infinity, (item, name) => {
            llmText(item?.text, `${name}.text`); llmPoint(item?.point, `${name}.point`, 3); llmPoint(item?.labelOffset, `${name}.labelOffset`, 2); llmTone(item?.tone, `${name}.tone`);
          });
          textArray(data.cloud?.axisLabels, 'llmData.cloud.axisLabels', 3, 3);
          llmText(data.cloud?.caption, 'cloud.caption');
        }
        if (['embedding-royalty', 'embedding-parents', 'embedding-offset', 'embedding-arithmetic'].includes(kind)) {
          const analogy = data.analogy;
          if (!isObject(analogy)) errors.push(`${label}.llmData.analogy: object required`);
          const keys = new Set();
          llmItems(analogy?.vectors, 'analogy.vectors', 4, 4, (item, name) => {
            for (const key of ['key', 'label']) llmText(item?.[key], `${name}.${key}`);
            if (keys.has(item?.key)) errors.push(`${label}.llmData.${name}.key: duplicate vector key`);
            keys.add(item?.key);
            llmPoint(item?.point, `${name}.point`, 2); llmTone(item?.tone, `${name}.tone`);
          });
          llmItems(analogy?.differences, 'analogy.differences', 1, 2, (item, name) => {
            for (const key of ['from', 'to']) if (!nonempty(item?.[key]) || !keys.has(item[key])) errors.push(`${label}.llmData.${name}.${key}: known vector key required`);
          });
          llmItems(analogy?.formula, 'analogy.formula', 1, Infinity, (item, name) => { llmText(item?.text, `${name}.text`); llmTone(item?.tone, `${name}.tone`); });
          llmText(analogy?.qualifier, 'analogy.qualifier');
          if (typeof data.showOffsets !== 'boolean') errors.push(`${label}.llmData.showOffsets: boolean required`);
        }
      }
      else if (llmAttentionKinds.has(kind)) {
        requireText(data.description, `${label}.llmData.description`);
        if (data.qualifier !== undefined) requireText(data.qualifier, `${label}.llmData.qualifier`);
        if (kind === 'attention-context') {
          textArray(data.paragraphs, 'llmData.paragraphs', 4, 4);
          requireText(data.badge, `${label}.llmData.badge`);
        } else if (kind.startsWith('attention-')) {
          for (const key of ['lead', 'caption']) requireText(data[key], `${label}.llmData.${key}`);
          const count = { 'attention-intro': 1, 'attention-base-vector': 1, 'attention-singing': 2, 'attention-composite': 5 }[kind];
          if (!Array.isArray(data.vectors) || data.vectors.length !== count) errors.push(`${label}.llmData.vectors: expected ${count} items`);
          else data.vectors.forEach((item, i) => {
            const field = `${label}.llmData.vectors[${i}]`;
            requireText(item?.label, `${field}.label`);
            for (const key of ['from', 'to', 'labelPosition']) {
              if (!Array.isArray(item?.[key]) || item[key].length !== 2 || item[key].some(n => typeof n !== 'number' || !Number.isFinite(n))) errors.push(`${field}.${key}: expected 2 finite numbers`);
            }
            if (!['blue', 'yellow', 'gray'].includes(item?.tone)) errors.push(`${field}.tone: unsupported tone`);
            if (item?.dashed !== undefined && typeof item.dashed !== 'boolean') errors.push(`${field}.dashed: boolean required`);
          });
          if (kind === 'attention-composite') textArray(data.asciiRows, 'llmData.asciiRows', 1, Infinity);
        } else {
          for (const key of ['lead', 'caption', 'flowLabel']) requireText(data[key], `${label}.llmData.${key}`);
          textArray(data.embeddingRows, 'llmData.embeddingRows', 1, Infinity);
          const boardKinds = ['embedding', 'attention', 'mlp', 'attention', 'mlp', 'softmax'].slice(0, { 'transformer-attention': 2, 'transformer-stack': 5, 'transformer-softmax': 6 }[kind]);
          if (!Array.isArray(data.boards) || data.boards.length !== boardKinds.length) errors.push(`${label}.llmData.boards: expected ${boardKinds.length} items`);
          else data.boards.forEach((item, i) => {
            requireText(item?.label, `${label}.llmData.boards[${i}].label`);
            if (item?.kind !== boardKinds[i]) errors.push(`${label}.llmData.boards[${i}].kind: expected ${boardKinds[i]}`);
          });
          if (kind !== 'transformer-attention') requireText(data.ellipsis, `${label}.llmData.ellipsis`);
        }
      } else if (llmGenerationKinds.has(kind)) {
        for (const key of ['description', 'lead']) llmText(data[key], key);
        if (typeof data.caption !== 'string') errors.push(`${label}.llmData.caption: text required`);
        const probabilities = (items, name) => {
          llmItems(items, name, 6, 7, (item, itemName) => {
            llmText(item?.token, `${itemName}.token`);
            if (typeof item?.probability !== 'number' || !Number.isFinite(item.probability) || item.probability < 0 || item.probability > 1) errors.push(`${label}.llmData.${itemName}.probability: number in 0-1 required`);
          });
          if (Array.isArray(items) && Math.abs(items.reduce((sum, item) => sum + (typeof item?.probability === 'number' ? item.probability : 0), 0) - 1) > 1e-6) errors.push(`${label}.llmData.${name}: probabilities must sum to 1`);
        };
        if (kind === 'generation-temperature') {
          llmItems(data.temperatureCases, 'temperatureCases', 3, 3, (item, name) => {
            llmText(item?.label, `${name}.label`);
            if (typeof item?.temperature !== 'number' || !Number.isFinite(item.temperature) || item.temperature <= 0) errors.push(`${label}.llmData.${name}.temperature: positive number required`);
            probabilities(item?.probabilities, `${name}.probabilities`);
          });
          llmText(data.temperatureFormula, 'temperatureFormula');
        } else if (kind.startsWith('generation-')) {
          for (const key of ['modelLabel', 'stageLabel']) llmText(data[key], key);
          textArray(data.promptLines, 'llmData.promptLines', 1, 3);
          probabilities(data.probabilities, 'probabilities');
          if (data.selectedToken !== undefined) llmText(data.selectedToken, 'selectedToken');
          if (data.showFeedback !== undefined && typeof data.showFeedback !== 'boolean') errors.push(`${label}.llmData.showFeedback: boolean required`);
          if (data.showFeedback === true || data.feedbackLabel !== undefined) llmText(data.feedbackLabel, 'feedbackLabel');
        } else if (kind.startsWith('scale-')) {
          llmText(data.plotLabels?.parameterAxis, 'plotLabels.parameterAxis');
          textArray(data.tableHeaders, 'llmData.tableHeaders', 4, 4);
          llmText(data.tableCaption, 'tableCaption');
          llmItems(data.models, 'models', 3, 3, (item, name) => {
            for (const key of ['name', 'trainingTokens', 'dimension']) llmText(item?.[key], `${name}.${key}`);
            if (!Number.isInteger(item?.year) || item.year < 1) errors.push(`${label}.llmData.${name}.year: positive integer required`);
            if (typeof item?.parametersB !== 'number' || !Number.isFinite(item.parametersB) || item.parametersB <= 0) errors.push(`${label}.llmData.${name}.parametersB: positive number required`);
          });
        } else if (kind === 'context-matrix') {
          llmText(data.dimensionLabel, 'dimensionLabel');
          llmItems(data.vectors, 'vectors', 7, 7, (item, name) => {
            llmText(item?.token, `${name}.token`); textArray(item?.values, `llmData.${name}.values`, 7, 7);
          });
        } else {
          llmText(data.windowLabel, 'windowLabel');
          textArray(data.windowParagraphs, 'llmData.windowParagraphs', 3, 3);
          if (kind === 'context-shift' || data.excludedText !== undefined) llmText(data.excludedText, 'excludedText');
        }
      }
    }
    if (slide.layout === 'relationship') {
      for (const key of ['ai', 'rules', 'learning', 'traditional', 'deep']) requireText(slide.taxonomy?.[key], `${label}.taxonomy.${key}`);
      textArray(slide.columnLabels, 'columnLabels', 3, 3);
      if (!Array.isArray(slide.relations) || slide.relations.length !== 7) errors.push(`${label}.relations: expected 7 items`);
      else slide.relations.forEach((item, index) => {
        const relationLabel = `${label}.relations[${index}]`;
        if (!relationRoutes.has(item?.route)) errors.push(`${relationLabel}.route: unsupported relationship route`);
        requireText(item?.capability, `${relationLabel}.capability`);
        requireText(item?.scenarios, `${relationLabel}.scenarios`);
      });
    }
    if (slide.layout === 'gallery') {
      if (!Array.isArray(slide.images) || slide.images.length < 2 || slide.images.length > 5) errors.push(`${label}.images: expected 2-5 items`);
      else slide.images.forEach((item, index) => {
        const imageLabel = `${label}.images[${index}]`;
        requireText(item?.path, `${imageLabel}.path`);
        requireText(item?.alt, `${imageLabel}.alt`);
        if (typeof item?.path !== 'string' || !/^assets\/[\w\s\u0080-\uFFFF./-]+$/.test(item.path) || item.path.split('/').includes('..')) errors.push(`${imageLabel}.path: must stay inside assets`);
        for (const key of ['label', 'position']) if (item?.[key] !== undefined) requireText(item[key], `${imageLabel}.${key}`);
        if (item?.fit !== undefined && !['contain', 'cover'].includes(item.fit)) errors.push(`${imageLabel}.fit: expected contain or cover`);
      });
    }
    if (slide.layout === 'product') {
      for (const key of ['productName', 'productMeta', 'imagePath', 'imageAlt', 'imageCredit', 'caption']) requireText(slide[key], `${label}.${key}`);
      for (const name of ['facts', 'steps']) {
        if (!Array.isArray(slide[name]) || slide[name].length !== 3) errors.push(`${label}.${name}: expected 3 items`);
        else slide[name].forEach((item, index) => {
          requireText(item?.label, `${label}.${name}[${index}].label`);
          requireText(item?.text, `${label}.${name}[${index}].text`);
        });
      }
    }
    if (slide.layout === 'waves') {
      if (!Array.isArray(slide.eras) || slide.eras.length !== 4) errors.push(`${label}.eras: expected 4 items`);
      else slide.eras.forEach((era, index) => {
        for (const key of ['period', 'title', 'description', 'application', 'icon']) requireText(era?.[key], `${label}.eras[${index}].${key}`);
        if (!waveIcons.has(era?.icon)) errors.push(`${label}.eras[${index}].icon: unsupported wave icon`);
      });
    }
    if (['timeline', 'process', 'diagram'].includes(slide.layout)) {
      const items = slide.layout === 'diagram' ? slide.nodes : slide.items;
      if (!Array.isArray(items) || items.length < 2 || items.length > 4) errors.push(`${label}: expected 2-4 diagram items`);
      else items.forEach(n => { requireText(n.label, `${label}.item.label`); requireText(n.description, `${label}.item.description`); if (slide.layout === 'diagram' && !tones.has(n.tone)) errors.push(`${label}: unknown tone`); });
      if (slide.layout === 'diagram' && !['pipeline','network'].includes(slide.diagramKind)) errors.push(`${label}: unsupported diagramKind`);
    }
    if (slide.layout === 'example') for (const k of ['prompt','response','promptLabel','responseLabel']) requireText(slide[k], `${label}.${k}`);
    if (slide.layout === 'image') for (const k of ['imagePath','caption']) requireText(slide[k], `${label}.${k}`);
  }
  if (deck.durationMinutes !== undefined) {
    if (typeof deck.durationMinutes !== 'number' || !Number.isFinite(deck.durationMinutes) || deck.durationMinutes < 1) errors.push('durationMinutes: number >= 1 required');
    else if (Math.abs(deck.slides.reduce((sum,s) => sum + (s.timingSeconds || 0), 0) - deck.durationMinutes * 60) > 1e-6) errors.push('timing: slide durations must equal durationMinutes');
  }
  return errors;
}
