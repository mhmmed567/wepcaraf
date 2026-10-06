import { NextResponse } from 'next/server';
import { productSchema } from '@/features/commerce/schema';
import { productSelect } from '@/features/commerce/server';
import { projectApiAccess } from '@/lib/server/project-api-access';
import { uuidPattern } from '@/lib/server/projects';
import { allowRequest } from '@/lib/server/rate-limit';
import { JsonBodyError, readJsonLimited } from '@/lib/server/json';

export const runtime = 'nodejs';
type Context = { params: Promise<{ id: string; productId: string }> };
export async function GET(req: Request, context: Context) {
  const { id, productId } = await context.params;
  const access = await projectApiAccess(req, id);
  if (!access.ok) return access.response;
  if (!uuidPattern.test(productId)) return NextResponse.json({ error: 'معرّف المنتج غير صالح' }, { status: 400 });
  const { data, error } = await access.db.from('commerce_products').select(productSelect).eq('id', productId).eq('project_id', id).maybeSingle();
  if (error) return NextResponse.json({ error: 'تعذر تحميل المنتج' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'المنتج غير موجود' }, { status: 404 });
  return NextResponse.json({ product: data }, { headers: { 'Cache-Control': 'no-store' } });
}
export async function PATCH(req: Request, context: Context) {
  const { id, productId } = await context.params;
  const access = await projectApiAccess(req, id);
  if (!access.ok) return access.response;
  if (!uuidPattern.test(productId)) return NextResponse.json({ error: 'معرّف المنتج غير صالح' }, { status: 400 });
  let body: unknown;
  try { body = await readJsonLimited(req, 150000); }
  catch (caught) { const error = caught as JsonBodyError; return NextResponse.json({ error: error.message }, { status: error.status || 400 }); }
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || 'بيانات المنتج غير صالحة' }, { status: 400 });
  try {
    if (!await allowRequest(access.db, req, `commerce-product:${access.userId}`, 60, 3600000)) return NextResponse.json({ error: 'طلبات كثيرة. حاول لاحقًا.' }, { status: 429 });
    const { variants, ...product } = parsed.data;
    const { error } = await access.db.rpc('commerce_save_product', { p_project_id: id, p_product_id: productId, p_product: product, p_variants: variants });
    if (error) return NextResponse.json({ error: error.code === '23505' ? 'رقم SKU مستخدم في منتج آخر' : error.message === 'product not found' ? 'المنتج غير موجود' : 'تعذر حفظ المنتج' }, { status: error.code === '23505' ? 409 : error.message === 'product not found' ? 404 : 500 });
    const { data, error: readError } = await access.db.from('commerce_products').select(productSelect).eq('id', productId).eq('project_id', id).single();
    if (readError) throw readError;
    return NextResponse.json({ product: data });
  } catch { return NextResponse.json({ error: 'تعذر حفظ المنتج' }, { status: 500 }); }
}
