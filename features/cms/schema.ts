import { z } from 'zod';
import type { CmsField } from './types';

const key = z.string().regex(/^[a-z][a-z0-9_]{0,39}$/);
const fieldSchema = z.object({
  key,
  label: z.string().trim().min(1).max(80),
  type: z.enum(['text', 'long_text', 'number', 'currency', 'boolean', 'date', 'email', 'phone', 'url', 'image', 'file', 'select', 'multi_select', 'json']),
  required: z.boolean(),
  options: z.array(z.string().trim().min(1).max(100)).max(40),
}).strict();
export const collectionSchema = z.object({
  name: z.string().trim().min(1).max(100),
  slug: z.string().regex(/^[a-z][a-z0-9-]{1,59}$/),
  fields: z.array(fieldSchema).max(30),
}).strict().refine(value => new Set(value.fields.map(field => field.key)).size === value.fields.length, 'أسماء الحقول يجب أن تكون مختلفة');

export const entrySchema = z.object({ data: z.record(z.string(), z.unknown()), status: z.enum(['draft', 'published']) }).strict();

export function validateEntryData(fields: CmsField[], raw: Record<string, unknown>) {
  const data: Record<string, unknown> = {};
  const failures: string[] = [];
  for (const field of fields) {
    const value = raw[field.key];
    const empty = value === undefined || value === null || value === '' || (Array.isArray(value) && !value.length);
    if (empty) { if (field.required) failures.push(field.label); continue; }
    const text = typeof value === 'string' && value.length <= (field.type === 'long_text' ? 20000 : 2000);
    const numeric = typeof value === 'number' && Number.isFinite(value) && Math.abs(value) <= 1_000_000_000;
    const valid = (() => {
      switch (field.type) {
        case 'text': case 'long_text': case 'phone': return text;
        case 'number': case 'currency': return numeric && (field.type !== 'currency' || value >= 0);
        case 'boolean': return typeof value === 'boolean';
        case 'date': {
          if (!text || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
          const parsed = new Date(`${value}T00:00:00.000Z`);
          return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
        }
        case 'email': return text && z.email().safeParse(value).success;
        case 'url': case 'image': case 'file': return text && z.url({ protocol: /^https?$/ }).safeParse(value).success;
        case 'select': return text && field.options.includes(value);
        case 'multi_select': return Array.isArray(value) && value.length <= 40 && value.every(item => typeof item === 'string' && field.options.includes(item));
        case 'json': return JSON.stringify(value).length <= 20000;
      }
    })();
    if (valid) data[field.key] = value;
    else failures.push(field.label);
  }
  return failures.length ? { ok: false as const, error: `تحقق من الحقول: ${failures.join('، ')}` } : { ok: true as const, data };
}
