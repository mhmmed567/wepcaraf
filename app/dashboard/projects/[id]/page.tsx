import { ProjectWorkspace } from '@/components/dashboard/ProjectWorkspace';

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <ProjectWorkspace id={id}/>; }
