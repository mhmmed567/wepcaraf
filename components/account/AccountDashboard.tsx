'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, FolderOpen, Globe2, LayoutDashboard, LogOut, Plus, Save, UserRound } from 'lucide-react';
import { accessToken, clientSupabase } from '@/lib/supabase/client';
import { useLanguage } from '@/hooks/useLanguage';

type Project = { id: string; title: string; role: 'owner' | 'editor'; revision: number; updated_at: string };

export function AccountDashboard() {
  const auth = useMemo(() => clientSupabase(), []);
  const { language, en, changeLanguage } = useLanguage();
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  const load = useCallback(async () => {
    const token = await accessToken();
    if (!token) { setSignedIn(false); setReady(true); return; }
    const session = await fetch('/api/auth/session', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
    if (!session.ok) { setSignedIn(false); setReady(true); return; }
    setSignedIn(true);
    const headers = { Authorization: `Bearer ${token}` };
    const [profileResponse, projectResponse, adminResponse] = await Promise.all([
      fetch('/api/profile', { headers, cache: 'no-store' }),
      fetch('/api/projects', { headers, cache: 'no-store' }),
      fetch('/api/assets', { headers, cache: 'no-store' }),
    ]);
    if (!profileResponse.ok || !projectResponse.ok) throw Error(en ? 'Could not load your account.' : 'تعذر تحميل حسابك');
    const profileData = await profileResponse.json();
    const projectData = await projectResponse.json();
    setName(profileData.profile.name);
    setEmail(profileData.profile.email || '');
    setProjects(projectData.projects);
    if (adminResponse.ok) setIsAdmin(Boolean((await adminResponse.json()).admin));
    setReady(true);
  }, [en]);

  useEffect(() => {
    if (!auth) { setReady(true); return; }
    let active = true;
    void load().catch(caught => { if (active) { setError(caught instanceof Error ? caught.message : String(caught)); setReady(true); } });
    const { data: { subscription } } = auth.auth.onAuthStateChange(() => setTimeout(() => { if (active) void load().catch(() => setReady(true)); }, 0));
    return () => { active = false; subscription.unsubscribe(); };
  }, [auth, load]);

  async function save() {
    if (!name.trim() || busy) return;
    setBusy(true); setError(''); setMessage('');
    try {
      const token = await accessToken();
      const response = await fetch('/api/profile', { method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
      const result = await response.json();
      if (!response.ok) throw Error(result.error);
      setName(result.name);
      await auth?.auth.refreshSession();
      setMessage(en ? 'Name saved successfully.' : 'تم حفظ الاسم بنجاح.');
    } catch (caught) { setError(caught instanceof Error ? caught.message : String(caught)); }
    finally { setBusy(false); }
  }

  async function signOut() {
    await fetch('/api/auth/logout', { method: 'POST' });
    await auth?.auth.signOut();
    window.location.href = '/';
  }

  return <div className="workspace-page" dir={en ? 'ltr' : 'rtl'} lang={language}>
    <header className="workspace-header"><Link className="builder-logo" href="/">WEB<span>CRAFT</span><i/></Link><div><Link href="/">{en ? 'Home' : 'الرئيسية'}</Link><button type="button" onClick={() => changeLanguage(en ? 'ar' : 'en')}><Globe2 size={16}/>{en ? 'AR' : 'EN'}</button></div></header>
    <main className="workspace-main"><div className="workspace-title"><span className="eyebrow">WEBCRAFT / ACCOUNT</span><h1>{en ? 'Your workspace' : 'مساحة عملك'}</h1><p>{en ? 'Update your profile and open all the projects you own or collaborate on.' : 'عدّل ملفك الشخصي وادخل إلى مشاريعك والمشاريع التي تشارك في تعديلها.'}</p></div>
      {!ready ? <div className="workspace-panel">{en ? 'Loading account…' : 'جاري تحميل الحساب...'}</div> : !signedIn ? <div className="workspace-panel"><UserRound size={30}/><h2>{en ? 'Sign in to view your workspace' : 'سجّل الدخول لعرض مساحة عملك'}</h2><Link className="workspace-primary" href="/login?next=%2Faccount">{en ? 'Sign in' : 'تسجيل الدخول'} <ArrowLeft size={17}/></Link></div> : <>
        <div className="workspace-stats"><div><span>{en ? 'My projects' : 'مشاريعي'}</span><strong>{projects.filter(p => p.role === 'owner').length}</strong></div><div><span>{en ? 'Shared with me' : 'مشاريع مشتركة'}</span><strong>{projects.filter(p => p.role === 'editor').length}</strong></div><div><span>{en ? 'All projects' : 'كل المشاريع'}</span><strong>{projects.length}</strong></div></div>
        <div className="workspace-columns"><section className="workspace-panel"><div className="workspace-section-title"><UserRound size={20}/><h2>{en ? 'Profile' : 'الملف الشخصي'}</h2></div><label>{en ? 'Full name' : 'الاسم الكامل'}<input value={name} maxLength={80} onChange={event => setName(event.target.value)} autoComplete="name" /></label><label>{en ? 'Email' : 'البريد الإلكتروني'}<input value={email} readOnly dir="ltr" /></label><button className="workspace-primary" type="button" onClick={save} disabled={busy || name.trim().length < 2}><Save size={17}/>{busy ? en ? 'Saving…' : 'جاري الحفظ...' : en ? 'Save name' : 'حفظ الاسم'}</button>{message && <p className="workspace-success" role="status">{message}</p>}<button className="workspace-muted" type="button" onClick={signOut}><LogOut size={16}/>{en ? 'Sign out' : 'تسجيل الخروج'}</button>{isAdmin && <Link className="workspace-admin-link" href="/admin"><LayoutDashboard size={17}/>{en ? 'Site administration' : 'إدارة الموقع'}</Link>}</section>
        <section className="workspace-panel"><div className="workspace-section-title"><FolderOpen size={20}/><h2>{en ? 'Projects' : 'المشاريع'}</h2><Link href="/builder"><Plus size={16}/>{en ? 'New project' : 'مشروع جديد'}</Link></div>{projects.length ? <div className="workspace-projects">{projects.map(project => <Link href={`/builder/${project.id}`} key={project.id}><div><strong>{project.title}</strong><span>{project.role === 'owner' ? en ? 'Owner' : 'المالك' : en ? 'Editor' : 'محرر'} · {new Intl.DateTimeFormat(en ? 'en' : 'ar', { dateStyle: 'medium' }).format(new Date(project.updated_at))}</span></div><ArrowLeft size={18}/></Link>)}</div> : <div className="workspace-empty"><FolderOpen size={29}/><p>{en ? 'You have no projects yet.' : 'ليس لديك مشاريع بعد.'}</p><Link href="/builder">{en ? 'Start your first project' : 'ابدأ مشروعك الأول'}</Link></div>}</section></div>
      </>}{error && <p className="form-error" role="alert">{error}</p>}
    </main>
  </div>;
}
