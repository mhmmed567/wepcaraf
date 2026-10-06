-- Manual orders reserve stock, then consume or release it in one transaction.
create table if not exists public.commerce_orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigint generated always as identity unique,
  project_id uuid not null references public.projects(id) on delete cascade,
  customer_name text not null check (char_length(customer_name) between 1 and 160),
  customer_email text not null default '' check (char_length(customer_email) <= 254),
  customer_phone text not null default '' check (char_length(customer_phone) <= 60),
  customer_note text not null default '' check (char_length(customer_note) <= 1000),
  status text not null default 'pending' check (status in ('pending','fulfilled','cancelled')),
  total_minor bigint not null default 0 check (total_minor >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(id, project_id)
);
create index if not exists commerce_orders_project_idx on public.commerce_orders(project_id, created_at desc);
create index if not exists commerce_orders_status_idx on public.commerce_orders(project_id, status, created_at desc);

create table if not exists public.commerce_order_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null,
  order_id uuid not null,
  variant_id uuid not null,
  product_name text not null,
  variant_title text not null,
  sku text,
  quantity integer not null check (quantity between 1 and 10000),
  unit_price_minor integer not null check (unit_price_minor between 0 and 1000000000),
  line_total_minor bigint not null check (line_total_minor >= 0),
  foreign key(order_id, project_id) references public.commerce_orders(id, project_id) on delete cascade,
  unique(order_id, variant_id)
);
create index if not exists commerce_order_items_order_idx on public.commerce_order_items(order_id);

alter table public.commerce_orders enable row level security;
alter table public.commerce_order_items enable row level security;
revoke all on public.commerce_orders, public.commerce_order_items from anon, authenticated;
grant all on public.commerce_orders, public.commerce_order_items to service_role;
grant usage, select on sequence public.commerce_orders_order_number_seq to service_role;

create or replace function public.commerce_create_order(p_project_id uuid, p_customer jsonb, p_items jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_order_id uuid;
  v_item jsonb;
  v_variant public.commerce_variants%rowtype;
  v_product_name text;
  v_quantity integer;
  v_total bigint := 0;
  v_seen uuid[] := '{}'::uuid[];
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) not between 1 and 50 then raise exception 'invalid items'; end if;
  if char_length(trim(coalesce(p_customer->>'name',''))) not between 1 and 160 then raise exception 'invalid customer'; end if;
  insert into public.commerce_orders(project_id,customer_name,customer_email,customer_phone,customer_note)
  values(p_project_id,trim(p_customer->>'name'),coalesce(p_customer->>'email',''),coalesce(p_customer->>'phone',''),coalesce(p_customer->>'note','')) returning id into v_order_id;
  for v_item in select value from jsonb_array_elements(p_items) order by value->>'variant_id' loop
    v_quantity := (v_item->>'quantity')::integer;
    if v_quantity not between 1 and 10000 then raise exception 'invalid quantity'; end if;
    if (v_item->>'variant_id')::uuid = any(v_seen) then raise exception 'duplicate variant'; end if;
    select v.* into v_variant from public.commerce_variants v
      join public.commerce_products p on p.id=v.product_id and p.project_id=v.project_id
      where v.id=(v_item->>'variant_id')::uuid and v.project_id=p_project_id and v.active and p.status='active'
      for update of v;
    if not found then raise exception 'variant unavailable'; end if;
    if v_variant.stock_on_hand-v_variant.stock_reserved < v_quantity then raise exception 'insufficient stock'; end if;
    select name into v_product_name from public.commerce_products where id=v_variant.product_id;
    update public.commerce_variants set stock_reserved=stock_reserved+v_quantity,updated_at=now() where id=v_variant.id;
    insert into public.commerce_order_items(project_id,order_id,variant_id,product_name,variant_title,sku,quantity,unit_price_minor,line_total_minor)
    values(p_project_id,v_order_id,v_variant.id,v_product_name,v_variant.title,v_variant.sku,v_quantity,v_variant.price_minor,v_quantity::bigint*v_variant.price_minor);
    v_total := v_total+v_quantity::bigint*v_variant.price_minor;
    v_seen := array_append(v_seen,v_variant.id);
  end loop;
  update public.commerce_orders set total_minor=v_total where id=v_order_id;
  return v_order_id;
end;
$$;
revoke all on function public.commerce_create_order(uuid,jsonb,jsonb) from public, anon, authenticated;
grant execute on function public.commerce_create_order(uuid,jsonb,jsonb) to service_role;

create or replace function public.commerce_transition_order(p_project_id uuid, p_order_id uuid, p_target text, p_actor_id uuid)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_order public.commerce_orders%rowtype;
  v_item public.commerce_order_items%rowtype;
begin
  if p_target not in ('fulfilled','cancelled') then raise exception 'invalid status'; end if;
  select * into v_order from public.commerce_orders where id=p_order_id and project_id=p_project_id for update;
  if not found then raise exception 'order not found'; end if;
  if v_order.status <> 'pending' then raise exception 'order already completed'; end if;
  for v_item in select * from public.commerce_order_items where order_id=p_order_id order by variant_id loop
    if p_target='fulfilled' then
      update public.commerce_variants set stock_reserved=stock_reserved-v_item.quantity,
        stock_on_hand=stock_on_hand-v_item.quantity,sold_count=sold_count+v_item.quantity,updated_at=now()
        where id=v_item.variant_id and project_id=p_project_id and stock_reserved>=v_item.quantity and stock_on_hand>=v_item.quantity;
      if not found then raise exception 'stock state changed'; end if;
      insert into public.commerce_stock_events(project_id,variant_id,delta,stock_after,reason,actor_id)
      select p_project_id,v_item.variant_id,-v_item.quantity,stock_on_hand,'Order #'||v_order.order_number||' fulfilled',p_actor_id
      from public.commerce_variants where id=v_item.variant_id;
    else
      update public.commerce_variants set stock_reserved=stock_reserved-v_item.quantity,updated_at=now()
        where id=v_item.variant_id and project_id=p_project_id and stock_reserved>=v_item.quantity;
      if not found then raise exception 'stock state changed'; end if;
    end if;
  end loop;
  update public.commerce_orders set status=p_target,updated_at=now() where id=p_order_id;
  return p_target;
end;
$$;
revoke all on function public.commerce_transition_order(uuid,uuid,text,uuid) from public, anon, authenticated;
grant execute on function public.commerce_transition_order(uuid,uuid,text,uuid) to service_role;
