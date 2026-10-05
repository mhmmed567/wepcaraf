import { NextResponse } from 'next/server';
import { z } from 'zod';
import { designSchema } from '@/lib/schemas/design';
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
  try{const access=await projectAccess(db,id,user.id);if(!access)return NextResponse.json({error:'المشروع غير موجود'},{status:404});return NextResponse.json({project:{id,title:access.project.title,design:access.project.design,revision:access.project.revision,role:access.role,updatedAt:access.project.updated_at}},{headers:{'Cache-Control':'no-store'}})}catch{return NextResponse.json({error:'تعذر تحميل المشروع'},{status:500})}
}

export async function PATCH(req:Request,ctx:Context){
  const db=serviceDb();if(!db)return NextResponse.json({error:'قاعدة البيانات غير مهيأة'},{status:503});
  const user=await verifiedUser(req);if(!user)return NextResponse.json({error:'غير مصرح'},{status:401});
  const {id}=await ctx.params;if(!uuidPattern.test(id))return NextResponse.json({error:'معرّف غير صالح'},{status:400});
  let raw:unknown;try{raw=await readJsonLimited(req,4_000_000)}catch(caught){const error=caught as JsonBodyError;return NextResponse.json({error:error.message},{status:error.status||400})}
  const parsed=z.object({revision:z.number().int().min(1),design:designSchema}).safeParse(raw);
  if(!parsed.success)return NextResponse.json({error:'التصميم غير صالح'},{status:400});
  try{
    const access=await projectAccess(db,id,user.id);if(!access)return NextResponse.json({error:'المشروع غير موجود'},{status:404});
    if(!await allowRequest(db,req,`edit:${user.id}`,120,60000))return NextResponse.json({error:'محاولات حفظ كثيرة. حاول بعد قليل.'},{status:429});
    const {data,error}=await db.rpc('save_project_design',{p_project_id:id,p_user_id:user.id,p_design:parsed.data.design,p_revision:parsed.data.revision});
    if(error)throw error;
    if(data===null)return NextResponse.json({error:'حُفظ تعديل أحدث بواسطة متعاون. أعد تحميل المشروع قبل المتابعة.'},{status:409});
    return NextResponse.json({revision:data});
  }catch{return NextResponse.json({error:'تعذر حفظ المشروع'},{status:500})}
}
