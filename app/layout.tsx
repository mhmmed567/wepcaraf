import type { Metadata } from 'next';
import './globals.css';
import './template-preview.css';
import './auth.css';
import './projects.css';
export const metadata:Metadata={title:'WEBCRAFT | صمّم موقعك كما تتخيله',description:'كتالوج تفاعلي لتصميم موقعك خطوة بخطوة مع معاينة مباشرة لكل اختيار.',openGraph:{title:'WEBCRAFT — صمّم موقعك كما تتخيله',description:'اختر الألوان والتنسيقات والأقسام وشاهد تصور موقعك قبل برمجته.'}};
const localFontCss = [
  ['light', '300'], ['regular', '400'], ['medium', '500 600'],
  ['bold', '700 800'], ['black', '900'],
].map(([weight,range])=>`@font-face{font-family:"thmanyah sans";src:url("/api/local-font/${weight}") format("opentype");font-style:normal;font-weight:${range};font-display:swap}`).join('\n');
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="ar" dir="rtl"><head>{process.env.NODE_ENV==='development'&&<style>{localFontCss}</style>}</head><body>{children}</body></html>}
