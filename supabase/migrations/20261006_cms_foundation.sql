-- Project-scoped content collections and entries for WEBCRAFT CMS.
create table if not exists public.cms_collections (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  slug text not null check (slug ~ '^[a-z][a-z0-9-]{1,59}$'),
  fields jsonb not null default '[]'::jsonb check (jsonb_typeof(fields) = 'array'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(project_id, slug),
  unique(id, project_id)
);
create index if not exists cms_collections_project_idx on public.cms_collections(project_id, created_at desc);

create table if not exists public.cms_entries (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  collection_id uuid not null,
  data jsonb not null default '{}'::jsonb check (jsonb_typeof(data) = 'object'),
  status text not null default 'draft' check (status in ('draft','published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key(collection_id, project_id) references public.cms_collections(id, project_id) on delete cascade
);
create index if not exists cms_entries_collection_idx on public.cms_entries(collection_id, created_at desc);
create index if not exists cms_entries_project_status_idx on public.cms_entries(project_id, status, created_at desc);

alter table public.cms_collections enable row level security;
alter table public.cms_entries enable row level security;
revoke all on public.cms_collections, public.cms_entries from anon, authenticated;
grant all on public.cms_collections, public.cms_entries to service_role;
