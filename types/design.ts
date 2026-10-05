export type Locale = 'ar' | 'en';
export type Palette = { id: string; name: string; primary: string; secondary: string; accent: string; background: string; text: string };
export type Section = { id: string; kind: string; variant: number; title: string; body: string; image?: string; visible: boolean };
export type DesignStyle = 'minimal' | 'luxury' | 'modern' | 'corporate' | 'glass' | 'dark' | 'bold' | 'editorial' | 'future' | 'creative';
export type DesignFeature = 'whatsapp' | 'contactForm' | 'booking' | 'payments' | 'ecommerce' | 'login' | 'dashboard' | 'multilingual' | 'seo' | 'maps' | 'chat' | 'blog' | 'analytics' | 'email';
export type NavbarSettings = { sticky: boolean; transparent: boolean; showCta: boolean; showLanguageSwitcher: boolean };
export type Design = { version: 1; projectName: string; siteType: string; locale: Locale; palette: Palette; style: DesignStyle; font: string; headingScale: number; fontWeight: number; letterSpacing: number; navbar: number; navbarSettings: NavbarSettings; navCta: string; logoImage: string; hero: number; heroTitle: string; heroBody: string; heroImage: string; buttonLabel: string; sections: Section[]; features: DesignFeature[]; buttonStyle: string; cardStyle: string; radius: number; shadow: number; footer: number; footerTagline?: string; contactEmail?: string; contactPhone?: string; motion: string; pages: string[] };
