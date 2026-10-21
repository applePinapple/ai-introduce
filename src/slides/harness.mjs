// Native editable diagrams for Harness engineering; all visible copy comes from the deck JSON.
export const harnessKinds = ['anatomy', 'context', 'continuity', 'execution', 'improvement', 'case'];

const C = { ink: '#0B1220', muted: '#5B6B7F', line: '#D3DBE5', blue: '#194DF9', orange: '#F7AC01', pale: '#E7EDFF', cream: '#FFF2CC' };

export function renderHarness(s, e) {
  const d = s.harnessData;
  const id = `ha-${s.id.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
  const p = (value, cls) => `<p class="${cls}" data-fit>${e(value)}</p>`;
  const text = (x, y, value, size = 28, color = C.ink, extra = '') => `<text data-fit x="${x}" y="${y}" fill="${color}" font-size="${size}" ${extra}>${e(value)}</text>`;
  const arrow = (x1, y1, x2, y2, tone = 'orange') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${C[tone]}" stroke-width="3" marker-end="url(#${id}-${tone})"/>`;
  const path = (value, tone = 'blue', dashed = false, bidirectional = false) => `<path d="${value}" fill="none" stroke="${C[tone]}" stroke-width="3"${dashed ? ' stroke-dasharray="8 7"' : ''}${bidirectional ? ` marker-start="url(#${id}-${tone})"` : ''} marker-end="url(#${id}-${tone})"/>`;
  const defs = `<defs>${['blue', 'orange'].map(tone => `<marker id="${id}-${tone}" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto-start-reverse"><path d="M0 0 L9 4.5 L0 9 Z" fill="${C[tone]}"/></marker>`).join('')}</defs>`;
  const svg = body => `<svg class="harness-svg" viewBox="0 0 1712 770" role="img" aria-label="${e(d.description)}">${defs}${body}</svg>`;
  const card = (item, cls, i) => `<article data-harness-card class="harness-card ${cls}">${i !== undefined ? `<span class="harness-step-number" data-fit>${String(i + 1).padStart(2, '0')}</span>` : ''}<h2 data-fit>${e(item.label)}</h2><p data-fit>${e(item.text)}</p></article>`;
  let content;
  if (s.harnessKind === 'anatomy') {
    content = `${p(d.applicationBoundary, 'harness-application-boundary')}<div class="harness-enclosure"><span data-fit>${e(d.harnessLabel)}</span></div>${card(d.input, 'harness-anatomy-input')}${card(d.output, 'harness-anatomy-output harness-yellow')}${card(d.model, 'harness-anatomy-model harness-blue')}<div class="harness-anatomy-parts">${d.parts.map((item, i) => card(item, `harness-part-${i + 1}`)).join('')}</div>${svg(arrow(250, 409, 725, 409, 'blue') + arrow(987, 409, 1450, 409) + path('M713 278 H780 V304', 'blue') + path('M989 278 H932 V304', 'blue', false, true) + path('M780 514 V535 H713', 'blue') + path('M932 514 V535 H999', 'orange'))}`;
  } else if (s.harnessKind === 'context') {
    content = `<div class="harness-stores">${d.stores.map((item, i) => card(item, i === 2 ? 'harness-yellow' : 'harness-blue')).join('')}</div><div class="harness-context-stages">${d.stages.map((item, i) => card(item, '', i)).join('')}</div>${card(d.window, 'harness-window harness-blue')}${p(d.stateLabel, 'harness-state-label')}${svg([278, 856, 1434].map(x => `<line x1="${x}" y1="267" x2="${x}" y2="310" stroke="${C.blue}" stroke-width="3"/>`).join('') + `<path d="M278 310 H1434 M150 310 H278" fill="none" stroke="${C.blue}" stroke-width="3"/>` + arrow(150, 310, 150, 358, 'blue') + arrow(300, 433, 344, 433) + arrow(650, 433, 694, 433) + arrow(1000, 433, 1100, 433))}`;
  } else if (s.harnessKind === 'continuity') {
    content = `<div class="harness-continuity-steps">${d.steps.map((item, i) => card(item, i === 2 ? 'harness-yellow' : '', i)).join('')}</div><article data-harness-card class="harness-record"><h2 data-fit>${e(d.record.label)}</h2><div>${d.record.items.map(value => `<p data-fit>${e(value)}</p>`).join('')}</div></article>${p(d.resumeLabel, 'harness-resume-label')}${svg([365, 810, 1255].map(x => arrow(x, 228, x + 69, 228)).join('') + path('M1035 347 V388 H856 V430', 'blue') + path('M1452 572 H1650 V396 H1450 V358', 'blue', true) + path('M259 515 H60 V396 H602 V348', 'blue', true))}`;
  } else if (s.harnessKind === 'execution') {
    content = `<div class="harness-execution-steps">${d.steps.map((item, i) => card(item, i === 2 ? 'harness-yellow' : '', i)).join('')}</div><div class="harness-controls">${d.controls.map((item, i) => card(item, i === 1 ? 'harness-yellow' : 'harness-blue')).join('')}</div>${svg([365, 810, 1255].map(x => arrow(x, 227, x + 69, 227)).join(''))}`;
  } else if (s.harnessKind === 'improvement') {
    content = `<article data-harness-card class="harness-inner"><h2 data-fit>${e(d.inner.label)}</h2><div class="harness-inner-steps">${d.inner.steps.map((value, i) => `<div><span data-fit>${e(value)}</span>${i < 2 ? '<b aria-hidden="true">↓</b>' : ''}</div>`).join('')}</div><p data-fit>${e(d.inner.text)}</p></article><article data-harness-card class="harness-outer"><h2 data-fit>${e(d.outer.label)}</h2><div class="harness-outer-steps">${d.outer.steps.map((value, i) => `<div class="harness-outer-step-${i + 1}"><span data-fit>${String(i + 1).padStart(2, '0')}</span><b data-fit>${e(value)}</b></div>`).join('')}</div><p data-fit>${e(d.outer.text)}</p></article>${svg(path('M60 463 H17 V244 H60', 'blue') + arrow(1188, 253, 1249, 253) + path('M1458 307 V332', 'orange') + arrow(1251, 388, 1188, 388) + path('M992 442 V467', 'orange') + path('M775 523 H730 V253 H775', 'blue', true))}${p(d.comparison, 'harness-comparison')}`;
  } else if (s.harnessKind === 'case') {
    content = `<div class="harness-case-scenario"><span data-fit>${e(d.exampleLabel)}</span><b data-fit>${e(d.scenario)}</b></div><table class="harness-case-table"><thead><tr>${d.columns.map(value => `<th data-fit>${e(value)}</th>`).join('')}</tr></thead><tbody>${d.rows.map(item => `<tr><td data-fit>${e(item.failure)}</td><td data-fit>${e(item.change)}</td><td data-fit>${e(item.evidence)}</td></tr>`).join('')}</tbody></table>${p(d.acceptance, 'harness-acceptance')}`;
  } else {
    throw new Error(`Unsupported harness kind: ${s.harnessKind}`);
  }
  return `<div class="harness-body harness-kind-${e(s.harnessKind)}" role="group" aria-label="${e(d.description)}">${p(d.lead, 'harness-lead')}${content}${p(d.bottomLine, 'harness-bottom')}${p(d.caption, 'harness-caption')}</div>`;
}
