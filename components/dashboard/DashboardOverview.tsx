'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, FolderKanban, Layers3, Plus, Send } from 'lucide-react';
import { useDashboardSession } from './DashboardShell';

type Summary = { ownedProjects: number; sharedProjects: number; designRequests: number };
type Project = { id: string; title: string; role: 'owner' | 'editor'; updated_at: string };

export function DashboardOverview() {
  const { token, en, email } = useDashboardSession();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [summaryError, setSummaryError] = useState('');
  const [projectError, setProjectError] = useState('');
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    const headers = { Authorization: `Bearer ${token}` };
    void fetch('/api/dashboard/summary', { headers, signal: controller.signal, cache: 'no-store' })
      .then(async response => { const body = await response.json(); if (!response.ok) throw Error(body.error); return body as Summary; })
      .then(setSummary)
      .catch(() => { if (!controller.signal.aborted) setSummaryError(en ? 'Could not load your activity.' : 'تعذر تحميل ملخص الحساب.'); });
    void fetch('/api/projects?limit=5', { headers, signal: controller.signal, cache: 'no-store' })
      .then(async response => { const body = await response.json(); if (!response.ok) throw Error(body.error); return body.projects as Project[]; })
      .then(setProjects)
      .catch(() => { if (!controller.signal.aborted) setProjectError(en ? 'Could not load projects.' : 'تعذر تحميل المشاريع.'); });
    return () => controller.abort();
  }, [token, en, refresh]);

  return <main className="saas-page"><div className="saas-heading"><div><span className="saas-eyebrow">WEBCRAFT / WORKSPACE</span><h1>{en ? 'From idea to a working business.' : 'من فكرة إلى مشروع يعمل.'}</h1><p>{en ? `Welcome${email ? `, ${email.split('@')[0]}` : ''}. Build your website and manage what is already underway.` : `مرحبًا${email ? `، ${email.split('@')[0]}` : ''}. ابنِ موقعك وتابع مشاريعك من مكان واحد.`}</p></div><Link className="saas-primary" href="/builder"><Plus size={17}/>{en ? 'New website' : 'موقع جديد'}</Link></div>
    <section className="saas-metrics" aria-label={en ? 'Workspace metrics' : 'ملخص مساحة العمل'}>{summary ? [
      { label: en ? 'Owned sites' : 'مشاريعي', value: summary.ownedProjects, Icon: FolderKanban },
      { label: en ? 'Shared projects' : 'مشاريع مشتركة', value: summary.sharedProjects, Icon: Layers3 },
      { label: en ? 'Design requests' : 'طلبات التصميم', value: summary.designRequests, Icon: Send },
    ].map(({ label, value, Icon }) => <div className="saas-metric" key={label}><span><Icon size={19}/>{label}</span><strong>{value}</strong></div>) : summaryError ? <div className="saas-inline-error">{summaryError}<button onClick={() => { setSummaryError(''); setRefresh(value => value + 1); }}>{en ? 'Retry' : 'إعادة المحاولة'}</button></div> : [0, 1, 2].map(index => <div className="saas-skeleton metric" key={index}/>)}</section>
    <div className="saas-overview-grid"><section className="saas-panel"><div className="saas-panel-head"><div><span className="saas-eyebrow">PROJECTS</span><h2>{en ? 'Continue where you left off' : 'تابع من حيث توقفت'}</h2></div><Link href="/dashboard/projects">{en ? 'All projects' : 'جميع المشاريع'} <ArrowLeft size={16}/></Link></div>{projects ? projects.length ? <div className="saas-project-list">{projects.map(project => <Link href={`/dashboard/projects/${project.id}`} key={project.id}><span className="saas-project-icon"><FolderKanban size={20}/></span><span><strong>{project.title}</strong><small>{project.role === 'owner' ? en ? 'Owner' : 'المالك' : en ? 'Collaborator' : 'متعاون'} · {new Intl.DateTimeFormat(en ? 'en' : 'ar', { dateStyle: 'medium' }).format(new Date(project.updated_at))}</small></span><ArrowLeft size={17}/></Link>)}</div> : <div className="saas-empty"><FolderKanban size={27}/><h3>{en ? 'Your first project starts here' : 'مشروعك الأول يبدأ هنا'}</h3><p>{en ? 'Choose a template or start with a blank canvas.' : 'اختر قالبًا أو ابدأ بتصميم جديد.'}</p><Link href="/builder">{en ? 'Create project' : 'إنشاء مشروع'}</Link></div> : projectError ? <div className="saas-inline-error">{projectError}<button onClick={() => { setProjectError(''); setRefresh(value => value + 1); }}>{en ? 'Retry' : 'إعادة المحاولة'}</button></div> : <div className="saas-skeleton table"/>}</section>
      <section className="saas-panel saas-next"><span className="saas-eyebrow">QUICK START</span><h2>{en ? 'Build and grow' : 'ابنِ ثم طوّر'}</h2><p>{en ? 'Your project starts with a design. Open a project to manage its content and settings.' : 'ابدأ بتصميم موقعك، ثم افتح المشروع لإدارة المحتوى والإعدادات.'}</p><div><Link href="/builder"><Plus size={19}/>{en ? 'Create a site' : 'إنشاء موقع'}<ArrowLeft size={16}/></Link><Link href="/library"><Layers3 size={19}/>{en ? 'Browse the code library' : 'استكشف مكتبة الأكواد'}<ArrowLeft size={16}/></Link></div></section></div>
  </main>;
}
