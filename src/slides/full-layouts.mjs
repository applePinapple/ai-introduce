import path from 'node:path';

// Text is supplied exclusively by the content JSON. These functions own geometry.
export function renderFullLayout(s, e) {
  const list = items => `<ul class="list">${items.map((x, i) => `<li><span class="n">${String(i + 1).padStart(2, '0')}</span><span data-fit>${e(x)}</span></li>`).join('')}</ul>`;
  const card = (title, text, tone = 'blue') => `<div class="frame concept-card ${tone}"><h2 data-fit>${e(title)}</h2><p data-fit>${e(text)}</p></div>`;
  const tail = `${s.takeaway ? `<div class="takeaway" data-fit>${e(s.takeaway)}</div>` : ''}${s.footnote ? `<p class="qualification" data-fit>${e(s.footnote)}</p>` : ''}`;
  let body;
  switch (s.layout) {
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

function network() {
  const layers = [[100, [75,135,195,255,315]], [400,[45,105,165,225,285,345]], [700,[75,135,195,255,315]], [1000,[105,195,285]]];
  let lines = '', circles = '';
  layers.forEach(([x,ys],i) => {
    ys.forEach(y => {
      if(i < layers.length-1) for(const y2 of layers[i+1][1]) lines += `<line x1="${x}" y1="${y}" x2="${layers[i+1][0]}" y2="${y2}" stroke="#D3DBE5" stroke-width="2"/>`;
      circles += `<circle cx="${x}" cy="${y}" r="17" fill="${i === 3 ? '#FFE9DB' : '#E3EAFF'}" stroke="${i === 3 ? '#FF6B1A' : '#2457F5'}" stroke-width="2"/>`;
    });
  });
  return `<svg class="network-figure" viewBox="0 0 1100 390" aria-hidden="true">${lines}${circles}</svg>`;
}
