'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Globe2, Monitor, Smartphone, Sparkles, Tablet } from 'lucide-react';
import { Preview } from '@/components/preview/Preview';
import { useLanguage } from '@/hooks/useLanguage';
import { palettes } from '@/lib/catalog';
import { formatPrice, sitePricing, templateDefinitions } from '@/lib/pricing';
import { designFromTemplate, localizeDesignDefaults } from '@/lib/templates';
import type { Design } from '@/types/design';

export function TemplatePreviewStudio({ id }: { id: string }) {
  const { language, changeLanguage, en } = useLanguage();
  const template = useMemo(() => templateDefinitions.find(entry => entry.id === id)!, [id]);
  const [design, setDesign] = useState<Design>(() => designFromTemplate(id, template.nameAr, 'ar')!);
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [activePalette, setActivePalette] = useState(design.palette.id);
  useEffect(() => { setDesign(current => ({ ...localizeDesignDefaults(current, language), projectName: current.projectName === template.nameAr || current.projectName === template.nameEn ? language === 'en' ? template.nameEn : template.nameAr : current.projectName })); }, [language, template]);
  const t = (ar: string, english: string) => en ? english : ar;
  const price = sitePricing[template.siteType];
  const colorOptions = palettes.slice(0, 6);

  return <div className="template-preview-page" dir={en ? 'ltr' : 'rtl'} lang={language}>
    <header className="template-preview-top"><Link href="/" className="home-logo">WEB<span>CRAFT</span><i/></Link><div><span className="template-preview-live"><i/>{t('معاينة مباشرة', 'Live preview')}</span><button type="button" onClick={() => changeLanguage(en ? 'ar' : 'en')} aria-label={en ? 'Switch to Arabic' : 'التبديل إلى الإنجليزية'}><Globe2 size={16}/>{en ? 'AR' : 'EN'}</button><Link href="/#templates">{t('كل القوالب', 'All templates')}</Link></div></header>
    <div className="template-preview-layout"><aside className="template-preview-controls">
      <div className="template-preview-eyebrow"><Sparkles size={15}/>{t('مساحة تجربة التصميم', 'Design playground')}</div>
      <h1>{en ? template.nameEn : template.nameAr}</h1>
      <p>{en ? template.descriptionEn : template.descriptionAr}</p>
      <div className="template-preview-price"><span>{t('سعر البداية', 'Starting at')}</span><strong dir="ltr">{formatPrice(price.price, language)}</strong><small>{price.pages} {t('صفحات مشمولة', 'pages included')}</small></div>
      <label className="template-preview-field"><span>{t('اسم المتجر أو المشروع', 'Store or project name')}</span><input maxLength={70} value={design.projectName} onChange={event => setDesign(current => ({ ...current, projectName: event.target.value }))}/></label>
      <label className="template-preview-field"><span>{t('عنوان الواجهة', 'Hero headline')}</span><input maxLength={100} value={design.heroTitle} onChange={event => setDesign(current => ({ ...current, heroTitle: event.target.value }))}/></label>
      <div className="template-preview-palette"><span>{t('جرّب هوية لونية', 'Try a color palette')}</span><div>{colorOptions.map(palette => <button key={palette.id} type="button" className={activePalette === palette.id ? 'selected' : ''} onClick={() => { setActivePalette(palette.id); setDesign(current => ({ ...current, palette })); }} aria-label={palette.name} title={palette.name} style={{ background: palette.primary }}>{activePalette === palette.id && <Check size={15}/>}</button>)}</div></div>
      <div className="template-preview-note">{t('كل تعديل يظهر فورًا في المعاينة. هذه تجربة للقالب؛ احفظ مشروعك بعد تسجيل الدخول.', 'Changes appear instantly in the preview. Sign in to save this template as a project.')}</div>
      <Link className="template-preview-start" href={`/builder?template=${template.id}`}>{t('ابدأ مشروعًا بهذا القالب', 'Start a project with this template')} <ArrowLeft size={17}/></Link>
    </aside><main className="template-preview-main"><div className="template-preview-toolbar"><div><strong>{t('موقعك قبل التنفيذ', 'Your site before launch')}</strong><small>{t('بدّل الجهاز وشاهد كل التفاصيل', 'Switch devices to inspect every detail')}</small></div><div className="template-preview-devices"><button type="button" className={device === 'desktop' ? 'active' : ''} onClick={() => setDevice('desktop')} aria-label={t('كمبيوتر', 'Desktop')}><Monitor size={17}/></button><button type="button" className={device === 'tablet' ? 'active' : ''} onClick={() => setDevice('tablet')} aria-label={t('لوحي', 'Tablet')}><Tablet size={17}/></button><button type="button" className={device === 'mobile' ? 'active' : ''} onClick={() => setDevice('mobile')} aria-label={t('جوال', 'Mobile')}><Smartphone size={17}/></button></div></div><div className={`template-preview-stage ${device}`}><div className="template-preview-frame"><div className="template-preview-browser"><span/><span/><span/><b>your-store.webcraft</b></div><div className="template-preview-scroll"><Preview design={design}/></div></div></div></main></div>
  </div>;
}
