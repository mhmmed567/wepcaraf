import { NextResponse } from 'next/server';
import { productSchema } from '@/features/commerce/schema';
import { productSelect } from '@/features/commerce/server';
import { projectApiAccess } from '@/lib/server/project-api-access';
import { allowRequest } from '@/lib/server/rate-limit';
import { JsonBodyError, readJsonLimited } from '@/lib/server/json';

export const runtime = 'nodejs';
type Context = { params: Promise<{ id: string }> };
export async function GET(req: Request, context: Context) {
  const { id } = await context.params;
  const access = await projectApiAccess(req, id);
  if (!access.ok) return access.response;
  const params = new URL(req.url).searchParams;
  const page = Math.max(1, Math.min(1000, Math.trunc(Number(params.get('page') || 1) || 1)));
  const limit = Math.max(1, Math.min(50, Math.trunc(Number(params.get('limit') || 12) || 12)));
  const search = (params.get('search') || '').trim().slice(0, 80).replace(/[%_]/g, '');
  const status = params.get('status');
  let query = access.db.from('commerce_products').select(productSelect, { count: 'exact' }).eq('project_id', id).order('updated_at', { ascending: false }).range((page - 1) * limit, page * limit - 1);
  if (search) query = query.ilike('name', `%${search}%`);
  if (status === 'draft' || status === 'active' || status === 'archived') query = query.eq('status', status);
  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: 'تعذر تحميل المنتجات' }, { status: 500 });
  return NextResponse.json({ products: data, total: count || 0, nextPage: page * limit < (count || 0) ? page + 1 : null }, { headers: { 'Cache-Control': 'no-store' } });
}
export async function POST(req: Request, context: Context) {
  const { id } = await context.params;
  const access = await projectApiAccess(req, id);
  if (!access.ok) return access.response;
  let body: unknown;
  try { body = await readJsonLimited(req, 150000); }
  catch (caught) { const error = caught as JsonBodyError; return NextResponse.json({ error: error.message }, { status: error.status || 400 }); }
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || 'بيانات المنتج غير صالحة' }, { status: 400 });
  try {
    if (!await allowRequest(access.db, req, `commerce-product:${access.userId}`, 60, 3600000)) return NextResponse.json({ error: 'طلبات كثيرة. حاول لاحقًا.' }, { status: 429 });
    const { count, error: countError } = await access.db.from('commerce_products').select('id', { count: 'exact', head: true }).eq('project_id', id);
    if (countError) throw countError;
    if ((count || 0) >= 2000) return NextResponse.json({ error: 'وصلت إلى الحد الأقصى للمنتجات' }, { status: 409 });
    const { variants, ...product } = parsed.data;
    const { data: productId, error } = await access.db.rpc('commerce_save_product', { p_project_id: id, p_product_id: null, p_product: product, p_variants: variants });
    if (error) return NextResponse.json({ error: error.code === '23505' ? 'رقم SKU مستخدم في منتج آخر' : 'تعذر إنشاء المنتج' }, { status: error.code === '23505' ? 409 : 500 });
    const { data, error: readError } = await access.db.from('commerce_products').select(productSelect).eq('id', productId).eq('project_id', id).single();
    if (readError) throw readError;
    return NextResponse.json({ product: data }, { status: 201 });
  } catch { return NextResponse.json({ error: 'تعذر إنشاء المنتج' }, { status: 500 }); }
}
