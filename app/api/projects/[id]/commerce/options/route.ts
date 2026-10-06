import { NextResponse } from 'next/server';
import { projectApiAccess } from '@/lib/server/project-api-access';

export const runtime = 'nodejs';
type Context = { params: Promise<{ id: string }> };
export async function GET(req: Request, context: Context) {
  const { id } = await context.params;
  const access = await projectApiAccess(req, id);
  if (!access.ok) return access.response;
  const search = (new URL(req.url).searchParams.get('search') || '').trim().slice(0, 80).replace(/[%_]/g, '');
  let query = access.db.from('commerce_variants').select('id,title,sku,price_minor,stock_on_hand,stock_reserved,commerce_products!inner(name,status)').eq('project_id', id).eq('active', true).eq('commerce_products.status', 'active').order('updated_at', { ascending: false }).limit(30);
  if (search) query = query.ilike('commerce_products.name', `%${search}%`);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: 'تعذر تحميل الخيارات' }, { status: 500 });
  return NextResponse.json({ options: data }, { headers: { 'Cache-Control': 'no-store' } });
}
