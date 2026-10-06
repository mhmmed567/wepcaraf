import { VisualProjectEditor } from '@/components/builder/VisualProjectEditor';

export const metadata = { title: 'المحرر | WEBCRAFT', robots: { index: false, follow: false } };
export default async function ProjectBuilderPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <VisualProjectEditor id={id}/>; }
