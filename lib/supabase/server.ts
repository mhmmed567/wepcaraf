import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';
import { VERIFIED_COOKIE, readSigned, sessionId } from '@/lib/server/auth-flow';

let serverClient: SupabaseClient | null = null;
export function serviceDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  serverClient ??= createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return serverClient;
}

export async function verifiedUser(request: Request): Promise<User | null> {
  const db = serviceDb();
  const token = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!db || !token) return null;
  const { data: auth, error: authError } = await db.auth.getUser(token);
  if (authError || !auth.user) return null;
  const proof = readSigned<{ userId: string; sessionId: string; expires: number }>(request, VERIFIED_COOKIE);
  if (!proof || proof.userId !== auth.user.id || proof.sessionId !== sessionId(token)) return null;
  return auth.user;
}

export async function verifyAdmin(request: Request) {
  const db = serviceDb();
  const user = await verifiedUser(request);
  if (!db || !user) return false;
  const { data, error } = await db.from('admin_users').select('user_id').eq('user_id', user.id).maybeSingle();
  return !error && !!data;
}
