import { notFound } from 'next/navigation';
import { templateDefinitions } from '@/lib/pricing';
import { TemplatePreviewStudio } from '@/components/templates/TemplatePreviewStudio';

export function generateStaticParams() {
  return templateDefinitions.map(template => ({ id: template.id }));
}

export default async function TemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!templateDefinitions.some(template => template.id === id)) notFound();
  return <TemplatePreviewStudio id={id}/>;
}
