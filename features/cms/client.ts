import type { CmsCollection, CmsEntry } from './types';

export async function cmsRequest<T>(token: string, url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, ...(init?.body ? { 'Content-Type': 'application/json' } : {}), ...init?.headers },
    cache: 'no-store',
  });
  const body = await response.json();
  if (!response.ok) throw Error(body.error || 'تعذر إكمال العملية');
  return body as T;
}

export type CollectionsResponse = { collections: CmsCollection[] };
export type EntriesResponse = { entries: CmsEntry[]; total: number; nextPage: number | null };
