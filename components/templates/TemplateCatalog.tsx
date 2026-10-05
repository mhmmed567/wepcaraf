import Link from 'next/link';
import type { CSSProperties } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { formatPrice, sitePricing, templateDefinitions, type Language, type TemplateId } from '@/lib/pricing';

export function TemplateCatalog({ language, selected, onSelect }: { language: Language; selected?: TemplateId | null; onSelect?: (id: TemplateId) => void }) {
  const en = language === 'en';
  return <div className="template-grid">{templateDefinitions.map(template => {
    const pricing = sitePricing[template.siteType];
    const content = <><div className={`template-art art-${template.id}`} style={{ '--template-accent': template.accent } as CSSProperties}><div className="template-window"><div className="template-window-top"><i/><i/><i/></div><div className="template-window-nav"><b/><span/><span/><span/></div><div className="template-window-hero"><div><strong/><small/><small/><em/></div><aside/></div><div className="template-window-tiles"><i/><i/><i/></div></div></div><div className="template-card-body"><div className="template-card-top"><span>{en ? template.nameEn : template.nameAr}</span><strong dir="ltr">{formatPrice(pricing.price, language)}</strong></div><h3>{en ? template.descriptionEn : template.descriptionAr}</h3><div className="template-card-foot"><small>{pricing.pages} {en ? pricing.pages === 1 ? 'included page' : 'included pages' : pricing.pages === 1 ? 'صفحة مشمولة' : 'صفحات مشمولة'}</small><span>{onSelect ? selected === template.id ? <><Check size={15}/>{en ? 'Selected' : 'محدد'}</> : en ? 'Choose template' : 'اختر القالب' : <>{en ? 'View & start' : 'اعرض وابدأ'} <ArrowLeft size={15}/></>}</span></div></div></>;
    return onSelect ? <button type="button" key={template.id} className={`template-card${selected === template.id ? ' selected' : ''}`} onClick={() => onSelect(template.id)} aria-pressed={selected === template.id}>{content}</button> : <Link key={template.id} className="template-card" href={`/templates/${template.id}`}>{content}</Link>;
  })}</div>;
}
