export const harnessKinds = ['anatomy', 'context', 'continuity', 'execution', 'improvement', 'case'];

// Check the editable chapter content before any renderer reads nested fields.
export function validateHarness(slide) {
  const errors = [];
  const prefix = slide.id || 'slide';
  const text = (value, name) => {
    if (typeof value !== 'string' || !value.trim()) errors.push(`${prefix}.${name}: nonempty text required`);
  };
  const fields = (value, names, path) => names.forEach(name => text(value?.[name], `${path}.${name}`));
  const items = (value, name, count, visit) => {
    if (!Array.isArray(value) || value.length !== count) {
      errors.push(`${prefix}.${name}: expected ${count} items`);
    } else value.forEach((item, index) => visit(item, `${name}[${index}]`));
  };
  const strings = (value, name, count) => items(value, name, count, text);
  const pairs = (value, name, count) => items(value, name, count, (item, path) => fields(item, ['label', 'text'], path));
  if (!harnessKinds.includes(slide.harnessKind)) errors.push(`${prefix}.harnessKind: unsupported harness kind`);
  for (const [name, expected] of Object.entries({ theme: 'reinbee', chapter: '06', section: 'Harness工程', sectionLabel: 'Harness工程' })) {
    if (slide[name] !== expected) errors.push(`${prefix}.${name}: harness requires ${expected}`);
  }
  text(slide.logoPath, 'logoPath');
  text(slide.logoAlt, 'logoAlt');
  const d = slide.harnessData;
  if (!d || typeof d !== 'object' || Array.isArray(d)) return [...errors, `${prefix}.harnessData: object required`];
  const base = 'harnessData';
  fields(d, ['description', 'lead', 'caption', 'bottomLine'], base);
  switch (slide.harnessKind) {
    case 'anatomy':
      for (const name of ['input', 'output', 'model']) fields(d[name], ['label', 'text'], `${base}.${name}`);
      text(d.harnessLabel, `${base}.harnessLabel`);
      pairs(d.parts, `${base}.parts`, 4);
      break;
    case 'context':
      pairs(d.stores, `${base}.stores`, 3);
      pairs(d.stages, `${base}.stages`, 3);
      fields(d.window, ['label', 'text'], `${base}.window`);
      text(d.stateLabel, `${base}.stateLabel`);
      break;
    case 'continuity':
      pairs(d.steps, `${base}.steps`, 4);
      text(d.record?.label, `${base}.record.label`);
      strings(d.record?.items, `${base}.record.items`, 3);
      text(d.resumeLabel, `${base}.resumeLabel`);
      break;
    case 'execution':
      pairs(d.steps, `${base}.steps`, 4);
      pairs(d.controls, `${base}.controls`, 3);
      break;
    case 'improvement':
      for (const [name, count] of [['inner', 3], ['outer', 5]]) {
        fields(d[name], ['label', 'text'], `${base}.${name}`);
        strings(d[name]?.steps, `${base}.${name}.steps`, count);
      }
      text(d.comparison, `${base}.comparison`);
      break;
    case 'case':
      fields(d, ['exampleLabel', 'scenario', 'acceptance'], base);
      strings(d.columns, `${base}.columns`, 3);
      items(d.rows, `${base}.rows`, 3, (item, path) => fields(item, ['failure', 'change', 'evidence'], path));
      break;
  }
  return errors;
}
