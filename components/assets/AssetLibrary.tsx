'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, Code2, Copy, Globe2, Layers3, MonitorPlay } from 'lucide-react';
import { AssetPreview } from './AssetPreview';
import type { AssetCategory, DeveloperAsset } from '@/lib/developer-assets';
import { useLanguage } from '@/hooks/useLanguage';

const categories: { id: AssetCategory | 'all'; ar: string; en: string }[] = [
  { id: 'all', ar: 'الكل', en: 'All' }, { id: 'template', ar: 'قوالب', en: 'Templates' },
  { id: 'button', ar: 'أزرار', en: 'Buttons' }, { id: 'component', ar: 'مكونات', en: 'Components' },
  { id: 'script', ar: 'سكربتات', en: 'Scripts' },
];

export function AssetLibrary() {
  const { language, en, changeLanguage } = useLanguage();
  const [assets, setAssets] = useState<DeveloperAsset[]>([]);
  const [category, setCategory] = useState<AssetCategory | 'all'>('all');
  const [active, setActive] = useState<DeveloperAsset | null>(null);
  const [tab, setTab] = useState<'html' | 'css' | 'js' | 'nextCode'>('html');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => { void fetch('/api/assets', { cache: 'no-store' }).then(async response => {
    const data = await response.json();
    if (!response.ok) throw Error(data.error);
    setAssets(data.assets);
  }).catch(caught => setError(caught instanceof Error ? caught.message : String(caught))).finally(() => setLoading(false)); }, []);

  async function copyCode() {
    if (!active) return;
    await navigator.clipboard.writeText(active[tab]);
    setCopied(true); setTimeout(() => setCopied(false), 1800);
  }

  const visible = assets.filter(asset => category === 'all' || asset.category === category);
  return <div className="workspace-page" dir={en ? 'ltr' : 'rtl'} lang={language}>
    <header className="workspace-header"><Link className="builder-logo" href="/">WEB<span>CRAFT</span><i/></Link><div><Link href="/account">{en ? 'My account' : 'حسابي'}</Link><button type="button" onClick={() => changeLanguage(en ? 'ar' : 'en')}><Globe2 size={16}/>{en ? 'AR' : 'EN'}</button></div></header>
    <main className="workspace-main"><div className="workspace-title"><span className="eyebrow">WEBCRAFT / CODE LIBRARY</span><h1>{en ? 'Templates & code library' : 'مكتبة القوالب والأكواد'}</h1><p>{en ? 'Ready-made layouts, buttons, components and scripts. Prices are starting implementation estimates.' : 'قوالب وأزرار ومكونات وسكربتات جاهزة. الأسعار تقديرات ابتدائية للتنفيذ.'}</p><small className="library-credit">{en ? <>Selected component ideas are adapted for WEBCRAFT from <a href="https://github.com/bidyut10/opensourceui" target="_blank" rel="noreferrer">OpenSourceUI</a> (MIT).</> : <>استُلهمت بعض المكونات وأُعيد تكييفها لـ WEBCRAFT من مكتبة <a href="https://github.com/bidyut10/opensourceui" target="_blank" rel="noreferrer">OpenSourceUI</a> المرخّصة MIT.</>}</small></div>
      <div className="asset-filters" role="group" aria-label={en ? 'Filter assets' : 'تصفية العناصر'}>{categories.map(item => <button type="button" key={item.id} className={category === item.id ? 'active' : ''} onClick={() => setCategory(item.id)}>{en ? item.en : item.ar}</button>)}</div>
      {loading ? <div className="workspace-panel">{en ? 'Loading library…' : 'جاري تحميل المكتبة...'}</div> : error ? <p className="form-error" role="alert">{error}</p> : visible.length === 0 ? <div className="workspace-panel workspace-empty"><Layers3 size={32}/><h2>{en ? 'No items in this category yet' : 'لا توجد عناصر في هذا القسم بعد'}</h2><p>{en ? 'New items will appear here when the site administrator publishes them.' : 'ستظهر العناصر هنا عندما ينشرها مسؤول الموقع.'}</p></div> : <div className="asset-grid">{visible.map(asset => <article className="asset-card" key={asset.id}><div className="asset-card-preview"><AssetPreview asset={asset} title={asset.title} /></div><div className="asset-card-body"><div className="asset-tags"><span>{categories.find(item => item.id === asset.category)?.[en ? 'en' : 'ar']}</span><span>{asset.framework === 'nextjs' ? 'Next.js' : 'HTML / CSS / JS'}</span></div><h2>{en && asset.titleEn ? asset.titleEn : asset.title}</h2><p>{en && asset.descriptionEn ? asset.descriptionEn : asset.description}</p><div className="asset-card-bottom"><strong>{asset.price === 0 ? en ? 'Free' : 'مجاني' : `${asset.price.toLocaleString(en ? 'en' : 'ar')} OMR`}</strong><button type="button" onClick={() => { setActive(asset); setTab(asset.framework === 'nextjs' ? 'nextCode' : 'html'); }}><MonitorPlay size={17}/>{en ? 'Preview & code' : 'المعاينة والكود'} <ArrowLeft size={16}/></button></div></div></article>)}</div>}
    </main>
    {active && <div className="asset-modal-backdrop" role="presentation" onMouseDown={() => setActive(null)}><section className="asset-modal" role="dialog" aria-modal="true" aria-label={active.title} onMouseDown={event => event.stopPropagation()}><header><div><span className="eyebrow">WEBCRAFT / PREVIEW</span><h2>{en && active.titleEn ? active.titleEn : active.title}</h2></div><button type="button" onClick={() => setActive(null)} aria-label={en ? 'Close' : 'إغلاق'}>×</button></header><div className="asset-modal-preview"><AssetPreview asset={active} title={active.title}/></div><div className="asset-code-bar"><div>{(['html', 'css', 'js', 'nextCode'] as const).filter(key => key !== 'nextCode' || active.framework === 'nextjs').map(key => <button type="button" className={tab === key ? 'active' : ''} key={key} onClick={() => setTab(key)}>{key === 'nextCode' ? 'Next.js' : key.toUpperCase()}</button>)}</div><button type="button" onClick={copyCode}><Copy size={15}/>{copied ? en ? 'Copied' : 'تم النسخ' : en ? 'Copy' : 'نسخ'}</button></div><pre className="asset-code"><code>{active[tab] || (en ? 'No code added' : 'لم يُضف كود')}</code></pre>{active.framework === 'nextjs' && <p className="asset-help"><Code2 size={15}/>{en ? 'Next.js source is shown for copying. The live preview uses the optional HTML/CSS/JS preview supplied by the administrator.' : 'كود Next.js متاح للنسخ. تستخدم المعاينة المباشرة HTML/CSS/JS الذي يضيفه المسؤول لهذا العنصر.'}</p>}</section></div>}
  </div>;
}
