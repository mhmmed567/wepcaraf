import { NextResponse } from 'next/server';
import { serviceDb, verifyAdmin } from '@/lib/supabase/server';
export const runtime='nodejs';
export async function GET(req:Request){const db=serviceDb();if(!db)return NextResponse.json({error:'قاعدة البيانات غير مهيأة'},{status:503});if(!await verifyAdmin(req))return NextResponse.json({error:'غير مصرح'},{status:403});const {data,error}=await db.from('projects').select('id,title,owner_email,revision,updated_at').order('updated_at',{ascending:false}).limit(200);if(error)return NextResponse.json({error:'تعذر تحميل المشاريع'},{status:500});return NextResponse.json({projects:data},{headers:{'Cache-Control':'no-store'}})}
