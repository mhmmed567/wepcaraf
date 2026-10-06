'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Database, FilePlus2, Layers3, Plus, Search, Settings2 } from 'lucide-react';
import { useDashboardSession } from '@/components/dashboard/DashboardShell';
import { cmsRequest, type CollectionsResponse, type EntriesResponse } from '../client';
import type { CmsCollection, CmsEntry } from '../types';
import { blankCollection, CollectionEditor, type CollectionDraft } from './CollectionEditor';
import { EntryEditor } from './EntryEditor';

export function CmsStudio({ projectId }: { projectId: string }) {
  const { token, en } = useDashboardSession();
  const base = `/api/projects/${projectId}/cms/collections`;
  const [collections, setCollections] = useState<CmsCollection[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [entries, setEntries] = useState<CmsEntry[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<'all' | 'draft' | 'published'>('all');
  const [collectionEditor, setCollectionEditor] = useState<CollectionDraft | CmsCollection | null>(null);
  const [entryEditor, setEntryEditor] = useState<CmsEntry | 'new' | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const selected = collections?.find(collection => collection.id === selectedId) || null;

  const loadCollections = useCallback(async (authToken: string) => {
    const result = await cmsRequest<CollectionsResponse>(authToken, base);
    setCollections(result.collections);
    setSelectedId(current => current && result.collections.some(collection => collection.id === current) ? current : result.collections[0]?.id || null);
  }, [base]);
  useEffect(() => {
    if (!token) return;
    let live = true;
    void loadCollections(token).catch(caught => { if (live) { setCollections([]); setError(caught instanceof Error ? caught.message : String(caught)); } });
    return () => { live = false; };
  }, [token, loadCollections]);

  const loadEntries = useCallback(async (authToken: string, collectionId: string, currentPage: number, currentStatus: typeof status) => {
    const suffix = currentStatus === 'all' ? '' : `&status=${currentStatus}`;
    const result = await cmsRequest<EntriesResponse>(authToken, `${base}/${collectionId}/entries?page=${currentPage}&limit=20${suffix}`);
    setEntries(result.entries); setTotal(result.total);
  }, [base]);
  useEffect(() => {
    if (!token || !selectedId) { setEntries(null); return; }
    let live = true; setEntries(null);
    void loadEntries(token, selectedId, page, status).catch(caught => { if (live) { setEntries([]); setError(caught instanceof Error ? caught.message : String(caught)); } });
    return () => { live = false; };
  }, [token, selectedId, page, status, loadEntries]);

  async function saveCollection(draft: CollectionDraft) {
    if (!token) return;
    setBusy(true); setError('');
    try {
      const existing = collectionEditor && 'id' in collectionEditor ? collectionEditor : null;
      const result = await cmsRequest<{ collection: CmsCollection }>(token, existing ? `${base}/${existing.id}` : base, { method: existing ? 'PATCH' : 'POST', body: JSON.stringify(draft) });
      setCollectionEditor(null); setNotice('تم حفظ المجموعة.'); await loadCollections(token); setSelectedId(result.collection.id);
    } finally { setBusy(false); }
  }
  async function removeCollection() {
    if (!token || !collectionEditor || !('id' in collectionEditor) || !window.confirm('سيُحذف كل محتوى هذه المجموعة نهائيًا. هل تريد المتابعة؟')) return;
    setBusy(true);
    try { await cmsRequest(token, `${base}/${collectionEditor.id}`, { method: 'DELETE' }); setCollectionEditor(null); setNotice('تم حذف المجموعة.'); await loadCollections(token); }
    finally { setBusy(false); }
  }
  async function saveEntry(data: Record<string, unknown>, nextStatus: 'draft' | 'published') {
    if (!token || !selected) return;
    setBusy(true);
    try {
      const existing = entryEditor && entryEditor !== 'new' ? entryEditor : null;
      await cmsRequest(token, `${base}/${selected.id}/entries${existing ? `/${existing.id}` : ''}`, { method: existing ? 'PATCH' : 'POST', body: JSON.stringify({ data, status: nextStatus }) });
      setEntryEditor(null); setNotice('تم حفظ المحتوى.'); await loadEntries(token, selected.id, page, status);
    } finally { setBusy(false); }
  }
  async function removeEntry() {
    if (!token || !selected || !entryEditor || entryEditor === 'new' || !window.confirm('حذف هذا العنصر نهائيًا؟')) return;
    setBusy(true);
    try { await cmsRequest(token, `${base}/${selected.id}/entries/${entryEditor.id}`, { method: 'DELETE' }); setEntryEditor(null); setNotice('تم حذف العنصر.'); await loadEntries(token, selected.id, page, status); }
    finally { setBusy(false); }
  }

  const entryTitle = (entry: CmsEntry) => {
    const field = selected?.fields.find(item => item.type === 'text' && entry.data[item.key]);
    return field ? String(entry.data[field.key]) : entry.id.slice(0, 8);
  };
  return <main className="saas-page cms-page"><Link className="saas-back" href={`/dashboard/projects/${projectId}`}>← {en ? 'Project workspace' : 'مساحة المشروع'}</Link><div className="saas-heading"><div><span className="saas-eyebrow">WEBCRAFT / CMS</span><h1>{en ? 'Content manager' : 'إدارة المحتوى'}</h1><p>{en ? 'Create collections and manage published or draft content for this project.' : 'أنشئ مجموعات مرنة، ثم أضف محتوى منشورًا أو مسودات لهذا المشروع.'}</p></div><button className="saas-primary" onClick={() => setCollectionEditor(blankCollection())}><Plus size={17}/>{en ? 'New collection' : 'مجموعة جديدة'}</button></div>{error && <div className="saas-inline-error" role="alert">{error}<button onClick={() => { setError(''); if (token) { void loadCollections(token); if (selectedId) void loadEntries(token, selectedId, page, status); } }}>{en ? 'Retry' : 'إعادة المحاولة'}</button></div>}{notice && <p className="cms-notice" role="status">{notice}</p>}<div className="cms-layout"><aside className="saas-panel cms-collections"><div className="saas-panel-head"><h2>{en ? 'Collections' : 'المجموعات'}</h2><button type="button" onClick={() => setCollectionEditor(blankCollection())} aria-label="إضافة مجموعة"><Plus size={18}/></button></div>{!collections ? <div className="saas-skeleton table"/> : collections.length ? <div className="cms-collection-list">{collections.map(collection => <button className={selectedId === collection.id ? 'active' : ''} key={collection.id} onClick={() => { setSelectedId(collection.id); setPage(1); }}><Layers3 size={17}/><span><strong>{collection.name}</strong><small dir="ltr">/{collection.slug}</small></span></button>)}</div> : <div className="saas-empty"><Database size={27}/><p>{en ? 'No collections yet.' : 'لا توجد مجموعات بعد.'}</p></div>}</aside><section className="saas-panel cms-entries">{selected ? <><div className="saas-panel-head"><div><span className="saas-eyebrow">/{selected.slug}</span><h2>{selected.name}</h2></div><div className="cms-head-actions"><button type="button" onClick={() => setCollectionEditor(selected)} aria-label="إعداد المجموعة"><Settings2 size={18}/></button><button type="button" className="saas-primary" onClick={() => setEntryEditor('new')}><FilePlus2 size={16}/>{en ? 'Add entry' : 'إضافة عنصر'}</button></div></div><div className="cms-toolbar"><div><button className={status === 'all' ? 'active' : ''} onClick={() => { setStatus('all'); setPage(1); }}>{en ? 'All' : 'الكل'}</button><button className={status === 'published' ? 'active' : ''} onClick={() => { setStatus('published'); setPage(1); }}>{en ? 'Published' : 'منشور'}</button><button className={status === 'draft' ? 'active' : ''} onClick={() => { setStatus('draft'); setPage(1); }}>{en ? 'Drafts' : 'مسودات'}</button></div><small>{total} {en ? 'entries' : 'عنصر'}</small></div>{!entries ? <div className="saas-skeleton table"/> : entries.length ? <div className="cms-entry-list">{entries.map(entry => <button key={entry.id} onClick={() => setEntryEditor(entry)}><span className="cms-entry-icon"><Search size={17}/></span><span><strong>{entryTitle(entry)}</strong><small>{new Intl.DateTimeFormat(en ? 'en' : 'ar', { dateStyle: 'medium' }).format(new Date(entry.updated_at))}</small></span><em className={entry.status}>{entry.status === 'published' ? en ? 'Published' : 'منشور' : en ? 'Draft' : 'مسودة'}</em><ArrowLeft size={17}/></button>)}</div> : <div className="saas-empty"><FilePlus2 size={29}/><h3>{en ? 'No content yet' : 'لا يوجد محتوى بعد'}</h3><p>{en ? 'Add the first entry to this collection.' : 'أضف أول عنصر إلى هذه المجموعة.'}</p><button onClick={() => setEntryEditor('new')}>{en ? 'Add entry' : 'إضافة عنصر'}</button></div>}{total > 20 && <div className="saas-pagination"><button disabled={page === 1} onClick={() => setPage(value => value - 1)}>{en ? 'Previous' : 'السابق'}</button><span>{page} / {Math.ceil(total / 20)}</span><button disabled={page * 20 >= total} onClick={() => setPage(value => value + 1)}>{en ? 'Next' : 'التالي'}</button></div>}</> : <div className="saas-empty"><Layers3 size={30}/><h3>{en ? 'Create your first collection' : 'أنشئ أول مجموعة محتوى'}</h3><p>{en ? 'Define fields such as name, price and image to start adding records.' : 'حدد حقولًا مثل الاسم والسعر والصورة ثم أضف العناصر.'}</p><button onClick={() => setCollectionEditor(blankCollection())}>{en ? 'New collection' : 'مجموعة جديدة'}</button></div>}</section></div>{collectionEditor && <CollectionEditor key={'id' in collectionEditor ? collectionEditor.id : 'new'} initial={collectionEditor} busy={busy} onSave={saveCollection} onDelete={'id' in collectionEditor ? removeCollection : undefined} onClose={() => setCollectionEditor(null)}/>}{entryEditor && selected && <EntryEditor key={entryEditor === 'new' ? 'new' : entryEditor.id} collection={selected} entry={entryEditor === 'new' ? null : entryEditor} busy={busy} onSave={saveEntry} onDelete={entryEditor === 'new' ? undefined : removeEntry} onClose={() => setEntryEditor(null)}/>}</main>;
}
