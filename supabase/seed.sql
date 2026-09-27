-- =====================================================================
-- Smellclub · Datos de EJEMPLO (placeholders)
-- ⚠️ Precios, stock, tamaños, descripciones y notas NO son reales.
--    Precio 0 = "Precio por confirmar" (no se puede comprar).
--    Stock 0  = "Agotado".
--    Edita o elimina todo desde /admin → Productos.
-- Las marcas marcadas con [VERIFICAR] deben confirmarse.
-- =====================================================================

insert into public.categories (name, slug, description, sort_order) values
  ('Perfumes árabes',       'perfumes-arabes',       '[PLACEHOLDER] Descripción de la categoría.', 1),
  ('Perfumes de diseñador', 'perfumes-de-disenador', '[PLACEHOLDER] Descripción de la categoría.', 2)
on conflict (slug) do nothing;

with seed (name, brand, slug, category_slug, is_featured, is_new, is_recommended, sort_order) as (
  values
    ('Asad',                 'Lattafa',              'asad',                 'perfumes-arabes',       true,  false, true,  1),
    ('Khamrah',              'Lattafa',              'khamrah',              'perfumes-arabes',       true,  false, true,  2),
    ('CDN Intense',          'Armaf',                'cdn-intense',          'perfumes-arabes',       true,  false, true,  3),
    ('Scandal Pour Homme',   'Jean Paul Gaultier',   'scandal-pour-homme',   'perfumes-de-disenador', true,  false, false, 4),
    ('Odyssey Mandarin Sky', 'Armaf',                'odyssey-mandarin-sky', 'perfumes-arabes',       false, true,  false, 5),
    ('Honor & Glory',        'Lattafa',              'honor-and-glory',      'perfumes-arabes',       false, true,  false, 6),
    ('Odyssey Homme',        'Armaf',                'odyssey-homme',        'perfumes-arabes',       false, false, false, 7),
    ('Fakhar',               'Lattafa',              'fakhar',               'perfumes-arabes',       false, false, true,  8),
    ('Emeer',                '[VERIFICAR MARCA]',    'emeer',                'perfumes-arabes',       false, true,  false, 9),
    ('9PM Night Out',        'Afnan',                '9pm-night-out',        'perfumes-arabes',       false, true,  false, 10),
    ('Vulcan Feu',           'French Avenue',        'vulcan-feu',           'perfumes-arabes',       false, false, false, 11),
    ('CDN Bling',            '[VERIFICAR MARCA]',    'cdn-bling',            'perfumes-arabes',       false, false, false, 12),
    ('Éclaire',              'Lattafa',              'eclaire',              'perfumes-arabes',       false, false, false, 13)
)
insert into public.products (
  name, brand, slug, description, category_id, status,
  is_featured, is_new, is_recommended, recommendation_text, sort_order
)
select s.name, s.brand, s.slug,
       '[PLACEHOLDER] Descripción pendiente. Edita este texto desde el panel de administración.',
       c.id, 'active', s.is_featured, s.is_new, s.is_recommended,
       case when s.is_recommended then '[PLACEHOLDER] Motivo de la recomendación.' end,
       s.sort_order
  from seed s
  left join public.categories c on c.slug = s.category_slug
on conflict (slug) do nothing;

-- Variantes: frasco completo (tamaño por confirmar) + decants 5 ml y 10 ml.
insert into public.product_variants (product_id, kind, size_ml, label, price_cents, stock, sort_order)
select p.id, v.kind, v.size_ml, v.label, 0, 0, v.sort_order
  from public.products p
 cross join (values
   ('bottle', null::integer, 'Frasco completo [TAMAÑO POR CONFIRMAR]', 1),
   ('decant', 5,             'Decant 5 ml',                            2),
   ('decant', 10,            'Decant 10 ml',                           3)
 ) as v (kind, size_ml, label, sort_order)
 where p.slug in (
   'asad', 'khamrah', 'cdn-intense', 'scandal-pour-homme', 'odyssey-mandarin-sky',
   'honor-and-glory', 'odyssey-homme', 'fakhar', 'emeer', '9pm-night-out',
   'vulcan-feu', 'cdn-bling', 'eclaire'
 )
on conflict do nothing;
