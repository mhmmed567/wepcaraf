'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Builder } from '@/components/builder/Builder';
import { accessToken, clientSupabase } from '@/lib/supabase/client';
import { designSchema } from '@/lib/schemas/design';
import type { Design } from '@/types/design';

type Project={id:string;design:Design;revision:number;role:'owner'|'editor'};
export function ProjectEditor({id}:{id:string}){
  const client=useMemo(()=>clientSupabase(),[]),router=useRouter();
  const [project,setProject]=useState<Project|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(true);
  useEffect(()=>{
    if(!client){setError('قاعدة البيانات غير مهيأة');setLoading(false);return}
    let active=true;
    (async()=>{try{const {data}=await client.auth.getSession();if(!data.session){router.replace('/login');return}const token=await accessToken();const response=await fetch(`/api/projects/${id}`,{headers:{Authorization:`Bearer ${token}`},cache:'no-store'});const result=await response.json();if(!response.ok)throw Error(result.error);const design=designSchema.safeParse(result.project.design);if(!design.success)throw Error('بيانات المشروع غير صالحة');if(active)setProject({...result.project,design:design.data})}catch(caught){if(active)setError(caught instanceof Error?caught.message:'تعذر فتح المشروع')}finally{if(active)setLoading(false)}})();
    const {data:{subscription}}=client.auth.onAuthStateChange((_event,session)=>{if(!session)router.replace('/login')});
    return()=>{active=false;subscription.unsubscribe()};
  },[client,id,router]);
  if(loading)return <div className="projects-state">جاري تحميل المشروع...</div>;
  if(error)return <div className="projects-state"><h2>{error}</h2><Link href="/builder">العودة إلى المشاريع</Link></div>;
  if(!project)return <div className="projects-state">جاري التحقق من تسجيل الدخول...</div>;
  return <Builder key={project.id} projectId={project.id} initialDesign={project.design} initialRevision={project.revision} role={project.role}/>;
}
