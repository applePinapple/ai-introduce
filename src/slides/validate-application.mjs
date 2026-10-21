export const applicationKinds = [
  'relationship', 'chatbot', 'generation', 'responsibilities',
  'comparison', 'hybrid', 'sequence', 'summary',
];

// Validate the content contract before the renderer reads nested diagram data.
export function validateApplication(slide) {
  const errors = [];
  const prefix = slide.id || 'slide';
  const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const text = (value, name) => {
    if (typeof value !== 'string' || !value.trim()) errors.push(`${prefix}.${name}: nonempty text required`);
  };
  const fields = (value, names, path) => names.forEach(name => text(value?.[name], `${path}.${name}`));
  const items = (value, name, min, max, visit) => {
    if (!Array.isArray(value) || value.length < min || value.length > max) {
      errors.push(`${prefix}.${name}: expected ${min}-${max} items`);
    } else value.forEach((item, index) => visit(item, `${name}[${index}]`));
  };
  const pairs = (value, name, count) => items(value, name, count, count, (item, path) => fields(item, ['label', 'text'], path));
  if (!applicationKinds.includes(slide.applicationKind)) errors.push(`${prefix}.applicationKind: unsupported application kind`);
  for (const [name, expected] of Object.entries({ theme: 'reinbee', chapter: '04', section: 'Agent基础', sectionLabel: 'Agent基础' })) {
    if (slide[name] !== expected) errors.push(`${prefix}.${name}: application requires ${expected}`);
  }
  text(slide.logoPath, 'logoPath');
  text(slide.logoAlt, 'logoAlt');
  const d = slide.applicationData;
  if (!object(d)) return [...errors, `${prefix}.applicationData: object required`];
  const base = 'applicationData';
  fields(d, ['description', 'lead', 'caption'], base);
  switch (slide.applicationKind) {
    case 'relationship':
      for (const name of ['model', 'product']) fields(d[name], ['title', 'label', 'summary'], `${base}.${name}`);
      items(d.acronym, `${base}.acronym`, 3, 3, (item, path) => fields(item, ['letter', 'term', 'meaning'], path));
      text(d.bridgeLabel, `${base}.bridgeLabel`);
      break;
    case 'chatbot':
      fields(d, ['appLabel', 'exampleLabel', 'composerLabel', 'anatomyTitle'], base);
      items(d.messages, `${base}.messages`, 4, 4, (item, path) => fields(item, ['role', 'text'], path));
      pairs(d.anatomy, `${base}.anatomy`, 3);
      break;
    case 'generation':
      fields(d, ['inputLabel', 'modelLabel', 'modelCaption', 'outputLabel', 'feedbackLabel'], base);
      pairs(d.inputs, `${base}.inputs`, 3);
      pairs(d.stages, `${base}.stages`, 3);
      items(d.outputTokens, `${base}.outputTokens`, 2, 8, text);
      break;
    case 'responsibilities':
      for (const name of ['app', 'model']) {
        fields(d[name], ['title', 'caption'], `${base}.${name}`);
        pairs(d[name]?.items, `${base}.${name}.items`, 3);
      }
      fields(d, ['connectionLabel', 'boundaryLabel'], base);
      break;
    case 'comparison':
      items(d.headers, `${base}.headers`, 3, 3, text);
      items(d.rows, `${base}.rows`, 4, 4, (row, path) => items(row, path, 3, 3, text));
      text(d.principle, `${base}.principle`);
      break;
    case 'hybrid':
      fields(d, ['exampleLabel', 'userRequest', 'feedbackLabel', 'resultLabel', 'resultText', 'boundaryLabel'], base);
      pairs(d.steps, `${base}.steps`, 4);
      break;
    case 'sequence':
      items(d.participants, `${base}.participants`, 3, 3, (item, path) => fields(item, ['label', 'caption'], path));
      items(d.events, `${base}.events`, 7, 7, (event, path) => {
        text(event?.label, `${path}.label`);
        for (const name of ['from', 'to']) {
          if (!Number.isInteger(event?.[name]) || event[name] < 0 || event[name] > 2) errors.push(`${prefix}.${path}.${name}: participant index 0-2 required`);
        }
        if (!['blue', 'orange', 'green'].includes(event?.tone)) errors.push(`${prefix}.${path}.tone: unsupported tone`);
      });
      text(d.bottomLine, `${base}.bottomLine`);
      break;
    case 'summary':
      items(d.questions, `${base}.questions`, 3, 3, (item, path) => fields(item, ['question', 'answer'], path));
      text(d.closing, `${base}.closing`);
      break;
  }
  return errors;
}
