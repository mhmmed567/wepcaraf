'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ArrowLeft, Command, FolderKanban, Globe2, Home, LogOut, Search, UserRound, X } from 'lucide-react';
import { clientSupabase } from '@/lib/supabase/client';
import { useLanguage } from '@/hooks/useLanguage';
import type { Language } from '@/lib/pricing';

type SessionState = { token: string | null; email: string; ready: boolean; language: Language; en: boolean; changeLanguage: (value: Language) => void };
const DashboardContext = createContext<SessionState | null>(null);
export function useDashboardSession() {
  const context = useContext(DashboardContext);
  if (!context) throw Error('DashboardSession is missing');
  return context;
}

type ProjectResult = { id: string; title: string };
export function DashboardShell({ children }: { children: ReactNode }) {
  const auth = useMemo(() => clientSupabase(), []);
  const pathname = usePathname();
  const router = useRouter();
  const { language, changeLanguage, en } = useLanguage();
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [commandOpen, setCommandOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ProjectResult[]>([]);
  const [searching, setSearching] = useState(false);
  const lastToken = useRef<string | null>(null);

  const establish = useCallback(async () => {
    if (!auth) { setReady(true); return; }
    const { data } = await auth.auth.getSession();
    const session = data.session;
    if (!session) { lastToken.current = null; setToken(null); setEmail(''); setReady(true); return; }
    if (session.access_token === lastToken.current) { setReady(true); return; }
    const response = await fetch('/api/auth/session', { method: 'POST', headers: { Authorization: `Bearer ${session.access_token}` }, cache: 'no-store' });
    if (response.ok) { lastToken.current = session.access_token; setToken(session.access_token); setEmail(session.user.email || ''); }
    else { lastToken.current = null; setToken(null); setEmail(''); }
    setReady(true);
  }, [auth]);

  useEffect(() => {
    if (!auth) { setReady(true); return; }
    let live = true;
    void establish().catch(() => { if (live) setReady(true); });
    const { data: { subscription } } = auth.auth.onAuthStateChange(() => setTimeout(() => { if (live) void establish().catch(() => setReady(true)); }, 0));
    return () => { live = false; subscription.unsubscribe(); };
  }, [auth, establish]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setCommandOpen(value => !value); }
      if (event.key === 'Escape') setCommandOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!commandOpen || !token || query.trim().length < 2) { setResults([]); setSearching(false); return; }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const response = await fetch(`/api/projects?limit=8&search=${encodeURIComponent(query.trim())}`, { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal, cache: 'no-store' });
        if (response.ok) setResults((await response.json()).projects);
      } catch { if (!controller.signal.aborted) setResults([]); }
      finally { if (!controller.signal.aborted) setSearching(false); }
    }, 220);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [commandOpen, query, token]);

  async function signOut() {
    await fetch('/api/auth/logout', { method: 'POST' });
    await auth?.auth.signOut();
    router.replace('/');
  }

  const links = [
    { href: '/dashboard', ar: 'نظرة عامة', en: 'Overview', icon: Home },
    { href: '/dashboard/projects', ar: 'المشاريع', en: 'Projects', icon: FolderKanban },
    { href: '/account', ar: 'حسابي', en: 'Account', icon: UserRound },
  ];
  return <DashboardContext.Provider value={{ token, email, ready, language, en, changeLanguage }}><div className="saas-shell" dir={en ? 'ltr' : 'rtl'} lang={language}>
    <aside className="saas-sidebar"><Link className="saas-brand" href="/">WEB<span>CRAFT</span><i/></Link><div className="saas-workspace-label">{en ? 'WORKSPACE' : 'مساحة العمل'}</div><nav>{links.map(link => <Link key={link.href} href={link.href} className={pathname === link.href ? 'active' : ''}><link.icon size={18}/>{en ? link.en : link.ar}</Link>)}</nav><div className="saas-side-bottom"><button type="button" onClick={() => changeLanguage(en ? 'ar' : 'en')}><Globe2 size={17}/>{en ? 'العربية' : 'English'}</button><button type="button" onClick={signOut}><LogOut size={17}/>{en ? 'Sign out' : 'تسجيل الخروج'}</button></div></aside>
    <div className="saas-content"><header className="saas-topbar"><div><span className="saas-mobile-brand">WEBCRAFT</span><span>{en ? 'Your business, all in one place' : 'مشروعك الرقمي، في مكان واحد'}</span></div><div><button type="button" className="saas-command-trigger" onClick={() => setCommandOpen(true)}><Search size={17}/><span>{en ? 'Search or jump to…' : 'ابحث أو انتقل إلى...'}</span><kbd>Ctrl K</kbd></button><Link href="/account" className="saas-avatar" title={email}><UserRound size={19}/></Link></div></header>
      <div className="saas-mobile-nav"><Link href="/dashboard">{en ? 'Overview' : 'الرئيسية'}</Link><Link href="/dashboard/projects">{en ? 'Projects' : 'المشاريع'}</Link><Link href="/account">{en ? 'Account' : 'حسابي'}</Link></div>
      {!ready ? <div className="saas-route-skeleton"><div className="saas-skeleton hero"/><div className="saas-skeleton cards"/></div> : !token ? <div className="saas-auth"><UserRound size={34}/><h1>{en ? 'Sign in to your workspace' : 'سجّل الدخول إلى مساحة عملك'}</h1><p>{en ? 'Your projects and business tools are tied to your account.' : 'مشاريعك وأدوات إدارة أعمالك مرتبطة بحسابك.'}</p><Link href={`/login?next=${encodeURIComponent(pathname)}`}>{en ? 'Sign in' : 'تسجيل الدخول'} <ArrowLeft size={17}/></Link></div> : children}
    </div>
    {commandOpen && <div className="saas-command-backdrop" onMouseDown={() => setCommandOpen(false)}><div className="saas-command" role="dialog" aria-modal="true" aria-label={en ? 'Quick search' : 'البحث السريع'} onMouseDown={event => event.stopPropagation()}><div className="saas-command-input"><Command size={20}/><input autoFocus placeholder={en ? 'Search projects or type an action…' : 'ابحث عن مشروع أو إجراء...'} value={query} onChange={event => setQuery(event.target.value)}/><button type="button" onClick={() => setCommandOpen(false)} aria-label={en ? 'Close' : 'إغلاق'}><X size={18}/></button></div><div className="saas-command-results"><span>{en ? 'QUICK ACTIONS' : 'إجراءات سريعة'}</span><button onClick={() => { setCommandOpen(false); router.push('/builder'); }}>{en ? 'New website' : 'موقع جديد'} <ArrowLeft size={15}/></button><button onClick={() => { setCommandOpen(false); router.push('/dashboard/projects'); }}>{en ? 'Open projects' : 'فتح المشاريع'} <ArrowLeft size={15}/></button>{query.trim().length >= 2 && <><span>{searching ? en ? 'SEARCHING…' : 'جاري البحث...' : en ? 'PROJECTS' : 'المشاريع'}</span>{results.map(project => <button key={project.id} onClick={() => { setCommandOpen(false); router.push(`/dashboard/projects/${project.id}`); }}>{project.title}<ArrowLeft size={15}/></button>)}{!searching && results.length === 0 && <p>{en ? 'No matching projects.' : 'لا توجد مشاريع مطابقة.'}</p>}</>}</div></div></div>}
  </div></DashboardContext.Provider>;
}
