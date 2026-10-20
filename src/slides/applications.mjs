// Native, editable diagrams for the application chapter adapted from video 005.
export const applicationKinds = ['relationship', 'chatbot', 'generation', 'responsibilities', 'comparison', 'hybrid', 'sequence', 'summary'];

const C = { ink: '#0B1220', muted: '#5B6B7F', line: '#D3DBE5', blue: '#194DF9', orange: '#F7AC01', green: '#194DF9', pale: '#E7EDFF', cream: '#FFF2CC' };

export function renderApplication(s, e) {
  const d = s.applicationData;
  const id = `app-${s.id.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
  const text = (x, y, value, size = 30, color = C.ink, extra = '') => `<text data-fit x="${x}" y="${y}" fill="${color}" font-size="${size}" ${extra}>${e(value)}</text>`;
  const arrow = (x1, y1, x2, y2, tone = 'orange', dashed = false) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${C[tone]}" stroke-width="3"${dashed ? ' stroke-dasharray="9 7"' : ''} marker-end="url(#${id}-${tone})"/>`;
  const defs = `<defs>${['blue', 'orange', 'green'].map(tone => `<marker id="${id}-${tone}" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto"><path d="M0 0 L9 4.5 L0 9 Z" fill="${C[tone]}"/></marker>`).join('')}</defs>`;
  const svg = content => `<svg class="app-svg" viewBox="0 0 1712 770" role="img" aria-label="${e(d.description)}">${defs}${content}</svg>`;
  const p = (value, cls) => `<p class="${cls}" data-fit>${e(value)}</p>`;
  const detailList = items => items.map(item => `<li><b data-fit>${e(item.label)}</b><p data-fit>${e(item.text)}</p></li>`).join('');
  let content = '';

  if (s.applicationKind === 'relationship') {
    const card = (item, tone) => `<article class="app-concept app-${tone}"><div class="app-kicker" data-fit>${e(item.label)}</div><h2 data-fit>${e(item.title)}</h2><p data-fit>${e(item.summary)}</p></article>`;
    content = `<div class="app-relationship-row">${card(d.model, 'blue')}<div class="app-concept-bridge"><span aria-hidden="true">→</span><p data-fit>${e(d.bridgeLabel)}</p></div>${card(d.product, 'yellow')}</div><div class="app-acronym">${d.acronym.map(item => `<div><strong data-fit>${e(item.letter)}</strong><div><b data-fit>${e(item.term)}</b><p data-fit>${e(item.meaning)}</p></div></div>`).join('')}</div>`;
  } else if (s.applicationKind === 'chatbot') {
    content = `<div class="app-chat-window"><div class="app-chat-header"><b data-fit>${e(d.appLabel)}</b><span data-fit>${e(d.exampleLabel)}</span></div><div class="app-chat-messages">${d.messages.map((item, i) => `<div class="app-chat-message ${i % 2 === 0 ? 'app-user' : 'app-assistant'}"><span data-fit>${e(item.role)}</span><p data-fit>${e(item.text)}</p></div>`).join('')}</div><div class="app-composer"><span data-fit>${e(d.composerLabel)}</span><span aria-hidden="true">↑</span></div></div><aside class="app-chat-anatomy"><h2 data-fit>${e(d.anatomyTitle)}</h2><ul>${detailList(d.anatomy)}</ul></aside>`;
  } else if (s.applicationKind === 'generation') {
    const inputs = d.inputs.map((item, i) => `<div class="app-input"><b data-fit>${e(item.label)}</b><p data-fit>${e(item.text)}</p></div>`).join('');
    content = `<div class="app-generation-inputs"><h2 data-fit>${e(d.inputLabel)}</h2>${inputs}</div><div class="app-generation-model"><div class="app-model-layers" aria-hidden="true"><i></i><i></i><i></i></div><b data-fit>${e(d.modelLabel)}</b><p data-fit>${e(d.modelCaption)}</p></div><div class="app-generation-output"><h2 data-fit>${e(d.outputLabel)}</h2><div class="app-tokens">${d.outputTokens.map(token => `<span data-fit>${e(token)}</span>`).join('')}</div></div>${svg(arrow(515, 345, 615, 345) + arrow(1095, 345, 1195, 345) + `<path d="M1450 388 V578 H250 V550" fill="none" stroke="${C.blue}" stroke-width="3" marker-end="url(#${id}-blue)"/>${text(856, 620, d.feedbackLabel, 29, C.blue, 'text-anchor="middle"')}`)}<div class="app-generation-stages">${d.stages.map((item, i) => `<div><span data-fit>${String(i + 1).padStart(2, '0')}</span><div><b data-fit>${e(item.label)}</b><p data-fit>${e(item.text)}</p></div></div>`).join('')}</div>`;
  } else if (s.applicationKind === 'responsibilities') {
    const column = (item, cls) => `<article class="app-responsibility ${cls}"><div class="app-responsibility-header"><h2 data-fit>${e(item.title)}</h2><p data-fit>${e(item.caption)}</p></div><ul>${detailList(item.items)}</ul></article>`;
    content = `<div class="app-responsibilities">${column(d.app, 'app-blue')}<div class="app-responsibility-bridge"><span aria-hidden="true">⇄</span><p data-fit>${e(d.connectionLabel)}</p></div>${column(d.model, 'app-yellow')}</div>${p(d.boundaryLabel, 'app-boundary')}`;
  } else if (s.applicationKind === 'comparison') {
    content = `<table class="app-comparison"><thead><tr>${d.headers.map(item => `<th data-fit>${e(item)}</th>`).join('')}</tr></thead><tbody>${d.rows.map(row => `<tr>${row.map((item, i) => `<${i === 0 ? 'th' : 'td'} data-fit>${e(item)}</${i === 0 ? 'th' : 'td'}>`).join('')}</tr>`).join('')}</tbody></table>${p(d.principle, 'app-principle')}`;
  } else if (s.applicationKind === 'hybrid') {
    content = `<div class="app-hybrid-request"><span data-fit>${e(d.exampleLabel)}</span><b data-fit>${e(d.userRequest)}</b></div><div class="app-hybrid-steps">${d.steps.map((item, i) => `<article class="${i % 2 === 0 ? 'app-yellow' : 'app-blue'}"><span class="app-step-number" data-fit>${String(i + 1).padStart(2, '0')}</span><h2 data-fit>${e(item.label)}</h2><p data-fit>${e(item.text)}</p>${i < d.steps.length - 1 ? '<span class="app-step-arrow" aria-hidden="true">→</span>' : ''}</article>`).join('')}</div>${svg(`<path d="M1532 482 V535 H178 V482" stroke="${C.blue}" stroke-width="3" fill="none" marker-end="url(#${id}-blue)"/>${text(856, 520, d.feedbackLabel, 28, C.blue, 'text-anchor="middle"')}`)}<div class="app-hybrid-result"><span data-fit>${e(d.resultLabel)}</span><p data-fit>${e(d.resultText)}</p></div>${p(d.boundaryLabel, 'app-hybrid-boundary')}`;
  } else if (s.applicationKind === 'sequence') {
    const xs = [120, 780, 1480];
    let body = d.participants.map((item, i) => `<rect x="${xs[i] - 112}" y="88" width="224" height="80" rx="10" fill="${i === 2 ? C.cream : '#FFFFFF'}" stroke="${i === 2 ? C.orange : C.line}" stroke-width="2"/>${text(xs[i], 121, item.label, 30, C.ink, 'text-anchor="middle" font-weight="600"')}${text(xs[i], 151, item.caption, 21, C.muted, 'text-anchor="middle"')}<line x1="${xs[i]}" y1="174" x2="${xs[i]}" y2="660" stroke="${C.line}" stroke-width="2" stroke-dasharray="8 7"/>`).join('');
    body += `<rect x="770" y="205" width="20" height="440" rx="3" fill="${C.pale}" stroke="${C.blue}"/><rect x="1470" y="338" width="20" height="156" rx="3" fill="${C.cream}" stroke="${C.orange}"/>`;
    d.events.forEach((item, i) => {
      const y = [220, 280, 350, 410, 480, 550, 620][i];
      const a = xs[item.from], b = xs[item.to];
      const label = `${String(i + 1).padStart(2, '0')}  ${item.label}`;
      if (a === b) {
        body += `<path d="M${a + 10} ${y - 4} H${a + 64} V${y + 24} H${a + 12}" fill="none" stroke="${C[item.tone]}" stroke-width="2.5" marker-end="url(#${id}-${item.tone})"/>`;
        body += text(item.from === 2 ? a - 40 : a + 90, y + 8, label, 27, C.ink, item.from === 2 ? 'text-anchor="end"' : '');
      } else {
        body += arrow(a + (b > a ? 10 : -10), y, b + (b > a ? -12 : 12), y, item.tone, b < a);
        body += text((a + b) / 2, y - 14, label, 27, C.ink, 'text-anchor="middle"');
      }
    });
    content = svg(body) + p(d.bottomLine, 'app-sequence-bottom');
  } else if (s.applicationKind === 'summary') {
    content = `<div class="app-summary-questions">${d.questions.map((item, i) => `<article><span data-fit>${String(i + 1).padStart(2, '0')}</span><h2 data-fit>${e(item.question)}</h2><p data-fit>${e(item.answer)}</p></article>`).join('')}</div>${p(d.closing, 'app-summary-closing')}`;
  } else {
    throw new Error(`Unsupported application kind: ${s.applicationKind}`);
  }
  return `<div class="application-body app-kind-${e(s.applicationKind)}" role="group" aria-label="${e(d.description)}">${p(d.lead, 'app-lead')}${content}${p(d.caption, 'app-caption')}</div>`;
}
