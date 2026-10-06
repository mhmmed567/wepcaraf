import { NextResponse } from 'next/server';
import { z } from 'zod';
import { blankDesign, designFromTemplate } from '@/lib/templates';
import { serviceDb, verifiedUser } from '@/lib/supabase/server';
import { allowRequest } from '@/lib/server/rate-limit';
import { JsonBodyError, readJsonLimited } from '@/lib/server/json';

export const runtime='nodejs';
const titleSchema=z.string().trim().min(1).max(160);

export async function GET(req:Request){
  const db=serviceDb();if(!db)return NextResponse.json({error:'قاعدة البيانات غير مهيأة'},{status:503});
  const user=await verifiedUser(req);if(!user)return NextResponse.json({error:'سجّل الدخول أولًا'},{status:401});
  const url=new URL(req.url);
  const limit=Math.max(1,Math.min(100,Math.trunc(Number(url.searchParams.get('limit')||100)||100)));
  const page=Math.max(1,Math.min(1000,Math.trunc(Number(url.searchParams.get('page')||1)||1)));
  const search=(url.searchParams.get('search')||'').trim().slice(0,80);
  const {data,error}=await db.rpc('list_user_projects',{p_user_id:user.id,p_search:search.replace(/[%_]/g,''),p_limit:limit,p_offset:(page-1)*limit});
  if(error)return NextResponse.json({error:'تعذر تحميل المشاريع'},{status:500});
  const total=Number(data?.[0]?.total_count||0);
  return NextResponse.json({projects:(data||[]).map(({owner_id,total_count,...project}:{owner_id:string;total_count:number;id:string;title:string;revision:number;updated_at:string})=>({...project,role:owner_id===user.id?'owner':'editor'})),total,nextPage:page*limit<total?page+1:null},{headers:{'Cache-Control':'no-store'}});
}

export async function POST(req:Request){
  const db=serviceDb();if(!db)return NextResponse.json({error:'قاعدة البيانات غير مهيأة'},{status:503});
  const user=await verifiedUser(req);if(!user)return NextResponse.json({error:'سجّل الدخول أولًا'},{status:401});
  let raw:unknown;try{raw=await readJsonLimited(req)}catch(caught){const error=caught as JsonBodyError;return NextResponse.json({error:error.message},{status:error.status||400})}
  const input=raw as {title?:unknown;templateId?:unknown;locale?:unknown};
  const parsed=titleSchema.safeParse(input?.title);
  if(!parsed.success)return NextResponse.json({error:'اسم المشروع غير صالح'},{status:400});
  const templateId=typeof input.templateId==='string'?input.templateId:'';
  const locale=input.locale==='en'?'en':'ar';
  const templateDesign=templateId?designFromTemplate(templateId,parsed.data,locale):null;
  if(templateId&&!templateDesign)return NextResponse.json({error:'القالب غير صالح'},{status:400});
  try{
    if(!await allowRequest(db,req,`project:${user.id}`,10,3600000))return NextResponse.json({error:'انتظر قليلًا قبل إنشاء مشروع جديد'},{status:429});
    const {count,error:countError}=await db.from('projects').select('id',{count:'exact',head:true}).eq('owner_id',user.id);
    if(countError)throw countError;
    if((count??0)>=100)return NextResponse.json({error:'وصلت إلى الحد الأقصى للمشاريع'},{status:409});
    const design=templateDesign??blankDesign(parsed.data,locale);
    const {data,error}=await db.from('projects').insert({owner_id:user.id,owner_email:user.email||'',title:parsed.data,design}).select('id').single();
    if(error)throw error;
    return NextResponse.json({id:data.id},{status:201});
  }catch{return NextResponse.json({error:'تعذر إنشاء المشروع'},{status:500})}
}
