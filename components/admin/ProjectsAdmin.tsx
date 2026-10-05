'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, FolderOpen } from 'lucide-react';
import { accessToken, clientSupabase } from '@/lib/supabase/client';

type Item={id:string;title:string;owner_email:string;revision:number;updated_at:string};
export function ProjectsAdmin(){
  const client=useMemo(()=>clientSupabase(),[]);
  const [items,setItems]=useState<Item[]>([]),[error,setError]=useState(''),[ready,setReady]=useState(false),[signedIn,setSignedIn]=useState(false),[search,setSearch]=useState('');
  useEffect(()=>{if(!client){setReady(true);return}client.auth.getSession().then(({data})=>{setSignedIn(!!data.session);setReady(true)});const {data:{subscription}}=client.auth.onAuthStateChange((_event,session)=>{setSignedIn(!!session);setReady(true)});return()=>subscription.unsubscribe()},[client]);
  useEffect(()=>{if(!signedIn)return;(async()=>{try{const token=await accessToken();const response=await fetch('/api/admin/projects',{headers:{Authorization:`Bearer ${token}`},cache:'no-store'});const data=await response.json();if(!response.ok)throw Error(data.error);setItems(data.projects)}catch(caught){setError(caught instanceof Error?caught.message:'تعذر تحميل المشاريع')}})()},[signedIn]);
  return <div className="admin-projects" dir="rtl"><header><Link href="/admin"><ArrowRight size={17}/> لوحة الإدارة</Link><h1>مشاريع العملاء</h1><p>كل مشروع مرتبط بحساب صاحبه. يستطيع صاحبه إضافة محررين من داخل المشروع.</p></header>{!ready?<div className="projects-state">جاري التحميل...</div>:!signedIn?<div className="projects-state"><Link href="/admin">سجّل دخول الإدارة أولًا</Link></div>:<main><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ابحث باسم المشروع أو بريد العميل"/><div className="admin-project-list">{items.filter(item=>`${item.title} ${item.owner_email}`.toLowerCase().includes(search.toLowerCase())).map(item=><article key={item.id}><FolderOpen size={22}/><div><strong>{item.title}</strong><span>{item.owner_email}</span></div><small>نسخة {item.revision}</small></article>)}{items.length===0&&<div className="projects-state">لا توجد مشاريع بعد.</div>}</div></main>}{error&&<p className="form-error" role="alert">{error}</p>}</div>
}
