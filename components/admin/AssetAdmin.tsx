'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Code2, Eye, Plus, Save, Trash2 } from 'lucide-react';
import { accessToken, clientSupabase } from '@/lib/supabase/client';
import { AssetPreview } from '@/components/assets/AssetPreview';
import type { AssetCategory, AssetFramework, DeveloperAsset } from '@/lib/developer-assets';

const newAsset = (): DeveloperAsset => ({ id: `asset-${crypto.randomUUID()}`, category: 'template', framework: 'html', title: '', titleEn: '', description: '', descriptionEn: '', price: 0, published: false, html: '<main class="demo">\n  <h1>عنوان التصميم</h1>\n  <p>اكتب محتوى المعاينة هنا</p>\n  <button>ابدأ الآن</button>\n</main>', css: '.demo { min-height: 100vh; display: grid; place-content: center; gap: 1rem; text-align: center; background: #f7f4ff; color: #282134; }\n.demo button { padding: .8rem 1.5rem; border: 0; border-radius: 12px; color: white; background: #835ef0; cursor: pointer; }', js: '', nextCode: '' });

export function AssetAdmin() {
  const auth = useMemo(() => clientSupabase(), []);
  const [ready, setReady] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const [assets, setAssets] = useState<DeveloperAsset[]>([]);
  const [draft, setDraft] = useState<DeveloperAsset>(() => newAsset());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    const token = await accessToken();
    if (!token) { setReady(true); setAllowed(false); return; }
    const session = await fetch('/api/auth/session', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
    if (!session.ok) { setReady(true); setAllowed(false); return; }
    const response = await fetch('/api/assets', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
    const result = await response.json();
    if (!response.ok) throw Error(result.error);
    setAllowed(result.admin === true);
    setAssets(result.assets);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!auth) { setReady(true); return; }
    let active = true;
    void load().catch(caught => { if (active) { setError(caught instanceof Error ? caught.message : String(caught)); setReady(true); } });
    const { data: { subscription } } = auth.auth.onAuthStateChange(() => setTimeout(() => { if (active) void load().catch(() => setReady(true)); }, 0));
    return () => { active = false; subscription.unsubscribe(); };
  }, [auth, load]);

  function update<K extends keyof DeveloperAsset>(key: K, value: DeveloperAsset[K]) { setDraft(current => ({ ...current, [key]: value })); setMessage(''); }

  async function save() {
    if (busy) return;
    setBusy(true); setError(''); setMessage('');
    try {
      const token = await accessToken();
      const response = await fetch('/api/assets', { method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(draft) });
      const result = await response.json();
      if (!response.ok) throw Error(result.error);
      setMessage('تم حفظ العنصر بنجاح.');
      await load();
    } catch (caught) { setError(caught instanceof Error ? caught.message : String(caught)); }
    finally { setBusy(false); }
  }

  async function remove() {
    if (!assets.some(asset => asset.id === draft.id) || busy || !window.confirm('حذف هذا العنصر نهائيًا؟')) return;
    setBusy(true); setError('');
    try {
      const token = await accessToken();
      const response = await fetch(`/api/assets?id=${encodeURIComponent(draft.id)}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      const result = await response.json();
      if (!response.ok) throw Error(result.error);
      setDraft(newAsset()); setMessage('تم حذف العنصر.'); await load();
    } catch (caught) { setError(caught instanceof Error ? caught.message : String(caught)); }
    finally { setBusy(false); }
  }

  return <div className="workspace-page" dir="rtl"><header className="workspace-header"><Link className="builder-logo" href="/">WEB<span>CRAFT</span><i/></Link><div><Link href="/admin">لوحة المسؤول</Link><Link href="/library">المكتبة العامة</Link></div></header><main className="workspace-main"><div className="workspace-title"><span className="eyebrow">WEBCRAFT / ADMIN / LIBRARY</span><h1>إدارة القوالب والأكواد</h1><p>أضف تصميمات وأزرارًا ومكونات وسكربتات، وحدد السعر وشاهد المعاينة قبل النشر.</p></div>
    {!ready ? <div className="workspace-panel">جاري التحقق من صلاحياتك...</div> : !allowed ? <div className="workspace-panel workspace-empty"><h2>هذه الصفحة للمسؤول فقط</h2><p>سجّل الدخول بحساب مسؤول الموقع للوصول إلى محرر القوالب.</p><Link href="/login?next=%2Fadmin%2Fassets">تسجيل الدخول</Link></div> : <div className="asset-admin-layout"><aside className="workspace-panel asset-admin-list"><div className="workspace-section-title"><h2>العناصر ({assets.length})</h2><button type="button" onClick={() => { setDraft(newAsset()); setMessage(''); }}><Plus size={16}/> جديد</button></div><div>{assets.map(asset => <button type="button" key={asset.id} className={draft.id === asset.id ? 'active' : ''} onClick={() => { setDraft(asset); setMessage(''); }}><strong>{asset.title}</strong><small>{asset.published ? 'منشور' : 'مسودة'} · {asset.price.toLocaleString('ar')} OMR</small></button>)}{assets.length === 0 && <p>لا توجد عناصر بعد. أضف أول عنصر من المحرر.</p>}</div></aside>
      <section className="workspace-panel asset-admin-editor"><div className="workspace-section-title"><Code2 size={19}/><h2>{assets.some(asset => asset.id === draft.id) ? 'تعديل العنصر' : 'إضافة عنصر'}</h2></div><div className="asset-form-grid"><label>الاسم<input value={draft.title} maxLength={120} onChange={event => update('title', event.target.value)} placeholder="مثل: زر تفاعلي بنفسجي" /></label><label>الاسم بالإنجليزية<input value={draft.titleEn} maxLength={120} onChange={event => update('titleEn', event.target.value)} placeholder="English title" /></label><label>السعر (ريال عماني)<input type="number" min="0" max="100000" step="0.001" value={draft.price} onChange={event => update('price', Number(event.target.value))} /></label><label>القسم<select value={draft.category} onChange={event => update('category', event.target.value as AssetCategory)}><option value="template">قالب</option><option value="button">زر</option><option value="component">مكون</option><option value="script">سكربت</option></select></label><label>نوع الكود<select value={draft.framework} onChange={event => update('framework', event.target.value as AssetFramework)}><option value="html">HTML / CSS / JS</option><option value="nextjs">Next.js</option></select></label></div><label>الوصف<textarea rows={2} maxLength={600} value={draft.description} onChange={event => update('description', event.target.value)} placeholder="ماذا يقدم هذا العنصر؟" /></label><label>الوصف بالإنجليزية<textarea rows={2} maxLength={600} value={draft.descriptionEn} onChange={event => update('descriptionEn', event.target.value)} placeholder="English description" /></label><div className="asset-editor-code"><label>HTML المعاينة<textarea dir="ltr" spellCheck={false} value={draft.html} onChange={event => update('html', event.target.value)} /></label><label>CSS<textarea dir="ltr" spellCheck={false} value={draft.css} onChange={event => update('css', event.target.value)} /></label><label>JavaScript<textarea dir="ltr" spellCheck={false} value={draft.js} onChange={event => update('js', event.target.value)} /></label>{draft.framework === 'nextjs' && <label>كود Next.js (TSX/JSX)<textarea dir="ltr" spellCheck={false} value={draft.nextCode} onChange={event => update('nextCode', event.target.value)} placeholder="export default function Component() { ... }" /></label>}</div>{draft.framework === 'nextjs' && <p className="asset-help">أضف كود Next.js للتنزيل والنسخ، واستخدم حقول HTML/CSS/JS أعلاه لصنع المعاينة المباشرة. تشغيل مشروع Next.js كامل يتطلب بناءه ونشره منفصلًا.</p>}<label className="asset-publish"><input type="checkbox" checked={draft.published} onChange={event => update('published', event.target.checked)} /> نشر العنصر في المكتبة العامة</label><div className="asset-admin-actions"><button type="button" className="workspace-primary" onClick={save} disabled={busy || !draft.title.trim()}><Save size={17}/>{busy ? 'جاري الحفظ...' : 'حفظ العنصر'}</button><button type="button" className="workspace-muted" onClick={remove} disabled={busy || !assets.some(asset => asset.id === draft.id)}><Trash2 size={16}/> حذف</button></div>{message && <p role="status" className="workspace-success">{message}</p>}{error && <p role="alert" className="form-error">{error}</p>}</section>
      <section className="workspace-panel asset-admin-preview"><div className="workspace-section-title"><Eye size={19}/><h2>معاينة مباشرة</h2></div><div><AssetPreview asset={draft} title="معاينة العنصر قبل النشر" /></div><small>تعمل الأكواد داخل إطار معزول عن الموقع.</small></section></div>}
    </main></div>;
}
