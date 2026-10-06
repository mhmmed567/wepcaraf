import { NextResponse } from 'next/server';
import { transitionOrderSchema } from '@/features/commerce/orders';
import { projectApiAccess } from '@/lib/server/project-api-access';
import { uuidPattern } from '@/lib/server/projects';
import { allowRequest } from '@/lib/server/rate-limit';
import { JsonBodyError, readJsonLimited } from '@/lib/server/json';

export const runtime = 'nodejs';
type Context = { params: Promise<{ id: string; orderId: string }> };
export async function PATCH(req: Request, context: Context) {
  const { id, orderId } = await context.params;
  const access = await projectApiAccess(req, id);
  if (!access.ok) return access.response;
  if (!uuidPattern.test(orderId)) return NextResponse.json({ error: 'معرّف الطلب غير صالح' }, { status: 400 });
  let body: unknown;
  try { body = await readJsonLimited(req, 10000); }
  catch (caught) { const error = caught as JsonBodyError; return NextResponse.json({ error: error.message }, { status: error.status || 400 }); }
  const parsed = transitionOrderSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'حالة الطلب غير صالحة' }, { status: 400 });
  try {
    if (!await allowRequest(access.db, req, `commerce-order:${access.userId}`, 60, 3600000)) return NextResponse.json({ error: 'طلبات كثيرة. حاول لاحقًا.' }, { status: 429 });
    const { data, error } = await access.db.rpc('commerce_transition_order', { p_project_id: id, p_order_id: orderId, p_target: parsed.data.status, p_actor_id: access.userId });
    if (error) return NextResponse.json({ error: error.message === 'order not found' ? 'الطلب غير موجود' : error.message === 'order already completed' ? 'الطلب منتهٍ مسبقًا' : 'تعذر تحديث الطلب' }, { status: error.message === 'order not found' ? 404 : error.message === 'order already completed' ? 409 : 500 });
    return NextResponse.json({ status: data });
  } catch { return NextResponse.json({ error: 'تعذر تحديث الطلب' }, { status: 500 }); }
}
