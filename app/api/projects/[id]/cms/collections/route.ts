import { NextResponse } from 'next/server';
import { collectionSchema } from '@/features/cms/schema';
import { cmsAccess } from '@/features/cms/server';
import { allowRequest } from '@/lib/server/rate-limit';
import { JsonBodyError, readJsonLimited } from '@/lib/server/json';

export const runtime = 'nodejs';
type Context = { params: Promise<{ id: string }> };
export async function GET(req: Request, context: Context) {
  const { id } = await context.params;
  const access = await cmsAccess(req, id);
  if (!access.ok) return access.response;
  const { data, error } = await access.db.from('cms_collections').select('id,project_id,name,slug,fields,created_at,updated_at').eq('project_id', id).order('created_at', { ascending: false }).limit(100);
  if (error) return NextResponse.json({ error: 'تعذر تحميل مجموعات المحتوى' }, { status: 500 });
  return NextResponse.json({ collections: data }, { headers: { 'Cache-Control': 'no-store' } });
}
export async function POST(req: Request, context: Context) {
  const { id } = await context.params;
  const access = await cmsAccess(req, id);
  if (!access.ok) return access.response;
  let body: unknown;
  try { body = await readJsonLimited(req, 30000); }
  catch (caught) { const error = caught as JsonBodyError; return NextResponse.json({ error: error.message }, { status: error.status || 400 }); }
  const parsed = collectionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'تحقق من اسم المجموعة والحقول وأسمائها' }, { status: 400 });
  if (!await allowRequest(access.db, req, `cms-collection:${access.userId}`, 40, 3600000)) return NextResponse.json({ error: 'طلبات كثيرة. حاول لاحقًا.' }, { status: 429 });
  const { count, error: countError } = await access.db.from('cms_collections').select('id', { count: 'exact', head: true }).eq('project_id', id);
  if (countError) return NextResponse.json({ error: 'تعذر إنشاء المجموعة' }, { status: 500 });
  if ((count || 0) >= 100) return NextResponse.json({ error: 'وصلت إلى الحد الأقصى للمجموعات' }, { status: 409 });
  const { data, error } = await access.db.from('cms_collections').insert({ project_id: id, ...parsed.data }).select('id,project_id,name,slug,fields,created_at,updated_at').single();
  if (error) return NextResponse.json({ error: error.code === '23505' ? 'هذا الرابط مستخدم بالفعل في المشروع' : 'تعذر إنشاء المجموعة' }, { status: error.code === '23505' ? 409 : 500 });
  return NextResponse.json({ collection: data }, { status: 201 });
}
