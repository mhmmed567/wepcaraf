export type AssetCategory = 'template' | 'button' | 'component' | 'script';
export type AssetFramework = 'html' | 'nextjs';

export type DeveloperAsset = {
  id: string;
  category: AssetCategory;
  framework: AssetFramework;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  price: number;
  published: boolean;
  html: string;
  css: string;
  js: string;
  nextCode: string;
};

// The iframe has a unique origin and no access to its parent, forms, popups or storage.
export function previewDocument(asset: Pick<DeveloperAsset, 'html' | 'css' | 'js'>) {
  const safeCss = asset.css.replace(/<\/style/gi, '<\\/style');
  const safeJs = asset.js.replace(/<\/script/gi, '<\\/script');
  return `<!doctype html><html lang="ar"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; font-src data:; connect-src 'none'; form-action 'none'; base-uri 'none'"><style>body{margin:0;min-height:100vh;font-family:system-ui,sans-serif;box-sizing:border-box}*,*:before,*:after{box-sizing:inherit}${safeCss}</style></head><body>${asset.html}<script>${safeJs}</script></body></html>`;
}
