import { createHash } from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
export async function allowRequest(db:SupabaseClient,request:Request,scope:string,max:number,windowMs:number){
 const key=createHash('sha256').update(`${process.env.NEXT_PUBLIC_SUPABASE_URL}:${scope}`).digest('hex');
 const {data,error}=await db.rpc('take_rate_limit',{p_key:key,p_max:max,p_window_ms:windowMs});
 if(error)throw error;
 return data===true;
}
