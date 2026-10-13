const layouts = new Set(['cover', 'loop', 'comparison']);
const tones = new Set(['blue', 'orange', 'green']);
const nonempty = value => typeof value === 'string' && value.trim().length > 0;

export function validateDeck(deck, sources) {
  const errors = [];
  const requireText = (value, label) => { if (!nonempty(value)) errors.push(`${label}: nonempty text required`); };
  requireText(deck?.title, 'title');
  if (!Array.isArray(deck?.slides) || !deck.slides.length) return [...errors, 'slides: nonempty array required'];
  const sourceMap = new Map((Array.isArray(sources?.sources) ? sources.sources : Array.isArray(sources) ? sources : []).map(s => [s.id, s]));
  const ids = new Set();
  for (const slide of deck.slides) {
    if (!slide || typeof slide !== 'object') { errors.push('slide: object required'); continue; }
    const label = slide.id || 'slide';
    for (const key of ['id', 'title', 'section']) requireText(slide[key], `${label}.${key}`);
    if (ids.has(slide.id)) errors.push(`${label}: duplicate id`);
    ids.add(slide.id);
    if (!layouts.has(slide.layout)) errors.push(`${label}: unsupported layout ${slide.layout}`);
    if (!Array.isArray(slide.notes) || !slide.notes.length || slide.notes.some(n => !nonempty(n))) errors.push(`${label}: notes required`);
    if (!Array.isArray(slide.sourceIds) || !slide.sourceIds.length) errors.push(`${label}: sourceIds required`);
    else for (const id of slide.sourceIds) {
      const source = sourceMap.get(id);
      if (!source) errors.push(`${label}: unknown source ${id}`);
      else if (!/^https?:\/\//.test(source.url || '') || !/^\d{4}-\d{2}-\d{2}$/.test(source.verifiedOn || '')) errors.push(`${label}: source ${id} missing URL or verification date`);
    }
    if (slide.layout === 'cover') {
      for (const key of ['eyebrow', 'subtitle', 'brand', 'imagePath', 'imageAlt', 'imageCredit']) requireText(slide[key], `${label}.${key}`);
      if (!/^assets\/[\w\s\u0080-\uFFFF./-]+$/.test(slide.imagePath || '') || slide.imagePath.split('/').includes('..')) errors.push(`${label}: imagePath must stay inside assets`);
    } else if (layouts.has(slide.layout)) {
      for (const key of ['chapter', 'sectionLabel', 'eyebrow', 'subtitle', 'sourceLabel']) requireText(slide[key], `${label}.${key}`);
    }
    if (slide.layout === 'loop') {
      for (const key of ['model', 'modelCaption', 'feedback', 'condition']) requireText(slide[key], `${label}.${key}`);
      for (const [name, count] of [['inputs', 3], ['outputs', 2]]) {
        if (!Array.isArray(slide[name]) || slide[name].length !== count) errors.push(`${label}.${name}: expected ${count} items`);
        else for (const item of slide[name]) {
          requireText(item?.label, `${label}.${name}.label`); requireText(item?.text, `${label}.${name}.text`);
          if (!tones.has(item?.tone)) errors.push(`${label}.${name}: unknown tone`);
        }
      }
    }
    if (slide.layout === 'comparison') {
      for (const key of ['exampleLabel', 'example']) requireText(slide[key], `${label}.${key}`);
      if (!Array.isArray(slide.steps) || slide.steps.length !== 3) errors.push(`${label}: expected three steps`);
      else slide.steps.forEach(s => { requireText(s?.label, `${label}.steps.label`); requireText(s?.text, `${label}.steps.text`); });
      if (!Array.isArray(slide.headers) || slide.headers.length !== 3 || slide.headers.some(h => !nonempty(h))) errors.push(`${label}: expected three table headers`);
      if (!Array.isArray(slide.rows) || !slide.rows.length || slide.rows.some(r => !Array.isArray(r) || r.length !== 3 || r.some(c => !nonempty(c)))) errors.push(`${label}: table row must have three text cells`);
      if (!Array.isArray(slide.takeaways) || slide.takeaways.length !== 2) errors.push(`${label}: expected two takeaways`);
      else slide.takeaways.forEach(t => { requireText(t?.title, `${label}.takeaways.title`); requireText(t?.text, `${label}.takeaways.text`); if (!tones.has(t?.tone)) errors.push(`${label}: unknown tone`); });
    }
  }
  return errors;
}
