import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

export const CHALLENGE_COOKIE = 'webcraft_challenge';
export const VERIFIED_COOKIE = 'webcraft_verified';

type Verified = { userId: string; sessionId: string; expires: number };

function secret() { return process.env.APP_AUTH_SECRET || process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY; }

export function authClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }) : null;
}

export function sign(value: Verified) {
  const key = secret();
  if (!key) return null;
  const body = Buffer.from(JSON.stringify(value)).toString('base64url');
  const signature = createHmac('sha256', key).update(body).digest('base64url');
  return `${body}.${signature}`;
}

export function readSigned<T extends Verified>(request: Request, name: string): T | null {
  const key = secret();
  const raw = request.headers.get('cookie')?.split(';').map(v => v.trim()).find(v => v.startsWith(`${name}=`))?.slice(name.length + 1);
  if (!key || !raw || raw.length > 2048) return null;
  const [body, signature, extra] = raw.split('.');
  if (!body || !signature || extra) return null;
  const expected = createHmac('sha256', key).update(body).digest();
  let actual: Buffer;
  try { actual = Buffer.from(signature, 'base64url'); } catch { return null; }
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  try {
    const value = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as T;
    return typeof value.expires === 'number' && value.expires > Date.now() ? value : null;
  } catch { return null; }
}

export function sessionId(accessToken: string): string | null {
  try {
    const payload = JSON.parse(Buffer.from(accessToken.split('.')[1], 'base64url').toString('utf8'));
    return typeof payload.session_id === 'string' ? payload.session_id : null;
  } catch { return null; }
}

export function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  if (!origin || !host) return false;
  try {
    const parsed = new URL(origin);
    const protocol = request.headers.get('x-forwarded-proto') || new URL(request.url).protocol.slice(0, -1);
    return parsed.host === host && parsed.protocol === `${protocol}:`;
  } catch { return false; }
}

export const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' as const, path: '/' };
