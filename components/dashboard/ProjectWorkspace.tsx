'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, FilePenLine, Layers3, Settings2, ShoppingBag } from 'lucide-react';
import { useDashboardSession } from './DashboardShell';
import type { Design } from '@/types/design';

type Project = { id: string; title: string; design: Design; role: 'owner' | 'editor'; revision: number; updatedAt: string };
export function ProjectWorkspace({ id }: { id: string }) {
  const { token, en } = useDashboardSession();
  const [project, setProject] = useState<Project | null>(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    void fetch(`/api/projects/${id}`, { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal, cache: 'no-store' })
      .then(async response => { const body = await response.json(); if (!response.ok) throw Error(body.error); setProject(body.project); })
      .catch(caught => { if (!controller.signal.aborted) setError(caught instanceof Error ? caught.message : String(caught)); });
    return () => controller.abort();
  }, [id, token, retry]);

  return <main className="saas-page"><Link className="saas-back" href="/dashboard/projects">← {en ? 'All projects' : 'كل المشاريع'}</Link>{error ? <div className="saas-inline-error">{error}<button onClick={() => { setError(''); setRetry(value => value + 1); }}>{en ? 'Retry' : 'إعادة المحاولة'}</button></div> : !project ? <div className="saas-route-skeleton"><div className="saas-skeleton hero"/><div className="saas-skeleton cards"/></div> : <><div className="saas-heading"><div><span className="saas-eyebrow">WEBCRAFT / PROJECT</span><h1>{project.title}</h1><p>{en ? 'Your project workspace. Build the website and manage its content here.' : 'مساحة إدارة مشروعك. عدّل الموقع وأدر محتواه من هنا.'}</p></div><span className="saas-role">{project.role === 'owner' ? en ? 'Owner' : 'مالك المشروع' : en ? 'Editor' : 'محرر'}</span></div><div className="saas-project-meta"><div><span>{en ? 'Current revision' : 'نسخة التصميم'}</span><strong>{project.revision}</strong></div><div><span>{en ? 'Website sections' : 'أقسام الموقع'}</span><strong>{project.design.sections.length}</strong></div><div><span>{en ? 'Last updated' : 'آخر تحديث'}</span><strong className="date">{new Intl.DateTimeFormat(en ? 'en' : 'ar', { dateStyle: 'medium' }).format(new Date(project.updatedAt))}</strong></div></div><div className="saas-tools"><Link href={`/dashboard/projects/${id}/builder`}><span><FilePenLine size={24}/></span><h2>{en ? 'Visual builder' : 'محرر الموقع'}</h2><p>{en ? 'Edit the design, sections and live preview.' : 'عدّل التصميم والأقسام وشاهد المعاينة.'}</p><ArrowLeft size={18}/></Link><Link href={`/dashboard/projects/${id}/cms`}><span><Layers3 size={24}/></span><h2>{en ? 'Content manager' : 'إدارة المحتوى'}</h2><p>{en ? 'Create collections and content for this site.' : 'أنشئ مجموعات المحتوى وعناصرها لهذا الموقع.'}</p><ArrowLeft size={18}/></Link><Link href={`/dashboard/projects/${id}/commerce`}><span><ShoppingBag size={24}/></span><h2>{en ? 'Commerce' : 'إدارة المتجر'}</h2><p>{en ? 'Manage products, variants, prices and stock.' : 'أدر المنتجات وخياراتها وأسعارها ومخزونها.'}</p><ArrowLeft size={18}/></Link><Link href={`/builder/${id}`}><span><Settings2 size={24}/></span><h2>{en ? 'Project settings' : 'إعدادات التصميم'}</h2><p>{en ? 'Open the existing project editor and collaborators.' : 'افتح محرر المشروع الحالي وإعدادات الفريق.'}</p><ArrowLeft size={18}/></Link></div></>}</main>;
}
