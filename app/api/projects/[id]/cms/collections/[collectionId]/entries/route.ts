import { NextResponse } from 'next/server';
import { entrySchema, validateEntryData } from '@/features/cms/schema';
import { cmsAccess, cmsCollection } from '@/features/cms/server';
import { allowRequest } from '@/lib/server/rate-limit';
import { JsonBodyError, readJsonLimited } from '@/lib/server/json';

export const runtime = 'nodejs';
type Context = { params: Promise<{ id: string; collectionId: string }> };
export async function GET(req: Request, context: Context) {
  const { id, collectionId } = await context.params;
  const access = await cmsAccess(req, id);
  if (!access.ok) return access.response;
  const collection = await cmsCollection(access.db, id, collectionId);
  if (!collection) return NextResponse.json({ error: 'المجموعة غير موجودة' }, { status: 404 });
  const params = new URL(req.url).searchParams;
  const page = Math.max(1, Math.min(1000, Math.trunc(Number(params.get('page') || 1) || 1)));
  const limit = Math.max(1, Math.min(50, Math.trunc(Number(params.get('limit') || 20) || 20)));
  const status = params.get('status');
  let query = access.db.from('cms_entries').select('id,project_id,collection_id,data,status,created_at,updated_at', { count: 'exact' }).eq('project_id', id).eq('collection_id', collectionId).order('created_at', { ascending: false }).range((page - 1) * limit, page * limit - 1);
  if (status === 'draft' || status === 'published') query = query.eq('status', status);
  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: 'تعذر تحميل العناصر' }, { status: 500 });
  return NextResponse.json({ entries: data, total: count || 0, nextPage: page * limit < (count || 0) ? page + 1 : null }, { headers: { 'Cache-Control': 'no-store' } });
}
export async function POST(req: Request, context: Context) {
  const { id, collectionId } = await context.params;
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
  const { data, error } = await access.db.from('cms_entries').insert({ project_id: id, collection_id: collectionId, data: validated.data, status: parsed.data.status }).select('id,project_id,collection_id,data,status,created_at,updated_at').single();
  if (error) return NextResponse.json({ error: 'تعذر إنشاء العنصر' }, { status: 500 });
  return NextResponse.json({ entry: data }, { status: 201 });
}
