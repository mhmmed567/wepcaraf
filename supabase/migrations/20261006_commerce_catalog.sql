-- Project-scoped product catalog, variants and audited stock adjustments.
create table if not exists public.commerce_products (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 160),
  description text not null default '' check (char_length(description) <= 10000),
  image_url text not null default '' check (char_length(image_url) <= 1000),
  category text not null default '' check (char_length(category) <= 100),
  brand text not null default '' check (char_length(brand) <= 100),
  tags text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft','active','archived')),
  seo_title text not null default '' check (char_length(seo_title) <= 160),
  seo_description text not null default '' check (char_length(seo_description) <= 300),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(id, project_id)
);
create index if not exists commerce_products_project_idx on public.commerce_products(project_id, updated_at desc);
create index if not exists commerce_products_status_idx on public.commerce_products(project_id, status, updated_at desc);

create table if not exists public.commerce_variants (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null,
  product_id uuid not null,
  title text not null check (char_length(title) between 1 and 120),
  options jsonb not null default '{}'::jsonb check (jsonb_typeof(options) = 'object'),
  sku text check (sku is null or char_length(sku) <= 80),
  barcode text not null default '' check (char_length(barcode) <= 80),
  price_minor integer not null check (price_minor between 0 and 1000000000),
  compare_price_minor integer check (compare_price_minor is null or compare_price_minor between 0 and 1000000000),
  cost_minor integer check (cost_minor is null or cost_minor between 0 and 1000000000),
  stock_on_hand integer not null default 0 check (stock_on_hand >= 0),
  stock_reserved integer not null default 0 check (stock_reserved >= 0 and stock_reserved <= stock_on_hand),
  sold_count integer not null default 0 check (sold_count >= 0),
  low_stock_threshold integer not null default 5 check (low_stock_threshold between 0 and 1000000),
  image_url text not null default '' check (char_length(image_url) <= 1000),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key(product_id, project_id) references public.commerce_products(id, project_id) on delete cascade,
  unique(id, project_id)
);
create unique index if not exists commerce_variants_project_sku_idx on public.commerce_variants(project_id, lower(sku)) where sku is not null and sku <> '';
create index if not exists commerce_variants_product_idx on public.commerce_variants(product_id, active);

create table if not exists public.commerce_stock_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null,
  variant_id uuid not null,
  delta integer not null check (delta <> 0),
  stock_after integer not null check (stock_after >= 0),
  reason text not null check (char_length(reason) between 1 and 300),
  actor_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  foreign key(variant_id, project_id) references public.commerce_variants(id, project_id) on delete cascade
);
create index if not exists commerce_stock_events_variant_idx on public.commerce_stock_events(variant_id, created_at desc);

alter table public.commerce_products enable row level security;
alter table public.commerce_variants enable row level security;
alter table public.commerce_stock_events enable row level security;
revoke all on public.commerce_products, public.commerce_variants, public.commerce_stock_events from anon, authenticated;
grant all on public.commerce_products, public.commerce_variants, public.commerce_stock_events to service_role;

create or replace function public.commerce_save_product(p_project_id uuid, p_product_id uuid, p_product jsonb, p_variants jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_id uuid := p_product_id;
  v_variant jsonb;
  v_variant_id uuid;
  v_seen uuid[] := '{}'::uuid[];
begin
  if jsonb_typeof(p_variants) <> 'array' or jsonb_array_length(p_variants) not between 1 and 50 then
    raise exception 'invalid variant count';
  end if;
  if v_id is null then
    insert into public.commerce_products(project_id,name,description,image_url,category,brand,tags,status,seo_title,seo_description)
    values(p_project_id,p_product->>'name',coalesce(p_product->>'description',''),coalesce(p_product->>'image_url',''),coalesce(p_product->>'category',''),coalesce(p_product->>'brand',''),array(select jsonb_array_elements_text(p_product->'tags')),p_product->>'status',coalesce(p_product->>'seo_title',''),coalesce(p_product->>'seo_description',''))
    returning id into v_id;
  else
    update public.commerce_products set name=p_product->>'name',description=coalesce(p_product->>'description',''),image_url=coalesce(p_product->>'image_url',''),category=coalesce(p_product->>'category',''),brand=coalesce(p_product->>'brand',''),tags=array(select jsonb_array_elements_text(p_product->'tags')),status=p_product->>'status',seo_title=coalesce(p_product->>'seo_title',''),seo_description=coalesce(p_product->>'seo_description',''),updated_at=now()
    where id=v_id and project_id=p_project_id;
    if not found then raise exception 'product not found'; end if;
  end if;
  for v_variant in select value from jsonb_array_elements(p_variants) loop
    v_variant_id := nullif(v_variant->>'id','')::uuid;
    if v_variant_id is null then
      insert into public.commerce_variants(project_id,product_id,title,options,sku,barcode,price_minor,compare_price_minor,cost_minor,stock_on_hand,low_stock_threshold,image_url,active)
      values(p_project_id,v_id,v_variant->>'title',coalesce(v_variant->'options','{}'::jsonb),nullif(v_variant->>'sku',''),coalesce(v_variant->>'barcode',''),(v_variant->>'price_minor')::integer,nullif(v_variant->>'compare_price_minor','')::integer,nullif(v_variant->>'cost_minor','')::integer,coalesce((v_variant->>'stock_on_hand')::integer,0),coalesce((v_variant->>'low_stock_threshold')::integer,5),coalesce(v_variant->>'image_url',''),true)
      returning id into v_variant_id;
    else
      update public.commerce_variants set title=v_variant->>'title',options=coalesce(v_variant->'options','{}'::jsonb),sku=nullif(v_variant->>'sku',''),barcode=coalesce(v_variant->>'barcode',''),price_minor=(v_variant->>'price_minor')::integer,compare_price_minor=nullif(v_variant->>'compare_price_minor','')::integer,cost_minor=nullif(v_variant->>'cost_minor','')::integer,low_stock_threshold=coalesce((v_variant->>'low_stock_threshold')::integer,5),image_url=coalesce(v_variant->>'image_url',''),active=true,updated_at=now()
      where id=v_variant_id and product_id=v_id and project_id=p_project_id;
      if not found then raise exception 'variant not found'; end if;
    end if;
    v_seen := array_append(v_seen,v_variant_id);
  end loop;
  update public.commerce_variants set active=false,updated_at=now() where product_id=v_id and project_id=p_project_id and not (id=any(v_seen));
  return v_id;
end;
$$;
revoke all on function public.commerce_save_product(uuid,uuid,jsonb,jsonb) from public, anon, authenticated;
grant execute on function public.commerce_save_product(uuid,uuid,jsonb,jsonb) to service_role;

create or replace function public.commerce_adjust_stock(p_project_id uuid, p_variant_id uuid, p_delta integer, p_reason text, p_actor_id uuid)
returns integer language plpgsql security definer set search_path = public as $$
declare v_variant public.commerce_variants%rowtype; v_after integer;
begin
  if p_delta = 0 or abs(p_delta) > 1000000 or char_length(trim(p_reason)) not between 1 and 300 then raise exception 'invalid adjustment'; end if;
  select * into v_variant from public.commerce_variants where id=p_variant_id and project_id=p_project_id for update;
  if not found then raise exception 'variant not found'; end if;
  v_after := v_variant.stock_on_hand + p_delta;
  if v_after < v_variant.stock_reserved or v_after < 0 then raise exception 'insufficient available stock'; end if;
  update public.commerce_variants set stock_on_hand=v_after,updated_at=now() where id=p_variant_id;
  insert into public.commerce_stock_events(project_id,variant_id,delta,stock_after,reason,actor_id) values(p_project_id,p_variant_id,p_delta,v_after,trim(p_reason),p_actor_id);
  return v_after;
end;
$$;
revoke all on function public.commerce_adjust_stock(uuid,uuid,integer,text,uuid) from public, anon, authenticated;
grant execute on function public.commerce_adjust_stock(uuid,uuid,integer,text,uuid) to service_role;

create or replace function public.commerce_catalog_summary(p_project_id uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'products', (select count(*) from public.commerce_products where project_id=p_project_id),
    'activeProducts', (select count(*) from public.commerce_products where project_id=p_project_id and status='active'),
    'lowStock', (select count(*) from public.commerce_variants v join public.commerce_products p on p.id=v.product_id where v.project_id=p_project_id and p.status='active' and v.active and v.stock_on_hand-v.stock_reserved <= v.low_stock_threshold and v.stock_on_hand-v.stock_reserved > 0),
    'outOfStock', (select count(*) from public.commerce_variants v join public.commerce_products p on p.id=v.product_id where v.project_id=p_project_id and p.status='active' and v.active and v.stock_on_hand-v.stock_reserved = 0),
    'availableUnits', (select coalesce(sum(v.stock_on_hand-v.stock_reserved),0) from public.commerce_variants v where v.project_id=p_project_id and v.active)
  );
$$;
revoke all on function public.commerce_catalog_summary(uuid) from public, anon, authenticated;
grant execute on function public.commerce_catalog_summary(uuid) to service_role;
