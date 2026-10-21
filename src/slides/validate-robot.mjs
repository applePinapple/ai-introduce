// The robot chapter keeps editable text in the deck and validates it before rendering.
const text = { type: 'string', minLength: 1 };
const object = properties => ({ type: 'object', required: Object.keys(properties), properties, additionalProperties: false });
const list = (items, count) => ({ type: 'array', minItems: count, maxItems: count, items });
const pair = object({ label: text, text });
const pairs = count => list(pair, count);
const strings = count => list(text, count);
const base = { description: text, lead: text, caption: text, bottomLine: text, brand: { ...text, const: '智蜂创元机器人Agent' } };
const row = fields => object(Object.fromEntries(fields.map(key => [key, text])));

export const robotContentSchemas = {
  vision: object({ ...base, goal: pair, cards: pairs(4) }),
  architecture: object({ ...base, layers: pairs(4), input: pair, output: pair, memory: pair, feedback: text }),
  planner: object({ ...base, inputs: pairs(3), decision: pair, outputs: pairs(3), boundary: text }),
  runtime: object({ ...base, steps: pairs(4), controls: pairs(3) }),
  skills: object({ ...base, columns: strings(3), rows: list(row(['phase', 'capability', 'reason']), 4), routing: pair }),
  task: object({ ...base, scenario: text, steps: pairs(5), success: text }),
  verification: object({ ...base, columns: strings(3), rows: list(row(['claim', 'evidence', 'decision']), 4), rule: pair }),
  recovery: object({ ...base, steps: pairs(4), triggers: pairs(3), stop: text }),
  memory: object({ ...base, fields: pairs(4), excluded: strings(3), reuse: strings(3) }),
  transfer: object({ ...base, before: pair, after: pair, steps: pairs(3), sceneLabels: strings(4) }),
  interface: object({ ...base, layers: pairs(3), inputs: strings(3), outputs: strings(3), boundary: text }),
  trace: object({ ...base, columns: strings(4), rows: list(row(['time', 'action', 'observation', 'decision']), 4), provenance: text }),
  benchmark: object({
    ...base,
    reference: object({ label: text, rate: text, count: text, conditions: strings(3), disclaimer: text }),
    criteria: pairs(3),
    company: pair
  }),
  validation: object({ ...base, stages: pairs(3), gates: pairs(3), scenario: text }),
  roadmap: object({ ...base, phases: list(row(['label', 'scope', 'gate']), 3), metrics: strings(4) }),
  closing: object({ ...base, pillars: pairs(4), questions: strings(2), statement: text })
};

export const robotKinds = Object.keys(robotContentSchemas);

function validateValue(value, schema, path, errors) {
  if (schema.type === 'string') {
    if (typeof value !== 'string' || !value.trim()) {
      errors.push(`${path}: nonempty text required`);
    } else if (schema.const !== undefined && value !== schema.const) {
      errors.push(`${path}: requires ${schema.const}`);
    }
  } else if (schema.type === 'object') {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      errors.push(`${path}: object required`);
      return;
    }
    for (const [key, field] of Object.entries(schema.properties)) validateValue(value[key], field, `${path}.${key}`, errors);
    for (const key of Object.keys(value)) {
      if (!Object.hasOwn(schema.properties, key)) errors.push(`${path}.${key}: unsupported field`);
    }
  } else if (schema.type === 'array') {
    if (!Array.isArray(value) || value.length !== schema.minItems) {
      errors.push(`${path}: expected ${schema.minItems} items`);
      return;
    }
    value.forEach((item, index) => validateValue(item, schema.items, `${path}[${index}]`, errors));
  }
}

export function validateRobot(slide) {
  const errors = [];
  const prefix = slide.id || 'slide';
  for (const [field, expected] of Object.entries({ theme: 'reinbee', chapter: '07', section: '机器人Agent', sectionLabel: '机器人Agent' })) {
    if (slide[field] !== expected) errors.push(`${prefix}.${field}: robot requires ${expected}`);
  }
  for (const field of ['logoPath', 'logoAlt']) validateValue(slide[field], text, `${prefix}.${field}`, errors);
  if (!robotKinds.includes(slide.robotKind)) {
    errors.push(`${prefix}.robotKind: unsupported robot kind`);
  } else {
    validateValue(slide.robotData, robotContentSchemas[slide.robotKind], `${prefix}.robotData`, errors);
  }
  return errors;
}
