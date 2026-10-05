import type { SupabaseClient } from '@supabase/supabase-js';

export const uuidPattern=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export async function projectAccess(db:SupabaseClient,projectId:string,userId:string){
  const {data:project,error}=await db.from('projects').select('id,owner_id,title,design,revision,updated_at').eq('id',projectId).maybeSingle();
  if(error)throw error;
  if(!project)return null;
  if(project.owner_id===userId)return {project,role:'owner' as const};
  const {data:member,error:memberError}=await db.from('project_members').select('role').eq('project_id',projectId).eq('user_id',userId).maybeSingle();
  if(memberError)throw memberError;
  return member?.role==='editor'?{project,role:'editor' as const}:null;
}
