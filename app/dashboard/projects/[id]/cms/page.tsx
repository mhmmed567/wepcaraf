import { CmsStudio } from '@/features/cms/components/CmsStudio';

export const metadata = { title: 'إدارة المحتوى | WEBCRAFT', robots: { index: false, follow: false } };
export default async function CmsPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <CmsStudio projectId={id}/>; }
