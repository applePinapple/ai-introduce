// === BLUE PROFESSIONAL: THREE SOURCE-FAITHFUL SAMPLE PAGES ===
// Only the original pages 1, 18 and 25 are rendered. Editorial text remains in
// deck.json; exact original notes and the original cover image come from OOXML.
const escapeHtml = value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const escapeAttribute = value => escapeHtml(value).replace(/\n/g, '&#10;').replace(/\r/g, '&#13;');
function field(tag, text, key, className = '', displayText = text) {
  return `<${tag} class="source-text ${className}" data-source-text="${escapeAttribute(text)}" data-source-key="${key}" data-edit-key="${key}">${escapeHtml(displayText)}</${tag}>`;
}
function originalPage(inventory, number) {
  const page = inventory.slides.find(slide => slide.number === number);
  if (!page?.notes?.bodyText) throw new Error(`Original PPTX page ${number} and its full notes are required`);
  return page;
}
function notes(page) {
  return `<template data-speaker-notes data-original-slide="${page.number}">${escapeHtml(page.notes.bodyText)}</template>`;
}
function footer(page) {
  const text = page.shapes.map(shape => shape.text).find(text => /^\d{2} \/ 39$/.test(text));
  if (!text) throw new Error(`Original footer missing on page ${page.number}`);
  return field('div', text, `original.${page.number}.pageNumber`, 'original-page-number');
}
function sectionStart(content, page, kind, active = false) {
  return `<section class="slide sample-${kind}${active ? ' active visible' : ''}" id="original-slide-${page.number}" data-original-slide="${page.number}" data-source-id="${escapeAttribute(content.id)}" aria-label="${escapeAttribute(content.title)}" aria-hidden="${!active}">${field('p', content.section, `${content.id}.section`, 'section-label')}`;
}
function cover(deck, content, page) {
  const metadata = page.shapes.map(shape => shape.text).find(text => text.includes(deck.audience) && text.includes('分钟'));
  if (!metadata) throw new Error('Original cover audience and duration text is missing');
  return `${sectionStart(content, page, 'cover', true)}
    <div class="cover-accent" aria-hidden="true"></div>
    <div class="cover-divider" aria-hidden="true"></div>
    ${field('h1', content.title, `${content.id}.title`, 'cover-title')}
    ${field('p', content.subtitle ?? deck.subtitle, `${content.id}.subtitle`, 'cover-subtitle')}
    <figure class="cover-image-frame"><img class="original-cover-image" src="assets/original-image-1.png" alt="" data-original-image="ppt/media/image-1-1.png" width="1672" height="941"></figure>
    ${field('p', metadata, `${content.id}.audienceAndDuration`, 'cover-meta')}
    ${footer(page)}${notes(page)}
  </section>`;
}
function rag(content, page) {
  if (content.items?.length !== 4) throw new Error('The original four-step RAG flow is required');
  const steps = content.items.map((item, index) => `<li class="rag-step">
    ${field('span', String(index + 1).padStart(2, '0'), `${content.id}.stepNumber.${index}`, 'step-node')}
    <div class="step-copy">${field('h3', item.label, `${content.id}.items.${index}.label`, 'step-title')}${field('p', item.description, `${content.id}.items.${index}.description`, 'step-description')}</div>
  </li>`).join('\n');
  return `${sectionStart(content, page, 'rag')}
    <div class="rag-divider" aria-hidden="true"></div>
    ${field('h2', content.title, `${content.id}.title`, 'rag-title')}
    ${field('p', content.subtitle, `${content.id}.subtitle`, 'rag-subtitle', content.subtitle.replace('，', '，\n'))}
    <ol class="rag-steps">${steps}</ol>
    ${field('p', content.takeaway, `${content.id}.takeaway`, 'rag-takeaway')}
    ${footer(page)}${notes(page)}
  </section>`;
}
function trace(content, page) {
  if (content.headers?.length !== 3 || content.rows?.length !== 4) throw new Error('The complete original three-column, four-row table is required');
  const header = content.headers.map((text, column) => field('th', text, `${content.id}.headers.${column}`)).join('');
  const rows = content.rows.map((row, index) => `<tr>${row.map((text, column) => field(column === 0 ? 'th' : 'td', text, `${content.id}.rows.${index}.${column}`)).join('')}</tr>`).join('\n');
  return `${sectionStart(content, page, 'trace')}
    ${field('h2', content.title, `${content.id}.title`, 'trace-title')}
    <table class="trace-table" aria-label="${escapeAttribute(content.title)}"><colgroup><col class="trace-col-step"><col class="trace-col-feedback"><col class="trace-col-next"></colgroup><thead><tr>${header}</tr></thead><tbody>${rows}</tbody></table>
    ${field('p', content.footnote, `${content.id}.footnote`, 'trace-footnote')}
    ${footer(page)}${notes(page)}
  </section>`;
}
export function renderSamples(deck, inventory) {
  if (inventory.summary?.slideCount !== 39) throw new Error('Expected the inspected 39-page original PPTX');
  const selected = [1, 18, 25];
  const pages = selected.map(number => originalPage(inventory, number));
  const content = selected.map(number => deck.slides[number - 1]);
  for (let index = 0; index < selected.length; index++) {
    const normalize = text => String(text).replace(/\s+/g, '');
    if (!normalize(pages[index].allText).includes(normalize(content[index].title))) throw new Error(`deck.json page ${selected[index]} does not match the original title`);
  }
  return [cover(deck, content[0], pages[0]), rag(content[1], pages[1]), trace(content[2], pages[2])].join('\n');
}
