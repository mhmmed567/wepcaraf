'use client';

import { useState } from 'react';
import { Save, Trash2, X } from 'lucide-react';
import type { CmsCollection, CmsEntry, CmsField } from '../types';

function initialValue(field: CmsField, data: Record<string, unknown>) { return data[field.key] ?? (field.type === 'boolean' ? false : field.type === 'multi_select' ? [] : ''); }
export function EntryEditor({ collection, entry, busy, onSave, onDelete, onClose }: { collection: CmsCollection; entry: CmsEntry | null; busy: boolean; onSave: (data: Record<string, unknown>, status: 'draft' | 'published') => Promise<void>; onDelete?: () => Promise<void>; onClose: () => void }) {
  const [data, setData] = useState<Record<string, unknown>>(() => Object.fromEntries(collection.fields.map(field => [field.key, initialValue(field, entry?.data || {})])));
  const [status, setStatus] = useState<'draft' | 'published'>(entry?.status || 'draft');
  const [error, setError] = useState('');
  const change = (key: string, value: unknown) => setData(current => ({ ...current, [key]: value }));
  async function submit() {
    setError('');
    const output = { ...data };
    for (const field of collection.fields) {
      const value = output[field.key];
      if (field.type === 'json' && typeof value === 'string' && value) {
        try { output[field.key] = JSON.parse(value); }
        catch { setError(`صيغة JSON غير صالحة في ${field.label}`); return; }
      }
    }
    try { await onSave(output, status); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'تعذر حفظ المحتوى'); }
  }
  return <div className="cms-overlay" onMouseDown={onClose}><section className="cms-dialog" role="dialog" aria-modal="true" aria-label="محرر المحتوى" onMouseDown={event => event.stopPropagation()}><header><div><span className="saas-eyebrow">CMS / ENTRY</span><h2>{entry ? 'تعديل المحتوى' : 'إضافة محتوى'}</h2></div><button onClick={onClose} aria-label="إغلاق"><X size={20}/></button></header><div className="cms-dialog-scroll"><p className="cms-editor-note">المجموعة: {collection.name}</p>{collection.fields.map(field => <label className="cms-entry-field" key={field.key}>{field.label}{field.required && <b> *</b>}{field.type === 'boolean' ? <input type="checkbox" checked={Boolean(data[field.key])} onChange={event => change(field.key, event.target.checked)}/> : field.type === 'long_text' || field.type === 'json' ? <textarea rows={field.type === 'json' ? 6 : 4} dir={field.type === 'json' ? 'ltr' : undefined} value={field.type === 'json' ? typeof data[field.key] === 'string' ? data[field.key] as string : JSON.stringify(data[field.key] ?? '', null, 2) : String(data[field.key] ?? '')} onChange={event => change(field.key, event.target.value)}/> : field.type === 'select' ? <select value={String(data[field.key] || '')} onChange={event => change(field.key, event.target.value)}><option value="">اختر...</option>{field.options.map(option => <option key={option}>{option}</option>)}</select> : field.type === 'multi_select' ? <div className="cms-multi">{field.options.map(option => <label key={option}><input type="checkbox" checked={Array.isArray(data[field.key]) && (data[field.key] as string[]).includes(option)} onChange={event => { const current = Array.isArray(data[field.key]) ? data[field.key] as string[] : []; change(field.key, event.target.checked ? [...current, option] : current.filter(value => value !== option)); }}/>{option}</label>)}</div> : <input type={field.type === 'number' || field.type === 'currency' ? 'number' : field.type === 'date' ? 'date' : field.type === 'email' ? 'email' : field.type === 'url' || field.type === 'image' || field.type === 'file' ? 'url' : 'text'} step={field.type === 'currency' ? '0.001' : field.type === 'number' ? 'any' : undefined} value={String(data[field.key] ?? '')} onChange={event => change(field.key, field.type === 'number' || field.type === 'currency' ? event.target.value === '' ? '' : Number(event.target.value) : event.target.value)}/>}</label>)}<label className="cms-entry-field">الحالة<select value={status} onChange={event => setStatus(event.target.value as 'draft' | 'published')}><option value="draft">مسودة</option><option value="published">منشور</option></select></label>{error && <p className="form-error" role="alert">{error}</p>}</div><footer><div>{entry && onDelete && <button type="button" className="cms-danger" disabled={busy} onClick={() => void onDelete().catch(caught => setError(caught instanceof Error ? caught.message : 'تعذر حذف المحتوى'))}><Trash2 size={16}/> حذف</button>}</div><button type="button" className="saas-primary" disabled={busy} onClick={() => void submit()}><Save size={16}/>{busy ? 'جاري الحفظ...' : 'حفظ المحتوى'}</button></footer></section></div>;
}
