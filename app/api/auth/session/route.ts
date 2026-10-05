import { NextResponse } from 'next/server';
import { serviceDb, verifiedUser } from '@/lib/supabase/server';
import { VERIFIED_COOKIE, cookieOptions, sameOrigin, sessionId, sign } from '@/lib/server/auth-flow';

export async function GET(request: Request) {
  const user = await verifiedUser(request);
  return Response.json({ authenticated: !!user }, { status: user ? 200 : 401, headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'طلب غير صالح.' }, { status: 403 });
  const token = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token || token.length > 8192) return NextResponse.json({ error: 'سجّل الدخول أولًا.' }, { status: 401 });
  const db = serviceDb();
  if (!db) return NextResponse.json({ error: 'إعدادات قاعدة البيانات غير مكتملة.' }, { status: 503 });
  const { data, error } = await db.auth.getUser(token);
  const id = sessionId(token);
  if (error || !data.user || !id) return NextResponse.json({ error: 'جلسة الدخول غير صالحة.' }, { status: 401 });
  const proof = sign({ userId: data.user.id, sessionId: id, expires: Date.now() + 24 * 60 * 60_000 });
  if (!proof) return NextResponse.json({ error: 'إعدادات الحماية غير مكتملة.' }, { status: 503 });
  const response = NextResponse.json({ authenticated: true }, { headers: { 'Cache-Control': 'no-store' } });
  response.cookies.set(VERIFIED_COOKIE, proof, { ...cookieOptions, maxAge: 86400 });
  return response;
}
