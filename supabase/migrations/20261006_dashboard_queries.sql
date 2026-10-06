-- Narrow server-only queries for dashboard pagination and CMS binding previews.
create or replace function public.list_user_projects(
  p_user_id uuid, p_search text, p_limit integer, p_offset integer
)
returns table(id uuid, title text, revision integer, updated_at timestamptz, owner_id uuid, total_count bigint)
language sql stable security definer set search_path = public
as $$
  with visible as (
    select p.id, p.title, p.revision, p.updated_at, p.owner_id
    from public.projects p
    where (p.owner_id = p_user_id or exists (
      select 1 from public.project_members m where m.project_id = p.id and m.user_id = p_user_id
    ))
    and (coalesce(p_search, '') = '' or p.title ilike '%' || p_search || '%')
  )
  select v.id, v.title, v.revision, v.updated_at, v.owner_id, count(*) over() as total_count
  from visible v order by v.updated_at desc, v.id desc
  limit least(greatest(p_limit, 1), 100) offset least(greatest(p_offset, 0), 100000);
$$;
revoke all on function public.list_user_projects(uuid,text,integer,integer) from public, anon, authenticated;
grant execute on function public.list_user_projects(uuid,text,integer,integer) to service_role;

create or replace function public.project_cms_preview(p_project_id uuid)
returns table(collection_id uuid, slug text, fields jsonb, data jsonb)
language sql stable security definer set search_path = public
as $$
  select c.id, c.slug, c.fields, coalesce(entry.data, '{}'::jsonb)
  from public.cms_collections c
  left join lateral (
    select e.data from public.cms_entries e
    where e.collection_id = c.id and e.project_id = p_project_id and e.status = 'published'
    order by e.created_at desc, e.id desc limit 1
  ) entry on true
  where c.project_id = p_project_id
  order by c.created_at asc
  limit 100;
$$;
revoke all on function public.project_cms_preview(uuid) from public, anon, authenticated;
grant execute on function public.project_cms_preview(uuid) to service_role;
