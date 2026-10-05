import { NextResponse } from 'next/server';
import { z } from 'zod';
import { projectAccess, uuidPattern } from '@/lib/server/projects';
import { serviceDb, verifiedUser } from '@/lib/supabase/server';
import { allowRequest } from '@/lib/server/rate-limit';
import { JsonBodyError, readJsonLimited } from '@/lib/server/json';

export const runtime='nodejs';
type Context={params:Promise<{id:string}>};
export async function GET(req:Request,ctx:Context){
  const db=serviceDb();if(!db)return NextResponse.json({error:'قاعدة البيانات غير مهيأة'},{status:503});
  const user=await verifiedUser(req);if(!user)return NextResponse.json({error:'غير مصرح'},{status:401});
  const {id}=await ctx.params;if(!uuidPattern.test(id))return NextResponse.json({error:'معرّف غير صالح'},{status:400});
  try{const access=await projectAccess(db,id,user.id);if(!access)return NextResponse.json({error:'المشروع غير موجود'},{status:404});const {data,error}=await db.from('project_members').select('user_id,email,role').eq('project_id',id);if(error)throw error;return NextResponse.json({role:access.role,members:data},{headers:{'Cache-Control':'no-store'}})}catch{return NextResponse.json({error:'تعذر تحميل المتعاونين'},{status:500})}
}
export async function POST(req:Request,ctx:Context){
  const db=serviceDb();if(!db)return NextResponse.json({error:'قاعدة البيانات غير مهيأة'},{status:503});
  const user=await verifiedUser(req);if(!user)return NextResponse.json({error:'غير مصرح'},{status:401});
  const {id}=await ctx.params;if(!uuidPattern.test(id))return NextResponse.json({error:'معرّف غير صالح'},{status:400});
  let raw:unknown;try{raw=await readJsonLimited(req,10000)}catch(caught){const error=caught as JsonBodyError;return NextResponse.json({error:error.message},{status:error.status||400})}const email=z.email().max(254).safeParse((raw as {email?:unknown})?.email);
  if(!email.success)return NextResponse.json({error:'البريد غير صالح'},{status:400});
  try{const access=await projectAccess(db,id,user.id);if(!access)return NextResponse.json({error:'المشروع غير موجود'},{status:404});if(access.role!=='owner')return NextResponse.json({error:'صاحب المشروع فقط يستطيع إضافة متعاونين'},{status:403});if(!await allowRequest(db,req,`member:${user.id}`,20,3600000))return NextResponse.json({error:'محاولات كثيرة. حاول بعد قليل.'},{status:429});const {count,error:countError}=await db.from('project_members').select('user_id',{count:'exact',head:true}).eq('project_id',id);if(countError)throw countError;if((count??0)>=20)return NextResponse.json({error:'الحد الأقصى 20 متعاونًا'},{status:409});const {data,error}=await db.rpc('add_project_editor',{p_project_id:id,p_owner_id:user.id,p_email:email.data.toLowerCase()});if(error)throw error;if(!data)return NextResponse.json({error:'لم يُعثر على حساب بهذا البريد.'},{status:404});return NextResponse.json({ok:true})}catch{return NextResponse.json({error:'تعذرت إضافة المتعاون'},{status:500})}
}
