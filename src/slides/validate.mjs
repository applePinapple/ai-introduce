const layouts = new Set(['cover', 'loop', 'comparison', 'spotlight', 'closing', 'bullets', 'duo', 'table', 'timeline', 'definition', 'waves', 'product', 'gallery', 'relationship', 'process', 'example', 'image', 'diagram']);
const tones = new Set(['blue', 'orange', 'green']);
const waveIcons = new Set(['rules', 'learning', 'network', 'language', 'deepseek']);
const relationRoutes = new Set(['rules', 'learning', 'deep']);
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
    if (slide.theme !== undefined && slide.theme !== 'reinbee') errors.push(`${label}.theme: unsupported theme`);
    if (!Array.isArray(slide.notes) || !slide.notes.length || slide.notes.some(n => !nonempty(n))) errors.push(`${label}: notes required`);
    if (!Array.isArray(slide.sourceIds) || (!slide.sourceIds.length && slide.contentKind !== 'presentation-plan')) errors.push(`${label}: sourceIds required`);
    else for (const id of slide.sourceIds) {
      const source = sourceMap.get(id);
      if (!source) errors.push(`${label}: unknown source ${id}`);
      else if (!/^https?:\/\//.test(source.url || '') || !/^\d{4}-\d{2}-\d{2}$/.test(source.verifiedOn || '')) errors.push(`${label}: source ${id} missing URL or verification date`);
    }
    for (const key of ['presenter', 'reportDate', 'robotModel']) {
      if (slide[key] !== undefined) {
        requireText(slide[key], `${label}.${key}`);
        if (slide.layout !== 'cover') errors.push(`${label}.${key}: only supported on cover slides`);
      }
    }
    if ((slide.presenter !== undefined) !== (slide.reportDate !== undefined)) errors.push(`${label}: presenter and reportDate must be supplied together`);
    if (slide.reportDate !== undefined && !/^\d{4}\.(0[1-9]|1[0-2])$/.test(slide.reportDate)) errors.push(`${label}.reportDate: expected YYYY.MM with month 01-12`);
    if (slide.layout === 'cover') {
      for (const key of ['eyebrow', 'subtitle', 'brand', 'imagePath', 'imageAlt', 'imageCredit']) requireText(slide[key], `${label}.${key}`);
      if (!/^assets\/[\w\s\u0080-\uFFFF./-]+$/.test(slide.imagePath || '') || slide.imagePath.split('/').includes('..')) errors.push(`${label}: imagePath must stay inside assets`);
    } else if (layouts.has(slide.layout)) {
      for (const key of ['chapter', 'sectionLabel', 'eyebrow', 'sourceLabel']) requireText(slide[key], `${label}.${key}`);
      if (typeof slide.subtitle !== 'string') errors.push(`${label}.subtitle: text required`);
    }
    if (slide.logoPath !== undefined) {
      requireText(slide.logoPath, `${label}.logoPath`);
      requireText(slide.logoAlt, `${label}.logoAlt`);
      if (typeof slide.logoPath !== 'string' || !/^assets\/[\w\s\u0080-\uFFFF./-]+$/.test(slide.logoPath) || slide.logoPath.split('/').includes('..')) errors.push(`${label}: logoPath must stay inside assets`);
    }
    for (const key of ['detailImagePath', 'detailImageAlt']) {
      if (slide[key] !== undefined) requireText(slide[key], `${label}.${key}`);
    }
    if ((slide.detailImagePath !== undefined) !== (slide.detailImageAlt !== undefined)) errors.push(`${label}: detailImagePath and detailImageAlt must be supplied together`);
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
    const textArray = (items, name, min = 1, max = 4) => {
      if (!Array.isArray(items) || items.length < min || items.length > max || items.some(x => !nonempty(x))) errors.push(`${label}.${name}: expected ${min}-${max} text items`);
    };
    for (const file of [slide.imagePath, slide.detailImagePath, ...(slide.evidencePaths ?? [])].filter(Boolean)) {
      if (!/^assets\/[\w\s\u0080-\uFFFF./-]+$/.test(file) || file.split('/').includes('..')) errors.push(`${label}: imagePath must stay inside assets`);
    }
    if (slide.timingSeconds !== undefined && (!Number.isInteger(slide.timingSeconds) || slide.timingSeconds < 1)) errors.push(`${label}: invalid timingSeconds`);
    if (['spotlight', 'closing', 'bullets'].includes(slide.layout)) textArray(slide.bullets, 'bullets');
    if (slide.layout === 'spotlight') requireText(slide.lead, `${label}.lead`);
    if (slide.layout === 'duo') {
      if (!Array.isArray(slide.columns) || slide.columns.length !== 2) errors.push(`${label}: expected two columns`);
      else slide.columns.forEach(c => { requireText(c.title, `${label}.column.title`); textArray(c.bullets, 'column.bullets'); });
    }
    if (slide.layout === 'table') {
      textArray(slide.headers, 'headers', 2, 5);
      if (!Array.isArray(slide.rows) || slide.rows.length < 1 || slide.rows.length > 6 || slide.rows.some(r => !Array.isArray(r) || r.length !== slide.headers?.length || r.some(c => !nonempty(c)))) errors.push(`${label}: table column mismatch or invalid rows`);
    }
    if (slide.layout === 'definition') requireText(slide.definition, `${label}.definition`);
    if (slide.layout === 'relationship') {
      for (const key of ['ai', 'rules', 'learning', 'traditional', 'deep']) requireText(slide.taxonomy?.[key], `${label}.taxonomy.${key}`);
      textArray(slide.columnLabels, 'columnLabels', 3, 3);
      if (!Array.isArray(slide.relations) || slide.relations.length !== 7) errors.push(`${label}.relations: expected 7 items`);
      else slide.relations.forEach((item, index) => {
        const relationLabel = `${label}.relations[${index}]`;
        if (!relationRoutes.has(item?.route)) errors.push(`${relationLabel}.route: unsupported relationship route`);
        requireText(item?.capability, `${relationLabel}.capability`);
        requireText(item?.scenarios, `${relationLabel}.scenarios`);
      });
    }
    if (slide.layout === 'gallery') {
      if (!Array.isArray(slide.images) || slide.images.length < 2 || slide.images.length > 5) errors.push(`${label}.images: expected 2-5 items`);
      else slide.images.forEach((item, index) => {
        const imageLabel = `${label}.images[${index}]`;
        requireText(item?.path, `${imageLabel}.path`);
        requireText(item?.alt, `${imageLabel}.alt`);
        if (typeof item?.path !== 'string' || !/^assets\/[\w\s\u0080-\uFFFF./-]+$/.test(item.path) || item.path.split('/').includes('..')) errors.push(`${imageLabel}.path: must stay inside assets`);
        for (const key of ['label', 'position']) if (item?.[key] !== undefined) requireText(item[key], `${imageLabel}.${key}`);
        if (item?.fit !== undefined && !['contain', 'cover'].includes(item.fit)) errors.push(`${imageLabel}.fit: expected contain or cover`);
      });
    }
    if (slide.layout === 'product') {
      for (const key of ['productName', 'productMeta', 'imagePath', 'imageAlt', 'imageCredit', 'caption']) requireText(slide[key], `${label}.${key}`);
      for (const name of ['facts', 'steps']) {
        if (!Array.isArray(slide[name]) || slide[name].length !== 3) errors.push(`${label}.${name}: expected 3 items`);
        else slide[name].forEach((item, index) => {
          requireText(item?.label, `${label}.${name}[${index}].label`);
          requireText(item?.text, `${label}.${name}[${index}].text`);
        });
      }
    }
    if (slide.layout === 'waves') {
      if (!Array.isArray(slide.eras) || slide.eras.length !== 4) errors.push(`${label}.eras: expected 4 items`);
      else slide.eras.forEach((era, index) => {
        for (const key of ['period', 'title', 'description', 'application', 'icon']) requireText(era?.[key], `${label}.eras[${index}].${key}`);
        if (!waveIcons.has(era?.icon)) errors.push(`${label}.eras[${index}].icon: unsupported wave icon`);
      });
    }
    if (['timeline', 'process', 'diagram'].includes(slide.layout)) {
      const items = slide.layout === 'diagram' ? slide.nodes : slide.items;
      if (!Array.isArray(items) || items.length < 2 || items.length > 4) errors.push(`${label}: expected 2-4 diagram items`);
      else items.forEach(n => { requireText(n.label, `${label}.item.label`); requireText(n.description, `${label}.item.description`); if (slide.layout === 'diagram' && !tones.has(n.tone)) errors.push(`${label}: unknown tone`); });
      if (slide.layout === 'diagram' && !['pipeline','network'].includes(slide.diagramKind)) errors.push(`${label}: unsupported diagramKind`);
    }
    if (slide.layout === 'example') for (const k of ['prompt','response','promptLabel','responseLabel']) requireText(slide[k], `${label}.${k}`);
    if (slide.layout === 'image') for (const k of ['imagePath','caption']) requireText(slide[k], `${label}.${k}`);
  }
  if (deck.durationMinutes && deck.slides.reduce((sum,s) => sum + (s.timingSeconds || 0), 0) !== deck.durationMinutes * 60) errors.push('timing: slide durations must equal durationMinutes');
  return errors;
}
