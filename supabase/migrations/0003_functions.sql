-- =====================================================================
-- Smellclub · 0003 · Funciones de negocio (pedidos, stock, rate limit)
-- =====================================================================

-- ---------------------------------------------------------------------
-- create_order
-- · Recalcula TODOS los precios desde la base de datos (ignora precios
--   enviados por el navegador).
-- · Bloquea las variantes (FOR UPDATE) → sin sobreventa en compras simultáneas.
-- · Valida stock, estado del producto y precio > 0.
-- · Descuenta stock en la misma transacción.
-- Solo ejecutable por service_role (el servidor Next.js tras validar y
-- aplicar rate limiting). Nunca expuesta al navegador.
-- ---------------------------------------------------------------------
create or replace function public.create_order(
  p_customer jsonb,
  p_items    jsonb,
  p_currency text,
  p_ip_hash  text default null
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_line          record;
  v_variant       record;
  v_lines         jsonb := '[]'::jsonb;
  v_subtotal      bigint := 0;
  v_order_id      uuid;
  v_order_number  text;
  v_delivery      text := p_customer->>'delivery_method';
  v_item_count    integer;
begin
  if jsonb_typeof(p_items) is distinct from 'array' then
    raise exception 'INVALID_ITEMS';
  end if;

  v_item_count := jsonb_array_length(p_items);
  if v_item_count < 1 or v_item_count > 30 then
    raise exception 'INVALID_ITEMS';
  end if;

  -- Agrupa duplicados y bloquea en orden estable (evita deadlocks)
  for v_line in
    select (e->>'variant_id')::uuid as variant_id,
           sum((e->>'quantity')::integer) as quantity
    from jsonb_array_elements(p_items) e
    group by 1
    order by 1
  loop
    if v_line.quantity is null or v_line.quantity < 1 or v_line.quantity > 20 then
      raise exception 'INVALID_QUANTITY';
    end if;

    select v.id, v.product_id, v.label, v.price_cents, v.stock, v.is_active,
           p.name as product_name, p.brand as product_brand, p.status as product_status
      into v_variant
      from public.product_variants v
      join public.products p on p.id = v.product_id
     where v.id = v_line.variant_id
       for update of v;

    if not found
       or not v_variant.is_active
       or v_variant.product_status <> 'active'
       or v_variant.price_cents <= 0 then
      raise exception 'UNAVAILABLE:%', v_line.variant_id;
    end if;

    if v_variant.stock < v_line.quantity then
      raise exception 'OUT_OF_STOCK:%', v_line.variant_id;
    end if;

    v_subtotal := v_subtotal + (v_variant.price_cents::bigint * v_line.quantity);

    v_lines := v_lines || jsonb_build_object(
      'variant_id',       v_variant.id,
      'product_id',       v_variant.product_id,
      'product_name',     v_variant.product_name,
      'product_brand',    v_variant.product_brand,
      'variant_label',    v_variant.label,
      'unit_price_cents', v_variant.price_cents,
      'quantity',         v_line.quantity,
      'line_total_cents', v_variant.price_cents * v_line.quantity
    );
  end loop;

  if v_subtotal > 2000000000 then
    raise exception 'INVALID_TOTAL';
  end if;

  insert into public.orders (
    customer_name, customer_phone, customer_email,
    delivery_method, shipping_address, shipping_city, shipping_region, shipping_postal_code,
    contact_method, payment_method, customer_notes,
    subtotal_cents, shipping_cents, total_cents, currency, ip_hash
  ) values (
    p_customer->>'name',
    p_customer->>'phone',
    nullif(p_customer->>'email', ''),
    v_delivery,
    case when v_delivery = 'shipping' then nullif(p_customer->>'address', '') end,
    case when v_delivery = 'shipping' then nullif(p_customer->>'city', '') end,
    case when v_delivery = 'shipping' then nullif(p_customer->>'region', '') end,
    case when v_delivery = 'shipping' then nullif(p_customer->>'postal_code', '') end,
    p_customer->>'contact_method',
    p_customer->>'payment_method',
    nullif(p_customer->>'notes', ''),
    v_subtotal, 0, v_subtotal, p_currency, p_ip_hash
  )
  returning id, order_number into v_order_id, v_order_number;

  insert into public.order_items (
    order_id, product_id, variant_id, product_name, product_brand, variant_label,
    unit_price_cents, quantity, line_total_cents
  )
  select v_order_id,
         (l->>'product_id')::uuid,
         (l->>'variant_id')::uuid,
         l->>'product_name',
         l->>'product_brand',
         l->>'variant_label',
         (l->>'unit_price_cents')::integer,
         (l->>'quantity')::integer,
         (l->>'line_total_cents')::integer
    from jsonb_array_elements(v_lines) l;

  update public.product_variants v
     set stock = v.stock - (l->>'quantity')::integer
    from jsonb_array_elements(v_lines) l
   where v.id = (l->>'variant_id')::uuid;

  insert into public.order_status_history (order_id, from_status, to_status)
  values (v_order_id, null, 'pending');

  return jsonb_build_object(
    'order_id',       v_order_id,
    'order_number',   v_order_number,
    'subtotal_cents', v_subtotal,
    'total_cents',    v_subtotal,
    'currency',       p_currency,
    'items',          v_lines
  );
end;
$$;

revoke all on function public.create_order(jsonb, jsonb, text, text) from public, anon, authenticated;
grant execute on function public.create_order(jsonb, jsonb, text, text) to service_role;

-- ---------------------------------------------------------------------
-- admin_set_order_status
-- Cambia el estado y, si se cancela, repone el stock. Un pedido cancelado
-- no puede reabrirse (evita descuadres de stock). Registra historial.
-- ---------------------------------------------------------------------
create or replace function public.admin_set_order_status(
  p_order_id uuid,
  p_status   text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old text;
begin
  if not public.is_admin() then
    raise exception 'FORBIDDEN';
  end if;

  if p_status not in ('pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled') then
    raise exception 'INVALID_STATUS';
  end if;

  select status into v_old from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'NOT_FOUND';
  end if;

  if v_old = p_status then
    return;
  end if;

  if v_old = 'cancelled' then
    raise exception 'ORDER_CANCELLED';
  end if;

  if p_status = 'cancelled' then
    update public.product_variants v
       set stock = v.stock + agg.quantity
      from (
        select variant_id, sum(quantity)::integer as quantity
          from public.order_items
         where order_id = p_order_id and variant_id is not null
         group by variant_id
      ) agg
     where v.id = agg.variant_id;
  end if;

  update public.orders set status = p_status where id = p_order_id;

  insert into public.order_status_history (order_id, from_status, to_status, changed_by)
  values (p_order_id, v_old, p_status, auth.uid());
end;
$$;

revoke all on function public.admin_set_order_status(uuid, text) from public, anon;
grant execute on function public.admin_set_order_status(uuid, text) to authenticated;

-- ---------------------------------------------------------------------
-- rate_limit_hit: devuelve true si la petición está permitida.
-- ---------------------------------------------------------------------
create or replace function public.rate_limit_hit(
  p_key            text,
  p_max            integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_window timestamptz;
  v_count  integer;
begin
  if p_window_seconds < 1 or p_max < 1 then
    raise exception 'INVALID_ARGS';
  end if;

  v_window := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);

  insert into public.rate_limits (key, window_start, count)
  values (p_key, v_window, 1)
  on conflict (key, window_start)
  do update set count = public.rate_limits.count + 1
  returning count into v_count;

  -- Limpieza ocasional de ventanas antiguas
  if random() < 0.02 then
    delete from public.rate_limits where window_start < now() - interval '1 day';
  end if;

  return v_count <= p_max;
end;
$$;

revoke all on function public.rate_limit_hit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.rate_limit_hit(text, integer, integer) to service_role;
