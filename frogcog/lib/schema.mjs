/* FrogCog binder: checking what a tool is given, before anything is saved.
 *
 * Each tool describes its inputs as a small JSON Schema (the same one the AI tool is shown). This checks a call
 * against it, so a misheard value is refused with a plain reason and never half-saved. It covers only what the
 * binder's tools use: objects, strings (length, pattern, a fixed list), numbers, integers, booleans and arrays.
 */
export const DAY = { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$', description: 'A date written yyyy-mm-dd.' };
export const text = (max, description) => ({ type: 'string', maxLength: max, ...(description ? { description } : {}) });
export const pick = (list, description) => ({ type: 'string', enum: list, ...(description ? { description } : {}) });
export const obj = (properties, required = []) => ({ type: 'object', additionalProperties: false, properties, required });

export function check(schema, value, where = 'input'){
  if (!schema) return null;
  const t = schema.type;
  if (t === 'object') {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return where + ' must be a set of named values';
    for (const k of schema.required || []) if (value[k] === undefined || value[k] === null) return '"' + k + '" is needed';
    for (const [k, v] of Object.entries(value)) {
      const s = (schema.properties || {})[k];
      if (!s) { if (schema.additionalProperties === false) return '"' + k + '" is not something this tool takes'; continue; }
      if (v === undefined || v === null) continue;
      const bad = check(s, v, '"' + k + '"');
      if (bad) return bad;
    }
    return null;
  }
  if (t === 'string') {
    if (typeof value !== 'string') return where + ' must be text';
    if (schema.maxLength && value.length > schema.maxLength) return where + ' is longer than ' + schema.maxLength + ' characters';
    if (schema.enum && !schema.enum.includes(value)) return where + ' must be one of: ' + schema.enum.join(', ');
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) return where + ' is not in the form this tool takes' + (schema.pattern === DAY.pattern ? ' (a date is written yyyy-mm-dd)' : '');
    return null;
  }
  if (t === 'number' || t === 'integer') {
    if (typeof value !== 'number' || !isFinite(value) || (t === 'integer' && !Number.isInteger(value))) return where + ' must be a ' + (t === 'integer' ? 'whole number' : 'number');
    if (schema.minimum !== undefined && value < schema.minimum) return where + ' must be at least ' + schema.minimum;
    if (schema.maximum !== undefined && value > schema.maximum) return where + ' must be at most ' + schema.maximum;
    return null;
  }
  if (t === 'boolean') return typeof value === 'boolean' ? null : where + ' must be true or false';
  if (t === 'array') {
    if (!Array.isArray(value)) return where + ' must be a list';
    if (schema.maxItems && value.length > schema.maxItems) return where + ' has more than ' + schema.maxItems + ' entries';
    for (const v of value) { const bad = check(schema.items, v, 'an entry of ' + where); if (bad) return bad; }
    return null;
  }
  return null;
}
