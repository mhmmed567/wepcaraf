import { NextResponse } from 'next/server';
import { cmsAccess } from '@/features/cms/server';

export const runtime = 'nodejs';
type Context = { params: Promise<{ id: string }> };
export async function GET(req: Request, context: Context) {
  const { id } = await context.params;
  const access = await cmsAccess(req, id);
  if (!access.ok) return access.response;
  const { data: collections, error } = await access.db.rpc('project_cms_preview', { p_project_id: id });
  if (error) return NextResponse.json({ error: 'تعذر تحميل محتوى المعاينة' }, { status: 500 });
  const bindings: Record<string, string> = {};
  const fields: { token: string; label: string }[] = [];
  for (const collection of collections || []) {
    for (const field of collection.fields as { key: string; label: string; type: string }[]) {
      if (!['text', 'long_text', 'number', 'currency', 'date', 'email', 'phone', 'url', 'image', 'select'].includes(field.type)) continue;
      const token = `${collection.slug}.${field.key}`;
      fields.push({ token, label: `${collection.slug} / ${field.label}` });
      const value = (collection.data as Record<string, unknown>)?.[field.key];
      if (typeof value === 'string' || typeof value === 'number') bindings[token] = String(value);
    }
  }
  return NextResponse.json({ bindings, fields }, { headers: { 'Cache-Control': 'no-store' } });
}
