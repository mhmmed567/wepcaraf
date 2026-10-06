'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowUp, Copy, Eye, EyeOff, GripVertical, Layers3, Monitor, Plus, Redo2, Save, Smartphone, Tablet, Trash2, Undo2 } from 'lucide-react';
import { Preview } from '@/components/preview/Preview';
import { resolveDesign } from '@/components/preview/resolveDesign';
import { useDashboardSession } from '@/components/dashboard/DashboardShell';
import { useDesign } from '@/hooks/useDesign';
import type { Design, Section } from '@/types/design';

type Selection = 'hero' | 'footer' | string;
const starterSections = [
  { kind: 'خدمات', title: 'خدماتنا', body: 'اشرح ما تقدمه للعملاء بطريقة واضحة.' },
  { kind: 'مميزات', title: 'ما يميزنا', body: 'أبرز الأسباب التي تجعل مشروعك الخيار المناسب.' },
  { kind: 'معرض', title: 'أعمالنا', body: 'اعرض صورًا أو أمثلة من أعمالك.' },
  { kind: 'آراء العملاء', title: 'ماذا يقول عملاؤنا', body: 'شارك تجارب حقيقية تعزز الثقة.' },
  { kind: 'الأسئلة الشائعة', title: 'الأسئلة الشائعة', body: 'أجب عن الأسئلة الأكثر تكرارًا.' },
  { kind: 'دعوة لاتخاذ إجراء', title: 'لنبدأ العمل معًا', body: 'وجّه الزائر إلى الخطوة التالية.' },
];

export function VisualBuilder({ projectId, initialDesign, initialRevision }: { projectId: string; initialDesign: Design; initialRevision: number }) {
  const { token, en } = useDashboardSession();
  const { design, update, undo, redo, canUndo, canRedo } = useDesign(initialDesign);
  const [selection, setSelection] = useState<Selection>('hero');
  const [tab, setTab] = useState<'layers' | 'elements' | 'styles' | 'data'>('layers');
  const [bindings, setBindings] = useState<Record<string, string>>({});
  const [dynamicFields, setDynamicFields] = useState<{ token: string; label: string }[]>([]);
  const [dataError, setDataError] = useState('');
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [showLeft, setShowLeft] = useState(true);
  const [showRight, setShowRight] = useState(true);
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'dirty' | 'error' | 'conflict'>('saved');
  const [saveError, setSaveError] = useState('');
  const [dragged, setDragged] = useState<string | null>(null);
  const revision = useRef(initialRevision);
  const lastSaved = useRef(JSON.stringify(initialDesign));
  const saving = useRef(false);
  const pending = useRef<Design | null>(null);
  const conflict = useRef(false);
  const selectedSection = design.sections.find(section => section.id === selection);

  const loadBindings = useCallback(async () => {
    if (!token) return;
    const response = await fetch(`/api/projects/${projectId}/cms/bindings`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
    const result = await response.json();
    if (!response.ok) throw Error(result.error || 'تعذر تحميل البيانات');
    setBindings(result.bindings); setDynamicFields(result.fields); setDataError('');
  }, [projectId, token]);
  useEffect(() => { void loadBindings().catch(caught => setDataError(caught instanceof Error ? caught.message : String(caught))); }, [loadBindings]);

  const persist = useCallback(async (snapshot: Design) => {
    if (!token || conflict.current) return;
    const serialized = JSON.stringify(snapshot);
    if (serialized === lastSaved.current) { setSaveState('saved'); return; }
    if (saving.current) { pending.current = snapshot; return; }
    saving.current = true; setSaveState('saving'); setSaveError('');
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH', cache: 'no-store',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ revision: revision.current, design: snapshot }),
      });
      const result = await response.json();
      if (!response.ok) {
        if (response.status === 409) { conflict.current = true; setSaveState('conflict'); }
        throw Error(result.error || (en ? 'Could not save changes' : 'تعذر حفظ التغييرات'));
      }
      revision.current = result.revision;
      lastSaved.current = serialized;
      setSaveState('saved');
    } catch (caught) {
      setSaveError(caught instanceof Error ? caught.message : String(caught));
      setSaveState(conflict.current ? 'conflict' : 'error');
    } finally {
      saving.current = false;
      const next = pending.current;
      pending.current = null;
      if (next && !conflict.current && JSON.stringify(next) !== lastSaved.current) void persist(next);
    }
  }, [projectId, token, en]);

  useEffect(() => {
    if (JSON.stringify(design) === lastSaved.current || conflict.current) return;
    setSaveState('dirty');
    const timer = window.setTimeout(() => { void persist(design); }, 1000);
    return () => window.clearTimeout(timer);
  }, [design, persist]);

  function setSection(id: string, patch: Partial<Section>) {
    update(current => ({ ...current, sections: current.sections.map(section => section.id === id ? { ...section, ...patch } : section) }));
  }
  function addSection(index: number) {
    const preset = starterSections[index];
    const section: Section = { id: crypto.randomUUID(), ...preset, variant: 0, visible: true };
    update(current => ({ ...current, sections: [...current.sections, section] }));
    setSelection(section.id); setTab('layers');
  }
  function moveSection(id: string, offset: number) {
    update(current => {
      const sections = [...current.sections];
      const from = sections.findIndex(section => section.id === id);
      const to = from + offset;
      if (from < 0 || to < 0 || to >= sections.length) return current;
      [sections[from], sections[to]] = [sections[to], sections[from]];
      return { ...current, sections };
    });
  }
  function dropSection(target: string) {
    if (!dragged || dragged === target) return;
    update(current => {
      const sections = [...current.sections];
      const from = sections.findIndex(section => section.id === dragged);
      const to = sections.findIndex(section => section.id === target);
      if (from < 0 || to < 0) return current;
      sections.splice(to, 0, sections.splice(from, 1)[0]);
      return { ...current, sections };
    });
    setDragged(null);
  }
  function inlineEdit(field: string, value: string) {
    const resolved = resolveDesign(design, bindings);
    if (field.startsWith('section:')) {
      const [, id, property] = field.split(':');
      if ((property === 'title' || property === 'body') && resolved.sections.find(section => section.id === id)?.[property] !== value) setSection(id, { [property]: value });
      return;
    }
    if (field.startsWith('page:')) {
      const index = Number(field.slice(5));
      update(current => ({ ...current, pages: current.pages.map((page, i) => i === index ? value : page) }));
      return;
    }
    if (field === 'locale' && (value === 'ar' || value === 'en')) update({ locale: value });
    else if (['projectName', 'heroTitle', 'heroBody', 'buttonLabel', 'navCta', 'footerTagline', 'contactEmail', 'contactPhone'].includes(field) && String(resolved[field as keyof Design] ?? '') !== value) update({ [field]: value });
  }
  const field = (label: string, value: string, onChange: (value: string) => void, multiline = false) => <label className="vb-field"><span>{label}</span>{multiline ? <textarea value={value} rows={4} onChange={event => onChange(event.target.value)}/> : <input value={value} onChange={event => onChange(event.target.value)}/>}</label>;

  return <div className={`visual-builder ${showLeft ? '' : 'vb-hide-left'} ${showRight ? '' : 'vb-hide-right'}`}>
    <div className="vb-toolbar"><div className="vb-toolbar-start"><Link href={`/dashboard/projects/${projectId}`} aria-label={en ? 'Back to project' : 'العودة إلى المشروع'}><ArrowLeft size={18}/></Link><span className="vb-toolbar-divider"/><strong>{design.projectName}</strong><small>{en ? 'Visual builder' : 'المحرر البصري'}</small></div><div className="vb-devices"><button className={device === 'desktop' ? 'active' : ''} onClick={() => setDevice('desktop')} aria-label={en ? 'Desktop preview' : 'معاينة الكمبيوتر'}><Monitor size={17}/></button><button className={device === 'tablet' ? 'active' : ''} onClick={() => setDevice('tablet')} aria-label={en ? 'Tablet preview' : 'معاينة الجهاز اللوحي'}><Tablet size={17}/></button><button className={device === 'mobile' ? 'active' : ''} onClick={() => setDevice('mobile')} aria-label={en ? 'Mobile preview' : 'معاينة الجوال'}><Smartphone size={17}/></button></div><div className="vb-toolbar-end"><button disabled={!canUndo} onClick={undo} title={en ? 'Undo' : 'تراجع'}><Undo2 size={17}/></button><button disabled={!canRedo} onClick={redo} title={en ? 'Redo' : 'إعادة'}><Redo2 size={17}/></button><span className={`vb-save-status ${saveState}`}>{saveState === 'saved' ? en ? 'Saved' : 'تم الحفظ' : saveState === 'saving' ? en ? 'Saving…' : 'جاري الحفظ...' : saveState === 'dirty' ? en ? 'Unsaved' : 'تعديلات غير محفوظة' : en ? 'Save failed' : 'تعذر الحفظ'}</span><button className="vb-save-button" disabled={saveState === 'saving' || saveState === 'conflict'} onClick={() => void persist(design)}><Save size={16}/><span>{en ? 'Save' : 'حفظ'}</span></button></div></div>
    {(saveState === 'error' || saveState === 'conflict') && <div className="vb-error" role="alert">{saveError}{saveState === 'conflict' && <button onClick={() => window.location.reload()}>{en ? 'Reload latest version' : 'تحميل أحدث نسخة'}</button>}</div>}
    <div className="vb-workspace"><aside className="vb-left"><div className="vb-panel-head"><strong>{en ? 'Structure' : 'بنية الصفحة'}</strong><button onClick={() => setShowLeft(false)} aria-label={en ? 'Hide panel' : 'إخفاء اللوحة'}>×</button></div><div className="vb-tabs"><button className={tab === 'layers' ? 'active' : ''} onClick={() => setTab('layers')}>{en ? 'Layers' : 'الطبقات'}</button><button className={tab === 'elements' ? 'active' : ''} onClick={() => setTab('elements')}>{en ? 'Elements' : 'العناصر'}</button><button className={tab === 'styles' ? 'active' : ''} onClick={() => setTab('styles')}>{en ? 'Styles' : 'التنسيق'}</button><button className={tab === 'data' ? 'active' : ''} onClick={() => { setTab('data'); void loadBindings().catch(caught => setDataError(caught instanceof Error ? caught.message : String(caught))); }}>{en ? 'Data' : 'البيانات'}</button></div>
      {tab === 'layers' && <div className="vb-layers"><button className={selection === 'hero' ? 'selected' : ''} onClick={() => setSelection('hero')}><Layers3 size={16}/>{en ? 'Hero' : 'الواجهة الرئيسية'}</button>{design.sections.map((section, index) => <div key={section.id} className={`vb-layer ${selection === section.id ? 'selected' : ''}`} draggable onDragStart={() => setDragged(section.id)} onDragEnd={() => setDragged(null)} onDragOver={event => event.preventDefault()} onDrop={() => dropSection(section.id)}><GripVertical size={15}/><button className="vb-layer-name" onClick={() => setSelection(section.id)}><small>{String(index + 1).padStart(2, '0')}</small>{section.title}</button><button onClick={() => setSection(section.id, { visible: !section.visible })} title={section.visible ? 'إخفاء' : 'إظهار'}>{section.visible ? <Eye size={15}/> : <EyeOff size={15}/>}</button></div>)}<button className={selection === 'footer' ? 'selected' : ''} onClick={() => setSelection('footer')}><Layers3 size={16}/>{en ? 'Footer' : 'التذييل'}</button><button className="vb-add-layer" onClick={() => setTab('elements')}><Plus size={16}/>{en ? 'Add section' : 'إضافة قسم'}</button></div>}
      {tab === 'elements' && <div className="vb-elements"><p>{en ? 'Add a section to the current page.' : 'أضف قسمًا جديدًا إلى الصفحة الحالية.'}</p>{starterSections.map((preset, index) => <button key={preset.kind} onClick={() => addSection(index)}><span><Plus size={16}/></span><strong>{preset.kind}</strong><small>{preset.title}</small></button>)}</div>}
      {tab === 'styles' && <div className="vb-properties">{field(en ? 'Website name' : 'اسم الموقع', design.projectName, value => update({ projectName: value }))}<label className="vb-field"><span>{en ? 'Main color' : 'اللون الرئيسي'}</span><input type="color" value={design.palette.primary} onChange={event => update(current => ({ ...current, palette: { ...current.palette, primary: event.target.value } }))}/></label><label className="vb-field"><span>{en ? 'Background' : 'الخلفية'}</span><input type="color" value={design.palette.background} onChange={event => update(current => ({ ...current, palette: { ...current.palette, background: event.target.value } }))}/></label><label className="vb-field"><span>{en ? 'Corner radius' : 'استدارة الزوايا'} · {design.radius}px</span><input type="range" min="0" max="32" value={design.radius} onChange={event => update({ radius: Number(event.target.value) })}/></label><label className="vb-field"><span>{en ? 'Text direction' : 'لغة التصميم'}</span><select value={design.locale} onChange={event => update({ locale: event.target.value as 'ar' | 'en' })}><option value="ar">العربية</option><option value="en">English</option></select></label></div>}
      {tab === 'data' && <div className="vb-dynamic"><p>{en ? 'Paste a field token into a title or description. The preview uses the latest published entry from each collection.' : 'انسخ رمز الحقل داخل أي عنوان أو وصف. تستخدم المعاينة أحدث عنصر منشور من كل مجموعة.'}</p>{dataError && <p role="alert">{dataError}</p>}{dynamicFields.length ? dynamicFields.map(item => <button key={item.token} onClick={() => void navigator.clipboard.writeText(`{{${item.token}}}`)}><strong>{item.label}</strong><code dir="ltr">{`{{${item.token}}}`}</code><Copy size={14}/></button>) : <Link href={`/dashboard/projects/${projectId}/cms`}>{en ? 'Create a content collection' : 'أنشئ مجموعة محتوى'}</Link>}</div>}
    </aside><main className="vb-canvas"><div className="vb-canvas-head"><button onClick={() => setShowLeft(value => !value)} aria-label={en ? 'Toggle layers' : 'إظهار أو إخفاء الطبقات'}><Layers3 size={17}/></button><span>{en ? 'Home page' : 'الصفحة الرئيسية'} · {device === 'desktop' ? '1440px' : device === 'tablet' ? '768px' : '390px'}</span><button onClick={() => setShowRight(value => !value)} aria-label={en ? 'Toggle properties' : 'إظهار أو إخفاء الخصائص'}>☷</button></div><div className={`vb-canvas-stage ${device}`}><div className="vb-page"><Preview design={design} bindings={bindings} editable onEdit={inlineEdit}/></div></div></main><aside className="vb-right"><div className="vb-panel-head"><strong>{en ? 'Properties' : 'خصائص العنصر'}</strong><button onClick={() => setShowRight(false)} aria-label={en ? 'Hide panel' : 'إخفاء اللوحة'}>×</button></div><div className="vb-properties">{selection === 'hero' && <><span className="vb-property-kicker">HERO SECTION</span>{field(en ? 'Headline' : 'العنوان الرئيسي', design.heroTitle, value => update({ heroTitle: value }))}{field(en ? 'Description' : 'الوصف', design.heroBody, value => update({ heroBody: value }), true)}{field(en ? 'Button text' : 'نص الزر', design.buttonLabel, value => update({ buttonLabel: value }))}{field(en ? 'Image URL' : 'رابط الصورة', design.heroImage.startsWith('data:') ? '' : design.heroImage, value => update({ heroImage: value }))}</>}{selectedSection && <><span className="vb-property-kicker">{selectedSection.kind}</span>{field(en ? 'Section title' : 'عنوان القسم', selectedSection.title, value => setSection(selectedSection.id, { title: value }))}{field(en ? 'Description' : 'الوصف', selectedSection.body, value => setSection(selectedSection.id, { body: value }), true)}{field(en ? 'Image URL' : 'رابط الصورة', selectedSection.image?.startsWith('data:') ? '' : selectedSection.image || '', value => setSection(selectedSection.id, { image: value }))}<label className="vb-field"><span>{en ? 'Layout' : 'التخطيط'}</span><select value={selectedSection.variant} onChange={event => setSection(selectedSection.id, { variant: Number(event.target.value) })}>{[0, 1, 2, 3].map(value => <option key={value} value={value}>{en ? `Layout ${value + 1}` : `تصميم ${value + 1}`}</option>)}</select></label><div className="vb-section-actions"><button disabled={design.sections[0]?.id === selectedSection.id} onClick={() => moveSection(selectedSection.id, -1)}><ArrowUp size={16}/></button><button disabled={design.sections.at(-1)?.id === selectedSection.id} onClick={() => moveSection(selectedSection.id, 1)}><ArrowDown size={16}/></button><button onClick={() => { const copy = { ...selectedSection, id: crypto.randomUUID() }; update(current => ({ ...current, sections: [...current.sections.slice(0, current.sections.findIndex(section => section.id === selectedSection.id) + 1), copy, ...current.sections.slice(current.sections.findIndex(section => section.id === selectedSection.id) + 1)] })); setSelection(copy.id); }}><Copy size={16}/>{en ? 'Duplicate' : 'نسخ'}</button><button className="danger" onClick={() => { update(current => ({ ...current, sections: current.sections.filter(section => section.id !== selectedSection.id) })); setSelection('hero'); }}><Trash2 size={16}/>{en ? 'Delete' : 'حذف'}</button></div></>}{selection === 'footer' && <><span className="vb-property-kicker">FOOTER</span>{field(en ? 'Tagline' : 'الوصف', design.footerTagline || '', value => update({ footerTagline: value }))}{field(en ? 'Contact email' : 'بريد التواصل', design.contactEmail || '', value => update({ contactEmail: value }))}{field(en ? 'Phone' : 'رقم الهاتف', design.contactPhone || '', value => update({ contactPhone: value }))}</>}<Link className="vb-cms-link" href={`/dashboard/projects/${projectId}/cms`}>{en ? 'Manage dynamic content' : 'إدارة المحتوى الديناميكي'} <ArrowLeft size={15}/></Link></div></aside></div>
  </div>;
}
