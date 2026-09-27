-- =====================================================================
-- Smellclub · 0002 · Permisos (GRANT) y Row Level Security
-- Principio de mínimo privilegio:
--   · anon (visitantes)        → solo lectura del catálogo publicado.
--   · authenticated            → solo lo que las políticas permitan; todo lo
--                                de escritura exige ser administrador.
--   · service_role (servidor)  → crea pedidos / mensajes / rate limits
--                                mediante funciones controladas.
-- =====================================================================

-- ---------------------------------------------------------------------
-- ¿El usuario actual es administrador?
-- SECURITY DEFINER para poder leer admin_users sin exponer la tabla.
-- ---------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_users where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated, service_role;

-- ---------------------------------------------------------------------
-- Quitar privilegios por defecto y conceder solo los necesarios
-- ---------------------------------------------------------------------
revoke all on
  public.admin_users, public.categories, public.products, public.product_variants,
  public.product_images, public.orders, public.order_items, public.order_status_history,
  public.contact_messages, public.rate_limits
from anon, authenticated;

revoke all on sequence public.order_number_seq from anon, authenticated;

-- Catálogo: lectura pública (filtrada por RLS), escritura solo admin (RLS)
grant select on public.categories, public.products, public.product_variants, public.product_images
  to anon, authenticated;
grant insert, update, delete on public.categories, public.products, public.product_variants, public.product_images
  to authenticated;

-- Pedidos: solo usuarios autenticados (RLS exige admin). Sin INSERT directo:
-- los pedidos se crean únicamente con public.create_order (service role).
-- El estado solo se cambia con public.admin_set_order_status (repone stock).
grant select on public.orders, public.order_items, public.order_status_history to authenticated;
grant update (admin_notes) on public.orders to authenticated;

-- Mensajes de contacto: lectura/gestión solo admin
grant select, delete on public.contact_messages to authenticated;
grant update (is_read) on public.contact_messages to authenticated;

-- Cada usuario puede comprobar solo su propia fila de admin
grant select on public.admin_users to authenticated;

-- Service role (solo en el servidor, nunca en el navegador)
grant all on all tables in schema public to service_role;
grant usage, select on sequence public.order_number_seq to service_role;

-- ---------------------------------------------------------------------
-- Activar RLS en TODAS las tablas
-- ---------------------------------------------------------------------
alter table public.admin_users          enable row level security;
alter table public.categories           enable row level security;
alter table public.products             enable row level security;
alter table public.product_variants     enable row level security;
alter table public.product_images       enable row level security;
alter table public.orders               enable row level security;
alter table public.order_items          enable row level security;
alter table public.order_status_history enable row level security;
alter table public.contact_messages     enable row level security;
alter table public.rate_limits          enable row level security;

-- ---------------------------------------------------------------------
-- admin_users: solo ver tu propia fila. Sin políticas de escritura →
-- nadie puede auto-promocionarse (evita escalada de privilegios).
-- ---------------------------------------------------------------------
create policy "admin_users: ver propia fila"
  on public.admin_users for select
  to authenticated
  using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------
create policy "categories: lectura pública de activas"
  on public.categories for select
  to anon, authenticated
  using (is_active or (select public.is_admin()));

create policy "categories: admin inserta"
  on public.categories for insert to authenticated
  with check ((select public.is_admin()));

create policy "categories: admin actualiza"
  on public.categories for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "categories: admin elimina"
  on public.categories for delete to authenticated
  using ((select public.is_admin()));

-- ---------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------
create policy "products: lectura pública de activos"
  on public.products for select
  to anon, authenticated
  using (status = 'active' or (select public.is_admin()));

create policy "products: admin inserta"
  on public.products for insert to authenticated
  with check ((select public.is_admin()));

create policy "products: admin actualiza"
  on public.products for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "products: admin elimina"
  on public.products for delete to authenticated
  using ((select public.is_admin()));

-- ---------------------------------------------------------------------
-- product_variants
-- ---------------------------------------------------------------------
create policy "variants: lectura pública de activas"
  on public.product_variants for select
  to anon, authenticated
  using (
    (is_active and exists (
      select 1 from public.products p
      where p.id = product_variants.product_id and p.status = 'active'
    ))
    or (select public.is_admin())
  );

create policy "variants: admin inserta"
  on public.product_variants for insert to authenticated
  with check ((select public.is_admin()));

create policy "variants: admin actualiza"
  on public.product_variants for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "variants: admin elimina"
  on public.product_variants for delete to authenticated
  using ((select public.is_admin()));

-- ---------------------------------------------------------------------
-- product_images
-- ---------------------------------------------------------------------
create policy "images: lectura pública de productos activos"
  on public.product_images for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.products p
      where p.id = product_images.product_id and p.status = 'active'
    )
    or (select public.is_admin())
  );

create policy "images: admin inserta"
  on public.product_images for insert to authenticated
  with check ((select public.is_admin()));

create policy "images: admin actualiza"
  on public.product_images for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "images: admin elimina"
  on public.product_images for delete to authenticated
  using ((select public.is_admin()));

-- ---------------------------------------------------------------------
-- orders / order_items / order_status_history: SOLO administradores.
-- Ningún visitante puede leer pedidos (protección IDOR).
-- ---------------------------------------------------------------------
create policy "orders: admin lee"
  on public.orders for select to authenticated
  using ((select public.is_admin()));

create policy "orders: admin actualiza notas"
  on public.orders for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "order_items: admin lee"
  on public.order_items for select to authenticated
  using ((select public.is_admin()));

create policy "order_status_history: admin lee"
  on public.order_status_history for select to authenticated
  using ((select public.is_admin()));

-- ---------------------------------------------------------------------
-- contact_messages: solo administradores
-- ---------------------------------------------------------------------
create policy "contact_messages: admin lee"
  on public.contact_messages for select to authenticated
  using ((select public.is_admin()));

create policy "contact_messages: admin actualiza"
  on public.contact_messages for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "contact_messages: admin elimina"
  on public.contact_messages for delete to authenticated
  using ((select public.is_admin()));

-- rate_limits: RLS activado y SIN políticas → inaccesible salvo service role.
