import { defaultDesign, palettes, siteProfiles } from '@/lib/catalog';
import { templateDefinitions, type TemplateId } from '@/lib/pricing';
import type { Design, Locale } from '@/types/design';

const englishProfiles: Record<TemplateId, { heroTitle: string; heroBody: string; button: string; sections: [string, string, string][]; pages: string[] }> = {
  launch: { heroTitle: 'One idea. Real impact.', heroBody: 'A clear experience that guides visitors to the next step.', button: 'Get started', sections: [['مميزات', 'Why choose us', 'The essentials, presented with clarity.'], ['أسعار', 'Choose your plan', 'Simple options that fit your goals.'], ['أسئلة شائعة', 'Questions answered', 'Everything you need to know before you begin.']], pages: ['Home'] },
  folio: { heroTitle: 'Hello, this is my space.', heroBody: 'Selected work, ideas, and the stories behind them.', button: 'Explore my work', sections: [['نبذة عنا', 'About me', 'A short introduction to my journey.'], ['معرض أعمال', 'Selected work', 'Projects shaped by curiosity and care.'], ['تواصل', 'Get in touch', 'Let us make something meaningful.']], pages: ['Home', 'Work', 'Contact'] },
  cafe: { heroTitle: 'A taste worth sharing.', heroBody: 'Thoughtful flavors and a welcoming place for every visit.', button: 'Explore the menu', sections: [['قصة العلامة', 'Our story', 'Made with care, served with warmth.'], ['معرض صور', 'From our kitchen', 'A closer look at what we love.'], ['حجز موعد', 'Reserve a table', 'Plan your next visit with us.']], pages: ['Home', 'Menu', 'About', 'Booking'] },
  studio: { heroTitle: 'Bold ideas. Real results.', heroBody: 'We turn challenges into practical solutions for ambitious teams.', button: 'Our services', sections: [['نبذة عنا', 'About us', 'A partner you can build with.'], ['خدمات', 'What we do', 'Services designed around your goals.'], ['إحصائيات', 'Our impact', 'The work behind the numbers.']], pages: ['Home', 'About', 'Services', 'Work', 'Contact'] },
  care: { heroTitle: 'Care that puts you first.', heroBody: 'Expert people and a reassuring experience at every step.', button: 'Book a visit', sections: [['خدمات', 'Our services', 'Thoughtful care for your needs.'], ['فريق العمل', 'Meet the team', 'Experienced professionals here to help.'], ['حجز موعد', 'Book an appointment', 'Choose a time that works for you.']], pages: ['Home', 'About', 'Services', 'Team', 'Contact'] },
  market: { heroTitle: 'Details make the difference.', heroBody: 'Explore a carefully selected collection for everyday moments.', button: 'Shop the collection', sections: [['مميزات', 'Why the details matter', 'Quality in every choice.'], ['شبكة منتجات', 'Discover the collection', 'Products selected with care.'], ['آراء العملاء', 'What customers say', 'Real stories from our community.']], pages: ['Home', 'Shop', 'About', 'FAQ', 'Contact'] },
};

const extraEnglishProfiles: Record<string, { heroTitle: string; heroBody: string; button: string; sections: [string, string, string][] }> = {
  'موقع حجوزات': { heroTitle: 'Book your time with ease.', heroBody: 'Choose a time that works for you and receive a quick confirmation.', button: 'Book now', sections: [['خدمات', 'Our services', 'Find the right option for your needs.'], ['حجز موعد', 'Available appointments', 'Choose a time that suits you.'], ['تواصل', 'Need help?', 'We are happy to help.']] },
  'خدمات': { heroTitle: 'Solutions that move you forward.', heroBody: 'Practical services shaped around your goals.', button: 'Explore services', sections: [['خدمات', 'What we offer', 'Services designed for your needs.'], ['خطوات العمل', 'How we work', 'A clear process from start to finish.'], ['آراء العملاء', 'Client stories', 'What our clients say.']] },
  'منصة تعليمية': { heroTitle: 'Your next step starts here.', heroBody: 'Learn new skills at a pace that works for you.', button: 'Explore courses', sections: [['مميزات', 'Learn differently', 'Flexible paths for curious minds.'], ['شبكة منتجات', 'Learning paths', 'Choose a course that fits your goals.'], ['آراء العملاء', 'Learner stories', 'Real progress from real people.']] },
  'عقارات': { heroTitle: 'Find a place to belong.', heroBody: 'Explore carefully selected properties in the right locations.', button: 'Browse properties', sections: [['شبكة منتجات', 'Featured properties', 'Discover places worth seeing.'], ['خدمات', 'Our services', 'Guidance at every step.'], ['تواصل', 'Speak to an advisor', 'We are here to help.']] },
  'موقع مخصص': { heroTitle: 'A new space for your ideas.', heroBody: 'A flexible digital experience shaped around what you need.', button: 'Contact us', sections: [['نبذة عنا', 'About the project', 'A fresh start for your idea.'], ['خدمات', 'What we offer', 'Solutions for your goals.'], ['تواصل', 'Let us talk', 'Tell us what you need.']] },
};

export function profileForLocale(siteType: string, locale: Locale) {
  const arabic = siteProfiles[siteType] ?? siteProfiles['موقع مخصص'];
  if (locale === 'ar') return { title: arabic.title, body: arabic.body, button: arabic.button, sections: arabic.sections.map(([kind, title]) => [kind, title, arabic.body] as [string, string, string]) };
  const template = templateDefinitions.find(entry => entry.siteType === siteType);
  const english = template ? englishProfiles[template.id] : extraEnglishProfiles[siteType] ?? extraEnglishProfiles['موقع مخصص'];
  return { title: english.heroTitle, body: english.heroBody, button: english.button, sections: english.sections };
}

export function localizeDesignDefaults(design: Design, locale: Locale): Design {
  if (design.locale === locale) return design;
  const before = profileForLocale(design.siteType, design.locale);
  const after = profileForLocale(design.siteType, locale);
  const sections = design.sections.map(section => {
    const from = before.sections.find(entry => entry[0] === section.kind);
    const to = after.sections.find(entry => entry[0] === section.kind);
    if (!from || !to) return section;
    return { ...section, title: section.title === from[1] ? to[1] : section.title, body: section.body === from[2] ? to[2] : section.body };
  });
  const template = templateDefinitions.find(entry => entry.siteType === design.siteType);
  const sourceTemplate = template && designFromTemplate(template.id, design.projectName, design.locale);
  const targetTemplate = template && designFromTemplate(template.id, design.projectName, locale);
  const sourcePages = sourceTemplate?.pages ?? (design.siteType === 'موقع مخصص' ? blankDesign(design.projectName, design.locale).pages : null);
  const targetPages = targetTemplate?.pages ?? (design.siteType === 'موقع مخصص' ? blankDesign(design.projectName, locale).pages : null);
  const pages = sourcePages && targetPages && JSON.stringify(design.pages) === JSON.stringify(sourcePages) ? targetPages : design.pages;
  return { ...design, locale, navCta: design.navCta === (design.locale === 'ar' ? 'تواصل معنا' : 'Contact us') ? locale === 'ar' ? 'تواصل معنا' : 'Contact us' : design.navCta, heroTitle: design.heroTitle === before.title ? after.title : design.heroTitle, heroBody: design.heroBody === before.body ? after.body : design.heroBody, buttonLabel: design.buttonLabel === before.button ? after.button : design.buttonLabel, sections, pages, footerTagline: design.footerTagline === 'صُمم بعناية لما يهمك.' || design.footerTagline === 'Made with care for what matters.' ? locale === 'en' ? 'Made with care for what matters.' : 'صُمم بعناية لما يهمك.' : design.footerTagline };
}

const arabicPages: Record<TemplateId, string[]> = {
  launch: ['الرئيسية'], folio: ['الرئيسية', 'الأعمال', 'تواصل'], cafe: ['الرئيسية', 'القائمة', 'من نحن', 'الحجز'], studio: ['الرئيسية', 'من نحن', 'الخدمات', 'الأعمال', 'تواصل'], care: ['الرئيسية', 'من نحن', 'الخدمات', 'الفريق', 'تواصل'], market: ['الرئيسية', 'المنتجات', 'من نحن', 'أسئلة شائعة', 'تواصل'],
};

export function designFromTemplate(id: string, title: string, locale: Locale): Design | null {
  const template = templateDefinitions.find(entry => entry.id === id);
  if (!template) return null;
  const profile = siteProfiles[template.siteType];
  const english = englishProfiles[template.id];
  const palette = palettes.find(entry => entry.id === template.palette) ?? palettes[0];
  return {
    ...defaultDesign,
    projectName: title,
    siteType: template.siteType,
    locale,
    palette,
    hero: template.hero,
    navbar: template.nav,
    footer: template.footer,
    heroTitle: locale === 'en' ? english.heroTitle : profile.title,
    heroBody: locale === 'en' ? english.heroBody : profile.body,
    buttonLabel: locale === 'en' ? english.button : profile.button,
    sections: locale === 'en'
      ? english.sections.map(([kind, sectionTitle, body], index) => ({ id: `${template.id}-${index}`, kind, variant: index % 4, title: sectionTitle, body, visible: true }))
      : profile.sections.map(([kind, sectionTitle], index) => ({ id: `${template.id}-${index}`, kind, variant: index % 4, title: sectionTitle, body: profile.body, visible: true })),
    pages: locale === 'en' ? english.pages : arabicPages[template.id],
    footerTagline: locale === 'en' ? 'Made with care for what matters.' : 'صُمم بعناية لما يهمك.',
  };
}

export function blankDesign(title: string, locale: Locale): Design {
  const profile = siteProfiles['موقع مخصص'];
  return {
    ...defaultDesign,
    projectName: title,
    siteType: 'موقع مخصص',
    locale,
    heroTitle: locale === 'en' ? 'A new space for your ideas.' : profile.title,
    heroBody: locale === 'en' ? 'A flexible digital experience shaped around what you need.' : profile.body,
    buttonLabel: locale === 'en' ? 'Contact us' : profile.button,
    sections: [],
    pages: locale === 'en' ? ['Home'] : ['الرئيسية'],
    footerTagline: locale === 'en' ? 'Made for what matters.' : 'صُمم لما يهمك.',
  };
}
