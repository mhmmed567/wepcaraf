export type ProductStatus = 'draft' | 'active' | 'archived';
export type CommerceVariant = {
  id: string; project_id: string; product_id: string; title: string; options: Record<string, string>;
  sku: string | null; barcode: string; price_minor: number; compare_price_minor: number | null; cost_minor: number | null;
  stock_on_hand: number; stock_reserved: number; sold_count: number; low_stock_threshold: number; image_url: string; active: boolean;
  created_at: string; updated_at: string;
};
export type CommerceProduct = {
  id: string; project_id: string; name: string; description: string; image_url: string; category: string; brand: string;
  tags: string[]; status: ProductStatus; seo_title: string; seo_description: string; created_at: string; updated_at: string;
  commerce_variants: CommerceVariant[];
};
export type ProductInput = {
  name: string; description: string; image_url: string; category: string; brand: string; tags: string[];
  status: ProductStatus; seo_title: string; seo_description: string;
  variants: Array<{ id?: string; title: string; options: Record<string, string>; sku: string; barcode: string;
    price_minor: number; compare_price_minor: number | null; cost_minor: number | null; stock_on_hand?: number;
    low_stock_threshold: number; image_url: string }>;
};
export const formatMoney = (minor: number, en: boolean) => new Intl.NumberFormat(en ? 'en-OM' : 'ar-OM', { style: 'currency', currency: 'OMR' }).format(minor / 1000);
