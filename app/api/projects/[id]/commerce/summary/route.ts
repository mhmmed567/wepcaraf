import { NextResponse } from 'next/server';
import { projectApiAccess } from '@/lib/server/project-api-access';

export const runtime = 'nodejs';
type Context = { params: Promise<{ id: string }> };
export async function GET(req: Request, context: Context) {
  const { id } = await context.params;
  const access = await projectApiAccess(req, id);
  if (!access.ok) return access.response;
  const { data, error } = await access.db.rpc('commerce_catalog_summary', { p_project_id: id });
  if (error) return NextResponse.json({ error: 'تعذر تحميل ملخص المتجر' }, { status: 500 });
  return NextResponse.json({ summary: data }, { headers: { 'Cache-Control': 'no-store' } });
}
