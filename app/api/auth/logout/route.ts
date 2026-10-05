import { NextResponse } from 'next/server';
import { CHALLENGE_COOKIE, VERIFIED_COOKIE, sameOrigin } from '@/lib/server/auth-flow';

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'طلب غير صالح.' }, { status: 403 });
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(VERIFIED_COOKIE);
  response.cookies.delete(CHALLENGE_COOKIE);
  response.headers.set('Cache-Control', 'no-store');
  return response;
}
