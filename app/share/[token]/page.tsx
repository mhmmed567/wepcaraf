import { notFound } from 'next/navigation';
import { serviceDb } from '@/lib/supabase/server';
import { Preview } from '@/components/preview/Preview';
import { designSchema } from '@/lib/schemas/design';
export const metadata={title:'معاينة تصميم | WEBCRAFT',robots:{index:false,follow:false}};
export default async function SharePage({params}:{params:Promise<{token:string}>}){const {token}=await params;if(!/^[a-f0-9]{40}$/.test(token))notFound();const db=serviceDb();if(!db)notFound();const {data,error}=await db.from('shares').select('design,expires_at').eq('token',token).maybeSingle();if(error||!data||new Date(data.expires_at).getTime()<Date.now())notFound();const design=designSchema.safeParse(data.design);if(!design.success)notFound();return <div><div style={{padding:'12px 25px',background:'#24222d',color:'#fff',fontSize:12,display:'flex',justifyContent:'space-between'}}><strong>WEBCRAFT · معاينة للعرض فقط</strong><span>تنتهي صلاحية الرابط بعد 30 يومًا</span></div><Preview design={design.data}/></div>}
