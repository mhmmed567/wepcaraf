import type { Metadata } from 'next';
import { AssetLibrary } from '@/components/assets/AssetLibrary';

export const metadata: Metadata = { title: 'مكتبة القوالب والأكواد | WEBCRAFT', description: 'قوالب وأزرار ومكونات وسكربتات جاهزة مع معاينة وأسعار واضحة.' };
export default function LibraryPage() { return <AssetLibrary />; }
