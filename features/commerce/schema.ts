import { z } from 'zod';

const url = z.union([z.literal(''), z.url({ protocol: /^https$/ }).max(1000)]);
const money = z.number().int().min(0).max(1_000_000_000);
const variant = z.object({
  id: z.uuid().optional(), title: z.string().trim().min(1).max(120), options: z.record(z.string().trim().min(1).max(50), z.string().trim().min(1).max(100)).refine(value => Object.keys(value).length <= 10),
  sku: z.string().trim().max(80), barcode: z.string().trim().max(80), price_minor: money,
  compare_price_minor: money.nullable(), cost_minor: money.nullable(), stock_on_hand: z.number().int().min(0).max(1_000_000).optional(),
  low_stock_threshold: z.number().int().min(0).max(1_000_000), image_url: url,
}).strict();
export const productSchema = z.object({
  name: z.string().trim().min(1).max(160), description: z.string().trim().max(10000), image_url: url,
  category: z.string().trim().max(100), brand: z.string().trim().max(100),
  tags: z.array(z.string().trim().min(1).max(40)).max(20), status: z.enum(['draft', 'active', 'archived']),
  seo_title: z.string().trim().max(160), seo_description: z.string().trim().max(300),
  variants: z.array(variant).min(1).max(50),
}).strict().refine(value => new Set(value.variants.map(item => item.sku.toLowerCase()).filter(Boolean)).size === value.variants.filter(item => item.sku).length, 'أرقام SKU يجب ألا تتكرر');
export const stockAdjustmentSchema = z.object({ delta: z.number().int().min(-1_000_000).max(1_000_000).refine(value => value !== 0), reason: z.string().trim().min(1).max(300) }).strict();
