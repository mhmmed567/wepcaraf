import { NextResponse } from 'next/server';
import { collectionSchema } from '@/features/cms/schema';
import { cmsAccess, cmsCollection } from '@/features/cms/server';
import { allowRequest } from '@/lib/server/rate-limit';
import { JsonBodyError, readJsonLimited } from '@/lib/server/json';

export const runtime = 'nodejs';
type Context = { params: Promise<{ id: string; collectionId: string }> };
export async function PATCH(req: Request, context: Context) {
  const { id, collectionId } = await context.params;
  const access = await cmsAccess(req, id);
  if (!access.ok) return access.response;
  const current = await cmsCollection(access.db, id, collectionId);
  if (!current) return NextResponse.json({ error: 'المجموعة غير موجودة' }, { status: 404 });
  let body: unknown;
  try { body = await readJsonLimited(req, 30000); }
  catch (caught) { const error = caught as JsonBodyError; return NextResponse.json({ error: error.message }, { status: error.status || 400 }); }
  const parsed = collectionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'تحقق من بيانات المجموعة' }, { status: 400 });
  if (!await allowRequest(access.db, req, `cms-collection:${access.userId}`, 40, 3600000)) return NextResponse.json({ error: 'طلبات كثيرة. حاول لاحقًا.' }, { status: 429 });
  const { data, error } = await access.db.from('cms_collections').update({ ...parsed.data, updated_at: new Date().toISOString() }).eq('id', collectionId).eq('project_id', id).select('id,project_id,name,slug,fields,created_at,updated_at').single();
  if (error) return NextResponse.json({ error: error.code === '23505' ? 'هذا الرابط مستخدم بالفعل' : 'تعذر حفظ المجموعة' }, { status: error.code === '23505' ? 409 : 500 });
  return NextResponse.json({ collection: data });
}
export async function DELETE(req: Request, context: Context) {
  const { id, collectionId } = await context.params;
  const access = await cmsAccess(req, id);
  if (!access.ok) return access.response;
  const current = await cmsCollection(access.db, id, collectionId);
  if (!current) return NextResponse.json({ error: 'المجموعة غير موجودة' }, { status: 404 });
  if (!await allowRequest(access.db, req, `cms-collection:${access.userId}`, 40, 3600000)) return NextResponse.json({ error: 'طلبات كثيرة. حاول لاحقًا.' }, { status: 429 });
  const { error } = await access.db.from('cms_collections').delete().eq('id', collectionId).eq('project_id', id);
  if (error) return NextResponse.json({ error: 'تعذر حذف المجموعة' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
