'use client';
import { useState } from 'react';
import { ArrowLeft, Menu } from 'lucide-react';
import type { Design, Section } from '@/types/design';
import { SectionContent } from './SectionContent';
import { navNames, footerNames, sectionKindEnglish } from '@/lib/catalog';
import { siteTypeEnglish } from '@/lib/pricing';

export const demoImages = [
 '/preview/store-hero.svg',
 '/preview/product-one.svg',
 '/preview/product-two.svg',
 '/preview/product-three.svg'
];
const siteImages:Record<string,string>={
 'متجر إلكتروني':demoImages[0],
 'موقع شركة':demoImages[2],
 'موقع شخصي':demoImages[1],
 'مطعم أو كوفي':demoImages[3],
 'عيادة طبية':demoImages[2],
 'منصة تعليمية':demoImages[1],
 'عقارات':demoImages[3],
 'خدمات':demoImages[2],
 'Landing Page':demoImages[2],
 'موقع مخصص':demoImages[3]
};
function Nav({d}:{d:Design}) {const [open,setOpen]=useState(false);const n=d.navbar;const en=d.locale==='en';return <header className={`sample-nav nav-${n}`} data-name={navNames[n]}><div className="sample-nav-inner"><button className="sample-menu" onClick={()=>setOpen(!open)} aria-label={en?'Menu':'القائمة'}><Menu size={17}/></button><strong>{d.projectName || (en?'Your brand':'اسم مشروعك')}<span className="brand-dot">.</span></strong><nav className={open?'open':''}><a href="#preview-about">{en?'Home':'الرئيسية'}</a><a href="#preview-about">{en?'About':'من نحن'}</a><a href="#preview-services">{en?'Services':'الخدمات'}</a><a href="#preview-contact">{en?'Contact':'تواصل معنا'}</a></nav><a className="sample-nav-cta" href="#preview-contact">{en?'Contact us':'تواصل معنا'} <ArrowLeft size={13}/></a></div></header>}
function Hero({d}:{d:Design}) {const h=d.hero;const en=d.locale==='en';const image=d.heroImage||siteImages[d.siteType]||demoImages[h%demoImages.length];return <section className={`sample-hero hero-${h}`}><div className="sample-hero-copy"><div className="sample-eyebrow"><span/> {en?(siteTypeEnglish[d.siteType as keyof typeof siteTypeEnglish]||d.siteType):d.siteType} • {en?'A distinct experience':'تجربة استثنائية'}</div><h1>{d.heroTitle}</h1><p>{d.heroBody}</p><div className="sample-actions"><a className={`sample-button button-${d.buttonStyle}`} href="#preview-services">{d.buttonLabel} <ArrowLeft size={14}/></a><a className="sample-link" href="#preview-about">{en?'Learn more':'اعرف المزيد'} <ArrowLeft size={13}/></a></div><div className="sample-proof"><span className="sample-avatars">✦ &nbsp; ✦ &nbsp; ✦</span><span>{en?'Made to inspire':'تجربة مصممة لتلهمك'}</span></div></div><div className="sample-hero-visual"><img src={image} alt={en?'Sample design image':'صورة تجريبية للتصميم'}/><div className="sample-image-note"><span>{en?'Selected collection':'مجموعة مختارة'}</span><b>01 / 04</b></div></div></section>}
function SectionView({s,d,index}:{s:Section;d:Design;index:number}) {return <section id={index===0?'preview-about':'preview-services'} className={`sample-section section-variant-${s.variant%4} sample-card-${d.cardStyle}`}><div className="section-intro"><span className="sample-kicker">{String(index+1).padStart(2,'0')} / {d.locale==='en'?(sectionKindEnglish[s.kind]||s.kind):s.kind}</span><h2>{s.title}</h2><p>{s.body}</p></div><SectionContent s={s} index={index} locale={d.locale} siteType={d.siteType}/></section>}
function Footer({d}:{d:Design}) {const en=d.locale==='en';return <footer id="preview-contact" className={`sample-footer footer-${d.footer}`} data-name={footerNames[d.footer]}><div><strong>{d.projectName || (en?'Your brand':'اسم مشروعك')}<span className="brand-dot">.</span></strong><p>{d.footerTagline|| (en?'Experiences to remember.':'نصنع تجارب تبقى في الذاكرة.')}</p>{d.contactEmail&&<p>{d.contactEmail}</p>}{d.contactPhone&&<p>{d.contactPhone}</p>}</div><div className="sample-footer-links">{d.pages.slice(0,4).map((page,i)=><a key={page+i} href={i===0?'#preview-about':i===d.pages.length-1?'#preview-contact':'#preview-services'}>{page}</a>)}</div><small>© 2026 {d.projectName || 'مشروعك'} — {en?'All rights reserved':'جميع الحقوق محفوظة'}</small></footer>}
export function Preview({design,compact=false}:{design:Design;compact?:boolean}) {const d=design;const style={'--sample-primary':d.palette.primary,'--sample-secondary':d.palette.secondary,'--sample-accent':d.palette.accent,'--sample-bg':d.palette.background,'--sample-text':d.palette.text,'--sample-radius':`${d.radius}px`,'--sample-shadow':`${d.shadow/100}`,fontFamily:`${d.font}, Cairo, Arial, sans-serif`,letterSpacing:`${d.letterSpacing}px`,'--heading-scale':d.headingScale,'--heading-weight':d.fontWeight} as React.CSSProperties;return <div className={`sample-site ${compact?'compact':''} motion-${d.motion}`} dir={d.locale==='ar'?'rtl':'ltr'} style={style}><Nav d={d}/><Hero d={d}/>{d.sections.filter(s=>s.visible).map((s,i)=><SectionView key={s.id} s={s} d={d} index={i}/>)}<Footer d={d}/></div>}
