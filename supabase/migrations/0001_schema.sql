-- =====================================================================
-- Smellclub · 0001 · Esquema principal
-- Ejecutar en Supabase → SQL Editor (en orden: 0001, 0002, 0003, 0004, seed)
-- =====================================================================

-- ---------------------------------------------------------------------
-- Utilidades
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- Administradores (roles). Solo se gestionan desde SQL / service role.
-- ---------------------------------------------------------------------
create table public.admin_users (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  role       text not null default 'admin' check (role in ('owner', 'admin')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Categorías
-- ---------------------------------------------------------------------
create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 80),
  slug        text not null unique
              check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 100),
  description text check (description is null or char_length(description) <= 1000),
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger categories_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Productos (un perfume = un producto; tamaños/decants = variantes)
-- ---------------------------------------------------------------------
create table public.products (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null check (char_length(name) between 1 and 120),
  brand               text not null check (char_length(brand) between 1 and 80),
  slug                text not null unique
                      check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 140),
  description         text not null default '' check (char_length(description) <= 5000),
  category_id         uuid references public.categories (id) on delete set null,
  gender              text check (gender in ('masculino', 'femenino', 'unisex')),
  olfactory_family    text check (olfactory_family in (
                        'amaderada', 'ambarada', 'aromatica', 'citrica', 'cuero',
                        'especiada', 'floral', 'frutal', 'fresca', 'gourmand',
                        'chipre', 'fougere', 'almizclada'
                      )),
  notes_top           text[] not null default '{}' check (cardinality(notes_top) <= 20),
  notes_heart         text[] not null default '{}' check (cardinality(notes_heart) <= 20),
  notes_base          text[] not null default '{}' check (cardinality(notes_base) <= 20),
  status              text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  is_featured         boolean not null default false,
  is_new              boolean not null default false,
  is_recommended      boolean not null default false,
  recommendation_text text check (recommendation_text is null or char_length(recommendation_text) <= 500),
  sort_order          integer not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index products_status_idx      on public.products (status);
create index products_category_idx    on public.products (category_id);
create index products_featured_idx    on public.products (is_featured) where status = 'active';
create index products_new_idx         on public.products (is_new) where status = 'active';
create index products_recommended_idx on public.products (is_recommended) where status = 'active';

create trigger products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Variantes: frasco completo y decants (5 ml, 10 ml...).
-- Precio en céntimos (entero) para evitar errores de redondeo.
-- ---------------------------------------------------------------------
create table public.product_variants (
  id                     uuid primary key default gen_random_uuid(),
  product_id             uuid not null references public.products (id) on delete cascade,
  kind                   text not null check (kind in ('bottle', 'decant')),
  size_ml                integer check (size_ml is null or size_ml between 1 and 1000),
  label                  text not null check (char_length(label) between 1 and 60),
  price_cents            integer not null default 0 check (price_cents between 0 and 100000000),
  compare_at_price_cents integer check (compare_at_price_cents is null or compare_at_price_cents > price_cents),
  stock                  integer not null default 0 check (stock between 0 and 100000),
  sku                    text unique check (sku is null or char_length(sku) between 1 and 64),
  is_active              boolean not null default true,
  sort_order             integer not null default 0,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  constraint product_variants_decant_size check (kind <> 'decant' or size_ml is not null)
);

-- Evita dos variantes idénticas (mismo tipo y tamaño) para un producto.
create unique index product_variants_unique_size
  on public.product_variants (product_id, kind, coalesce(size_ml, 0));
create index product_variants_product_idx on public.product_variants (product_id);

create trigger product_variants_updated_at
  before update on public.product_variants
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Imágenes de producto (archivos en Supabase Storage, bucket product-images)
-- La imagen con menor "position" es la principal.
-- ---------------------------------------------------------------------
create table public.product_images (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid not null references public.products (id) on delete cascade,
  storage_path text not null unique
               check (storage_path ~ '^products/[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|png|webp|avif)$'),
  alt          text check (alt is null or char_length(alt) <= 200),
  position     integer not null default 0,
  created_at   timestamptz not null default now()
);

create index product_images_product_idx on public.product_images (product_id, position);

-- ---------------------------------------------------------------------
-- Pedidos
-- ---------------------------------------------------------------------
create sequence public.order_number_seq start 1001;

create table public.orders (
  id                   uuid primary key default gen_random_uuid(),
  order_number         text not null unique
                       default ('SC-' || lpad(nextval('public.order_number_seq')::text, 6, '0')),
  customer_name        text not null check (char_length(customer_name) between 2 and 120),
  customer_phone       text not null check (customer_phone ~ '^[0-9+() .-]{6,30}$'),
  customer_email       text check (
                         customer_email is null
                         or (char_length(customer_email) <= 254
                             and customer_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
                       ),
  delivery_method      text not null check (delivery_method in ('shipping', 'pickup')),
  shipping_address     text check (shipping_address is null or char_length(shipping_address) <= 300),
  shipping_city        text check (shipping_city is null or char_length(shipping_city) <= 100),
  shipping_region      text check (shipping_region is null or char_length(shipping_region) <= 100),
  shipping_postal_code text check (shipping_postal_code is null or char_length(shipping_postal_code) <= 20),
  contact_method       text not null check (contact_method in ('whatsapp', 'instagram', 'email', 'phone')),
  payment_method       text not null check (payment_method in ('transfer', 'cash', 'payment_link', 'to_agree')),
  customer_notes       text check (customer_notes is null or char_length(customer_notes) <= 1000),
  admin_notes          text check (admin_notes is null or char_length(admin_notes) <= 2000),
  status               text not null default 'pending'
                       check (status in ('pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled')),
  subtotal_cents       integer not null check (subtotal_cents >= 0),
  shipping_cents       integer not null default 0 check (shipping_cents >= 0),
  total_cents          integer not null,
  currency             text not null check (currency ~ '^[A-Z]{3}$'),
  ip_hash              text check (ip_hash is null or char_length(ip_hash) = 64),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  constraint orders_total_check check (total_cents = subtotal_cents + shipping_cents),
  constraint orders_shipping_required check (
    delivery_method = 'pickup' or (shipping_address is not null and shipping_city is not null)
  )
);

create index orders_status_idx     on public.orders (status);
create index orders_created_at_idx on public.orders (created_at desc);

create trigger orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

create table public.order_items (
  id               uuid primary key default gen_random_uuid(),
  order_id         uuid not null references public.orders (id) on delete cascade,
  product_id       uuid references public.products (id) on delete set null,
  variant_id       uuid references public.product_variants (id) on delete set null,
  -- Copia de los datos en el momento de la compra (histórico inmutable)
  product_name     text not null,
  product_brand    text not null,
  variant_label    text not null,
  unit_price_cents integer not null check (unit_price_cents > 0),
  quantity         integer not null check (quantity between 1 and 20),
  line_total_cents integer not null,
  created_at       timestamptz not null default now(),
  constraint order_items_line_total_check check (line_total_cents = unit_price_cents * quantity)
);

create index order_items_order_idx   on public.order_items (order_id);
create index order_items_variant_idx on public.order_items (variant_id);
create index order_items_product_idx on public.order_items (product_id);

create table public.order_status_history (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders (id) on delete cascade,
  from_status text,
  to_status   text not null,
  changed_by  uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now()
);

create index order_status_history_order_idx on public.order_status_history (order_id, created_at);

-- ---------------------------------------------------------------------
-- Mensajes del formulario de contacto
-- ---------------------------------------------------------------------
create table public.contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 2 and 120),
  email      text check (email is null or char_length(email) <= 254),
  phone      text check (phone is null or phone ~ '^[0-9+() .-]{6,30}$'),
  message    text not null check (char_length(message) between 5 and 2000),
  is_read    boolean not null default false,
  ip_hash    text check (ip_hash is null or char_length(ip_hash) = 64),
  created_at timestamptz not null default now()
);

create index contact_messages_created_at_idx on public.contact_messages (created_at desc);

-- ---------------------------------------------------------------------
-- Rate limiting (contadores por ventana de tiempo). Solo service role.
-- ---------------------------------------------------------------------
create table public.rate_limits (
  key          text not null check (char_length(key) <= 200),
  window_start timestamptz not null,
  count        integer not null default 0,
  primary key (key, window_start)
);
