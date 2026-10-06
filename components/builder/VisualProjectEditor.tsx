'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useDashboardSession } from '@/components/dashboard/DashboardShell';
import { designSchema } from '@/lib/schemas/design';
import type { Design } from '@/types/design';
import { VisualBuilder } from './VisualBuilder';

type Project = { id: string; design: Design; revision: number };
export function VisualProjectEditor({ id }: { id: string }) {
  const { token, en } = useDashboardSession();
  const [project, setProject] = useState<Project | null>(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    void fetch(`/api/projects/${id}`, { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal, cache: 'no-store' })
      .then(async response => { const body = await response.json(); if (!response.ok) throw Error(body.error); const valid = designSchema.safeParse(body.project.design); if (!valid.success) throw Error('بيانات التصميم غير صالحة'); return { id: body.project.id, design: valid.data, revision: body.project.revision } as Project; })
      .then(setProject)
      .catch(caught => { if (!controller.signal.aborted) setError(caught instanceof Error ? caught.message : String(caught)); });
    return () => controller.abort();
  }, [id, token, retry]);
  if (error) return <div className="saas-error"><h1>{en ? 'Could not open the builder' : 'تعذر فتح المحرر'}</h1><p>{error}</p><button onClick={() => { setError(''); setRetry(value => value + 1); }}>{en ? 'Retry' : 'إعادة المحاولة'}</button><Link href={`/dashboard/projects/${id}`}>{en ? 'Back to project' : 'العودة إلى المشروع'}</Link></div>;
  if (!project) return <div className="saas-route-skeleton"><div className="saas-skeleton hero"/><div className="saas-skeleton cards"/></div>;
  return <VisualBuilder projectId={project.id} initialDesign={project.design} initialRevision={project.revision}/>;
}
