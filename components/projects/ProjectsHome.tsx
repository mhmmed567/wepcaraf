'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, FolderOpen, Globe2, Plus, UserRound } from 'lucide-react';
import { accessToken, clientSupabase } from '@/lib/supabase/client';
import { TemplateCatalog } from '@/components/templates/TemplateCatalog';
import { formatPrice, sitePricing, templateDefinitions, type TemplateId } from '@/lib/pricing';
import { useLanguage } from '@/hooks/useLanguage';

type Project = { id: string; title: string; role: 'owner' | 'editor'; revision: number; updated_at: string };

export function ProjectsHome() {
  const client = useMemo(() => clientSupabase(), []);
  const { language, changeLanguage, en } = useLanguage();
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [templateId, setTemplateId] = useState<TemplateId | null>(null);
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get('template');
    const template = templateDefinitions.find(entry => entry.id === requested);
    if (template) setTemplateId(template.id);
  }, []);

  useEffect(() => {
    if (!client) { setReady(true); return; }
    let active = true;
    const check = async () => {
      const { data } = await client.auth.getSession();
      const session = data.session;
      const response = session ? await fetch('/api/auth/session', { method: 'POST', headers: { Authorization: `Bearer ${session.access_token}` }, cache: 'no-store' }) : null;
      if (active) { setSignedIn(!!response?.ok); setReady(true); }
    };
    void check();
    const { data: { subscription } } = client.auth.onAuthStateChange(() => { setTimeout(() => void check(), 0); });
    return () => { active = false; subscription.unsubscribe(); };
  }, [client]);

  useEffect(() => {
    if (!signedIn) return;
    (async () => {
      try {
        const token = await accessToken();
        const response = await fetch('/api/projects', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
        const data = await response.json();
        if (!response.ok) throw Error(data.error);
        setProjects(data.projects);
      } catch (caught) { setError(caught instanceof Error ? caught.message : 'تعذر تحميل المشاريع'); }
    })();
  }, [signedIn]);

  function selectTemplate(id: TemplateId) {
    setTemplateId(id);
  }

  async function create() {
    if (!title.trim() || busy) return;
    setBusy(true); setError('');
    try {
      const token = await accessToken();
      const response = await fetch('/api/projects', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ title: title.trim(), templateId, locale: language }) });
      const data = await response.json();
      if (!response.ok) throw Error(data.error);
      window.location.href = `/builder/${data.id}`;
    } catch (caught) { setError(caught instanceof Error ? caught.message : en ? 'Could not create the project.' : 'تعذر إنشاء المشروع'); setBusy(false); }
  }

  const authReturn = encodeURIComponent(templateId ? `/builder?template=${templateId}` : '/builder');

  return <div className="projects-page" dir={en ? 'ltr' : 'rtl'} lang={language}><header><Link className="builder-logo" href="/">WEB<span>CRAFT</span><i/></Link><div className="projects-header-actions"><button type="button" onClick={() => changeLanguage(en ? 'ar' : 'en')} aria-label={en ? 'Switch to Arabic' : 'التبديل إلى الإنجليزية'}><Globe2 size={16}/>{en ? 'AR' : 'EN'}</button><Link href="/login"><UserRound size={16}/>{en ? 'Account' : 'حسابي'}</Link></div></header><main><span className="eyebrow">WEBCRAFT / PROJECTS</span><h1>{en ? 'Your projects' : 'مشاريعك'}</h1><p>{en ? 'Choose a ready-made template, then shape every detail around your idea.' : 'اختر قالبًا جاهزًا، ثم خصّص كل تفصيل حسب فكرتك.'}</p><section className="projects-templates"><div className="projects-section-head"><h2>{en ? 'Start with a template' : 'ابدأ بقالب جاهز'}</h2><p>{en ? 'The displayed price is a starting estimate for the website build.' : 'السعر المعروض تقدير ابتدائي لتنفيذ الموقع.'}</p></div><TemplateCatalog language={language} selected={templateId} onSelect={selectTemplate}/><button className="template-blank" type="button" aria-pressed={!templateId} onClick={() => setTemplateId(null)}>{en ? 'Start from scratch' : 'ابدأ من الصفر'} · <span dir="ltr">{formatPrice(sitePricing['موقع مخصص'].price, language)}</span></button></section>{!ready ? <div className="projects-state">{en ? 'Loading account...' : 'جاري تحميل الحساب...'}</div> : !client ? <div className="projects-state">{en ? 'Connect Supabase to enable projects.' : 'أضف إعدادات Supabase لتفعيل المشاريع.'}</div> : !signedIn ? <div className="projects-state"><UserRound size={26}/><h2>{en ? 'Sign in to create a project' : 'سجّل الدخول لإنشاء مشروع'}</h2><p>{en ? 'Use your email and password to save and edit projects.' : 'استخدم بريدك وكلمة المرور لحفظ المشاريع وتعديلها.'}</p><div className="projects-auth-actions"><Link href={`/login?next=${authReturn}`}>{en ? 'Sign in' : 'تسجيل الدخول'} <ArrowLeft size={16}/></Link><Link className="secondary" href={`/signup?next=${authReturn}`}>{en ? 'Create account' : 'إنشاء حساب'} <ArrowLeft size={16}/></Link></div></div> : <><div className="project-create"><div><strong>{en ? 'New project' : 'مشروع جديد'}</strong><small>{en ? 'Your chosen template will be saved to your account.' : 'سيُحفظ القالب الذي اخترته في حسابك.'}</small></div><input value={title} onChange={event => setTitle(event.target.value)} onKeyDown={event => event.key === 'Enter' && create()} placeholder={en ? 'Project name' : 'اسم المشروع'} maxLength={160}/><button onClick={create} disabled={busy || !title.trim()}><Plus size={16}/>{busy ? en ? 'Creating...' : 'جاري الإنشاء...' : en ? 'Create project' : 'إنشاء مشروع'}</button></div><h2>{en ? 'Available projects' : 'المشاريع المتاحة'}</h2><div className="project-grid">{projects.map(project => <Link href={`/builder/${project.id}`} key={project.id}><FolderOpen size={23}/><strong>{project.title}</strong><span>{project.role === 'owner' ? en ? 'Owner' : 'مشروعي' : en ? 'Collaborator' : 'متعاون'} · {en ? 'Revision' : 'نسخة'} {project.revision}</span><ArrowLeft size={16}/></Link>)}</div>{projects.length === 0 && <div className="projects-state">{en ? 'No projects yet.' : 'ليس لديك مشاريع بعد.'}</div>}</>}{error && <p className="form-error" role="alert">{error}</p>}</main></div>;
}
