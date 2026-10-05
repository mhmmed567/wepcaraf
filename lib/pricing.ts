import type { Design } from '@/types/design';

export type Language = 'ar' | 'en';
export const currency = 'OMR';

export const sitePricing = {
  'Landing Page': { price: 120, pages: 1 },
  'موقع شخصي': { price: 180, pages: 3 },
  'خدمات': { price: 260, pages: 4 },
  'مطعم أو كوفي': { price: 280, pages: 4 },
  'موقع شركة': { price: 320, pages: 5 },
  'عيادة طبية': { price: 380, pages: 5 },
  'عقارات': { price: 430, pages: 5 },
  'منصة تعليمية': { price: 480, pages: 5 },
  'متجر إلكتروني': { price: 590, pages: 5 },
  'موقع مخصص': { price: 650, pages: 5 },
} as const;

export const siteTypeEnglish: Record<keyof typeof sitePricing, string> = {
  'Landing Page': 'Landing page',
  'موقع شخصي': 'Portfolio',
  'خدمات': 'Services website',
  'مطعم أو كوفي': 'Restaurant or cafe',
  'موقع شركة': 'Company website',
  'عيادة طبية': 'Medical clinic',
  'عقارات': 'Real estate',
  'منصة تعليمية': 'Learning platform',
  'متجر إلكتروني': 'Online store',
  'موقع مخصص': 'Custom website',
};

export const addOnPricing = {
  extraPage: 30,
  blog: 80,
  booking: 120,
  catalog: 240,
  bilingual: 150,
  content: 60,
  hostingYear: 70,
  careMonth: 25,
} as const;

export const templateDefinitions = [
  { id: 'launch', siteType: 'Landing Page', nameAr: 'انطلاقة', nameEn: 'Launch', descriptionAr: 'صفحة واحدة لعرض فكرة أو حملة بوضوح.', descriptionEn: 'A focused page for a product or campaign.', palette: 'purple', hero: 0, nav: 5, footer: 0, accent: '#9a7ae4' },
  { id: 'folio', siteType: 'موقع شخصي', nameAr: 'بصمة', nameEn: 'Folio', descriptionAr: 'ملف شخصي أنيق للأعمال والإنجازات.', descriptionEn: 'A refined portfolio for your work and story.', palette: 'beige', hero: 6, nav: 13, footer: 8, accent: '#b49774' },
  { id: 'cafe', siteType: 'مطعم أو كوفي', nameAr: 'مذاق', nameEn: 'Taste', descriptionAr: 'قائمة وقصة المكان مع دعوة للحجز.', descriptionEn: 'Menu, atmosphere, and a clear booking path.', palette: 'green', hero: 2, nav: 3, footer: 2, accent: '#6a9a7e' },
  { id: 'studio', siteType: 'موقع شركة', nameAr: 'استوديو', nameEn: 'Studio', descriptionAr: 'حضور مؤسسي للخدمات وفريق العمل.', descriptionEn: 'A confident company site for services and team.', palette: 'navy', hero: 1, nav: 0, footer: 5, accent: '#6891c1' },
  { id: 'care', siteType: 'عيادة طبية', nameAr: 'رعاية', nameEn: 'Care', descriptionAr: 'خدمات العيادة والفريق ومسار المواعيد.', descriptionEn: 'Clinic services, people, and appointment path.', palette: 'blue', hero: 4, nav: 2, footer: 1, accent: '#729bf1' },
  { id: 'market', siteType: 'متجر إلكتروني', nameAr: 'سوق', nameEn: 'Market', descriptionAr: 'واجهة منتجات مصممة للبيع والاستكشاف.', descriptionEn: 'A product-led storefront built for discovery.', palette: 'luxury', hero: 7, nav: 8, footer: 2, accent: '#c2ae8f' },
] as const;

export type TemplateId = typeof templateDefinitions[number]['id'];

export function formatPrice(value: number, language: Language = 'ar') {
  return `${new Intl.NumberFormat(language === 'ar' ? 'ar-OM' : 'en-OM', { maximumFractionDigits: 0 }).format(value)} ${currency}`;
}

export function estimateDesign(design: Design) {
  const base = sitePricing[design.siteType as keyof typeof sitePricing] ?? sitePricing['موقع مخصص'];
  const lines: { id: string; amount: number; ar: string; en: string }[] = [
    { id: 'base', amount: base.price, ar: 'القالب وتنفيذ الموقع', en: 'Template and website build' },
  ];
  const extraPages = Math.max(0, design.pages.length - base.pages);
  if (extraPages) lines.push({ id: 'pages', amount: extraPages * addOnPricing.extraPage, ar: `${extraPages} صفحات إضافية`, en: `${extraPages} extra pages` });
  const kinds = new Set(design.sections.filter(section => section.visible).map(section => section.kind));
  if (kinds.has('مدونة')) lines.push({ id: 'blog', amount: addOnPricing.blog, ar: 'مدونة', en: 'Blog' });
  if (kinds.has('حجز موعد') && !['مطعم أو كوفي', 'عيادة طبية'].includes(design.siteType)) lines.push({ id: 'booking', amount: addOnPricing.booking, ar: 'نظام حجز', en: 'Booking module' });
  if ((kinds.has('شبكة منتجات') || kinds.has('عرض منتج')) && design.siteType !== 'متجر إلكتروني' && design.siteType !== 'منصة تعليمية') lines.push({ id: 'catalog', amount: addOnPricing.catalog, ar: 'كتالوج منتجات', en: 'Product catalog' });
  return { lines, total: lines.reduce((sum, line) => sum + line.amount, 0), includedPages: base.pages };
}
