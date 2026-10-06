'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, FolderKanban, Plus, Search } from 'lucide-react';
import { useDashboardSession } from './DashboardShell';

type Project = { id: string; title: string; role: 'owner' | 'editor'; updated_at: string; revision: number };
export function DashboardProjects() {
  const { token, en } = useDashboardSession();
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => { const timer = setTimeout(() => { setSearch(query); setPage(1); }, 250); return () => clearTimeout(timer); }, [query]);
  useEffect(() => {
    if (!token) return;
    const controller = new AbortController(); setLoading(true); setError('');
    void fetch(`/api/projects?limit=12&page=${page}&search=${encodeURIComponent(search)}`, { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal, cache: 'no-store' })
      .then(async response => { const body = await response.json(); if (!response.ok) throw Error(body.error); setProjects(body.projects); setTotal(body.total); })
      .catch(caught => { if (!controller.signal.aborted) setError(caught instanceof Error ? caught.message : String(caught)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [token, page, search, retry]);
  return <main className="saas-page"><div className="saas-heading"><div><span className="saas-eyebrow">WEBCRAFT / PROJECTS</span><h1>{en ? 'Your projects' : 'مشاريعك'}</h1><p>{en ? 'All the websites you own or collaborate on.' : 'كل المواقع التي تملكها أو تشارك في تعديلها.'}</p></div><Link className="saas-primary" href="/builder"><Plus size={17}/>{en ? 'New project' : 'مشروع جديد'}</Link></div><section className="saas-panel"><div className="saas-panel-head"><strong>{en ? `${total} projects` : `${total} مشروع`}</strong><label className="saas-search"><Search size={16}/><input value={query} onChange={event => setQuery(event.target.value)} placeholder={en ? 'Search projects' : 'ابحث عن مشروع'}/></label></div>{error ? <div className="saas-inline-error">{error}<button type="button" onClick={() => setRetry(value => value + 1)}>{en ? 'Retry' : 'إعادة المحاولة'}</button></div> : loading || !projects ? <div className="saas-skeleton table"/> : projects.length ? <div className="saas-project-list">{projects.map(project => <Link key={project.id} href={`/dashboard/projects/${project.id}`}><span className="saas-project-icon"><FolderKanban size={21}/></span><span><strong>{project.title}</strong><small>{project.role === 'owner' ? en ? 'Owner' : 'المالك' : en ? 'Editor' : 'محرر'} · {en ? 'Revision' : 'نسخة'} {project.revision}</small></span><ArrowLeft size={17}/></Link>)}</div> : <div className="saas-empty"><FolderKanban size={28}/><h3>{search ? en ? 'No matching projects' : 'لا توجد نتائج مطابقة' : en ? 'No projects yet' : 'ليس لديك مشاريع بعد'}</h3>{!search && <Link href="/builder">{en ? 'Create your first project' : 'أنشئ مشروعك الأول'}</Link>}</div>}{total > 12 && <div className="saas-pagination"><button disabled={page === 1} onClick={() => setPage(value => value - 1)}>{en ? 'Previous' : 'السابق'}</button><span>{page} / {Math.ceil(total / 12)}</span><button disabled={page * 12 >= total} onClick={() => setPage(value => value + 1)}>{en ? 'Next' : 'التالي'}</button></div>}</section></main>;
}
