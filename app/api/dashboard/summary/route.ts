import { NextResponse } from 'next/server';
import { serviceDb, verifiedUser } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const db = serviceDb();
  if (!db) return NextResponse.json({ error: 'قاعدة البيانات غير مهيأة' }, { status: 503 });
  const user = await verifiedUser(req);
  if (!user) return NextResponse.json({ error: 'سجّل الدخول أولًا' }, { status: 401 });
  const [owned, shared, requests] = await Promise.all([
    db.from('projects').select('id', { count: 'exact', head: true }).eq('owner_id', user.id),
    db.from('project_members').select('project_id', { count: 'exact', head: true }).eq('user_id', user.id),
    db.from('requests').select('id', { count: 'exact', head: true }).eq('client_id', user.id),
  ]);
  if (owned.error || shared.error || requests.error) return NextResponse.json({ error: 'تعذر تحميل ملخص مساحة العمل' }, { status: 500 });
  return NextResponse.json({ ownedProjects: owned.count || 0, sharedProjects: shared.count || 0, designRequests: requests.count || 0 }, { headers: { 'Cache-Control': 'no-store' } });
}
