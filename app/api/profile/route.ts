import { NextResponse } from 'next/server';
import { z } from 'zod';
import { serviceDb, verifiedUser } from '@/lib/supabase/server';
import { JsonBodyError, readJsonLimited } from '@/lib/server/json';
import { allowRequest } from '@/lib/server/rate-limit';

export const runtime = 'nodejs';
const profileInput = z.object({ name: z.string().trim().min(2).max(80) }).strict();

export async function GET(req: Request) {
  const user = await verifiedUser(req);
  if (!user) return NextResponse.json({ error: 'سجّل الدخول أولًا' }, { status: 401 });
  return NextResponse.json({ profile: { email: user.email, name: user.user_metadata?.full_name || '' } }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function PATCH(req: Request) {
  const db = serviceDb();
  const user = await verifiedUser(req);
  if (!db || !user) return NextResponse.json({ error: 'سجّل الدخول أولًا' }, { status: 401 });
  let body: unknown;
  try { body = await readJsonLimited(req, 1000); }
  catch (caught) { const error = caught as JsonBodyError; return NextResponse.json({ error: error.message }, { status: error.status || 400 }); }
  const parsed = profileInput.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'أدخل اسمًا من حرفين إلى 80 حرفًا' }, { status: 400 });
  if (!await allowRequest(db, req, `profile:${user.id}`, 20, 3600000)) return NextResponse.json({ error: 'انتظر قليلًا قبل تعديل الاسم مجددًا' }, { status: 429 });
  const { error } = await db.auth.admin.updateUserById(user.id, { user_metadata: { ...user.user_metadata, full_name: parsed.data.name } });
  if (error) return NextResponse.json({ error: 'تعذر تحديث الملف الشخصي' }, { status: 500 });
  return NextResponse.json({ name: parsed.data.name });
}
