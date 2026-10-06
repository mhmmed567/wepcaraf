import { CommerceStudio } from '@/features/commerce/components/CommerceStudio';

export const metadata = { title: 'إدارة المتجر | WEBCRAFT', robots: { index: false, follow: false } };
export default async function CommercePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CommerceStudio projectId={id}/>;
}
