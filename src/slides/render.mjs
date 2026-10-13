import path from 'node:path';
import { validateDeck } from './validate.mjs';

export const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const e = escapeHtml;

// Original reference geometry, with unique ids instead of the repeated #fade.
// Print adaptation: use an opaque stroke gradient instead of an alpha overlay.
// #DCE3EB is #D3DBE5 composited with the reference's 35% #EEF2F6 overlay;
// the outer .grid opacity remains .55. This preserves the screen appearance
// while avoiding Chromium PDF's inconsistent transparent SVG soft-mask output.
function grid(id) {
  let lines = '';
  for (let x = -1400; x <= 3300; x += 190) lines += `<line x1="960" y1="330" x2="${x}" y2="1080" stroke="url(#fade-${id})" stroke-width="1"/>`;
  let y = 370, step = 8;
  while (y < 1080) { lines += `<line x1="0" y1="${y}" x2="1920" y2="${y}" stroke="url(#fade-${id})" stroke-width="1"/>`; step *= 1.32; y += step; }
  return `<svg class="grid" aria-hidden="true" viewBox="0 0 1920 1080" preserveAspectRatio="none"><defs><linearGradient id="fade-${id}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="1080"><stop offset="0" stop-color="#EEF2F6"/><stop offset=".55" stop-color="#EEF2F6"/><stop offset="1" stop-color="#DCE3EB"/></linearGradient></defs>${lines}</svg>`;
}
const header = s => `<div class="head"><div class="sec"><i></i><b data-fit>${e(s.chapter)}</b><span data-fit>${e(s.sectionLabel)}</span></div><div data-fit>${e(s.eyebrow)}</div></div><h1 data-fit>${e(s.title)}<small>${e(s.subtitle)}</small></h1>`;
const step = s => `<div class="step ${e(s.tone)}"><span class="lab" data-fit>${e(s.label)}</span><div data-fit>${e(s.text)}</div></div>`;

function slideContent(s, index) {
  if (s.layout === 'cover') return `<div class="txt"><div class="eb" data-fit>${e(s.eyebrow)}</div><h1 data-fit>${e(s.title)}</h1><p data-fit>${e(s.subtitle)}</p></div><div class="brand" data-fit>${e(s.brand)}</div><div class="band"><img src="media/${e(path.basename(s.imagePath))}" alt="${e(s.imageAlt)}"><span class="image-credit" data-fit>${e(s.imageCredit)}</span></div>`;
  if (s.layout === 'loop') return `${header(s)}<div class="body loop-body"><div class="loop-row"><div class="col loop-inputs"><div class="chain">${s.inputs.map(step).join('')}</div></div><div class="arrow" aria-hidden="true">→</div><div class="frame loop-model"><b data-fit>${e(s.model)}</b><span data-fit>${e(s.modelCaption)}</span></div><div class="arrow" aria-hidden="true">→</div><div class="col loop-outputs"><div class="chain">${s.outputs.map(step).join('')}</div></div></div><svg class="loop-feedback" viewBox="0 0 1310 112" role="img" aria-label="${e(s.feedback)}"><defs><marker id="return-${index}" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path d="M1 1 L9 5 L1 9" fill="none" stroke="#1B9E77" stroke-width="1.5"/></marker></defs><path d="M1288 0 V78 H24 V6" stroke="#1B9E77" stroke-width="2.5" fill="none" marker-end="url(#return-${index})"/><rect x="428" y="53" width="455" height="49" rx="10" fill="#EEF2F6"/><text data-fit x="655" y="87" text-anchor="middle" font-size="28" fill="#1B9E77">${e(s.feedback)}</text></svg><div class="loop-condition" data-fit>${e(s.condition)}</div></div>`;
  return `${header(s)}<div class="body comparison-body"><div class="col comparison-example"><div class="frame"><div class="tag blue" data-fit>${e(s.exampleLabel)}</div><div class="big" data-fit>${e(s.example)}</div></div><ul class="list">${s.steps.map((x, i) => `<li><span class="n" data-fit>0${i + 1}</span><div><b data-fit>${e(x.label)}</b><div class="cap" data-fit>${e(x.text)}</div></div></li>`).join('')}</ul></div><div class="col comparison-details"><table class="comparison-table"><thead><tr>${s.headers.map(h => `<th data-fit>${e(h)}</th>`).join('')}</tr></thead><tbody>${s.rows.map(row => `<tr>${row.map(c => `<td data-fit>${e(c)}</td>`).join('')}</tr>`).join('')}</tbody></table><div class="stats">${s.takeaways.map(t => `<div class="stat ${e(t.tone)}"><div class="v" data-fit>${e(t.title)}</div><div class="k" data-fit>${e(t.text)}</div></div>`).join('')}</div></div></div>`;
}

export function speakerNotes(deck, sources) {
  const items = Array.isArray(sources) ? sources : sources.sources;
  const sourceMap = new Map(items.map(s => [s.id, s]));
  return deck.slides.map((s, i) => ({ page: i + 1, id: s.id, title: s.title, notes: s.notes, sources: s.sourceIds.map(id => sourceMap.get(id)) }));
}

export function renderDeck(deck, sources, { css = '', runtime = '' } = {}) {
  const errors = validateDeck(deck, sources);
  if (errors.length) throw new Error(errors.join('\n'));
  const notes = speakerNotes(deck, sources);
  const sections = deck.slides.map((s, i) => `<section class="slide${s.layout === 'cover' ? ' cover' : ''}${i === 0 ? ' active' : ''}" data-id="${e(s.id)}" data-sec="${e(s.section)}" data-title="${e(s.title)}" aria-label="${i + 1}. ${e(s.title)}">${grid(i)}${slideContent(s, i)}${s.sourceLabel ? `<div class="foot"><div class="src" data-fit>${e(s.sourceLabel)}</div></div>` : ''}<template data-speaker-notes>${notes[i].notes.map(p => `<p>${e(p)}</p>`).join('')}<ul>${notes[i].sources.map(ref => `<li>${e(ref.title)} · ${e(ref.publisher)} · <a href="${e(ref.url)}">${e(ref.url)}</a> · 核验 ${e(ref.verifiedOn)}</li>`).join('')}</ul></template></section>`).join('\n');
  return `<!doctype html>\n<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${e(deck.title)}</title><style>${css}</style></head><body><main id="stage">${sections}</main><div id="nav-hot"></div><nav id="nav-btn" aria-label="幻灯片导航"><button type="button" class="b" id="nb-prev" aria-label="上一页">‹</button><span class="pg" id="nb-pg" aria-live="polite">1 / ${deck.slides.length}</span><button type="button" class="b" id="nb-next" aria-label="下一页">›</button><button type="button" class="b" id="nb-list" aria-label="页面目录" aria-controls="nav-panel" aria-expanded="false">☰</button></nav><div id="nav-panel" aria-label="页面目录"></div><div id="hud"></div><script>${runtime}</script></body></html>`;
}
