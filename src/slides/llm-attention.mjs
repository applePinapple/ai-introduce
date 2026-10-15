// Editable reconstruction of video 004, 08:30–12:30, on the ReinBee content canvas.
const C = { blue: '#194DF9', yellow: '#F7AC01', ink: '#0B1220', gray: '#5B6B7F', lightBlue: '#E7EDFF', lightYellow: '#FFF2CC', white: '#FFF' };
const number = v => Number(v.toFixed(2));

export function renderLlmAttention(s, e) {
  const d = s.llmData;
  const uid = `llma-${s.id.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
  const text = (x, y, value, size = 30, color = C.ink, anchor = 'start', extra = '') => `<text data-fit x="${x}" y="${y}" font-size="${size}" fill="${color}" text-anchor="${anchor}" ${extra}>${e(value)}</text>`;
  const line = (x1, y1, x2, y2, color = C.gray, width = 1.5, extra = '') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${width}" ${extra}/>`;
  const defs = `<defs>${['blue', 'yellow', 'gray'].map(tone => `<marker id="${uid}-arrow-${tone}" markerWidth="13" markerHeight="13" refX="10" refY="6" markerUnits="userSpaceOnUse" orient="auto"><path d="M0,0 L12,6 L0,12 Z" fill="${C[tone]}"/></marker>`).join('')}</defs>`;
  const svg = body => `<svg class="llma-svg" viewBox="0 0 1712 770" role="img" aria-label="${e(d.description)}" xmlns="http://www.w3.org/2000/svg">${defs}${body}</svg>`;
  const lead = d.lead ? `<p class="llma-lead" data-fit>${e(d.lead)}</p>` : '';
  const caption = () => text(856, 710, d.caption, 30, C.ink, 'middle') + (d.qualifier ? text(856, 753, d.qualifier, 22, C.gray, 'middle') : '');

  if (s.llmKind === 'attention-context') {
    return `<article class="llm-module-body llma-canvas llma-context" aria-label="${e(d.description)}"><div class="llma-context-badge" data-fit>${e(d.badge)}</div><div class="llma-context-copy">${d.paragraphs.map(p => `<p data-fit>${e(p)}</p>`).join('')}</div></article>`;
  }

  if (s.llmKind.startsWith('attention-')) {
    let body = line(350, 550, 1540, 550, C.gray, 1.3, `marker-end="url(#${uid}-arrow-gray)"`) + line(850, 630, 850, 180, C.gray, 1.3, `marker-end="url(#${uid}-arrow-gray)"`);
    for (const v of d.vectors) {
      body += line(...v.from, ...v.to, C[v.tone], v.tone === 'blue' ? 2.4 : 2, `${v.dashed ? 'stroke-dasharray="7 6" ' : ''}marker-end="url(#${uid}-arrow-${v.tone})"`);
      body += text(v.labelPosition[0], v.labelPosition[1], v.label, 30, v.tone === 'blue' ? C.blue : C.ink);
    }
    body += `<circle cx="850" cy="550" r="3.5" fill="${C.blue}"/>`;
    if (s.llmKind === 'attention-composite') {
      body += d.asciiRows.map((row, i) => text(1225, 192 + i * 22, row, 22, i % 5 === 0 ? C.gray : C.blue, 'start', 'font-family="Consolas,monospace" xml:space="preserve"')).join('');
    }
    return `<div class="llm-module-body llma-canvas">${svg(body + caption())}${lead}</div>`;
  }

  if (s.llmKind.startsWith('transformer-')) {
    const count = d.boards.length;
    const positions = count === 2 ? [300, 850] : count === 5 ? [80, 335, 590, 845, 1100] : [30, 265, 500, 735, 970, 1370];
    const width = count === 2 ? 420 : count === 5 ? 320 : 300;
    const top = 258, rise = 85, height = 360;
    let body = '';
    for (let i = 0; i < count; i++) {
      const b = d.boards[i], x = positions[i], slope = -rise / width;
      const face = b.kind === 'attention' ? C.blue : b.kind === 'mlp' ? C.lightYellow : C.lightBlue;
      const edge = b.kind === 'mlp' ? C.yellow : C.blue;
      const texture = b.kind === 'attention' ? C.white : C.gray;
      // Slight thickness and a sloping top preserve the video's separated 3D layers.
      body += `<polygon points="${x},${top} ${x + width},${top - rise} ${x + width + 9},${top - rise - 10} ${x + 9},${top - 10}" fill="${edge}" opacity=".8"/>`;
      body += `<polygon points="${x + width},${top - rise} ${x + width + 9},${top - rise - 10} ${x + width + 9},${top - rise + height - 10} ${x + width},${top - rise + height}" fill="${edge}" opacity=".55"/>`;
      body += `<polygon points="${x},${top} ${x + width},${top - rise} ${x + width},${top - rise + height} ${x},${top + height}" fill="${face}" stroke="${edge}" stroke-width="1.7"/>`;
      // In the stacked views MLP labels sit over the preceding blue attention plane.
      body += text(x + 10, top - 27, b.label, 30, b.kind === 'mlp' ? C.white : C.ink, 'start', `transform="rotate(${number(Math.atan(slope) * 180 / Math.PI)} ${x + 10} ${top - 27})" font-weight="600"`);
      let plane = '';
      if (b.kind === 'embedding') {
        d.embeddingRows.forEach((row, j) => plane += text(24, 63 + j * 48, row, 22, C.gray, 'start', 'font-family="Consolas,monospace"'));
      } else {
        for (let row = 0; row < 6; row++) {
          for (let col = 0; col < 5; col++) {
            const xx = 31 + col * (width - 62) / 4, yy = 47 + row * 51;
            plane += `<circle cx="${number(xx)}" cy="${yy}" r="3" fill="${texture}" opacity=".36"/>`;
            if (col < 4) plane += line(xx, yy, xx + (width - 62) / 4, yy, texture, .8, 'opacity=".22"');
            if (row < 5 && (b.kind === 'attention' || col % 2 === 0)) plane += line(xx, yy, 31 + ((col + 2) % 5) * (width - 62) / 4, yy + 51, texture, .8, 'opacity=".18"');
          }
        }
      }
      body += `<g transform="matrix(1 ${number(slope)} 0 1 ${x} ${top})">${plane}</g>`;
    }
    if (d.ellipsis) body += text(count === 6 ? 1325 : 1545, 420, d.ellipsis, 48, C.gray, 'middle');
    body += line(120, 665, 1592, 665, C.gray, 1.5, `marker-end="url(#${uid}-arrow-gray)"`);
    body += text(856, 708, d.flowLabel, 30, C.ink, 'middle');
    body += text(856, 753, d.caption, 26, C.gray, 'middle');
    return `<div class="llm-module-body llma-canvas">${svg(body)}${lead}</div>`;
  }
  throw new Error(`Unsupported attention layout: ${s.llmKind}`);
}
