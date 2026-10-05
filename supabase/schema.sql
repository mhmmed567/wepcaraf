-- Run once in the Supabase SQL Editor. All application data is accessed by
-- the Next.js server using a server-only secret key; browsers use Auth only.
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  owner_email text not null,
  title text not null check (char_length(title) between 1 and 160),
  design jsonb not null,
  revision integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists projects_owner_idx on public.projects(owner_id, updated_at desc);
create table if not exists public.project_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'editor' check (role = 'editor'),
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);
create index if not exists project_members_user_idx on public.project_members(user_id);
create table if not exists public.designs (
  id text primary key,
  design jsonb not null,
  schema_version integer not null default 1,
  created_at timestamptz not null default now()
);
create table if not exists public.requests (
  id text primary key references public.designs(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete restrict,
  client_id uuid not null references auth.users(id) on delete restrict,
  contact jsonb not null,
  status text not null default 'new' check (status in ('new','in_progress','completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Existing WEBCRAFT installations may already have requests without project ownership.
-- Legacy rows remain readable by admins; every new request includes both IDs.
alter table public.requests add column if not exists project_id uuid references public.projects(id) on delete restrict;
alter table public.requests add column if not exists client_id uuid references auth.users(id) on delete restrict;
create index if not exists requests_created_at_idx on public.requests(created_at desc);
create table if not exists public.shares (
  token text primary key,
  design jsonb not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create table if not exists public.catalog_components (
  id text primary key,
  data jsonb not null
);
create table if not exists public.color_palettes (
  id text primary key,
  data jsonb not null
);
create table if not exists public.request_throttle (
  key text primary key,
  count integer not null,
  until_at timestamptz not null,
  updated_at timestamptz not null default now()
);
create table if not exists public.settings (
  id text primary key,
  value jsonb not null default '{}'::jsonb
);
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.designs enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.requests enable row level security;
alter table public.shares enable row level security;
alter table public.catalog_components enable row level security;
alter table public.color_palettes enable row level security;
alter table public.request_throttle enable row level security;
alter table public.settings enable row level security;
alter table public.admin_users enable row level security;

revoke all on public.projects, public.project_members, public.designs, public.requests, public.shares,
  public.catalog_components, public.color_palettes, public.request_throttle,
  public.settings, public.admin_users from anon, authenticated;
grant all on public.projects, public.project_members, public.designs, public.requests, public.shares,
  public.catalog_components, public.color_palettes, public.request_throttle,
  public.settings, public.admin_users to service_role;

drop function if exists public.create_design_request(text,jsonb,jsonb);
create or replace function public.create_design_request(
  p_id text, p_design jsonb, p_contact jsonb, p_project_id uuid, p_client_id uuid
) returns void language plpgsql set search_path = public as $$
begin
  if not exists (select 1 from public.projects where id = p_project_id and owner_id = p_client_id) then
    raise exception 'Project owner required';
  end if;
  insert into public.designs (id, design) values (p_id, p_design);
  insert into public.requests (id, project_id, client_id, contact)
    values (p_id, p_project_id, p_client_id, p_contact);
end;
$$;

create or replace function public.save_project_design(
  p_project_id uuid, p_user_id uuid, p_design jsonb, p_revision integer
) returns integer language plpgsql set search_path = public as $$
declare next_revision integer;
begin
  update public.projects set design = p_design, title = coalesce(nullif(p_design->>'projectName',''), title),
    revision = revision + 1, updated_at = now()
  where id = p_project_id and revision = p_revision
    and (owner_id = p_user_id or exists (
      select 1 from public.project_members
      where project_id = p_project_id and user_id = p_user_id and role = 'editor'
    ))
  returning revision into next_revision;
  return next_revision;
end;
$$;

create or replace function public.add_project_editor(
  p_project_id uuid, p_owner_id uuid, p_email text
) returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
declare target_id uuid; target_email text;
begin
  if not exists (select 1 from public.projects where id = p_project_id and owner_id = p_owner_id) then
    return false;
  end if;
  select id, email into target_id, target_email from auth.users
    where lower(email) = lower(trim(p_email)) limit 1;
  if target_id is null or target_id = p_owner_id then return false; end if;
  insert into public.project_members (project_id, user_id, email)
    values (p_project_id, target_id, target_email)
    on conflict (project_id, user_id) do nothing;
  return true;
end;
$$;

create or replace function public.take_rate_limit(
  p_key text, p_max integer, p_window_ms integer
) returns boolean language plpgsql set search_path = public as $$
declare current_count integer; expiry timestamptz;
begin
  insert into public.request_throttle (key, count, until_at)
    values (p_key, 0, now()) on conflict (key) do nothing;
  select count, until_at into current_count, expiry
    from public.request_throttle where key = p_key for update;
  if expiry <= now() then
    update public.request_throttle set count = 1,
      until_at = now() + (p_window_ms * interval '1 millisecond'),
      updated_at = now() where key = p_key;
    return true;
  end if;
  if current_count >= p_max then return false; end if;
  update public.request_throttle set count = count + 1, updated_at = now()
    where key = p_key;
  return true;
end;
$$;

revoke all on function public.create_design_request(text,jsonb,jsonb,uuid,uuid) from public, anon, authenticated;
revoke all on function public.save_project_design(uuid,uuid,jsonb,integer) from public, anon, authenticated;
revoke all on function public.add_project_editor(uuid,uuid,text) from public, anon, authenticated;
revoke all on function public.take_rate_limit(text,integer,integer) from public, anon, authenticated;
grant execute on function public.create_design_request(text,jsonb,jsonb,uuid,uuid) to service_role;
grant execute on function public.save_project_design(uuid,uuid,jsonb,integer) to service_role;
grant execute on function public.add_project_editor(uuid,uuid,text) to service_role;
grant execute on function public.take_rate_limit(text,integer,integer) to service_role;

-- After the admin signs up, run with the real email:
-- insert into public.admin_users (user_id)
-- select id from auth.users where email = 'admin@example.com'
-- on conflict (user_id) do nothing;
