'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { ArrowLeft, Globe2, LockKeyhole, UserRound } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { clientSupabase } from '@/lib/supabase/client';
import { useLanguage } from '@/hooks/useLanguage';
import { templateDefinitions } from '@/lib/pricing';

type Mode = 'login' | 'signup';

function projectReturnPath() {
  const requested = new URLSearchParams(window.location.search).get('next');
  if (!requested) return '/account';
  try {
    const target = new URL(requested, window.location.origin);
    if (target.origin !== window.location.origin) return '/account';
    if (target.pathname === '/account' || target.pathname === '/admin' || target.pathname === '/admin/assets') return target.pathname;
    if (target.pathname !== '/builder') return '/account';
    const template = target.searchParams.get('template');
    return template && templateDefinitions.some(entry => entry.id === template)
      ? `/builder?template=${encodeURIComponent(template)}`
      : '/builder';
  } catch {
    return '/account';
  }
}

export function Login({ initialMode = 'login' }: { initialMode?: Mode }) {
  const router = useRouter();
  const client = useMemo(() => clientSupabase(), []);
  const { language, changeLanguage, en } = useLanguage();
  const t = (ar: string, english: string) => en ? english : ar;
  const [mode, setMode] = useState<Mode>(initialMode);
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!client) { setReady(true); return; }
    let active = true;
    (async () => {
      const { data } = await client.auth.getSession();
      if (data.session) {
        const response = await fetch('/api/auth/session', { method: 'POST', headers: { Authorization: `Bearer ${data.session.access_token}` }, cache: 'no-store' });
        if (active) setUser(response.ok ? data.session.user : null);
      }
      if (active) setReady(true);
    })().catch(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, [client]);

  async function establishAppSession(accessToken: string) {
    const response = await fetch('/api/auth/session', { method: 'POST', headers: { Authorization: `Bearer ${accessToken}` }, cache: 'no-store' });
    const result = await response.json();
    if (!response.ok) throw Error(result.error || t('تعذر فتح الجلسة.', 'Could not start your session.'));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!client || busy) return;
    setBusy(true); setError(''); setNotice('');
    const normalizedEmail = email.trim().toLowerCase();
    try {
      if (mode === 'signup') {
        const { data, error: signUpError } = await client.auth.signUp({ email: normalizedEmail, password });
        if (signUpError) throw Error(en ? 'Could not create the account. Check your details and try again.' : 'تعذر إنشاء الحساب. تحقق من البريد وكلمة المرور وحاول مجددًا.');
        if (!data.session) throw Error(t('تأكيد البريد ما زال مفعّلًا في Supabase. عطّله من Authentication ثم Sign In / Providers ثم Confirm email حتى يتم إنشاء الحساب دون رسالة تأكيد.', 'Email confirmation is still enabled in Supabase. Turn it off under Authentication → Sign In / Providers → Confirm email to create accounts without a confirmation email.'));
        await establishAppSession(data.session.access_token);
        setUser(data.user);
      } else {
        const { data, error: signInError } = await client.auth.signInWithPassword({ email: normalizedEmail, password });
        if (signInError || !data.session) throw Error(en ? 'Email or password is incorrect.' : 'البريد الإلكتروني أو كلمة المرور غير صحيحة.');
        await establishAppSession(data.session.access_token);
        setUser(data.user);
      }
      setPassword('');
      setNotice(t('تم تسجيل الدخول بنجاح.', 'You are signed in.'));
      router.replace(projectReturnPath()); router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t('تعذر إكمال العملية.', 'Could not complete this step.'));
    } finally { setBusy(false); }
  }

  function switchMode(next: Mode) { setMode(next); setError(''); setNotice(''); }

  return <div className="auth-page" dir={en ? 'ltr' : 'rtl'} lang={language}>
    <header className="auth-header"><Link href="/" className="home-logo">WEB<span>CRAFT</span><i/></Link><div className="auth-header-actions"><button type="button" onClick={() => changeLanguage(en ? 'ar' : 'en')} aria-label={en ? 'Switch to Arabic' : 'التبديل إلى الإنجليزية'}><Globe2 size={16}/>{en ? 'AR' : 'EN'}</button><Link href="/" className="auth-back">{t('العودة للرئيسية', 'Back to home')} <ArrowLeft size={16}/></Link></div></header>
    <main className="auth-main"><div className="auth-copy"><span className="auth-eyebrow">WEBCRAFT / ACCOUNT</span><h1>{t('مساحة لأفكارك', 'A space for your ideas')}<br/><em>{t('ومشاريعك.', 'and projects.')}</em></h1><p>{t('أنشئ حسابك، احفظ مشاريعك، وادعُ أعضاء فريقك للتعديل معك. دخولك محمي بكلمة المرور.', 'Create an account, save your projects, and invite teammates to edit with you. Sign in securely with your password.')}</p><div className="auth-benefits"><span>✦ {t('مشاريع محفوظة لحسابك', 'Projects saved to your account')}</span><span>✦ {t('تعاون مع فريقك', 'Collaborate with your team')}</span><span>✦ {t('دخول مباشر بالبريد وكلمة المرور', 'Direct email and password sign-in')}</span></div><div className="auth-decoration"><span>✦</span><span>◈</span><span>✳</span></div></div>
      <section className="auth-card" aria-label={t('الحساب', 'Account')}>
        {!ready ? <p>{t('جاري تحميل الحساب...', 'Loading account...')}</p> : !client ? <><div className="auth-card-icon"><LockKeyhole size={23}/></div><h2>{t('تسجيل الدخول غير مفعّل', 'Sign-in is not configured')}</h2><p>{t('إعدادات تسجيل الدخول غير مكتملة. يرجى التواصل مع إدارة الموقع.', 'Sign-in setup is incomplete. Please contact the site owner.')}</p></> : user ? <><div className="auth-card-icon"><UserRound size={23}/></div><h2>{t('مرحبًا،', 'Welcome,')} {user.user_metadata?.full_name || user.email?.split('@')[0]}</h2><p>{t('أنت مسجل الدخول بحساب', 'You are signed in as')} <strong>{user.email}</strong>.</p><Link className="auth-primary" href="/account">{t('لوحة حسابي', 'My dashboard')} <ArrowLeft size={16}/></Link><button className="auth-secondary" type="button" disabled={busy} onClick={async () => { setBusy(true); await fetch('/api/auth/logout', { method: 'POST' }); const { error: signOutError } = await client.auth.signOut(); if (signOutError) setError(t('تعذر تسجيل الخروج.', 'Could not sign out.')); else setUser(null); setBusy(false); }}>{t('تسجيل الخروج', 'Sign out')}</button>{error && <p className="auth-error" role="alert">{error}</p>}</> : <><div className="auth-card-icon"><LockKeyhole size={23}/></div><span className="auth-label">WEBCRAFT / ACCOUNT</span><h2>{mode === 'signup' ? t('أنشئ حسابك', 'Create your account') : t('سجّل الدخول', 'Sign in')}</h2><p>{mode === 'signup' ? t('أنشئ حسابًا لحفظ مشاريعك والعمل مع فريقك.', 'Create an account to save projects and work with your team.') : t('أدخل بريدك وكلمة المرور للوصول إلى مشاريعك.', 'Enter your email and password to access your projects.')}</p>
        <div className="auth-tabs" role="tablist" aria-label={t('نوع الحساب', 'Account action')}><button type="button" role="tab" aria-selected={mode === 'login'} className={mode === 'login' ? 'active' : ''} onClick={() => switchMode('login')}>{t('تسجيل الدخول', 'Sign in')}</button><button type="button" role="tab" aria-selected={mode === 'signup'} className={mode === 'signup' ? 'active' : ''} onClick={() => switchMode('signup')}>{t('إنشاء حساب', 'Create account')}</button></div>
        <form onSubmit={submit}><label>{t('البريد الإلكتروني', 'Email')}<input type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="name@example.com" dir="ltr"/></label><label>{t('كلمة المرور', 'Password')}<input type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} required minLength={8} value={password} onChange={event => setPassword(event.target.value)} placeholder={t('8 أحرف على الأقل', 'At least 8 characters')} dir="ltr"/></label>{error && <p className="auth-error" role="alert">{error}</p>}{notice && <p className="auth-notice" role="status">{notice}</p>}<button className="auth-primary" type="submit" disabled={busy}>{busy ? t('جاري المتابعة...', 'Working...') : mode === 'signup' ? t('إنشاء حساب', 'Create account') : t('تسجيل الدخول', 'Sign in')} <ArrowLeft size={16}/></button></form></>}
      </section></main><footer className="auth-footer">© 2026 WEBCRAFT</footer>
  </div>;
}
