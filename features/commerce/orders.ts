import { z } from 'zod';

export const createOrderSchema = z.object({
  customer: z.object({ name: z.string().trim().min(1).max(160), email: z.union([z.literal(''), z.email().max(254)]), phone: z.string().trim().max(60), note: z.string().trim().max(1000) }).strict(),
  items: z.array(z.object({ variant_id: z.uuid(), quantity: z.number().int().min(1).max(10000) }).strict()).min(1).max(50),
}).strict().refine(value => new Set(value.items.map(item => item.variant_id)).size === value.items.length, 'لا يمكن تكرار الخيار داخل الطلب');
export const transitionOrderSchema = z.object({ status: z.enum(['fulfilled', 'cancelled']) }).strict();

export type CommerceOrder = {
  id: string; order_number: number; project_id: string; customer_name: string; customer_email: string; customer_phone: string;
  customer_note: string; status: 'pending' | 'fulfilled' | 'cancelled'; total_minor: number; created_at: string; updated_at: string;
  commerce_order_items: Array<{ id: string; variant_id: string; product_name: string; variant_title: string; sku: string | null; quantity: number; unit_price_minor: number; line_total_minor: number }>;
};
