// Native editable Agent foundations diagrams, integrating course examples and official engineering sources.
export const agentKinds = ['overview', 'weather', 'setup', 'loop', 'schema', 'messages', 'sequence', 'safeguards'];

const C = { ink: '#0B1220', muted: '#5B6B7F', line: '#D3DBE5', blue: '#194DF9', orange: '#F7AC01', pale: '#E7EDFF', cream: '#FFF2CC' };

export function renderAgent(s, e) {
  const d = s.agentData;
  const id = `ag-${s.id.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
  const bottomClasses = ['agent-overview-bottom', 'agent-takeaway', 'agent-bottom-line', 'agent-loop-repeat', 'agent-schema-mapping', 'agent-message-bottom', 'agent-sequence-bottom', 'agent-safeguards-bottom'];
  const p = (value, cls) => `<p class="${cls}${bottomClasses.includes(cls) ? ' agent-bottom' : ''}" data-fit>${e(value)}</p>`;
  const text = (x, y, value, size = 28, color = C.ink, extra = '') => `<text data-fit x="${x}" y="${y}" fill="${color}" font-size="${size}" ${extra}>${e(value)}</text>`;
  const arrow = (x1, y1, x2, y2, tone = 'orange', dashed = false) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${C[tone]}" stroke-width="3"${dashed ? ' stroke-dasharray="9 7"' : ''} marker-end="url(#${id}-${tone})"/>`;
  const defs = `<defs>${['blue', 'orange'].map(tone => `<marker id="${id}-${tone}" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto"><path d="M0 0 L9 4.5 L0 9 Z" fill="${C[tone]}"/></marker>`).join('')}</defs>`;
  const svg = body => `<svg class="agent-svg" viewBox="0 0 1712 770" role="img" aria-label="${e(d.description)}">${defs}${body}</svg>`;
  const code = (title, lines, cls = '') => `<article data-agent-card class="agent-code ${cls}"><h2 data-fit>${e(title)}</h2><pre data-fit><code>${lines.map(e).join('\n')}</code></pre></article>`;
  let content;
  if (s.agentKind === 'overview') {
    content = `<div class="agent-overview-concepts">${d.concepts.map((item, i) => `<article data-agent-card class="agent-overview-concept agent-overview-concept-${i + 1} ${i === 2 ? 'agent-yellow' : 'agent-blue'}"><h2 data-fit>${e(item.label)}</h2><p data-fit>${e(item.text)}</p><span data-fit>${e(item.example)}</span></article>`).join('')}</div>${svg(arrow(305, 423, 305, 333, 'blue') + text(333, 385, d.relations[0], 26, C.blue) + `<path d="M610 542 H856 V220 H1090" fill="none" stroke="${C.orange}" stroke-width="3" marker-end="url(#${id}-orange)"/>` + `<rect x="650" y="352" width="412" height="53" rx="8" fill="#EEF2F6"/>` + text(856, 386, d.relations[1], 27, C.ink, 'text-anchor="middle"') + arrow(1407, 423, 1407, 333, 'blue') + text(1435, 385, d.relations[2], 26, C.blue))}${p(d.bottomLine, 'agent-overview-bottom')}`;
  } else if (s.agentKind === 'weather') {
    content = `<div class="agent-weather-request"><span data-fit>${e(d.exampleLabel)}</span><b data-fit>${e(d.request)}</b></div><div class="agent-weather-paths">${d.paths.map((item, i) => `<article data-agent-card class="${i === 0 ? 'agent-blue' : 'agent-yellow'}"><span class="agent-kicker" data-fit>${e(item.label)}</span><h2 data-fit>${e(item.title)}</h2><ol>${item.steps.map(value => `<li data-fit>${e(value)}</li>`).join('')}</ol><p class="agent-path-result" data-fit>${e(item.result)}</p></article>`).join('')}</div>${p(d.takeaway, 'agent-takeaway')}`;
  } else if (s.agentKind === 'setup') {
    content = `<div class="agent-components">${d.components.map((item, i) => `<article data-agent-card class="${i === 1 ? 'agent-yellow' : 'agent-blue'}"><span data-fit>${String(i + 1).padStart(2, '0')}</span><div><h2 data-fit>${e(item.label)}</h2><p data-fit>${e(item.text)}</p></div></article>`).join('')}</div>${code(d.codeTitle, d.codeLines, 'agent-setup-code')}${p(d.bottomLine, 'agent-bottom-line')}`;
  } else if (s.agentKind === 'loop') {
    const node = (item, cls) => `<article data-agent-card class="agent-loop-node ${cls}"><h2 data-fit>${e(item.label)}</h2><p data-fit>${e(item.text)}</p></article>`;
    content = `${node(d.input, 'agent-loop-input')}${node(d.output, 'agent-loop-output')}<article data-agent-card class="agent-loop-model"><h2 data-fit>${e(d.model.label)}</h2><ul>${d.model.questions.map(value => `<li data-fit>${e(value)}</li>`).join('')}</ul></article>${node(d.tool, 'agent-loop-tool')}${svg(arrow(354, 335, 548, 335, 'blue') + arrow(1148, 335, 1347, 335) + arrow(700, 448, 700, 514) + arrow(1010, 514, 1010, 448, 'blue') + text(1248, 303, d.finishLabel, 25, C.muted, 'text-anchor="middle"') + text(667, 496, d.actionLabel, 26, C.ink, 'text-anchor="end"') + text(1043, 496, d.observationLabel, 26, C.blue))}${p(d.repeatLabel, 'agent-loop-repeat')}`;
  } else if (s.agentKind === 'schema') {
    content = `${code(d.codeTitle, d.codeLines, 'agent-schema-code')}<div class="agent-schema-fields">${d.fields.map((item, i) => `<article data-agent-card><span class="agent-field-number" data-fit>${String(i + 1).padStart(2, '0')}</span><div><h2 data-fit>${e(item.label)}</h2><b data-fit>${e(item.value)}</b><p data-fit>${e(item.text)}</p></div></article>`).join('')}</div>${p(d.mappingLabel, 'agent-schema-mapping')}`;
  } else if (s.agentKind === 'messages') {
    content = `<div class="agent-message-chain">${d.rows.map((item, i) => `<article data-agent-card class="${i === 2 ? 'agent-yellow' : 'agent-blue'}"><span class="agent-message-number" data-fit>${String(i + 1).padStart(2, '0')}</span><h2 data-fit>${e(item.role)}</h2><p class="agent-message-tag" data-fit>${e(item.tag)}</p><div class="agent-message-lines">${item.lines.map(value => `<p data-fit>${e(value)}</p>`).join('')}</div>${i < d.rows.length - 1 ? '<span class="agent-chain-arrow" aria-hidden="true">→</span>' : ''}</article>`).join('')}</div>${p(d.pairingLabel, 'agent-message-pairing')}${p(d.bottomLine, 'agent-message-bottom')}`;
  } else if (s.agentKind === 'sequence') {
    const xs = [130, 790, 1475];
    let body = d.participants.map((item, i) => `<rect x="${xs[i] - 124}" y="75" width="248" height="83" rx="10" fill="${i === 2 ? C.cream : '#FFFFFF'}" stroke="${i === 2 ? C.orange : C.line}" stroke-width="2"/>${text(xs[i], 109, item.label, 31, C.ink, 'text-anchor="middle" font-weight="600"')}${text(xs[i], 142, item.caption, 23, C.muted, 'text-anchor="middle"')}<line x1="${xs[i]}" y1="165" x2="${xs[i]}" y2="663" stroke="${C.line}" stroke-width="2" stroke-dasharray="8 7"/>`).join('');
    body += `<rect x="780" y="180" width="20" height="472" rx="3" fill="${C.pale}" stroke="${C.blue}"/>`;
    body += `<g class="agent-direct-reply">${arrow(1465, 340, 802, 340, 'blue', true)}${text(1132, 328, d.directReplyLabel, 25, C.blue, 'text-anchor="middle"')}<path d="M780 340 H720 V645 H778" fill="none" stroke="${C.blue}" stroke-width="2.5" stroke-dasharray="7 6" marker-end="url(#${id}-blue)"/></g>`;
    d.events.forEach((item, i) => {
      const y = 190 + i * 50 + (i > 2 ? 55 : 0);
      const a = xs[item.from], b = xs[item.to];
      const label = `${String(i + 1).padStart(2, '0')}  ${item.label}`;
      if (a === b) {
        body += `<path d="M${a + 10} ${y - 5} H${a + 61} V${y + 18} H${a + 12}" fill="none" stroke="${C[item.tone]}" stroke-width="2.5" marker-end="url(#${id}-${item.tone})"/>`;
        body += text(a === xs[2] ? a - 34 : a + 82, y + 7, label, 25, C.ink, a === xs[2] ? 'text-anchor="end"' : '');
      } else {
        body += arrow(a + (b > a ? 10 : -10), y, b + (b > a ? -12 : 12), y, item.tone, b < a);
        body += text((a + b) / 2, y - 12, label, 25, C.ink, 'text-anchor="middle"');
      }
    });
    content = svg(body) + p(d.bottomLine, 'agent-sequence-bottom');
  } else if (s.agentKind === 'safeguards') {
    content = `<div class="agent-safeguards">${d.items.map((item, i) => `<article data-agent-card class="${i === 1 ? 'agent-yellow' : 'agent-blue'}"><span class="agent-kicker" data-fit>${e(item.label)}</span><h2 data-fit>${e(item.title)}</h2><p data-fit>${e(item.text)}</p></article>`).join('')}</div>${p(d.bottomLine, 'agent-safeguards-bottom')}`;
  } else {
    throw new Error(`Unsupported agent kind: ${s.agentKind}`);
  }
  return `<div class="agent-body agent-kind-${e(s.agentKind)}" role="group" aria-label="${e(d.description)}">${p(d.lead, 'agent-lead')}${content}${p(d.caption, 'agent-caption')}</div>`;
}
