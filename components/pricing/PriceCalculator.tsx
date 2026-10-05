'use client';
import { useMemo, useState } from 'react';
import { addOnPricing, formatPrice, sitePricing, siteTypeEnglish, type Language } from '@/lib/pricing';

type Option = 'blog' | 'booking' | 'catalog' | 'bilingual' | 'hostingYear' | 'careMonth';
const options: { id: Option; ar: string; en: string }[] = [
  { id: 'blog', ar: 'مدونة', en: 'Blog' },
  { id: 'booking', ar: 'نظام حجز', en: 'Booking module' },
  { id: 'catalog', ar: 'كتالوج منتجات', en: 'Product catalog' },
  { id: 'bilingual', ar: 'لغة ثانية', en: 'Second language' },
  { id: 'hostingYear', ar: 'استضافة سنوية', en: 'Annual hosting' },
  { id: 'careMonth', ar: 'صيانة شهرية', en: 'Monthly care' },
];

export function PriceCalculator({ language }: { language: Language }) {
  const en = language === 'en';
  const [siteType, setSiteType] = useState<keyof typeof sitePricing>('موقع شركة');
  const [extraPages, setExtraPages] = useState(0);
  const [contentPages, setContentPages] = useState(0);
  const [selected, setSelected] = useState<Option[]>([]);
  const base = sitePricing[siteType];
  const itemized = useMemo(() => {
    const items = [
      { key: 'base', ar: 'الموقع الأساسي', en: 'Base website', value: base.price },
      ...(extraPages ? [{ key: 'pages', ar: `صفحات إضافية × ${extraPages}`, en: `Extra pages × ${extraPages}`, value: extraPages * addOnPricing.extraPage }] : []),
      ...(contentPages ? [{ key: 'content', ar: `كتابة محتوى × ${contentPages}`, en: `Content writing × ${contentPages}`, value: contentPages * addOnPricing.content }] : []),
      ...options.filter(option => selected.includes(option.id) && !['hostingYear', 'careMonth'].includes(option.id)).map(option => ({ key: option.id, ar: option.ar, en: option.en, value: addOnPricing[option.id] })),
    ];
    return { items, total: items.reduce((sum, item) => sum + item.value, 0) };
  }, [base.price, extraPages, contentPages, selected]);

  function toggle(id: Option) { setSelected(current => current.includes(id) ? current.filter(value => value !== id) : [...current, id]); }

  return <div className="price-calculator"><div className="calculator-heading"><div><span>{en ? 'BUILD YOUR ESTIMATE' : 'احسب تكلفة مشروعك'}</span><h3>{en ? 'See your estimated price' : 'شاهد السعر التقديري'}</h3></div><strong dir="ltr">{formatPrice(itemized.total, language)}</strong></div><div className="calculator-body"><div className="calculator-controls"><label>{en ? 'Website type' : 'نوع الموقع'}<select value={siteType} onChange={event => setSiteType(event.target.value as keyof typeof sitePricing)}>{Object.keys(sitePricing).map(type => <option key={type} value={type}>{en ? siteTypeEnglish[type as keyof typeof sitePricing] : type}</option>)}</select></label><div className="calculator-number-grid"><label>{en ? 'Extra pages' : 'صفحات إضافية'}<input type="number" min="0" max="30" value={extraPages} onChange={event => setExtraPages(Math.max(0, Math.min(30, Number(event.target.value) || 0)))}/></label><label>{en ? 'Pages needing copy' : 'صفحات تحتاج كتابة محتوى'}<input type="number" min="0" max="30" value={contentPages} onChange={event => setContentPages(Math.max(0, Math.min(30, Number(event.target.value) || 0)))}/></label></div><div className="calculator-options">{options.map(option => <label key={option.id}><input type="checkbox" checked={selected.includes(option.id)} onChange={() => toggle(option.id)}/><span>{en ? option.en : option.ar}</span><small dir="ltr">+{formatPrice(addOnPricing[option.id], language)}</small></label>)}</div></div><div className="calculator-summary"><h4>{en ? 'Estimate breakdown' : 'تفصيل السعر'}</h4><p>{en ? `${base.pages} pages included in the base website` : `${base.pages} صفحات مشمولة في الموقع الأساسي`}</p>{itemized.items.map(item => <div key={item.key}><span>{en ? item.en : item.ar}</span><strong dir="ltr">{formatPrice(item.value, language)}</strong></div>)}<div className="calculator-total"><span>{en ? 'One-time estimate' : 'الإجمالي التقديري لمرة واحدة'}</span><strong dir="ltr">{formatPrice(itemized.total, language)}</strong></div>{selected.includes('hostingYear') && <div><span>{en ? 'Hosting / year' : 'الاستضافة / سنة'}</span><strong dir="ltr">{formatPrice(addOnPricing.hostingYear, language)}</strong></div>}{selected.includes('careMonth') && <div><span>{en ? 'Care / month' : 'الصيانة / شهر'}</span><strong dir="ltr">{formatPrice(addOnPricing.careMonth, language)}</strong></div>}<small>{en ? 'Recurring services are shown separately. Final pricing is confirmed after scope review.' : 'الخدمات المتكررة منفصلة عن إجمالي التنفيذ. يؤكَّد السعر النهائي بعد مراجعة النطاق.'}</small></div></div></div>;
}
