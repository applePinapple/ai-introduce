export const agentKinds = ['weather', 'setup', 'loop', 'schema', 'messages', 'sequence', 'safeguards'];

// Validate nested content before rendering diagrams and code examples.
export function validateAgent(slide) {
  const errors = [];
  const prefix = slide.id || 'slide';
  const text = (value, name) => {
    if (typeof value !== 'string' || !value.trim()) errors.push(`${prefix}.${name}: nonempty text required`);
  };
  const fields = (value, names, path) => names.forEach(name => text(value?.[name], `${path}.${name}`));
  const items = (value, name, min, max, visit) => {
    if (!Array.isArray(value) || value.length < min || value.length > max) {
      errors.push(`${prefix}.${name}: expected ${min}-${max} items`);
    } else value.forEach((item, index) => visit(item, `${name}[${index}]`));
  };
  const strings = (value, name, min, max = min) => items(value, name, min, max, text);
  const pairs = (value, name, count, names = ['label', 'text']) =>
    items(value, name, count, count, (item, path) => fields(item, names, path));
  if (!agentKinds.includes(slide.agentKind)) errors.push(`${prefix}.agentKind: unsupported agent kind`);
  for (const [name, expected] of Object.entries({ theme: 'reinbee', chapter: '05', section: 'Agent原理', sectionLabel: 'Agent原理' })) {
    if (slide[name] !== expected) errors.push(`${prefix}.${name}: agent requires ${expected}`);
  }
  text(slide.logoPath, 'logoPath');
  text(slide.logoAlt, 'logoAlt');
  const d = slide.agentData;
  if (!d || typeof d !== 'object' || Array.isArray(d)) return [...errors, `${prefix}.agentData: object required`];
  const base = 'agentData';
  fields(d, ['description', 'lead', 'caption'], base);
  switch (slide.agentKind) {
    case 'weather':
      fields(d, ['request', 'exampleLabel', 'takeaway'], base);
      items(d.paths, `${base}.paths`, 2, 2, (item, path) => {
        fields(item, ['label', 'title', 'result'], path);
        strings(item?.steps, `${path}.steps`, 3);
      });
      break;
    case 'setup':
      pairs(d.components, `${base}.components`, 3);
      fields(d, ['codeTitle', 'bottomLine'], base);
      strings(d.codeLines, `${base}.codeLines`, 3, 12);
      break;
    case 'loop':
      for (const name of ['input', 'output', 'tool']) fields(d[name], ['label', 'text'], `${base}.${name}`);
      fields(d.model, ['label'], `${base}.model`);
      strings(d.model?.questions, `${base}.model.questions`, 3);
      fields(d, ['actionLabel', 'observationLabel', 'finishLabel', 'repeatLabel'], base);
      break;
    case 'schema':
      fields(d, ['codeTitle', 'mappingLabel'], base);
      strings(d.codeLines, `${base}.codeLines`, 3, 12);
      pairs(d.fields, `${base}.fields`, 3, ['label', 'value', 'text']);
      break;
    case 'messages':
      items(d.rows, `${base}.rows`, 4, 4, (item, path) => {
        fields(item, ['role', 'tag'], path);
        strings(item?.lines, `${path}.lines`, 1, 3);
      });
      fields(d, ['pairingLabel', 'bottomLine'], base);
      break;
    case 'sequence':
      pairs(d.participants, `${base}.participants`, 3, ['label', 'caption']);
      items(d.events, `${base}.events`, 9, 9, (event, path) => {
        text(event?.label, `${path}.label`);
        for (const name of ['from', 'to']) {
          if (!Number.isInteger(event?.[name]) || event[name] < 0 || event[name] > 2) errors.push(`${prefix}.${path}.${name}: participant index 0-2 required`);
        }
        if (!['blue', 'orange'].includes(event?.tone)) errors.push(`${prefix}.${path}.tone: unsupported tone`);
      });
      text(d.bottomLine, `${base}.bottomLine`);
      break;
    case 'safeguards':
      pairs(d.items, `${base}.items`, 3, ['label', 'title', 'text']);
      text(d.bottomLine, `${base}.bottomLine`);
      break;
  }
  return errors;
}
