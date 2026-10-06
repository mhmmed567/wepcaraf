'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { AssetPreview } from './AssetPreview';
import type { DeveloperAsset } from '@/lib/developer-assets';
import type { Language } from '@/lib/pricing';

export function FeaturedAssets({ language }: { language: Language }) {
  const [assets, setAssets] = useState<DeveloperAsset[]>([]);
  useEffect(() => { void fetch('/api/assets', { cache: 'no-store' }).then(response => response.ok ? response.json() : null).then(data => setAssets((data?.assets || []).slice(0, 3))).catch(() => {}); }, []);
  if (!assets.length) return null;
  const en = language === 'en';
  return <section className="featured-assets"><div className="templates-intro"><div><span className="section-label">WEBCRAFT / CODE LIBRARY</span><h2>{en ? 'More ready-made ideas.' : 'أفكار جاهزة أكثر.'}</h2><p>{en ? 'Browse code templates, buttons and scripts with live previews.' : 'تصفح قوالب وأزرارًا وسكربتات مع معاينة مباشرة وسعر واضح.'}</p></div><Link href="/library">{en ? 'Open library' : 'افتح المكتبة'} <ArrowLeft size={17}/></Link></div><div className="asset-grid">{assets.map(asset => <article className="asset-card" key={asset.id}><div className="asset-card-preview"><AssetPreview asset={asset} title={asset.title}/></div><div className="asset-card-body"><div className="asset-tags"><span>{asset.framework === 'nextjs' ? 'Next.js' : 'HTML / CSS / JS'}</span></div><h2>{en && asset.titleEn ? asset.titleEn : asset.title}</h2><p>{en && asset.descriptionEn ? asset.descriptionEn : asset.description}</p><div className="asset-card-bottom"><strong>{asset.price === 0 ? en ? 'Free' : 'مجاني' : `${asset.price.toLocaleString(en ? 'en' : 'ar')} OMR`}</strong><Link href="/library">{en ? 'View code' : 'عرض الكود'} <ArrowLeft size={16}/></Link></div></div></article>)}</div></section>;
}
