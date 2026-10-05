import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { serviceDb, verifiedUser } from '@/lib/supabase/server';
import { designSchema } from '@/lib/schemas/design';
import { allowRequest } from '@/lib/server/rate-limit';
import { projectAccess, uuidPattern } from '@/lib/server/projects';
import { JsonBodyError, readJsonLimited } from '@/lib/server/json';
export const runtime='nodejs';
export async function POST(req:Request){const db=serviceDb();if(!db)return NextResponse.json({error:'المشاركة غير مفعّلة'},{status:503});const user=await verifiedUser(req);if(!user)return NextResponse.json({error:'سجّل الدخول أولًا'},{status:401});let body:unknown;try{body=await readJsonLimited(req,10000)}catch(caught){const error=caught as JsonBodyError;return NextResponse.json({error:error.message},{status:error.status||400})}const projectId=(body as {projectId?:string})?.projectId;if(!uuidPattern.test(projectId||''))return NextResponse.json({error:'مشروع غير صالح'},{status:400});try{const access=await projectAccess(db,projectId!,user.id);if(!access)return NextResponse.json({error:'المشروع غير موجود'},{status:404});const parsed=designSchema.safeParse(access.project.design);if(!parsed.success)return NextResponse.json({error:'تصميم غير صالح'},{status:400});if(!await allowRequest(db,req,`share:${user.id}`,10,3600000))return NextResponse.json({error:'حاول لاحقًا'},{status:429});const token=randomBytes(20).toString('hex');const {error}=await db.from('shares').insert({token,design:parsed.data,expires_at:new Date(Date.now()+30*86400000).toISOString()});if(error)throw error;return NextResponse.json({url:`${new URL(req.url).origin}/share/${token}`},{status:201})}catch{return NextResponse.json({error:'تعذرت مشاركة التصميم'},{status:500})}}
