import { NextResponse } from 'next/server';
import { projectAccess, uuidPattern } from '@/lib/server/projects';
import { serviceDb, verifiedUser } from '@/lib/supabase/server';

export const runtime='nodejs';
export async function DELETE(req:Request,ctx:{params:Promise<{id:string;userId:string}>}){
  const db=serviceDb();if(!db)return NextResponse.json({error:'قاعدة البيانات غير مهيأة'},{status:503});
  const user=await verifiedUser(req);if(!user)return NextResponse.json({error:'غير مصرح'},{status:401});
  const {id,userId}=await ctx.params;if(!uuidPattern.test(id)||!uuidPattern.test(userId))return NextResponse.json({error:'معرّف غير صالح'},{status:400});
  try{const access=await projectAccess(db,id,user.id);if(!access)return NextResponse.json({error:'المشروع غير موجود'},{status:404});if(access.role!=='owner')return NextResponse.json({error:'غير مصرح'},{status:403});const {error}=await db.from('project_members').delete().eq('project_id',id).eq('user_id',userId);if(error)throw error;return NextResponse.json({ok:true})}catch{return NextResponse.json({error:'تعذر إزالة المتعاون'},{status:500})}
}
