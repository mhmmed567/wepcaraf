'use client';

import { useState } from 'react';
import { Plus, Save, Trash2, X } from 'lucide-react';
import type { CmsCollection, CmsField, CmsFieldType } from '../types';

const types: { id: CmsFieldType; label: string }[] = [
  { id: 'text', label: 'نص' }, { id: 'long_text', label: 'نص طويل' }, { id: 'number', label: 'رقم' },
  { id: 'currency', label: 'عملة' }, { id: 'boolean', label: 'نعم / لا' }, { id: 'date', label: 'تاريخ' },
  { id: 'email', label: 'بريد' }, { id: 'phone', label: 'هاتف' }, { id: 'url', label: 'رابط' },
  { id: 'image', label: 'صورة (رابط)' }, { id: 'file', label: 'ملف (رابط)' },
  { id: 'select', label: 'اختيار' }, { id: 'multi_select', label: 'اختيارات متعددة' }, { id: 'json', label: 'JSON' },
];

export type CollectionDraft = { name: string; slug: string; fields: CmsField[] };
export const blankCollection = (): CollectionDraft => ({ name: '', slug: '', fields: [{ key: 'title', label: 'العنوان', type: 'text', required: true, options: [] }] });

export function CollectionEditor({ initial, busy, onSave, onDelete, onClose }: { initial: CollectionDraft | CmsCollection; busy: boolean; onSave: (draft: CollectionDraft) => Promise<void>; onDelete?: () => Promise<void>; onClose: () => void }) {
  const [draft, setDraft] = useState<CollectionDraft>({ name: initial.name, slug: initial.slug, fields: initial.fields.map(field => ({ ...field })) });
  const [error, setError] = useState('');
  function updateField(index: number, patch: Partial<CmsField>) { setDraft(value => ({ ...value, fields: value.fields.map((field, position) => position === index ? { ...field, ...patch } : field) })); }
  async function submit() {
    setError('');
    if (!draft.name.trim() || !/^[a-z][a-z0-9-]{1,59}$/.test(draft.slug)) { setError('أدخل الاسم ورابطًا إنجليزيًا قصيرًا يبدأ بحرف.'); return; }
    if (new Set(draft.fields.map(field => field.key)).size !== draft.fields.length || draft.fields.some(field => !/^[a-z][a-z0-9_]{0,39}$/.test(field.key) || !field.label.trim())) { setError('تحقق من أسماء الحقول الإنجليزية، ويجب ألا تتكرر.'); return; }
    try { await onSave(draft); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'تعذر حفظ المجموعة'); }
  }
  return <div className="cms-overlay" onMouseDown={onClose}><section className="cms-dialog" role="dialog" aria-modal="true" aria-label="إعداد المجموعة" onMouseDown={event => event.stopPropagation()}><header><div><span className="saas-eyebrow">CMS / COLLECTION</span><h2>{'id' in initial ? 'تعديل المجموعة' : 'مجموعة جديدة'}</h2></div><button onClick={onClose} aria-label="إغلاق"><X size={20}/></button></header><div className="cms-dialog-scroll"><div className="cms-form-row"><label>اسم المجموعة<input value={draft.name} maxLength={100} onChange={event => setDraft(value => ({ ...value, name: event.target.value }))} placeholder="مثل: السيارات"/></label><label>الرابط الإنجليزي<input value={draft.slug} dir="ltr" maxLength={60} onChange={event => setDraft(value => ({ ...value, slug: event.target.value.toLowerCase() }))} placeholder="cars"/></label></div><div className="cms-fields-head"><h3>الحقول</h3><button type="button" onClick={() => setDraft(value => ({ ...value, fields: [...value.fields, { key: '', label: '', type: 'text', required: false, options: [] }] }))}><Plus size={16}/> إضافة حقل</button></div>{draft.fields.map((field, index) => <div className="cms-field-row" key={index}><label>اسم الحقل<input value={field.label} maxLength={80} onChange={event => updateField(index, { label: event.target.value })} placeholder="الاسم"/></label><label>المفتاح<input value={field.key} dir="ltr" maxLength={40} onChange={event => updateField(index, { key: event.target.value.toLowerCase() })} placeholder="name"/></label><label>النوع<select value={field.type} onChange={event => updateField(index, { type: event.target.value as CmsFieldType, options: [] })}>{types.map(type => <option value={type.id} key={type.id}>{type.label}</option>)}</select></label><label className="cms-field-required"><input type="checkbox" checked={field.required} onChange={event => updateField(index, { required: event.target.checked })}/> إلزامي</label><button type="button" className="cms-icon-button" aria-label="حذف الحقل" onClick={() => setDraft(value => ({ ...value, fields: value.fields.filter((_, position) => position !== index) }))}><Trash2 size={16}/></button>{(field.type === 'select' || field.type === 'multi_select') && <label className="cms-options">الخيارات، مفصولة بفاصلة<input value={field.options.join(', ')} onChange={event => updateField(index, { options: event.target.value.split(',').map(option => option.trim()).filter(Boolean) })} placeholder="أحمر، أزرق"/></label>}</div>)}{error && <p className="form-error" role="alert">{error}</p>}</div><footer><div>{onDelete && <button type="button" className="cms-danger" disabled={busy} onClick={() => void onDelete().catch(caught => setError(caught instanceof Error ? caught.message : 'تعذر حذف المجموعة'))}><Trash2 size={16}/> حذف المجموعة</button>}</div><button type="button" className="saas-primary" disabled={busy} onClick={() => void submit()}><Save size={16}/>{busy ? 'جاري الحفظ...' : 'حفظ المجموعة'}</button></footer></section></div>;
}
