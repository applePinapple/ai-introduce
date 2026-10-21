// Editable robot-agent diagrams. All audience-facing copy is supplied by robotData.
export const robotKinds = ['vision', 'architecture', 'planner', 'runtime', 'skills', 'task', 'verification', 'recovery', 'memory', 'transfer', 'interface', 'trace', 'benchmark', 'validation', 'roadmap', 'closing'];

const C = { ink: '#0B1220', muted: '#5B6B7F', line: '#D3DBE5', blue: '#194DF9', yellow: '#F7AC01', pale: '#E7EDFF', cream: '#FFF2CC', green: '#1B9E77', lightGreen: '#DDF3EC' };

// Icons are deliberately drawn as geometry, never used as screenshots of technical diagrams.
const icon = (kind, x, y, scale = 1, color = C.blue) => {
  const paths = {
    observe: '<path d="M4 31 Q32 2 60 31 Q32 60 4 31Z"/><circle cx="32" cy="31" r="10"/><path d="M32 17V11 M32 51V45"/>',
    plan: '<rect x="21" y="3" width="22" height="17" rx="4"/><path d="M32 20V32 M10 32H54 M10 32V43 M32 32V43 M54 32V43"/><rect x="2" y="43" width="16" height="16" rx="3"/><rect x="24" y="43" width="16" height="16" rx="3"/><rect x="46" y="43" width="16" height="16" rx="3"/>',
    run: '<path d="M13 51L31 27L47 37L54 17 M5 55H27 M46 9L58 12L60 25"/><circle cx="31" cy="27" r="6"/><circle cx="47" cy="37" r="6"/>',
    verify: '<path d="M32 3L55 12V31Q55 49 32 61Q9 49 9 31V12Z"/><path d="M20 31L29 40L45 23"/>',
    save: '<path d="M8 7H49L57 15V57H8Z"/><path d="M18 7V25H45V7 M18 57V37H47V57 M36 13V20"/>',
    robot: '<rect x="11" y="15" width="42" height="34" rx="9"/><path d="M32 15V7 M25 7H39 M4 25V39 M60 25V39 M21 56H43"/><circle cx="23" cy="29" r="3"/><circle cx="41" cy="29" r="3"/><path d="M24 40H40"/>',
    simulate: '<path d="M32 3L58 17V47L32 62L6 47V17Z M6 17L32 32L58 17 M32 32V62 M19 10L45 25"/>',
    tools: '<path d="M45 4L34 15L41 23L53 12Q61 33 41 37L19 59L6 46L28 24Q27 3 45 4Z"/>',
    context: '<rect x="8" y="8" width="48" height="46" rx="5"/><path d="M18 20H46 M18 31H46 M18 42H35"/>',
    stop: '<path d="M22 4H42L60 22V42L42 60H22L4 42V22Z"/><path d="M32 17V37 M32 46V48"/>',
  };
  return `<g transform="translate(${x} ${y}) scale(${scale})" fill="none" stroke="${color}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[kind] ?? paths.robot}</g>`;
};

const cup = (x, y, scale = 1, tone = C.yellow) => `<g transform="translate(${x} ${y}) scale(${scale})" aria-hidden="true"><path d="M0 0H60L54 72Q30 85 6 72Z" fill="${C.cream}" stroke="${tone}" stroke-width="4"/><path d="M59 10H75Q91 35 65 49H57" fill="none" stroke="${tone}" stroke-width="5"/><ellipse cx="30" cy="0" rx="30" ry="7" fill="#fff" stroke="${tone}" stroke-width="4"/></g>`;

const arm = (x, y, scale = 1, mirrored = false) => `<g transform="translate(${x} ${y}) scale(${mirrored ? -scale : scale} ${scale})" aria-hidden="true">
  <ellipse cx="0" cy="154" rx="75" ry="15" fill="${C.pale}"/>
  <path d="M-58 148H58L42 126H-42Z" fill="#fff" stroke="${C.blue}" stroke-width="4"/>
  <path d="M0 126V82L76 2L166 49" fill="none" stroke="${C.blue}" stroke-width="31" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M0 126V82L76 2L166 49" fill="none" stroke="#fff" stroke-width="21" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="0" cy="82" r="21" fill="${C.pale}" stroke="${C.blue}" stroke-width="4"/><circle cx="76" cy="2" r="20" fill="${C.pale}" stroke="${C.blue}" stroke-width="4"/><circle cx="166" cy="49" r="15" fill="${C.cream}" stroke="${C.yellow}" stroke-width="4"/>
  <path d="M166 64V86 M149 86H183 M149 86V111 M183 86V111" fill="none" stroke="${C.blue}" stroke-width="6" stroke-linecap="round"/>
</g>`;

const mobileRobot = (x, y, scale = 1) => `<g transform="translate(${x} ${y}) scale(${scale})" aria-hidden="true">
  <ellipse cx="115" cy="272" rx="133" ry="21" fill="${C.pale}"/>
  <rect x="34" y="103" width="162" height="133" rx="29" fill="#fff" stroke="${C.blue}" stroke-width="5"/>
  <rect x="52" y="16" width="126" height="86" rx="24" fill="${C.pale}" stroke="${C.blue}" stroke-width="5"/>
  <path d="M115 16V0 M103 0H127" stroke="${C.blue}" stroke-width="5" stroke-linecap="round"/>
  <rect x="72" y="41" width="86" height="35" rx="15" fill="${C.blue}"/><circle cx="94" cy="58" r="5" fill="#fff"/><circle cx="137" cy="58" r="5" fill="#fff"/>
  <rect x="72" y="133" width="86" height="56" rx="9" fill="${C.pale}"/><path d="M88 161H108L118 146L131 175L144 161" fill="none" stroke="${C.blue}" stroke-width="4" stroke-linejoin="round"/>
  <path d="M33 124L4 169L24 202 M197 124L224 163L255 145" fill="none" stroke="${C.blue}" stroke-width="17" stroke-linecap="round"/>
  <circle cx="66" cy="239" r="27" fill="${C.ink}"/><circle cx="164" cy="239" r="27" fill="${C.ink}"/><circle cx="66" cy="239" r="12" fill="#fff"/><circle cx="164" cy="239" r="12" fill="#fff"/>
</g>`;

export function renderRobot(s, e) {
  const d = s.robotData;
  const id = `rb-${s.id.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
  const p = (value, cls) => `<p class="${cls}" data-fit>${e(value)}</p>`;
  const text = (x, y, value, size = 28, color = C.ink, extra = '') => `<text data-fit x="${x}" y="${y}" fill="${color}" font-size="${size}" ${extra}>${e(value)}</text>`;
  const arrow = (x1, y1, x2, y2, tone = 'yellow', dashed = false) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${C[tone]}" stroke-width="3"${dashed ? ' stroke-dasharray="8 7"' : ''} marker-end="url(#${id}-${tone})"/>`;
  const path = (value, tone = 'blue', dashed = false, bidirectional = false) => `<path d="${value}" fill="none" stroke="${C[tone]}" stroke-width="3"${dashed ? ' stroke-dasharray="8 7"' : ''}${bidirectional ? ` marker-start="url(#${id}-${tone})"` : ''} marker-end="url(#${id}-${tone})"/>`;
  const defs = `<defs>${['blue', 'yellow', 'green'].map(tone => `<marker id="${id}-${tone}" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto-start-reverse"><path d="M0 0 L9 4.5 L0 9 Z" fill="${C[tone]}"/></marker>`).join('')}</defs>`;
  const svg = body => `<svg class="robot-svg" viewBox="0 0 1712 770" role="img" aria-label="${e(d.description)}">${defs}${body}</svg>`;
  const card = (item, cls = '', i) => `<article data-robot-card class="robot-card ${cls}">${i === undefined ? '' : `<span class="robot-number" data-fit>${String(i + 1).padStart(2, '0')}</span>`}<h2 data-fit>${e(item.label)}</h2><p data-fit>${e(item.text)}</p></article>`;
  const table = (columns, rows, fields, cls) => `<table class="robot-table ${cls}"><thead><tr>${columns.map(value => `<th data-fit>${e(value)}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${fields.map(field => `<td data-fit>${e(row[field])}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  let content;

  if (s.robotKind === 'vision') {
    content = `<div class="robot-vision-stage">${p(d.brand, 'robot-vision-brand')}</div>${card(d.goal, 'robot-vision-goal robot-blue')}<div class="robot-vision-cards">${d.cards.map((item, i) => card(item, i === 2 ? 'robot-yellow' : '')).join('')}</div>${svg(mobileRobot(118, 230, 1.24) + '<path d="M430 517H683 M455 517V588 M659 517V588" fill="none" stroke="#9BAAC0" stroke-width="6"/>' + cup(543, 420, 1.1) + path('M448 304 Q570 230 659 339', 'blue', true) + icon('verify', 570, 550, 0.75, C.green))}`;
  } else if (s.robotKind === 'architecture') {
    content = `${card(d.input, 'robot-architecture-input')}${card(d.output, 'robot-architecture-output robot-yellow')}<div class="robot-layers">${d.layers.map((item, i) => card(item, `robot-layer-${i + 1}`, i)).join('')}</div>${card(d.memory, 'robot-architecture-memory')}${p(d.feedback, 'robot-architecture-feedback')}${svg(path('M270 323 H280 V139 H330', 'blue') + path('M1360 469 H1417 V323 H1432', 'yellow') + path('M1577 246 V212 H1390 V249 H1370', 'green', true) + path('M338 249 H315 V596 H338', 'blue', false, true))}`;
  } else if (s.robotKind === 'planner') {
    content = `<div class="robot-planner-inputs">${d.inputs.map(item => card(item)).join('')}</div>${card(d.decision, 'robot-planner-decision robot-blue')}<div class="robot-planner-outputs">${d.outputs.map((item, i) => card(item, i === 1 ? 'robot-yellow' : '')).join('')}</div>${p(d.boundary, 'robot-boundary')}${svg([169, 339, 509].map(y => `<line x1="510" y1="${y}" x2="565" y2="${y}" stroke="${C.blue}" stroke-width="3"/>`).join('') + '<path d="M565 169V509" fill="none" stroke="#194DF9" stroke-width="3"/>' + arrow(565, 339, 640, 339, 'blue') + arrow(1072, 339, 1148, 339) + '<path d="M1148 169V509" fill="none" stroke="#F7AC01" stroke-width="3"/>' + [169, 339, 509].map(y => arrow(1148, y, 1192, y)).join('') + icon('plan', 801, 155, 1.6))}`;
  } else if (s.robotKind === 'runtime') {
    content = `<div class="robot-four-steps robot-runtime-steps">${d.steps.map((item, i) => card(item, i === 2 ? 'robot-yellow' : '', i)).join('')}</div><div class="robot-three-controls">${d.controls.map((item, i) => card(item, i === 1 ? 'robot-yellow' : 'robot-blue')).join('')}</div>${svg([365, 814, 1263].map(x => arrow(x, 235, x + 73, 235)).join('') + ['plan', 'run', 'verify', 'observe'].map((kind, i) => icon(kind, 27 + 449 * i, 129, 0.8)).join(''))}`;
  } else if (s.robotKind === 'skills') {
    content = `${table(d.columns, d.rows, ['phase', 'capability', 'reason'], 'robot-skills-table')}${card(d.routing, 'robot-routing robot-blue')}${svg(arm(1330, 416, 0.91) + cup(1558, 506, 0.68) + '<path d="M1254 593H1700" stroke="#9BAAC0" stroke-width="5"/>')}`;
  } else if (s.robotKind === 'task') {
    content = `${p(d.scenario, 'robot-task-scenario')}<div class="robot-five-steps">${d.steps.map((item, i) => card(item, i === 2 ? 'robot-yellow' : '', i)).join('')}</div>${p(d.success, 'robot-task-success')}${svg('<rect x="0" y="104" width="780" height="229" rx="16" fill="#E7EDFF"/><path d="M28 294H743" stroke="#AAB6C9" stroke-width="5"/>' + arm(164, 161, 0.79) + cup(493, 231, 0.73) + arrow(389, 237, 464, 237, 'blue', true) + [306, 657, 1008, 1359].map(x => arrow(x, 472, x + 35, 472)).join(''))}`;
  } else if (s.robotKind === 'verification') {
    content = `${table(d.columns, d.rows, ['claim', 'evidence', 'decision'], 'robot-verification-table')}${card(d.rule, 'robot-rule')}`;
  } else if (s.robotKind === 'recovery') {
    content = `<div class="robot-four-steps robot-recovery-steps">${d.steps.map((item, i) => card(item, i === 0 ? 'robot-yellow' : '', i)).join('')}</div><div class="robot-triggers">${d.triggers.map(item => card(item, 'robot-yellow')).join('')}</div>${p(d.stop, 'robot-recovery-stop')}${svg([365, 814, 1263].map(x => arrow(x, 225, x + 73, 225)).join('') + path('M1530 349 V381 H183 V350', 'blue', true))}`;
  } else if (s.robotKind === 'memory') {
    content = `<div class="robot-memory-folder"><div class="robot-folder-tab"></div>${p(d.brand, 'robot-memory-brand')}<div class="robot-memory-fields">${d.fields.map(item => card(item)).join('')}</div></div><div class="robot-memory-excluded">${d.excluded.map(value => `<p data-fit><span aria-hidden="true">×</span>${e(value)}</p>`).join('')}</div><div class="robot-memory-reuse">${d.reuse.map(value => `<p data-fit><span aria-hidden="true">✓</span>${e(value)}</p>`).join('')}</div>${svg(arrow(1111, 419, 1175, 419, 'blue'))}`;
  } else if (s.robotKind === 'transfer') {
    content = `${card(d.before, 'robot-transfer-before')}${card(d.after, 'robot-transfer-after')}<div class="robot-transfer-steps">${d.steps.map((item, i) => card(item, i === 1 ? 'robot-blue' : '', i)).join('')}</div>${svg('<path d="M36 397H764 M948 397H1676" stroke="#AAB6C9" stroke-width="5"/>' + arm(180, 261, 0.78) + arm(1092, 261, 0.78) + cup(422, 330, 0.75) + cup(1516, 330, 0.75) + '<rect x="1326" y="319" width="71" height="81" rx="8" fill="none" stroke="#D3DBE5" stroke-width="3" stroke-dasharray="7 6"/>' + arrow(1407, 351, 1494, 351, 'blue', true) + arrow(812, 297, 898, 297) + text(34, 433, d.sceneLabels[0], 25, C.muted) + text(946, 433, d.sceneLabels[1], 25, C.muted) + text(448, 307, d.sceneLabels[2], 27, C.blue, 'text-anchor="middle"') + text(1537, 307, d.sceneLabels[3], 27, C.blue, 'text-anchor="middle"'))}`;
  } else if (s.robotKind === 'interface') {
    content = `<div class="robot-interface-inputs">${d.inputs.map(value => p(value, 'robot-interface-chip')).join('')}</div><div class="robot-interface-layers">${d.layers.map((item, i) => card(item, i === 1 ? 'robot-blue' : '', i)).join('')}</div><div class="robot-interface-outputs">${d.outputs.map(value => p(value, 'robot-interface-chip')).join('')}</div>${p(d.boundary, 'robot-boundary')}${svg([171, 287, 403].map(y => arrow(310, y, 388, y, 'blue')).join('') + [171, 287, 403].map(y => arrow(1324, y, 1398, y)).join('') + icon('robot', 553, 514, 1.05) + icon('run', 823, 514, 1.05) + icon('tools', 1093, 514, 1.05))}`;
  } else if (s.robotKind === 'trace') {
    content = `${table(d.columns, d.rows, ['time', 'action', 'observation', 'decision'], 'robot-trace-table')}${p(d.provenance, 'robot-trace-provenance')}`;
  } else if (s.robotKind === 'benchmark') {
    content = `<article data-robot-card class="robot-benchmark-reference"><h2 data-fit>${e(d.reference.label)}</h2><div class="robot-benchmark-value"><b data-fit>${e(d.reference.rate)}</b><span data-fit>${e(d.reference.count)}</span></div><ul>${d.reference.conditions.map(value => `<li data-fit>${e(value)}</li>`).join('')}</ul><p data-fit>${e(d.reference.disclaimer)}</p></article><div class="robot-benchmark-criteria">${d.criteria.map((item, i) => card(item, '', i)).join('')}</div>${card(d.company, 'robot-benchmark-company robot-yellow')}`;
  } else if (s.robotKind === 'validation') {
    content = `${p(d.scenario, 'robot-validation-scenario')}<div class="robot-validation-stages">${d.stages.map((item, i) => card(item, i === 2 ? 'robot-yellow' : 'robot-blue', i)).join('')}</div><div class="robot-validation-gates">${d.gates.map(item => card(item)).join('')}</div>${svg(['simulate', 'run', 'robot'].map((kind, i) => icon(kind, 45 + 596 * i, 150, 1.45)).join('') + arrow(520, 288, 584, 288) + arrow(1116, 288, 1180, 288))}`;
  } else if (s.robotKind === 'roadmap') {
    content = `<div class="robot-roadmap-phases">${d.phases.map((item, i) => `<article data-robot-card class="robot-roadmap-phase"><span class="robot-number" data-fit>${String(i + 1).padStart(2, '0')}</span><h2 data-fit>${e(item.label)}</h2><p class="robot-phase-scope" data-fit>${e(item.scope)}</p><p class="robot-phase-gate" data-fit>${e(item.gate)}</p></article>`).join('')}</div><div class="robot-roadmap-metrics">${d.metrics.map(value => p(value, 'robot-metric')).join('')}</div>${svg(arrow(520, 292, 584, 292) + arrow(1116, 292, 1180, 292))}`;
  } else if (s.robotKind === 'closing') {
    content = `${p(d.brand, 'robot-closing-brand')}${p(d.statement, 'robot-closing-statement')}<div class="robot-closing-pillars">${d.pillars.map((item, i) => card(item, i === 2 ? 'robot-yellow' : '')).join('')}</div><div class="robot-closing-questions">${d.questions.map(value => p(value, 'robot-closing-question')).join('')}</div>${svg(['plan', 'context', 'run', 'verify'].map((kind, i) => icon(kind, 28 + 440 * i, 300, 0.95, i === 2 ? C.yellow : C.blue)).join(''))}`;
  } else {
    throw new Error(`Unsupported robot kind: ${s.robotKind}`);
  }
  return `<div class="robot-body robot-kind-${e(s.robotKind)}" role="group" aria-label="${e(d.description)}">${p(d.lead, 'robot-lead')}${content}${p(d.bottomLine, 'robot-bottom')}${p(d.caption, 'robot-caption')}</div>`;
}
