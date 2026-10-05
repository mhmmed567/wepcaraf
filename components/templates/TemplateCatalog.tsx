import Link from 'next/link';
import type { CSSProperties } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { formatPrice, sitePricing, templateDefinitions, type Language, type TemplateId } from '@/lib/pricing';
import { designFromTemplate } from '@/lib/templates';

export function TemplateCatalog({ language, selected, onSelect }: { language: Language; selected?: TemplateId | null; onSelect?: (id: TemplateId) => void }) {
  const en = language === 'en';
  return <div className="template-grid">{templateDefinitions.map(template => {
    const pricing = sitePricing[template.siteType];
    const design = designFromTemplate(template.id, en ? template.nameEn : template.nameAr, language);
    const palette = design?.palette;
    const thumbImage = template.id === 'market' ? '/preview/store-hero.svg' : template.id === 'cafe' ? '/preview/product-three.svg' : template.id === 'folio' ? '/preview/product-one.svg' : template.id === 'care' ? '/preview/product-two.svg' : '/preview/product-two.svg';
    const content = <><div className={`template-art art-${template.id}`} style={{ '--template-accent': template.accent } as CSSProperties}><div aria-hidden="true" className="template-live-site" dir={en ? 'ltr' : 'rtl'} style={{ '--thumb-primary': palette?.primary ?? template.accent, '--thumb-bg': palette?.background ?? '#fff', '--thumb-text': palette?.text ?? '#222', '--thumb-accent': palette?.accent ?? template.accent } as CSSProperties}>{design && <><div className="template-live-nav"><b>{design.projectName}<i>.</i></b><span>{en ? 'Home　 About　 Services' : 'الرئيسية　 من نحن　 الخدمات'}</span><em/></div><div className={`template-live-hero thumb-hero-${design.hero}`}><div><small>{en ? template.nameEn : template.nameAr} · {en ? 'A distinct experience' : 'تجربة استثنائية'}</small><strong>{design.heroTitle}</strong><p>{design.heroBody}</p><i>{design.buttonLabel}</i></div><img src={design.heroImage || thumbImage} alt=""/></div><div className="template-live-products"><span/><span/><span/></div></>}</div></div><div className="template-card-body"><div className="template-card-top"><span>{en ? template.nameEn : template.nameAr}</span><strong dir="ltr">{formatPrice(pricing.price, language)}</strong></div><h3>{en ? template.descriptionEn : template.descriptionAr}</h3><div className="template-card-foot"><small>{pricing.pages} {en ? pricing.pages === 1 ? 'included page' : 'included pages' : pricing.pages === 1 ? 'صفحة مشمولة' : 'صفحات مشمولة'}</small><span>{onSelect ? selected === template.id ? <><Check size={15}/>{en ? 'Selected' : 'محدد'}</> : en ? 'Choose template' : 'اختر القالب' : <>{en ? 'View & start' : 'اعرض وابدأ'} <ArrowLeft size={15}/></>}</span></div></div></>;
    return onSelect ? <button type="button" key={template.id} className={`template-card${selected === template.id ? ' selected' : ''}`} onClick={() => onSelect(template.id)} aria-pressed={selected === template.id}>{content}</button> : <Link key={template.id} className="template-card" href={`/templates/${template.id}`}>{content}</Link>;
  })}</div>;
}
