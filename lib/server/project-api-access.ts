import 'server-only';
import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { serviceDb, verifiedUser } from '@/lib/supabase/server';
import { uuidPattern } from '@/lib/server/projects';

export type ProjectApiAccess = { ok: true; db: SupabaseClient; userId: string; role: 'owner' | 'editor' } | { ok: false; response: NextResponse };
export async function projectApiAccess(req: Request, projectId: string): Promise<ProjectApiAccess> {
  if (!uuidPattern.test(projectId)) return { ok: false, response: NextResponse.json({ error: 'معرّف المشروع غير صالح' }, { status: 400 }) };
  const db = serviceDb();
  if (!db) return { ok: false, response: NextResponse.json({ error: 'قاعدة البيانات غير مهيأة' }, { status: 503 }) };
  const user = await verifiedUser(req);
  if (!user) return { ok: false, response: NextResponse.json({ error: 'سجّل الدخول أولًا' }, { status: 401 }) };
  const { data: project, error } = await db.from('projects').select('owner_id').eq('id', projectId).maybeSingle();
  if (error) return { ok: false, response: NextResponse.json({ error: 'تعذر التحقق من المشروع' }, { status: 500 }) };
  if (!project) return { ok: false, response: NextResponse.json({ error: 'المشروع غير موجود' }, { status: 404 }) };
  if (project.owner_id === user.id) return { ok: true, db, userId: user.id, role: 'owner' };
  const { data: member, error: memberError } = await db.from('project_members').select('role').eq('project_id', projectId).eq('user_id', user.id).maybeSingle();
  if (memberError) return { ok: false, response: NextResponse.json({ error: 'تعذر التحقق من الصلاحيات' }, { status: 500 }) };
  if (member?.role === 'editor') return { ok: true, db, userId: user.id, role: 'editor' };
  return { ok: false, response: NextResponse.json({ error: 'المشروع غير موجود' }, { status: 404 }) };
}
