import path from 'node:path';

// Native reconstruction of video 003 diagrams, adapted to the shared brand shell.
// All visible prose, diagram labels and formula tokens come from neuralData.
export const neuralWhiteKinds = Object.freeze([
  'white-neuron', 'white-network', 'white-layers', 'white-neuron-detail',
  'white-neuron-formula', 'white-neuron-steps', 'white-backprop-history',
  'white-train-forward', 'white-train-loss', 'white-train-backward',
  'white-train-update', 'white-train-summary',
]);

function rich(parts, e) {
  return (parts || []).map(part => part.emphasis
    ? `<strong class="nnw-emphasis">${e(part.text)}</strong>`
    : part.bold ? `<strong>${e(part.text)}</strong>` : e(part.text)).join('');
}

function network(s, e) {
  const d = s.neuralData.network;
  const id = `nnw-net-${s.id.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
  const columns = [
    { x: 135, ys: [105, 175, 245], fill: '#FFF2CC', stroke: '#F7AC01', label: d.layers[0], text: '#0B1220' },
    { x: 325, ys: [65, 135, 205, 275], fill: '#E7EDFF', stroke: '#194DF9', label: d.layers[1], text: '#194DF9' },
    { x: 525, ys: [65, 135, 205, 275], fill: '#E7EDFF', stroke: '#194DF9', label: d.layers[2], text: '#194DF9' },
    { x: 720, ys: [175], fill: '#FFF2CC', stroke: '#F7AC01', label: d.layers[3], text: '#0B1220' },
  ];
  let edges = '', nodes = '', blocks = '', labels = '', count = 0;
  for (let c = 0; c < columns.length; c++) {
    const col = columns[c], top = Math.min(...col.ys) - 43, bottom = Math.max(...col.ys) + 43;
    blocks += `<rect x="${col.x - 46}" y="${top}" width="92" height="${bottom - top}" fill="${col.fill}" stroke="${col.stroke}" stroke-width="1.4"/>`;
    if (c < columns.length - 1) for (const y1 of col.ys) for (const y2 of columns[c + 1].ys) {
      const nx = columns[c + 1].x, dx = nx - col.x, dy = y2 - y1, len = Math.hypot(dx, dy), pad = 29;
      edges += `<line x1="${col.x + pad * dx / len}" y1="${y1 + pad * dy / len}" x2="${nx - pad * dx / len}" y2="${y2 - pad * dy / len}" marker-end="url(#${id})"/>`;
    }
    for (const y of col.ys) nodes += `<circle cx="${col.x}" cy="${y}" r="27"/><text data-fit x="${col.x}" y="${y + 9}" text-anchor="middle">${++count}</text>`;
    labels += `<text data-fit x="${col.x}" y="${bottom + 38}" text-anchor="middle" fill="${col.text}" class="nnw-layer-label">${e(col.label)}</text>`;
  }
  const inputs = columns[0].ys.map((y, i) => `<line x1="15" y1="${y}" x2="103" y2="${y}" marker-end="url(#${id})"/><text data-fit x="25" y="${y - 13}" class="nnw-math-label">${e(d.inputs[i])}</text>`).join('');
  const weights = (d.weights || []).map((label, i) => `<text data-fit x="${i < 3 ? 205 : 405}" y="${i < 3 ? 80 + i * 27 : 45 + (i - 3) * 27}" class="nnw-weight-label">${e(label)}</text>`).join('');
  return `<svg class="nnw-network-svg" viewBox="0 0 830 380" role="img" aria-label="${e(d.alt)}"><defs><marker id="${id}" markerWidth="6" markerHeight="6" refX="5.1" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0 0 L6 3 L0 6 Z" fill="#194DF9"/></marker></defs>${blocks}<g class="nnw-net-edges">${edges}${inputs}<line x1="751" y1="175" x2="814" y2="175" marker-end="url(#${id})"/></g><g class="nnw-net-nodes">${nodes}</g><g>${labels}${weights}<text data-fit x="780" y="157" class="nnw-math-label">${e(d.output)}</text></g></svg>`;
}

function neuron(s, e) {
  const d = s.neuralData.neuron;
  const id = `nnw-unit-${s.id.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
  const ys = [130, 215, 300, 455];
  const inputs = ys.map((y, i) => `<circle cx="165" cy="${y}" r="23"/><text data-fit x="124" y="${y + 8}" text-anchor="end" class="nnw-unit-variable">${e(d.inputs[i])}</text><line x1="187" y1="${y}" x2="426" y2="${262 + i * 13}" marker-end="url(#${id})"/><text data-fit x="284" y="${y + (285 - y) * .43 - 10}" class="nnw-unit-weight">${e(d.weights[i])}</text>`).join('');
  return `<svg class="nnw-neuron-svg" viewBox="0 0 900 540" role="img" aria-label="${e(d.alt)}"><defs><marker id="${id}" markerWidth="8" markerHeight="8" refX="6.4" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill="#194DF9"/></marker></defs><g class="nnw-unit-boxes"><rect x="40" y="62" width="180" height="445"/><rect x="240" y="62" width="98" height="445"/><rect x="760" y="223" width="125" height="133"/></g><g class="nnw-unit-labels"><text data-fit x="130" y="42" text-anchor="middle">${e(d.labels[0])}</text><text data-fit x="289" y="42" text-anchor="middle">${e(d.labels[1])}</text><text data-fit x="479" y="247" text-anchor="middle">${e(d.labels[2])}</text><text data-fit x="659" y="247" text-anchor="middle">${e(d.labels[3])}</text><text data-fit x="821" y="207" text-anchor="middle">${e(d.labels[4])}</text></g><g class="nnw-unit-ink">${inputs}<text data-fit x="165" y="384" text-anchor="middle" font-size="34">⋮</text><rect x="432" y="265" width="95" height="65"/><rect x="613" y="265" width="95" height="65"/><line x1="527" y1="297" x2="609" y2="297" marker-end="url(#${id})"/><line x1="708" y1="297" x2="788" y2="297" marker-end="url(#${id})"/><circle cx="812" cy="297" r="22"/></g><g class="nnw-unit-symbols"><text data-fit x="480" y="317" text-anchor="middle">${e(d.sumSymbol)}</text><text data-fit x="660" y="311" text-anchor="middle">${e(d.activationSymbol)}</text><text data-fit x="850" y="306" text-anchor="middle" font-size="29">${e(d.output)}</text></g></svg>`;
}

function formula(d, e) {
  return `<div class="nnw-formula" data-fit role="img" aria-label="${e(d.alt)}"><math xmlns="http://www.w3.org/1998/Math/MathML" display="block"><mrow><mi>${e(d.result)}</mi><mo>=</mo><mi>${e(d.activation)}</mi><mo stretchy="true">(</mo><munderover><mo>∑</mo><mrow><mi>${e(d.index)}</mi><mo>=</mo><mn>1</mn></mrow><mi>${e(d.upper)}</mi></munderover><msub><mi>${e(d.weight)}</mi><mi>${e(d.index)}</mi></msub><msub><mi>${e(d.input)}</mi><mi>${e(d.index)}</mi></msub><mo>−</mo><mi>${e(d.threshold)}</mi><mo stretchy="true">)</mo></mrow></math></div>`;
}

function callout(s, e) {
  return `<div class="nnw-callout"><svg class="nnw-callout-outline" viewBox="0 0 625 510" aria-hidden="true"><path d="M200 0 L260 148 H560 Q616 148 616 205 V445 Q616 501 560 501 H65 Q9 501 9 445 V205 Q9 148 65 148 H112 Z"/></svg><div class="nnw-callout-neuron">${neuron(s, e)}</div></div>`;
}

function starburst(label, className, e) {
  return `<svg class="nnw-star ${className}" viewBox="0 0 530 235" role="img" aria-label="${e(label.alt)}"><polygon points="265,9 292,63 359,27 360,80 448,57 415,103 514,109 435,139 501,178 407,170 419,222 341,185 313,231 267,185 217,229 191,182 113,220 131,167 30,182 99,140 12,113 109,98 48,44 147,72 172,17 224,62"/><text data-fit x="265" y="108" text-anchor="middle">${e(label.label)}</text><text data-fit x="265" y="148" text-anchor="middle" class="nnw-star-en">${e(label.english)}</text></svg>`;
}

export function renderNeuralWhite(s, e) {
  if (!neuralWhiteKinds.includes(s.neuralKind)) return null;
  const d = s.neuralData;
  const lead = d.lead ? `<p class="nnw-lead" data-fit>${rich(d.lead, e)}</p>` : '';
  let body = '';
  if (s.neuralKind === 'white-neuron' || s.neuralKind === 'white-network') {
    body = `<img class="nnw-biology ${s.neuralKind === 'white-network' ? 'nnw-biology-network' : 'nnw-biology-neuron'}" src="media/${e(path.basename(s.imagePath))}" alt="${e(s.imageAlt)}"><div class="${s.neuralKind === 'white-neuron' ? 'nnw-neuron-large' : 'nnw-network-large'}">${s.neuralKind === 'white-neuron' ? neuron(s, e) : network(s, e)}</div>`;
  } else if (s.neuralKind.startsWith('white-train') || s.neuralKind === 'white-backprop-history') {
    const count = d.visibleSteps || 0;
    body = `<div class="nnw-training-network">${network(s, e)}</div>${count ? `<div class="nnw-training-copy"><p class="nnw-flow-intro" data-fit>${e(d.flowIntro)}</p><ul class="nnw-training-steps">${d.trainingSteps.slice(0, count).map(step => `<li data-fit><strong>${e(step.label)}</strong>${e(step.text)}</li>`).join('')}</ul></div>` : ''}${d.showCallouts ? `<div class="nnw-training-callouts">${starburst(d.callouts[0], 'nnw-loss-star', e)}${starburst(d.callouts[1], 'nnw-gradient-star', e)}</div>` : ''}`;
  } else {
    body = `<ul class="nnw-layer-copy">${d.layerDescriptions.map(item => `<li data-fit><strong>${e(item.label)}</strong>${e(item.text)}</li>`).join('')}</ul><div class="nnw-network-small">${network(s, e)}</div>${s.neuralKind !== 'white-layers' ? callout(s, e) : ''}${d.showFormula ? formula(d.formula, e) : ''}${d.calculationSteps ? `<ol class="nnw-calculation-steps">${d.calculationSteps.map((text, i) => `<li data-fit><span>${e(d.stepNumbers[i])}</span>${e(text)}</li>`).join('')}</ol>` : ''}`;
  }
  return `<div class="neural-slide neural-light nnw-screen nnw-${e(s.neuralKind)}">${lead}${body}</div>`;
}
