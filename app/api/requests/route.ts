import { NextResponse } from 'next/server';
import { serviceDb, verifiedUser, verifyAdmin } from '@/lib/supabase/server';
import { requestSchema } from '@/lib/schemas/design';
import { randomUUID } from 'crypto';
import { allowRequest } from '@/lib/server/rate-limit';
import { designSchema } from '@/lib/schemas/design';
import { JsonBodyError, readJsonLimited } from '@/lib/server/json';
export const runtime='nodejs';
export async function POST(req:Request){
  const db=serviceDb();if(!db)return NextResponse.json({error:'إرسال الطلبات غير مفعّل. يرجى إعداد Supabase على الخادم.'},{status:503});
  const user=await verifiedUser(req);if(!user)return NextResponse.json({error:'سجّل الدخول أولًا'},{status:401});
  let raw:unknown;try{raw=await readJsonLimited(req)}catch(caught){const error=caught as JsonBodyError;return NextResponse.json({error:error.message},{status:error.status||400})}
  const parsed=requestSchema.safeParse(raw);if(!parsed.success)return NextResponse.json({error:'تحقق من بيانات المشروع ومعلومات التواصل.'},{status:400});if(parsed.data.website)return NextResponse.json({error:'تعذر إرسال الطلب'},{status:400});
  try{
    const {data:project,error:projectError}=await db.from('projects').select('design,owner_id').eq('id',parsed.data.projectId).maybeSingle();
    if(projectError)throw projectError;if(!project||project.owner_id!==user.id)return NextResponse.json({error:'صاحب المشروع فقط يستطيع إرسال الطلب'},{status:403});
    const design=designSchema.safeParse(project.design);if(!design.success)return NextResponse.json({error:'احفظ التصميم أولًا'},{status:400});
    if(!await allowRequest(db,req,`request:${user.id}`,5,3600000))return NextResponse.json({error:'تم تجاوز عدد الطلبات المسموح بها. حاول لاحقًا.'},{status:429});
    const id=`WC-${new Date().getFullYear()}-${randomUUID().slice(0,8).toUpperCase()}`;
    const result=await db.rpc('create_design_request',{p_id:id,p_design:design.data,p_contact:parsed.data.contact,p_project_id:parsed.data.projectId,p_client_id:user.id});
    if(result.error){
      // Older Supabase deployments may not have the latest RPC yet. Keep the
      // same ownership checks and use service-role inserts only for this request.
      if(!['PGRST202','42883'].includes(result.error.code||''))throw result.error;
      const {error:designError}=await db.from('designs').insert({id,design:design.data});
      if(designError)throw designError;
      const {error:requestError}=await db.from('requests').insert({id,project_id:parsed.data.projectId,client_id:user.id,contact:parsed.data.contact});
      if(requestError){await db.from('designs').delete().eq('id',id);throw requestError;}
    }
    return NextResponse.json({requestId:id},{status:201});
  }catch(caught){
    const code=typeof caught==='object'&&caught&&'code'in caught?String((caught as {code:unknown}).code):'unknown';
    console.error('Design request could not be saved', { code });
    return NextResponse.json({error:'تعذر حفظ الطلب حاليًا. أعد المحاولة بعد قليل، وإذا استمرت المشكلة أرسل رقم المشروع للدعم.'},{status:500});
  }
}
export async function GET(req:Request){const db=serviceDb();if(!db)return NextResponse.json({error:'Supabase غير مهيأ'},{status:503});if(!await verifyAdmin(req))return NextResponse.json({error:'غير مصرح'},{status:403});const {data,error}=await db.from('requests').select('id,contact,status,created_at').order('created_at',{ascending:false}).limit(100);if(error)return NextResponse.json({error:'تعذر تحميل الطلبات'},{status:500});return NextResponse.json({requests:data.map(r=>({id:r.id,contact:r.contact,status:r.status,createdAt:r.created_at,designId:r.id}))})}
