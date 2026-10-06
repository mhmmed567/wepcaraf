import { NextResponse } from 'next/server';
import { stockAdjustmentSchema } from '@/features/commerce/schema';
import { projectApiAccess } from '@/lib/server/project-api-access';
import { uuidPattern } from '@/lib/server/projects';
import { allowRequest } from '@/lib/server/rate-limit';
import { JsonBodyError, readJsonLimited } from '@/lib/server/json';

export const runtime = 'nodejs';
type Context = { params: Promise<{ id: string; variantId: string }> };
export async function GET(req: Request, context: Context) {
  const { id, variantId } = await context.params;
  const access = await projectApiAccess(req, id);
  if (!access.ok) return access.response;
  if (!uuidPattern.test(variantId)) return NextResponse.json({ error: 'معرّف الخيار غير صالح' }, { status: 400 });
  const { data, error } = await access.db.from('commerce_stock_events').select('id,delta,stock_after,reason,created_at').eq('project_id', id).eq('variant_id', variantId).order('created_at', { ascending: false }).limit(30);
  if (error) return NextResponse.json({ error: 'تعذر تحميل سجل المخزون' }, { status: 500 });
  return NextResponse.json({ events: data }, { headers: { 'Cache-Control': 'no-store' } });
}
export async function POST(req: Request, context: Context) {
  const { id, variantId } = await context.params;
  const access = await projectApiAccess(req, id);
  if (!access.ok) return access.response;
  if (!uuidPattern.test(variantId)) return NextResponse.json({ error: 'معرّف الخيار غير صالح' }, { status: 400 });
  let body: unknown;
  try { body = await readJsonLimited(req, 10000); }
  catch (caught) { const error = caught as JsonBodyError; return NextResponse.json({ error: error.message }, { status: error.status || 400 }); }
  const parsed = stockAdjustmentSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'أدخل كمية صحيحة وسببًا للتعديل' }, { status: 400 });
  try {
    if (!await allowRequest(access.db, req, `commerce-stock:${access.userId}`, 100, 3600000)) return NextResponse.json({ error: 'طلبات كثيرة. حاول لاحقًا.' }, { status: 429 });
    const { data, error } = await access.db.rpc('commerce_adjust_stock', { p_project_id: id, p_variant_id: variantId, p_delta: parsed.data.delta, p_reason: parsed.data.reason, p_actor_id: access.userId });
    if (error) return NextResponse.json({ error: error.message === 'insufficient available stock' ? 'لا يمكن أن يقل المخزون عن المحجوز' : error.message === 'variant not found' ? 'الخيار غير موجود' : 'تعذر تعديل المخزون' }, { status: error.message === 'insufficient available stock' ? 409 : error.message === 'variant not found' ? 404 : 500 });
    return NextResponse.json({ stock_on_hand: data });
  } catch { return NextResponse.json({ error: 'تعذر تعديل المخزون' }, { status: 500 }); }
}
