import { NextResponse } from 'next/server';
import { projectApiAccess } from '@/lib/server/project-api-access';

export const runtime = 'nodejs';
type Context = { params: Promise<{ id: string }> };
export async function GET(req: Request, context: Context) {
  const { id } = await context.params;
  const access = await projectApiAccess(req, id);
  if (!access.ok) return access.response;
  const params = new URL(req.url).searchParams;
  const page = Math.max(1, Math.min(1000, Math.trunc(Number(params.get('page') || 1) || 1)));
  const limit = Math.max(1, Math.min(50, Math.trunc(Number(params.get('limit') || 20) || 20)));
  const { data, count, error } = await access.db.from('commerce_variants').select('id,product_id,title,sku,stock_on_hand,stock_reserved,sold_count,low_stock_threshold,active,commerce_products!inner(name,status)', { count: 'exact' }).eq('project_id', id).eq('active', true).order('updated_at', { ascending: false }).range((page - 1) * limit, page * limit - 1);
  if (error) return NextResponse.json({ error: 'تعذر تحميل المخزون' }, { status: 500 });
  return NextResponse.json({ variants: data, total: count || 0, nextPage: page * limit < (count || 0) ? page + 1 : null }, { headers: { 'Cache-Control': 'no-store' } });
}
