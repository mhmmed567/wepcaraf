import { NextResponse } from 'next/server';
import { z } from 'zod';
import { serviceDb, verifyAdmin } from '@/lib/supabase/server';
import { JsonBodyError, readJsonLimited } from '@/lib/server/json';

export const runtime = 'nodejs';
const assetSchema = z.object({
  id: z.string().regex(/^asset-[a-z0-9-]{3,74}$/),
  category: z.enum(['template', 'button', 'component', 'script']),
  framework: z.enum(['html', 'nextjs']),
  title: z.string().trim().min(1).max(120),
  titleEn: z.string().trim().max(120),
  description: z.string().trim().max(600),
  descriptionEn: z.string().trim().max(600),
  price: z.number().finite().min(0).max(100000),
  published: z.boolean(),
  html: z.string().max(30000),
  css: z.string().max(30000),
  js: z.string().max(30000),
  nextCode: z.string().max(40000),
}).strict();

export async function GET(req: Request) {
  const db = serviceDb();
  if (!db) return NextResponse.json({ error: 'قاعدة البيانات غير مهيأة' }, { status: 503 });
  const admin = await verifyAdmin(req);
  const { data, error } = await db.from('catalog_components').select('data').like('id', 'asset-%').limit(200);
  if (error) return NextResponse.json({ error: 'تعذر تحميل المكتبة' }, { status: 500 });
  const assets = (data || []).map(row => assetSchema.safeParse(row.data)).filter(result => result.success).map(result => result.data);
  return NextResponse.json({ assets: admin ? assets : assets.filter(asset => asset.published), admin }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function PUT(req: Request) {
  const db = serviceDb();
  if (!db) return NextResponse.json({ error: 'قاعدة البيانات غير مهيأة' }, { status: 503 });
  if (!await verifyAdmin(req)) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
  let body: unknown;
  try { body = await readJsonLimited(req, 145000); }
  catch (caught) { const error = caught as JsonBodyError; return NextResponse.json({ error: error.message }, { status: error.status || 400 }); }
  const parsed = assetSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'تحقق من بيانات العنصر وحجم الأكواد' }, { status: 400 });
  const { error } = await db.from('catalog_components').upsert({ id: parsed.data.id, data: parsed.data });
  if (error) return NextResponse.json({ error: 'تعذر حفظ العنصر' }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const db = serviceDb();
  if (!db) return NextResponse.json({ error: 'قاعدة البيانات غير مهيأة' }, { status: 503 });
  if (!await verifyAdmin(req)) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
  const id = new URL(req.url).searchParams.get('id');
  if (!id || !/^asset-[a-z0-9-]{3,74}$/.test(id)) return NextResponse.json({ error: 'معرّف غير صالح' }, { status: 400 });
  const { error } = await db.from('catalog_components').delete().eq('id', id);
  if (error) return NextResponse.json({ error: 'تعذر الحذف' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
