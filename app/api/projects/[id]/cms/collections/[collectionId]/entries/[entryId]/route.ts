import { NextResponse } from 'next/server';
import { entrySchema, validateEntryData } from '@/features/cms/schema';
import { cmsAccess, cmsCollection } from '@/features/cms/server';
import { uuidPattern } from '@/lib/server/projects';
import { allowRequest } from '@/lib/server/rate-limit';
import { JsonBodyError, readJsonLimited } from '@/lib/server/json';

export const runtime = 'nodejs';
type Context = { params: Promise<{ id: string; collectionId: string; entryId: string }> };
export async function PATCH(req: Request, context: Context) {
  const { id, collectionId, entryId } = await context.params;
  if (!uuidPattern.test(entryId)) return NextResponse.json({ error: 'معرّف غير صالح' }, { status: 400 });
  const access = await cmsAccess(req, id);
  if (!access.ok) return access.response;
  const collection = await cmsCollection(access.db, id, collectionId);
  if (!collection) return NextResponse.json({ error: 'المجموعة غير موجودة' }, { status: 404 });
  let body: unknown;
  try { body = await readJsonLimited(req, 100000); }
  catch (caught) { const error = caught as JsonBodyError; return NextResponse.json({ error: error.message }, { status: error.status || 400 }); }
  const parsed = entrySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'بيانات العنصر غير صالحة' }, { status: 400 });
  const validated = validateEntryData(collection.fields, parsed.data.data);
  if (!validated.ok) return NextResponse.json({ error: validated.error }, { status: 400 });
  if (!await allowRequest(access.db, req, `cms-entry:${access.userId}`, 120, 3600000)) return NextResponse.json({ error: 'طلبات كثيرة. حاول لاحقًا.' }, { status: 429 });
  const { data, error } = await access.db.from('cms_entries').update({ data: validated.data, status: parsed.data.status, updated_at: new Date().toISOString() }).eq('id', entryId).eq('project_id', id).eq('collection_id', collectionId).select('id,project_id,collection_id,data,status,created_at,updated_at').maybeSingle();
  if (error) return NextResponse.json({ error: 'تعذر حفظ العنصر' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'العنصر غير موجود' }, { status: 404 });
  return NextResponse.json({ entry: data });
}
export async function DELETE(req: Request, context: Context) {
  const { id, collectionId, entryId } = await context.params;
  if (!uuidPattern.test(entryId)) return NextResponse.json({ error: 'معرّف غير صالح' }, { status: 400 });
  const access = await cmsAccess(req, id);
  if (!access.ok) return access.response;
  if (!await allowRequest(access.db, req, `cms-entry:${access.userId}`, 120, 3600000)) return NextResponse.json({ error: 'طلبات كثيرة. حاول لاحقًا.' }, { status: 429 });
  const { data, error } = await access.db.from('cms_entries').delete().eq('id', entryId).eq('project_id', id).eq('collection_id', collectionId).select('id').maybeSingle();
  if (error) return NextResponse.json({ error: 'تعذر حذف العنصر' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'العنصر غير موجود' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
