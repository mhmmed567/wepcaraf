import { NextResponse } from 'next/server';
import { createOrderSchema } from '@/features/commerce/orders';
import { projectApiAccess } from '@/lib/server/project-api-access';
import { allowRequest } from '@/lib/server/rate-limit';
import { JsonBodyError, readJsonLimited } from '@/lib/server/json';

export const runtime = 'nodejs';
type Context = { params: Promise<{ id: string }> };
const select = 'id,order_number,project_id,customer_name,customer_email,customer_phone,customer_note,status,total_minor,created_at,updated_at,commerce_order_items(id,variant_id,product_name,variant_title,sku,quantity,unit_price_minor,line_total_minor)';
export async function GET(req: Request, context: Context) {
  const { id } = await context.params;
  const access = await projectApiAccess(req, id);
  if (!access.ok) return access.response;
  const params = new URL(req.url).searchParams;
  const page = Math.max(1, Math.min(1000, Math.trunc(Number(params.get('page') || 1) || 1)));
  const status = params.get('status');
  let query = access.db.from('commerce_orders').select(select, { count: 'exact' }).eq('project_id', id).order('created_at', { ascending: false }).range((page - 1) * 15, page * 15 - 1);
  if (status === 'pending' || status === 'fulfilled' || status === 'cancelled') query = query.eq('status', status);
  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: 'تعذر تحميل الطلبات' }, { status: 500 });
  return NextResponse.json({ orders: data, total: count || 0 }, { headers: { 'Cache-Control': 'no-store' } });
}
export async function POST(req: Request, context: Context) {
  const { id } = await context.params;
  const access = await projectApiAccess(req, id);
  if (!access.ok) return access.response;
  let body: unknown;
  try { body = await readJsonLimited(req, 25000); }
  catch (caught) { const error = caught as JsonBodyError; return NextResponse.json({ error: error.message }, { status: error.status || 400 }); }
  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || 'بيانات الطلب غير صالحة' }, { status: 400 });
  try {
    if (!await allowRequest(access.db, req, `commerce-order:${access.userId}`, 60, 3600000)) return NextResponse.json({ error: 'طلبات كثيرة. حاول لاحقًا.' }, { status: 429 });
    const { data: orderId, error } = await access.db.rpc('commerce_create_order', { p_project_id: id, p_customer: parsed.data.customer, p_items: parsed.data.items });
    if (error) return NextResponse.json({ error: error.message === 'insufficient stock' ? 'المخزون لا يكفي لهذه الكمية' : error.message === 'variant unavailable' ? 'أحد الخيارات غير متاح للبيع' : 'تعذر إنشاء الطلب' }, { status: error.message === 'insufficient stock' || error.message === 'variant unavailable' ? 409 : 500 });
    const { data, error: readError } = await access.db.from('commerce_orders').select(select).eq('id', orderId).eq('project_id', id).single();
    if (readError) throw readError;
    return NextResponse.json({ order: data }, { status: 201 });
  } catch { return NextResponse.json({ error: 'تعذر إنشاء الطلب' }, { status: 500 }); }
}
