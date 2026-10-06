import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { projectApiAccess } from '@/lib/server/project-api-access';
import { uuidPattern } from '@/lib/server/projects';
import type { CmsCollection } from './types';

export { projectApiAccess as cmsAccess };

export async function cmsCollection(db: SupabaseClient, projectId: string, collectionId: string): Promise<CmsCollection | null> {
  if (!uuidPattern.test(collectionId)) return null;
  const { data, error } = await db.from('cms_collections').select('id,project_id,name,slug,fields,created_at,updated_at').eq('id', collectionId).eq('project_id', projectId).maybeSingle();
  if (error) throw error;
  return data as CmsCollection | null;
}
