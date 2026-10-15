// Editable, native-size reconstruction of the Token / Embedding sequence in video 004.
// The shared slide renderer supplies the brand shell. All visible copy is in llmData.
export const llmEmbeddingKinds = Object.freeze([
  'embedding-definition', 'embedding-tokens', 'embedding-single',
  'embedding-2d', 'embedding-3d', 'embedding-high-d', 'embedding-cloud',
  'embedding-royalty', 'embedding-parents', 'embedding-offset', 'embedding-arithmetic',
]);

const colors = { blue: '#194DF9', yellow: '#F7AC01', ink: '#0B1220' };
const color = tone => colors[tone] || colors.ink;
const uid = s => `llme-${s.id.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
const rich = (parts, e) => (parts || []).map(p => `<span class="llme-tone-${p.tone || 'ink'}">${e(p.text)}</span>`).join('');

function defs(id) {
  return `<defs>${['blue', 'yellow', 'ink', 'gray'].map(tone => {
    const size = tone === 'yellow' ? 15 : 9;
    return `<marker id="${id}-${tone}" markerWidth="${size}" markerHeight="${size}" refX="${size - 1.5}" refY="${size / 2}" orient="auto" markerUnits="userSpaceOnUse"><path d="M0 0 L${size} ${size / 2} L0 ${size} Z" fill="${tone === 'gray' ? '#5B6B7F' : color(tone)}"/></marker>`;
  }).join('')}</defs>`;
}

function numberColumn(values, x, y, e, options = {}) {
  const gap = options.gap || 40, half = options.half || 50;
  const bottom = y + (values.length - 1) * gap + 18;
  return `<g class="llme-number-column"><path d="M${x - half + 12} ${y - 27} H${x - half} V${bottom} H${x - half + 12} M${x + half - 12} ${y - 27} H${x + half} V${bottom} H${x + half - 12}"/>${values.map((v, i) => `<text data-fit x="${x}" y="${y + i * gap}" text-anchor="middle">${e(v)}</text>`).join('')}</g>`;
}

function tokenColumn(token, x, id, e, selected = false) {
  const width = Math.max(96, Math.min(186, token.text.length * 17 + 26));
  return `<g class="llme-token-column ${selected ? 'llme-token-selected' : ''}"><rect x="${x - width / 2}" y="10" width="${width}" height="52" rx="4"/><text data-fit x="${x}" y="45" text-anchor="middle" class="llme-token-word">${e(token.text)}</text><line x1="${x}" y1="74" x2="${x}" y2="110" marker-end="url(#${id}-gray)"/>${numberColumn(token.values, x, 153, e)}</g>`;
}

function coordinatePanel(example, dx, id, e) {
  const origin = [220, 405], dims = example.dimensions;
  const project = p => dims === 2
    ? [origin[0] + p[0] * 70, origin[1] - p[1] * 70]
    : [origin[0] + p[0] * 60 + p[1] * 32, origin[1] - p[1] * 29 - p[2] * 59];
  const p = project(example.values), xAxis = dims === 2 ? [505, 405] : [490, 405];
  let grid = '';
  if (dims === 3) {
    for (let i = -2; i <= 4; i++) {
      const a = project([i, -2, 0]), b = project([i, 4, 0]);
      const c = project([-2, i, 0]), d = project([4, i, 0]);
      grid += `<path d="M${a} L${b} M${c} L${d}"/>`;
    }
  }
  const yAxis = dims === 2 ? [220, 175] : project([0, 4.3, 0]);
  let axes = `<path d="M35 405 H${xAxis[0]}" marker-end="url(#${id}-gray)"/><path d="M${dims === 2 ? '220 475' : '165 455'} L${yAxis}" marker-end="url(#${id}-gray)"/>`;
  let axisText = `<text data-fit x="${xAxis[0] + 15}" y="416">${e(example.axisLabels[0])}</text><text data-fit x="${yAxis[0] + (dims === 3 ? 35 : 10)}" y="${yAxis[1] - 12}">${e(example.axisLabels[1])}</text>`;
  let projection;
  if (dims === 2) {
    projection = `<path d="M${p[0]} 405 V${p[1]} H220"/>`;
  } else {
    const floor = project([example.values[0], example.values[1], 0]);
    const alongX = project([example.values[0], 0, 0]);
    projection = `<path d="M${alongX} L${floor} L${p}"/>`;
    const zAxis = project([0, 0, 4.5]);
    axes += `<path d="M220 445 L${zAxis}" marker-end="url(#${id}-gray)"/>`;
    axisText += `<text data-fit x="${zAxis[0] - 28}" y="${zAxis[1] - 10}">${e(example.axisLabels[2])}</text>`;
  }
  return `<g transform="translate(${dx} 0)"><g class="llme-coordinate-grid">${grid}</g><g class="llme-coordinate-axes">${axes}</g><g class="llme-axis-labels">${axisText}</g><g class="llme-projection">${projection}</g><path class="llme-coordinate-vector" d="M${origin} L${p}" marker-end="url(#${id}-blue)"/><circle cx="${p[0]}" cy="${p[1]}" r="5" fill="#194DF9"/><text data-fit class="llme-point-label" x="${p[0] + 18}" y="${p[1] + (dims === 3 ? 34 : -17)}">${e(example.vectorLabel)}</text>${numberColumn(example.values.map(v => Number(v).toFixed(1)), 440, 81, e, { gap: 37, half: 49 })}</g>`;
}

function embeddingDiagram(s, e) {
  const d = s.llmData, id = uid(s);
  let diagram = '';
  if (s.llmKind === 'embedding-tokens') {
    diagram = d.tokens.map((token, i) => tokenColumn(token, 105 + 195 * i, id, e, i === d.selectedToken)).join('');
  } else {
    diagram = tokenColumn(d.tokens[d.selectedToken], 1470, id, e, true);
    (d.coordinateExamples || []).forEach((example, i) => { diagram += coordinatePanel(example, i === 0 ? 30 : 660, id, e); });
    if (s.llmKind === 'embedding-high-d') {
      diagram += `<path class="llme-dimension-brace" d="M1544 127 C1567 127 1557 275 1576 294 C1557 313 1567 451 1544 451"/><text data-fit class="llme-dimension-label" x="1596" y="308">${e(d.dimensionLabel)}</text><text data-fit class="llme-dimension-caption" x="1470" y="504" text-anchor="middle">${e(d.dimensionCaption)}</text>`;
    }
  }
  return `<svg class="llme-embedding-diagram" viewBox="0 0 1712 530" role="img" aria-label="${e(s.title)}">${defs(id)}${diagram}</svg>`;
}

function cloudDiagram(s, e) {
  const d = s.llmData.cloud, id = uid(s), origin = [856, 316];
  const project = p => [origin[0] + p[0] * 110 + p[1] * 51, origin[1] + p[0] * 15 - p[1] * 32 - p[2] * 70];
  let grid = '';
  for (let i = -8; i <= 8; i++) {
    const a = project([i, -8, 0]), b = project([i, 8, 0]);
    const c = project([-8, i, 0]), f = project([8, i, 0]);
    grid += `<path d="M${a} L${b} M${c} L${f}"/>`;
  }
  const ends = [project([6, 0, 0]), project([0, 8, 0]), project([0, 0, 3.7])];
  const axes = ends.map((p, i) => `<path d="M${origin} L${p}" marker-end="url(#${id}-gray)"/><text data-fit x="${p[0] + 14}" y="${p[1] + 8}">${e(d.axisLabels[i])}</text>`).join('');
  const vectors = d.words.map(w => {
    const p = project(w.point), c = color(w.tone);
    return `<path class="llme-cloud-vector" d="M${origin} L${p}" stroke="${c}" marker-end="url(#${id}-${w.tone || 'ink'})"/><text data-fit class="llme-cloud-word" x="${p[0] + w.labelOffset[0]}" y="${p[1] + w.labelOffset[1]}" fill="${w.tone === 'yellow' ? '#0B1220' : c}">${e(w.text)}</text>`;
  }).join('');
  return `<svg class="llme-cloud-diagram" viewBox="0 0 1712 640" role="img" aria-label="${e(s.title)}">${defs(id)}<defs><clipPath id="${id}-clip"><rect x="0" y="0" width="1712" height="640"/></clipPath></defs><g clip-path="url(#${id}-clip)"><g class="llme-cloud-grid">${grid}</g><g class="llme-cloud-axes">${axes}</g>${vectors}<circle cx="${origin[0]}" cy="${origin[1]}" r="5" fill="#0B1220"/></g></svg><p class="llme-qualifier" data-fit>${e(d.caption)}</p>`;
}

function analogyDiagram(s, e) {
  const d = s.llmData.analogy, id = uid(s), origin = [856, 500];
  const project = p => [origin[0] + 110 * p[0], origin[1] - 110 * p[1]];
  const vectors = d.vectors.map(v => {
    const p = project(v.point), left = p[0] < origin[0], c = color(v.tone);
    return `<path class="llme-analogy-vector" d="M${origin} L${p}" stroke="${c}" marker-end="url(#${id}-${v.tone || 'ink'})"/><circle cx="${p[0]}" cy="${p[1]}" r="5" fill="${c}"/><text data-fit class="llme-analogy-label" x="${p[0] + (left ? -24 : 24)}" y="${p[1] + 10}" text-anchor="${left ? 'end' : 'start'}">${e(v.label)}</text>`;
  }).join('');
  const differences = d.differences.map((diff, i) => {
    if (i > 0 && !s.llmData.showOffsets) return '';
    const a = d.vectors.find(v => v.key === diff.from), b = d.vectors.find(v => v.key === diff.to);
    if (!a || !b) return '';
    return `<path class="llme-analogy-offset" d="M${project(a.point)} L${project(b.point)}" marker-end="url(#${id}-yellow)"/>`;
  }).join('');
  return `<div class="llme-analogy-formula" data-fit>${rich(d.formula, e)}</div><svg class="llme-analogy-diagram" viewBox="0 0 1712 640" role="img" aria-label="${e(s.title)}">${defs(id)}<path class="llme-analogy-axes" d="M220 500 H1490 M856 55 V630"/>${vectors}${differences}<circle cx="856" cy="500" r="5" fill="#0B1220"/></svg><p class="llme-qualifier" data-fit>${e(d.qualifier)}</p>`;
}

export function renderLlmEmbedding(s, e) {
  if (!llmEmbeddingKinds.includes(s.llmKind)) throw new Error(`Unknown embedding kind: ${s.llmKind}`);
  const d = s.llmData;
  const lead = d.lead?.length ? `<p class="llme-lead" data-fit>${rich(d.lead, e)}</p>` : '';
  const bullets = d.bullets?.length ? `<ul class="llme-bullets">${d.bullets.map(b => `<li data-fit>${b.label ? `<strong>${e(b.label)}</strong>` : ''}${e(b.text)}</li>`).join('')}</ul>` : '';
  let body = '';
  if (s.llmKind === 'embedding-cloud') body = cloudDiagram(s, e);
  else if (s.llmKind === 'embedding-definition') body = '';
  else if (s.llmKind.startsWith('embedding-') && d.analogy) body = analogyDiagram(s, e);
  else body = embeddingDiagram(s, e);
  const qualifier = d.qualifier ? `<p class="llme-qualifier" data-fit>${e(d.qualifier)}</p>` : '';
  return `<div class="llm-module-body llme-body llme-${s.llmKind}">${lead}${bullets}${body}${qualifier}</div>`;
}
