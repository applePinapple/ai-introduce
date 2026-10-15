// Video 004 generation, scale and context diagrams, on the shared brand master.
const C = { ink: '#0B1220', muted: '#5B6B7F', line: '#D3DBE5', blue: '#194DF9', yellow: '#F7AC01', pale: '#E7EDFF', cream: '#FFF2CC', white: '#FFFFFF' };

export const llmGenerationKinds = ['generation-distribution', 'generation-temperature', 'generation-selected', 'generation-append', 'generation-repeat', 'generation-english', 'scale-public', 'scale-capabilities', 'context-matrix', 'context-window', 'context-shift'];

export function renderLlmGeneration(s, e) {
  const d = s.llmData;
  const id = `llmg-${s.id.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
  const t = (x, y, value, size = 30, color = C.ink, extra = '') => `<text data-fit x="${x}" y="${y}" fill="${color}" font-size="${size}" ${extra}>${e(value)}</text>`;
  const line = (x1, y1, x2, y2, color = C.line, width = 2, arrow = false) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${width}"${arrow ? ` marker-end="url(#${id}-arrow)"` : ''}/>`;
  const defs = `<defs><marker id="${id}-arrow" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path d="M1 1 L9 5 L1 9 Z" fill="${C.yellow}"/></marker></defs>`;
  const lead = d.lead ? `<p class="llmg-lead" data-fit>${e(d.lead)}</p>` : '';
  const caption = d.caption ? `<p class="llmg-caption" data-fit>${e(d.caption)}</p>` : '';
  const svg = body => `<svg class="llmg-svg" viewBox="0 0 1712 770" role="img" aria-label="${e(d.description)}">${defs}${body}</svg>`;
  const block = (x = 515, y = 260, width = 475, height = 250) => {
    const dx = 65, dy = 60;
    let art = `<polygon points="${x},${y} ${x + width},${y} ${x + width + dx},${y + dy} ${x + dx},${y + dy}" fill="${C.pale}" stroke="${C.blue}" stroke-width="2"/>`;
    for (let i = 1; i <= 12; i++) art += line(x + i * 4, y + i * 4, x + width + i * 4, y + i * 4, '#B9C9FF', 1.4);
    art += `<polygon points="${x},${y} ${x + dx},${y + dy} ${x + dx},${y + height} ${x},${y + height - dy}" fill="#B9C9FF" stroke="${C.blue}" stroke-width="2"/><rect x="${x + dx}" y="${y + dy}" width="${width}" height="${height - dy}" fill="${C.blue}"/>`;
    return art + t(x + dx + width / 2, y + dy + (height - dy) / 2 + 13, d.modelLabel, 36, C.white, 'text-anchor="middle" font-family="var(--mono)"');
  };
  const bars = (items, x, y, width = 445, row = 58, selected = '', labelWidth = 102) => items.map((item, i) => {
    const yy = y + i * row;
    const selectedRow = item.token === selected;
    const p = `${Number((item.probability * 100).toFixed(1))}%`;
    return `${selectedRow ? `<rect x="${x - 10}" y="${yy - 31}" width="${width + 14}" height="49" rx="5" fill="${C.cream}" stroke="${C.yellow}"/>` : ''}${t(x, yy + 3, item.token, 29)}<rect x="${x + labelWidth}" y="${yy - 23}" width="${(width - labelWidth - 108) * item.probability}" height="25" fill="${selectedRow ? C.yellow : C.blue}"/>${t(x + width, yy + 3, p, 25, C.muted, 'text-anchor="end" font-family="var(--mono)"')}`;
  }).join('');

  let body = '';
  if (s.llmKind === 'generation-temperature') {
    body = svg(d.temperatureCases.map((item, i) => {
      const x = 55 + i * 560;
      return t(x, 185, item.label, 34, i === 1 ? C.blue : C.ink) + bars(item.probabilities, x, 255, 445, 54);
    }).join('') + t(856, 684, d.temperatureFormula, 34, C.ink, 'text-anchor="middle" font-family="var(--serif)"'));
  } else if (s.llmKind.startsWith('generation-')) {
    const english = s.llmKind === 'generation-english';
    const prompt = d.promptLines.map((p, i) => t(english ? 840 : 0, (english ? 58 : 355) + i * 54, p, english ? 30 : 32)).join('');
    const model = english ? block(65, 320, 470, 250) : block();
    const probs = bars(d.probabilities, english ? 860 : 1225, english ? 300 : 220, english ? 650 : 445, 58, d.selectedToken || '', english ? 245 : 102);
    const arrows = english ? line(650, 460, 790, 460, C.yellow, 8, true) : line(400, 405, 490, 405, C.yellow, 8, true) + line(1080, 405, 1170, 405, C.yellow, 8, true);
    const stage = d.stageLabel ? t(english ? 860 : 1225, english ? 230 : 150, d.stageLabel, 25, C.muted) : '';
    const feedback = d.showFeedback ? `<path d="M1450 635 V670 H270 V465" fill="none" stroke="${C.yellow}" stroke-width="3" marker-end="url(#${id}-arrow)"/>${t(860, 710, d.feedbackLabel, 27, C.muted, 'text-anchor="middle"')}` : '';
    body = svg(prompt + model + probs + arrows + stage + feedback);
  } else if (s.llmKind.startsWith('scale-')) {
    const x0 = 95, x1 = 730, y0 = 640, top = 205;
    const y = p => y0 - Math.log10(p) / 3 * (y0 - top);
    let plot = line(x0, y0, x1, y0, C.muted) + line(x0, y0, x0, top, C.muted);
    for (const value of [1, 10, 100, 1000]) plot += line(x0 - 7, y(value), x1, y(value), C.line, 1) + t(x0 - 20, y(value) + 8, String(value), 23, C.muted, 'text-anchor="end"');
    const years = [...new Set(d.models.map(model => model.year))].sort();
    plot += t(x0, 170, d.plotLabels.parameterAxis, 26, C.muted) + t(215, 690, String(years[0]), 25, C.muted, 'text-anchor="middle"') + t(620, 690, String(years.at(-1)), 25, C.muted, 'text-anchor="middle"');
    d.models.forEach((model, i) => {
      const x = model.year === years[0] ? 215 : 620, cy = y(model.parametersB), col = i === 0 ? C.blue : C.yellow;
      plot += `<circle cx="${x}" cy="${cy}" r="9" fill="${col}"/>` + t(x + (i === 0 ? 18 : -18), cy - 20, model.name, 27, C.ink, `text-anchor="${i === 0 ? 'start' : 'end'}"`) + t(x + (i === 0 ? 18 : -18), cy + 15, `${model.parametersB}B`, 25, C.muted, `text-anchor="${i === 0 ? 'start' : 'end'}"`);
    });
    body = svg(plot) + `<div class="llmg-model-table"><table><thead><tr>${d.tableHeaders.map(x => `<th data-fit>${e(x)}</th>`).join('')}</tr></thead><tbody>${d.models.map(model => `<tr><td data-fit>${e(model.name)}</td><td data-fit>${e(`${model.parametersB}B`)}</td><td data-fit>${e(model.trainingTokens)}</td><td data-fit>${e(model.dimension)}</td></tr>`).join('')}</tbody></table><p data-fit>${e(d.tableCaption)}</p></div>`;
  } else if (s.llmKind === 'context-matrix') {
    const rows = d.vectors.map((row, i) => t(70, 245 + i * 65, row.token, 31) + t(340, 245 + i * 65, `[ ${row.values.join('    ')} ]`, 30, C.muted, 'font-family="var(--mono)"')).join('');
    body = svg(`<path d="M335 165 V151 H1612 V165" fill="none" stroke="${C.blue}" stroke-width="2"/>${t(974, 126, d.dimensionLabel, 31, C.blue, 'text-anchor="middle"')}${rows}`);
  } else if (s.llmKind === 'context-window' || s.llmKind === 'context-shift') {
    body = `<div class="llmg-window${s.llmKind === 'context-shift' ? ' is-shifted' : ''}"><div class="llmg-window-label" data-fit>${e(d.windowLabel)}</div>${d.windowParagraphs.map(x => `<p data-fit>${e(x)}</p>`).join('')}</div>${d.excludedText ? `<p class="llmg-excluded" data-fit>${e(d.excludedText)}</p>` : ''}`;
  } else throw new Error(`Unsupported LLM kind: ${s.llmKind}`);
  return `<div class="llm-module-body llmg-body llmg-${e(s.llmKind)}">${lead}${body}${caption}</div>`;
}
