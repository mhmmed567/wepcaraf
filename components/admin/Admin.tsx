'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import { ArrowLeft, Download, Eye, LayoutDashboard, LockKeyhole, LogOut, Search, Settings2 } from 'lucide-react';
import { accessToken, clientSupabase } from '@/lib/supabase/client';
import { Preview } from '@/components/preview/Preview';
import type { Design } from '@/types/design';

type Status = 'new' | 'in_progress' | 'completed';
type RequestItem = {
  id: string;
  contact: { name: string; company: string; whatsapp: string; email: string; description: string; notes: string };
  status: Status;
  createdAt: string;
  designId: string;
};

export function Admin() {
  const auth = useMemo(() => clientSupabase(), []);
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [selected, setSelected] = useState<RequestItem | null>(null);
  const [design, setDesign] = useState<Design | null>(null);
  const [search, setSearch] = useState('');

  const establish = useCallback(async (session: { access_token: string; user: User } | null) => {
    if (!session) { setUser(null); setReady(true); return; }
    try {
      const response = await fetch('/api/auth/session', { method: 'POST', headers: { Authorization: `Bearer ${session.access_token}` }, cache: 'no-store' });
      setUser(response.ok ? session.user : null);
    } catch { setUser(null); }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!auth) { setReady(true); return; }
    void auth.auth.getSession().then(({ data }) => establish(data.session));
    const { data: { subscription } } = auth.auth.onAuthStateChange((_event, session) => { setTimeout(() => void establish(session), 0); });
    return () => subscription.unsubscribe();
  }, [auth, establish]);

  const api = useCallback(async (path: string, init?: RequestInit) => {
    if (!user) throw Error('سجّل الدخول أولًا');
    const token = await accessToken();
    const response = await fetch(path, { ...init, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...init?.headers } });
    const result = await response.json();
    if (!response.ok) throw Error(result.error || 'تعذر تحميل البيانات');
    return result;
  }, [user]);

  const load = useCallback(async () => {
    try { const result = await api('/api/requests'); setRequests(result.requests); setError(''); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'تعذر تحميل الطلبات'); }
  }, [api]);
  useEffect(() => { if (user) void load(); }, [user, load]);

  async function open(item: RequestItem) {
    setSelected(item); setDesign(null);
    try { const result = await api(`/api/requests/${item.id}`); setDesign(result.design); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'تعذر تحميل التصميم'); }
  }
  async function updateStatus(status: Status) {
    if (!selected) return;
    try {
      await api(`/api/requests/${selected.id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
      setSelected({ ...selected, status });
      setRequests(items => items.map(item => item.id === selected.id ? { ...item, status } : item));
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'تعذر تحديث الحالة'); }
  }
  function exportJson() {
    if (!selected || !design) return;
    const blob = new Blob([JSON.stringify({ request: selected, design }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob), anchor = document.createElement('a');
    anchor.href = url; anchor.download = `${selected.id}.json`; anchor.click(); URL.revokeObjectURL(url);
  }
  const counts = { total: requests.length, new: requests.filter(item => item.status === 'new').length, inProgress: requests.filter(item => item.status === 'in_progress').length, completed: requests.filter(item => item.status === 'completed').length };

  if (!ready) return <div className="admin-message">جاري التحميل...</div>;
  if (!auth) return <div className="admin-message"><LockKeyhole size={30}/><h2>لوحة الإدارة غير مفعّلة</h2><p>أضف إعدادات Supabase كما هو موضح في README.</p></div>;
  if (!user) return <div className="admin-message"><LockKeyhole size={30}/><h2>سجّل الدخول بالبريد وكلمة المرور</h2><Link href="/login">الانتقال إلى تسجيل الدخول</Link></div>;

  return <div className="admin-shell" dir="rtl">
    <aside className="admin-side"><div className="builder-logo">WEB<span>CRAFT</span><i/></div><span>إدارة المنصة</span><nav><a className="active" href="#overview"><LayoutDashboard size={17}/> نظرة عامة</a><a href="#requests"><Eye size={17}/> طلبات العملاء</a><Link href="/admin/projects"><LayoutDashboard size={17}/> مشاريع العملاء</Link><Link href="/admin/catalog"><Settings2 size={17}/> إدارة الكتالوج</Link><Link href="/admin/assets"><Settings2 size={17}/> القوالب والأكواد</Link></nav><button onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); await auth.auth.signOut(); }}><LogOut size={16}/> تسجيل الخروج</button></aside>
    <main className="admin-main"><header><div><span className="eyebrow">WEBCRAFT / ADMIN</span><h1>لوحة التحكم</h1><p>تابع طلبات تصميم المواقع وتفاصيلها من مكان واحد.</p></div><span className="admin-user">{user.email}</span></header>
      <section id="overview" className="admin-metrics">{[['إجمالي الطلبات', counts.total], ['طلبات جديدة', counts.new], ['قيد التنفيذ', counts.inProgress], ['مكتملة', counts.completed]].map(([name, value]) => <div key={name}><span>{name}</span><strong>{value}</strong></div>)}</section>
      <section id="requests" className="admin-requests"><div className="admin-section-head"><h2>طلبات العملاء</h2><button onClick={() => void load()}>تحديث</button></div><label className="admin-search"><Search size={17}/><input value={search} onChange={event => setSearch(event.target.value)} placeholder="ابحث باسم العميل أو رقم الطلب"/></label><div className="admin-list">{requests.filter(item => `${item.id} ${item.contact.name} ${item.contact.company}`.toLowerCase().includes(search.toLowerCase())).map(item => <button key={item.id} onClick={() => void open(item)} className={selected?.id === item.id ? 'selected' : ''}><div><strong>{item.contact.company || item.contact.name}</strong><span>{item.id} · {item.contact.name}</span></div><span className={`status ${item.status}`}>{item.status === 'new' ? 'جديد' : item.status === 'in_progress' ? 'قيد التنفيذ' : 'مكتمل'}</span><ArrowLeft size={16}/></button>)}{requests.length === 0 && <div className="admin-empty">لا توجد طلبات بعد.</div>}</div></section>
    </main>
    {selected && <aside className="admin-detail"><div className="admin-detail-head"><div><span>تفاصيل الطلب</span><h2>{selected.id}</h2></div><div className="admin-detail-actions"><button onClick={() => window.print()} disabled={!design}><Download size={15}/> PDF</button><button onClick={exportJson} disabled={!design}><Download size={15}/> JSON</button></div></div><div className="admin-contact"><h3>{selected.contact.company || selected.contact.name}</h3><p>{selected.contact.name} · {selected.contact.whatsapp}</p><p>{selected.contact.email}</p><p>{selected.contact.description}</p>{selected.contact.notes && <p>{selected.contact.notes}</p>}</div><label className="field"><span>حالة الطلب</span><select value={selected.status} onChange={event => void updateStatus(event.target.value as Status)}><option value="new">جديد</option><option value="in_progress">قيد التنفيذ</option><option value="completed">مكتمل</option></select></label><h3 className="admin-preview-title">معاينة تصميم العميل</h3>{design ? <div className="admin-preview"><Preview design={design} compact/></div> : <div className="admin-empty">جاري تحميل التصميم...</div>}</aside>}
    {error && <div className="toast">{error}<button onClick={() => setError('')}>×</button></div>}
  </div>;
}
