import path from 'node:path';
import { readFileSync } from 'node:fs';

// Text is supplied exclusively by the content JSON. These functions own geometry.
export function renderFullLayout(s, e) {
  const list = items => `<ul class="list">${items.map((x, i) => `<li><span class="n">${String(i + 1).padStart(2, '0')}</span><span data-fit>${e(x)}</span></li>`).join('')}</ul>`;
  const card = (title, text, tone = 'blue') => `<div class="frame concept-card ${tone}"><h2 data-fit>${e(title)}</h2><p data-fit>${e(text)}</p></div>`;
  const tail = `${s.takeaway ? `<div class="takeaway" data-fit>${e(s.takeaway)}</div>` : ''}${s.footnote ? `<p class="qualification" data-fit>${e(s.footnote)}</p>` : ''}`;
  let body;
  switch (s.layout) {
    case 'definition':
      body = `<div class="definition-panel"><p class="definition-statement" data-fit>${e(s.definition)}</p></div>`; break;
    case 'gallery':
      body = `<div class="picture-gallery picture-gallery-${s.images.length}">${s.images.map(img => `<figure class="gallery-picture"><img src="media/${e(path.basename(img.path))}" alt="${e(img.alt)}" style="object-fit:${e(img.fit || 'contain')};object-position:${e(img.position || 'center')}"></figure>`).join('')}</div>`; break;
    case 'relationship':
      body = relationship(s, e); break;
    case 'waves':
      body = `<div class="wave-chart"><svg class="wave-connectors" viewBox="0 0 1712 740" aria-hidden="true"><path d="M48 116V334M904 116V334M478 398V434H278V470M1334 398V434H1068V470"/><circle cx="478" cy="398" r="5"/><circle cx="1334" cy="398" r="5"/></svg><div class="wave-periods">${s.eras.map(era => `<div class="wave-period"><span data-fit>${e(era.period)}</span></div>`).join('')}</div>${s.eras.map((era, i) => `<article class="wave-era wave-era-${i + 1}"><div class="wave-symbol" aria-hidden="true">${waveIcon(era.icon)}</div><div class="wave-copy"><h2 data-fit>${e(era.title)}</h2><ul class="wave-details"><li class="wave-description" data-fit>${e(era.description)}</li><li class="wave-application" data-fit>${e(era.application)}</li></ul></div></article>`).join('')}</div>`; break;
    case 'product':
      body = `<div class="product-overview"><figure class="product-visual"><div class="product-identity"><h2 data-fit>${e(s.productName)}</h2><span data-fit>${e(s.productMeta)}</span></div><div class="frame product-image${s.detailImagePath ? ' product-image-pair' : ''}"><img src="media/${e(path.basename(s.imagePath))}" alt="${e(s.imageAlt)}">${s.detailImagePath ? `<img src="media/${e(path.basename(s.detailImagePath))}" alt="${e(s.detailImageAlt)}">` : ''}</div><figcaption><p data-fit>${e(s.caption)}</p><span data-fit>${e(s.imageCredit)}</span></figcaption></figure><div class="product-facts">${s.facts.map((fact, i) => `<article class="product-fact"><h2 data-fit><span>${String(i + 1).padStart(2, '0')}</span>${e(fact.label)}</h2><p data-fit>${e(fact.text)}</p></article>`).join('')}</div></div><div class="product-process">${s.steps.map((item, i) => `<div class="product-process-step"><span class="product-step-number" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span><div><h3 data-fit>${e(item.label)}</h3><p data-fit>${e(item.text)}</p></div></div>${i < s.steps.length - 1 ? '<span class="product-process-arrow" aria-hidden="true">→</span>' : ''}`).join('')}</div>`; break;
    case 'spotlight':
      body = `<div class="split"><div class="lead" data-fit>${e(s.lead)}</div><div class="spot-list">${list(s.bullets)}</div></div>`; break;
    case 'closing':
    case 'bullets':
      body = `<div class="closing-list">${list(s.bullets)}</div>`; break;
    case 'duo':
      body = `<div class="duo">${s.columns.map((c, i) => `<div class="frame duo-card ${i ? 'orange' : 'blue'}"><h2 data-fit>${e(c.title)}</h2>${list(c.bullets)}</div>`).join('')}</div>`; break;
    case 'table':
      body = `<div class="frame full-table"><table><thead><tr>${s.headers.map(h => `<th data-fit>${e(h)}</th>`).join('')}</tr></thead><tbody>${s.rows.map(row => `<tr>${row.map(c => `<td data-fit>${e(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`; break;
    case 'timeline':
    case 'process':
      body = `<div class="flow ${s.layout}">${s.items.map((item, i) => `<div class="flow-item"><span class="flow-number" data-fit>${String(i + 1).padStart(2, '0')}</span>${card(item.label, item.description, ['blue','blue','orange','green'][i % 4])}</div>${i < s.items.length - 1 ? '<div class="flow-arrow" aria-hidden="true">→</div>' : ''}`).join('')}</div>`; break;
    case 'example':
      body = `<div class="example-stack"><div class="frame question"><span class="tag blue">${e(s.promptLabel)}</span><p data-fit>${e(s.prompt)}</p></div><div class="frame answer"><span class="tag green">${e(s.responseLabel)}</span><p data-fit>${e(s.response)}</p></div>${s.caption ? `<p class="qualification" data-fit>${e(s.caption)}</p>` : ''}</div>`; break;
    case 'image':
      body = `<div class="split image-split"><figure><div class="frame"><img src="media/${e(path.basename(s.imagePath))}" alt="${e(s.caption)}"></div><figcaption data-fit>${e(s.caption)}</figcaption></figure>${list(s.bullets || [])}</div>`; break;
    case 'diagram':
      body = `<div class="diagram-area">${s.diagramKind === 'network' ? network() : ''}<div class="diagram-nodes">${s.nodes.map((n,i) => `${i ? '<div class="flow-arrow" aria-hidden="true">→</div>' : ''}${card(n.label,n.description,n.tone)}`).join('')}</div>${s.feedback ? `<div class="diagram-feedback" data-fit>↶ ${e(s.feedback)}</div>` : ''}${s.bullets ? list(s.bullets) : ''}</div>`; break;
    default: return null;
  }
  return `<div class="body full-body layout-${e(s.layout)}">${body}${tail}</div>`;
}

function relationship(s, e) {
  const centers = s.relations.map((_, i) => 96 + i * 92);
  const markers = ['rules', 'learning', 'deep'].map(route => `<marker id="relation-${e(s.id)}-${route}" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M1 1 L6 4 L1 7" fill="none" stroke="var(${route === 'rules' ? '--yellow' : route === 'learning' ? '--muted' : '--blue'})" stroke-width="1.6"/></marker>`).join('');
  const edges = s.relations.map((r, i) => {
    const y = centers[i];
    const start = r.route === 'rules' ? [448, 194, 526] : r.route === 'learning' ? [428, 411, 566] : [428, 589, 622];
    const color = r.route === 'rules' ? '--yellow' : r.route === 'learning' ? '--muted' : '--blue';
    return `<path class="relation-path" d="M${start[0]} ${start[1]}H${start[2]}V${y}H710" stroke="var(${color})" marker-end="url(#relation-${e(s.id)}-${r.route})"/><path class="relation-path" d="M1110 ${y}H1170" stroke="var(${color})" marker-end="url(#relation-${e(s.id)}-${r.route})"/>`;
  }).join('');
  return `<div class="relationship-map"><div class="relation-heading relation-heading-taxonomy" data-fit>${e(s.columnLabels[0])}</div><div class="relation-heading relation-heading-capability" data-fit>${e(s.columnLabels[1])}</div><div class="relation-heading relation-heading-scenario" data-fit>${e(s.columnLabels[2])}</div><div class="relation-taxonomy"><h2 data-fit>${e(s.taxonomy.ai)}</h2><div class="relation-rules" data-fit>${e(s.taxonomy.rules)}</div><div class="relation-learning"><h3 data-fit>${e(s.taxonomy.learning)}</h3><div class="relation-traditional" data-fit>${e(s.taxonomy.traditional)}</div><div class="relation-deep" data-fit>${e(s.taxonomy.deep)}</div></div></div><svg class="relationship-edges" viewBox="0 0 1712 710" aria-hidden="true"><defs>${markers}</defs>${edges}</svg>${s.relations.map((r, i) => `<div class="relation-row relation-route-${e(r.route)}" style="top:${56 + i * 92}px"><div class="relation-capability" data-fit>${e(r.capability)}</div><div class="relation-scenario" data-fit>${e(r.scenarios)}</div></div>`).join('')}</div>`;
}

function waveIcon(icon) {
  if (icon === 'deepseek') return readFileSync(new URL('../../assets/brand/deepseek-logo.svg', import.meta.url), 'utf8');
  const glyphs = {
    rules: '<rect x="24" y="9" width="16" height="13" rx="3"/><path d="M32 22v11M12 33h40M12 33v9M32 33v9M52 33v9"/><rect x="5" y="43" width="14" height="12" rx="3"/><rect x="25" y="43" width="14" height="12" rx="3"/><rect x="45" y="43" width="14" height="12" rx="3"/>',
    learning: '<path d="M9 9v46h47M16 45l12-11 11 3 14-20"/><circle cx="18" cy="24" r="3"/><circle cx="30" cy="15" r="3"/><circle cx="42" cy="47" r="3"/><circle cx="52" cy="31" r="3"/>',
    network: '<path d="M10 17l22-8 22 8-22 15-22-15 22 36 22-36M10 47l22-15 22 15-22 8-22-8 22-38 22 38"/><circle cx="10" cy="17" r="4"/><circle cx="10" cy="47" r="4"/><circle cx="32" cy="9" r="4"/><circle cx="32" cy="32" r="4"/><circle cx="32" cy="55" r="4"/><circle cx="54" cy="17" r="4"/><circle cx="54" cy="47" r="4"/>',
    language: '<path d="M11 11h42a4 4 0 014 4v28a4 4 0 01-4 4H28L14 57V47h-3a4 4 0 01-4-4V15a4 4 0 014-4zM18 23h28M18 34h18"/><path d="M46 5v10M41 10h10"/>',
  };
  return `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${glyphs[icon]}</svg>`;
}

function network() {
  const layers = [[100, [75,135,195,255,315]], [400,[45,105,165,225,285,345]], [700,[75,135,195,255,315]], [1000,[105,195,285]]];
  let lines = '', circles = '';
  layers.forEach(([x,ys],i) => {
    ys.forEach(y => {
      if(i < layers.length-1) for(const y2 of layers[i+1][1]) lines += `<line x1="${x}" y1="${y}" x2="${layers[i+1][0]}" y2="${y2}" stroke="var(--line)" stroke-width="2"/>`;
      circles += `<circle cx="${x}" cy="${y}" r="17" fill="var(${i === 3 ? '--orange-soft' : '--blue-soft'})" stroke="var(${i === 3 ? '--orange' : '--blue'})" stroke-width="2"/>`;
    });
  });
  return `<svg class="network-figure" viewBox="0 0 1100 390" aria-hidden="true">${lines}${circles}</svg>`;
}
