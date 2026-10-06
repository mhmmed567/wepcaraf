'use client';

import { previewDocument, type DeveloperAsset } from '@/lib/developer-assets';

export function AssetPreview({ asset, title = 'معاينة التصميم' }: { asset: DeveloperAsset; title?: string }) {
  if (!asset.html.trim()) return <div className="asset-no-preview">معاينة HTML غير مضافة بعد. يمكن عرض كود Next.js ونسخه من صفحة العنصر.</div>;
  return <iframe title={title} className="asset-iframe" sandbox="allow-scripts" referrerPolicy="no-referrer" srcDoc={previewDocument(asset)} />;
}
