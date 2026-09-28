-- =====================================================================
-- Smellclub · Importación del catálogo de la web antigua
-- (smellclub.github.io/Smell-Club · 82 perfumes, precios en pesos uruguayos)
--
-- Copia TODO este archivo → Supabase → SQL Editor → Run. Solo UNA vez.
-- · Crea o actualiza los perfumes (no duplica los que ya existen).
-- · Sustituye sus formatos por los de la web antigua con los MISMOS precios.
-- · Stock inicial: 10 unidades por formato (la web antigua no tenía stock).
--   Ajústalo en /admin → Productos.
-- =====================================================================
begin;

-- Nombres cortos del catálogo de ejemplo → nombres completos de la web antigua
update public.products set slug = 'club-de-nuit-intense'
 where slug = 'cdn-intense' and not exists (select 1 from public.products where slug = 'club-de-nuit-intense');
update public.products set slug = 'club-de-nuit-bling'
 where slug = 'cdn-bling' and not exists (select 1 from public.products where slug = 'club-de-nuit-bling');

insert into public.categories (name, slug, sort_order) values
  ('Perfumes árabes', 'perfumes-arabes', 1),
  ('Perfumes de diseñador', 'perfumes-de-disenador', 2)
on conflict (slug) do nothing;

with data (name, brand, slug, category_slug, gender, sort_order) as (
  values
  ('Vulcan Feu', 'Lattafa', 'vulcan-feu', 'perfumes-arabes', 'unisex', 1),
  ('Khamrah', 'Lattafa', 'khamrah', 'perfumes-arabes', 'unisex', 2),
  ('Club de Nuit Bling', 'Armaf', 'club-de-nuit-bling', 'perfumes-arabes', 'unisex', 3),
  ('Emeer', 'Lattafa', 'emeer', 'perfumes-arabes', 'unisex', 4),
  ('9PM Night Out', 'Afnan', '9pm-night-out', 'perfumes-arabes', 'masculino', 5),
  ('Asad', 'Lattafa', 'asad', 'perfumes-arabes', 'masculino', 6),
  ('Fakhar', 'Lattafa', 'fakhar', 'perfumes-arabes', 'unisex', 7),
  ('Mandarin Elixir', 'Marca por confirmar', 'mandarin-elixir', 'perfumes-arabes', 'unisex', 8),
  ('Eclaire', 'Lattafa', 'eclaire', 'perfumes-arabes', 'femenino', 9),
  ('Scandal pour Homme', 'Jean Paul Gaultier', 'scandal-pour-homme', 'perfumes-de-disenador', 'masculino', 10),
  ('JPG Paradise Garden', 'Jean Paul Gaultier', 'jpg-paradise-garden', 'perfumes-de-disenador', 'masculino', 11),
  ('Odyssey Candee', 'Armaf', 'odyssey-candee', 'perfumes-arabes', 'femenino', 12),
  ('Odyssey Mandarin Sky', 'Armaf', 'odyssey-mandarin-sky', 'perfumes-arabes', 'masculino', 13),
  ('Odyssey Homme', 'Armaf', 'odyssey-homme', 'perfumes-arabes', 'masculino', 14),
  ('Odyssey Mega', 'Armaf', 'odyssey-mega', 'perfumes-arabes', 'masculino', 15),
  ('Honor & Glory', 'Lattafa', 'honor-and-glory', 'perfumes-arabes', 'unisex', 16),
  ('Oud for Glory', 'Lattafa', 'oud-for-glory', 'perfumes-arabes', 'unisex', 17),
  ('Amethyst', 'Lattafa', 'amethyst', 'perfumes-arabes', 'femenino', 18),
  ('Club de Nuit Intense', 'Armaf', 'club-de-nuit-intense', 'perfumes-arabes', 'unisex', 19),
  ('Odyssey Spectra', 'Armaf', 'odyssey-spectra', 'perfumes-arabes', 'unisex', 20),
  ('Odyssey Pink Pop', 'Armaf', 'odyssey-pink-pop', 'perfumes-arabes', 'femenino', 21),
  ('Island Breeze', 'Maison Alhambra', 'island-breeze', 'perfumes-arabes', 'unisex', 22),
  ('Veneno Scarlet', 'French Avenue', 'veneno-scarlet', 'perfumes-arabes', 'unisex', 23),
  ('Chants', 'Maison Alhambra', 'chants', 'perfumes-arabes', 'unisex', 24),
  ('Set Yara', 'Lattafa', 'set-yara', 'perfumes-arabes', 'femenino', 25),
  ('Afeef', 'Lattafa', 'afeef', 'perfumes-arabes', 'unisex', 26),
  ('Mayar Cherry Intense', 'Lattafa', 'mayar-cherry-intense', 'perfumes-arabes', 'femenino', 27),
  ('Victoria', 'Lattafa', 'victoria', 'perfumes-arabes', 'unisex', 28),
  ('Hawas Ice', 'Rasasi', 'hawas-ice', 'perfumes-arabes', 'masculino', 29),
  ('Hawas For Him', 'Rasasi', 'hawas-for-him', 'perfumes-arabes', 'masculino', 30),
  ('Pacific Blue', 'Maison Alhambra', 'pacific-blue', 'perfumes-arabes', 'unisex', 31),
  ('Odyssey Bahamas', 'Armaf', 'odyssey-bahamas', 'perfumes-arabes', 'unisex', 32),
  ('Cocoa Morado', 'French Avenue', 'cocoa-morado', 'perfumes-arabes', 'unisex', 33),
  ('Azzure Aoud', 'French Avenue', 'azzure-aoud', 'perfumes-arabes', 'unisex', 34),
  ('Lovely Cherie', 'Maison Alhambra', 'lovely-cherie', 'perfumes-arabes', 'unisex', 35),
  ('Club de Nuit Elixir', 'Armaf', 'club-de-nuit-elixir', 'perfumes-arabes', 'unisex', 36),
  ('Club de Nuit Iconic', 'Armaf', 'club-de-nuit-iconic', 'perfumes-arabes', 'masculino', 37),
  ('Club de Nuit Precieux', 'Armaf', 'club-de-nuit-precieux', 'perfumes-arabes', 'unisex', 38),
  ('Club de Nuit Imperiale', 'Armaf', 'club-de-nuit-imperiale', 'perfumes-arabes', 'femenino', 39),
  ('Club de Nuit Woman', 'Armaf', 'club-de-nuit-woman', 'perfumes-arabes', 'femenino', 40),
  ('Club de Nuit Maleka', 'Armaf', 'club-de-nuit-maleka', 'perfumes-arabes', 'femenino', 41),
  ('Khamrah Qahwa', 'Lattafa', 'khamrah-qahwa', 'perfumes-arabes', 'unisex', 42),
  ('Khamrah Dukhan', 'Lattafa', 'khamrah-dukhan', 'perfumes-arabes', 'unisex', 43),
  ('Sceptre Malachite', 'Maison Alhambra', 'sceptre-malachite', 'perfumes-arabes', 'unisex', 44),
  ('Angham', 'Lattafa', 'angham', 'perfumes-arabes', 'femenino', 45),
  ('Fakhar Black', 'Lattafa', 'fakhar-black', 'perfumes-arabes', 'masculino', 46),
  ('Fakhar Gold Extrait', 'Lattafa', 'fakhar-gold-extrait', 'perfumes-arabes', 'unisex', 47),
  ('Fakhar Rose', 'Lattafa', 'fakhar-rose', 'perfumes-arabes', 'femenino', 48),
  ('Salvo Intense', 'Maison Alhambra', 'salvo-intense', 'perfumes-arabes', 'masculino', 49),
  ('Hayaati Black', 'Lattafa', 'hayaati-black', 'perfumes-arabes', 'femenino', 50),
  ('Qaed Al Fursan Unlimited', 'Lattafa', 'qaed-al-fursan-unlimited', 'perfumes-arabes', 'unisex', 51),
  ('Qaed Al Fursan', 'Lattafa', 'qaed-al-fursan', 'perfumes-arabes', 'unisex', 52),
  ('9AM Dive', 'Afnan', '9am-dive', 'perfumes-arabes', 'masculino', 53),
  ('Musamam', 'Lattafa', 'musamam', 'perfumes-arabes', 'unisex', 54),
  ('Vintage Radio', 'Lattafa', 'vintage-radio', 'perfumes-arabes', 'unisex', 55),
  ('Ansaam Gold', 'Lattafa', 'ansaam-gold', 'perfumes-arabes', 'unisex', 56),
  ('Asad Zanzibar', 'Lattafa', 'asad-zanzibar', 'perfumes-arabes', 'masculino', 57),
  ('Asad Bourbon', 'Lattafa', 'asad-bourbon', 'perfumes-arabes', 'masculino', 58),
  ('The Kingdom', 'Lattafa', 'the-kingdom', 'perfumes-arabes', 'unisex', 59),
  ('Nebras', 'Lattafa', 'nebras', 'perfumes-arabes', 'unisex', 60),
  ('Sehr', 'Lattafa', 'sehr', 'perfumes-arabes', 'unisex', 61),
  ('Tiramisu Coco', 'Lattafa', 'tiramisu-coco', 'perfumes-arabes', 'unisex', 62),
  ('Yara Moi', 'Lattafa', 'yara-moi', 'perfumes-arabes', 'femenino', 63),
  ('Yara Rosa', 'Lattafa', 'yara-rosa', 'perfumes-arabes', 'femenino', 64),
  ('Yara Candy', 'Lattafa', 'yara-candy', 'perfumes-arabes', 'femenino', 65),
  ('Yara Tous', 'Lattafa', 'yara-tous', 'perfumes-arabes', 'femenino', 66),
  ('Mayar Natural Intense', 'Lattafa', 'mayar-natural-intense', 'perfumes-arabes', 'femenino', 67),
  ('Haya', 'Lattafa', 'haya', 'perfumes-arabes', 'femenino', 68),
  ('Sakeena', 'Lattafa', 'sakeena', 'perfumes-arabes', 'femenino', 69),
  ('Emaan', 'Lattafa', 'emaan', 'perfumes-arabes', 'femenino', 70),
  ('Bharara', 'Bharara', 'bharara', 'perfumes-arabes', 'unisex', 71),
  ('Al Haramain Amber Oud', 'Al Haramain', 'al-haramain-amber-oud', 'perfumes-arabes', 'unisex', 72),
  ('Al Haramain Aqua Dubai', 'Al Haramain', 'al-haramain-aqua-dubai', 'perfumes-arabes', 'unisex', 73),
  ('Tharwah', 'Lattafa', 'tharwah', 'perfumes-arabes', 'unisex', 74),
  ('Odyssey Aqua', 'Armaf', 'odyssey-aqua', 'perfumes-arabes', 'unisex', 75),
  ('Odyssey Limoni', 'Armaf', 'odyssey-limoni', 'perfumes-arabes', 'unisex', 76),
  ('Odyssey Chocolat', 'Armaf', 'odyssey-chocolat', 'perfumes-arabes', 'unisex', 77),
  ('Liquid Brun', 'Fragrance World', 'liquid-brun', 'perfumes-arabes', 'unisex', 78),
  ('Tag-Her', 'Armaf', 'tag-her', 'perfumes-arabes', 'femenino', 79),
  ('Atlas', 'Lattafa', 'atlas', 'perfumes-arabes', 'masculino', 80),
  ('Island Bliss', 'Lattafa', 'island-bliss', 'perfumes-arabes', 'unisex', 81),
  ('Yum Yum', 'Lattafa', 'yum-yum', 'perfumes-arabes', 'unisex', 82)
)
insert into public.products (name, brand, slug, description, category_id, gender, status, sort_order)
select d.name, d.brand, d.slug, '', c.id, d.gender, 'active', d.sort_order
  from data d
  left join public.categories c on c.slug = d.category_slug
on conflict (slug) do update set
  name = excluded.name,
  brand = excluded.brand,
  category_id = excluded.category_id,
  gender = excluded.gender,
  status = 'active',
  sort_order = excluded.sort_order,
  description = case when products.description like '[PLACEHOLDER]%' then '' else products.description end,
  recommendation_text = case when products.recommendation_text like '[PLACEHOLDER]%' then null else products.recommendation_text end;

-- Formatos y precios (los pedidos antiguos conservan su copia de precio)
delete from public.product_variants
 where product_id in (select id from public.products where slug in ('vulcan-feu', 'khamrah', 'club-de-nuit-bling', 'emeer', '9pm-night-out', 'asad', 'fakhar', 'mandarin-elixir', 'eclaire', 'scandal-pour-homme', 'jpg-paradise-garden', 'odyssey-candee', 'odyssey-mandarin-sky', 'odyssey-homme', 'odyssey-mega', 'honor-and-glory', 'oud-for-glory', 'amethyst', 'club-de-nuit-intense', 'odyssey-spectra', 'odyssey-pink-pop', 'island-breeze', 'veneno-scarlet', 'chants', 'set-yara', 'afeef', 'mayar-cherry-intense', 'victoria', 'hawas-ice', 'hawas-for-him', 'pacific-blue', 'odyssey-bahamas', 'cocoa-morado', 'azzure-aoud', 'lovely-cherie', 'club-de-nuit-elixir', 'club-de-nuit-iconic', 'club-de-nuit-precieux', 'club-de-nuit-imperiale', 'club-de-nuit-woman', 'club-de-nuit-maleka', 'khamrah-qahwa', 'khamrah-dukhan', 'sceptre-malachite', 'angham', 'fakhar-black', 'fakhar-gold-extrait', 'fakhar-rose', 'salvo-intense', 'hayaati-black', 'qaed-al-fursan-unlimited', 'qaed-al-fursan', '9am-dive', 'musamam', 'vintage-radio', 'ansaam-gold', 'asad-zanzibar', 'asad-bourbon', 'the-kingdom', 'nebras', 'sehr', 'tiramisu-coco', 'yara-moi', 'yara-rosa', 'yara-candy', 'yara-tous', 'mayar-natural-intense', 'haya', 'sakeena', 'emaan', 'bharara', 'al-haramain-amber-oud', 'al-haramain-aqua-dubai', 'tharwah', 'odyssey-aqua', 'odyssey-limoni', 'odyssey-chocolat', 'liquid-brun', 'tag-her', 'atlas', 'island-bliss', 'yum-yum'));

insert into public.product_variants (product_id, kind, size_ml, label, price_cents, stock, sort_order)
select p.id, v.kind, v.size_ml, v.label, v.price_cents, v.stock, v.sort_order
  from (values
  ('vulcan-feu', 'decant', 5, 'Decant 5 ml', 25000, 10, 1),
  ('vulcan-feu', 'decant', 10, 'Decant 10 ml', 40000, 10, 2),
  ('vulcan-feu', 'bottle', null, 'Frasco completo', 309900, 10, 3),
  ('khamrah', 'decant', 5, 'Decant 5 ml', 25000, 10, 1),
  ('khamrah', 'decant', 10, 'Decant 10 ml', 40000, 10, 2),
  ('khamrah', 'bottle', null, 'Frasco completo', 239900, 10, 3),
  ('club-de-nuit-bling', 'decant', 5, 'Decant 5 ml', 25000, 10, 1),
  ('club-de-nuit-bling', 'decant', 10, 'Decant 10 ml', 40000, 10, 2),
  ('club-de-nuit-bling', 'bottle', null, 'Frasco completo', 309900, 10, 3),
  ('emeer', 'decant', 5, 'Decant 5 ml', 25000, 10, 1),
  ('emeer', 'decant', 10, 'Decant 10 ml', 40000, 10, 2),
  ('emeer', 'bottle', null, 'Frasco completo', 239900, 10, 3),
  ('9pm-night-out', 'decant', 5, 'Decant 5 ml', 25000, 10, 1),
  ('9pm-night-out', 'decant', 10, 'Decant 10 ml', 40000, 10, 2),
  ('asad', 'decant', 5, 'Decant 5 ml', 25000, 10, 1),
  ('asad', 'decant', 10, 'Decant 10 ml', 40000, 10, 2),
  ('asad', 'bottle', null, 'Frasco completo', 229900, 10, 3),
  ('fakhar', 'decant', 5, 'Decant 5 ml', 25000, 10, 1),
  ('fakhar', 'decant', 10, 'Decant 10 ml', 40000, 10, 2),
  ('mandarin-elixir', 'decant', 5, 'Decant 5 ml', 25000, 10, 1),
  ('mandarin-elixir', 'decant', 10, 'Decant 10 ml', 40000, 10, 2),
  ('eclaire', 'decant', 5, 'Decant 5 ml', 25000, 10, 1),
  ('eclaire', 'decant', 10, 'Decant 10 ml', 40000, 10, 2),
  ('eclaire', 'bottle', null, 'Frasco completo', 239900, 10, 3),
  ('scandal-pour-homme', 'decant', 5, 'Decant 5 ml', 60000, 10, 1),
  ('scandal-pour-homme', 'decant', 10, 'Decant 10 ml', 110000, 10, 2),
  ('jpg-paradise-garden', 'decant', 5, 'Decant 5 ml', 60000, 10, 1),
  ('jpg-paradise-garden', 'decant', 10, 'Decant 10 ml', 110000, 10, 2),
  ('odyssey-candee', 'bottle', null, 'Frasco completo', 259900, 10, 1),
  ('odyssey-mandarin-sky', 'bottle', null, 'Frasco completo', 259900, 10, 1),
  ('odyssey-homme', 'bottle', null, 'Frasco completo', 259900, 10, 1),
  ('odyssey-mega', 'bottle', null, 'Frasco completo', 259900, 10, 1),
  ('honor-and-glory', 'bottle', null, 'Frasco completo', 199900, 10, 1),
  ('oud-for-glory', 'bottle', null, 'Frasco completo', 199900, 10, 1),
  ('amethyst', 'bottle', null, 'Frasco completo', 199900, 10, 1),
  ('club-de-nuit-intense', 'bottle', null, 'Frasco completo', 239900, 10, 1),
  ('odyssey-spectra', 'bottle', null, 'Frasco completo', 259900, 10, 1),
  ('odyssey-pink-pop', 'bottle', null, 'Frasco completo', 259900, 10, 1),
  ('island-breeze', 'bottle', null, 'Frasco completo', 339900, 10, 1),
  ('veneno-scarlet', 'bottle', null, 'Frasco completo', 309900, 10, 1),
  ('chants', 'bottle', null, 'Frasco completo', 229900, 10, 1),
  ('set-yara', 'bottle', null, 'Frasco completo', 269900, 10, 1),
  ('afeef', 'bottle', null, 'Frasco completo', 259900, 10, 1),
  ('mayar-cherry-intense', 'bottle', null, 'Frasco completo', 239900, 10, 1),
  ('victoria', 'bottle', null, 'Frasco completo', 249900, 10, 1),
  ('hawas-ice', 'bottle', null, 'Frasco completo', 259900, 10, 1),
  ('hawas-for-him', 'bottle', null, 'Frasco completo', 239900, 10, 1),
  ('pacific-blue', 'bottle', null, 'Frasco completo', 239900, 10, 1),
  ('odyssey-bahamas', 'bottle', null, 'Frasco completo', 279900, 10, 1),
  ('cocoa-morado', 'bottle', null, 'Frasco completo', 299900, 10, 1),
  ('azzure-aoud', 'bottle', null, 'Frasco completo', 299900, 10, 1),
  ('lovely-cherie', 'bottle', null, 'Frasco completo', 219900, 10, 1),
  ('club-de-nuit-elixir', 'bottle', null, 'Frasco completo', 279900, 10, 1),
  ('club-de-nuit-iconic', 'bottle', null, 'Frasco completo', 269900, 10, 1),
  ('club-de-nuit-precieux', 'bottle', null, 'Frasco completo', 319900, 10, 1),
  ('club-de-nuit-imperiale', 'bottle', null, 'Frasco completo', 269900, 10, 1),
  ('club-de-nuit-woman', 'bottle', null, 'Frasco completo', 239900, 10, 1),
  ('club-de-nuit-maleka', 'bottle', null, 'Frasco completo', 319900, 10, 1),
  ('khamrah-qahwa', 'bottle', null, 'Frasco completo', 239900, 10, 1),
  ('khamrah-dukhan', 'bottle', null, 'Frasco completo', 289900, 10, 1),
  ('sceptre-malachite', 'bottle', null, 'Frasco completo', 229900, 10, 1),
  ('angham', 'bottle', null, 'Frasco completo', 219900, 10, 1),
  ('fakhar-black', 'bottle', null, 'Frasco completo', 229900, 10, 1),
  ('fakhar-gold-extrait', 'bottle', null, 'Frasco completo', 229900, 10, 1),
  ('fakhar-rose', 'bottle', null, 'Frasco completo', 229900, 10, 1),
  ('salvo-intense', 'bottle', null, 'Frasco completo', 209900, 10, 1),
  ('hayaati-black', 'bottle', null, 'Frasco completo', 259900, 10, 1),
  ('qaed-al-fursan-unlimited', 'bottle', null, 'Frasco completo', 199900, 10, 1),
  ('qaed-al-fursan', 'bottle', null, 'Frasco completo', 199900, 10, 1),
  ('9am-dive', 'bottle', null, 'Frasco completo', 269900, 10, 1),
  ('musamam', 'bottle', null, 'Frasco completo', 259900, 10, 1),
  ('vintage-radio', 'bottle', null, 'Frasco completo', 249900, 10, 1),
  ('ansaam-gold', 'bottle', null, 'Frasco completo', 249900, 10, 1),
  ('asad-zanzibar', 'bottle', null, 'Frasco completo', 229900, 10, 1),
  ('asad-bourbon', 'bottle', null, 'Frasco completo', 249900, 10, 1),
  ('the-kingdom', 'bottle', null, 'Frasco completo', 259900, 10, 1),
  ('nebras', 'bottle', null, 'Frasco completo', 269900, 10, 1),
  ('sehr', 'bottle', null, 'Frasco completo', 259900, 10, 1),
  ('tiramisu-coco', 'bottle', null, 'Frasco completo', 269900, 10, 1),
  ('yara-moi', 'bottle', null, 'Frasco completo', 209900, 10, 1),
  ('yara-rosa', 'bottle', null, 'Frasco completo', 219900, 10, 1),
  ('yara-candy', 'bottle', null, 'Frasco completo', 229900, 10, 1),
  ('yara-tous', 'bottle', null, 'Frasco completo', 209900, 10, 1),
  ('mayar-natural-intense', 'bottle', null, 'Frasco completo', 229900, 10, 1),
  ('haya', 'bottle', null, 'Frasco completo', 229900, 10, 1),
  ('sakeena', 'bottle', null, 'Frasco completo', 219900, 10, 1),
  ('emaan', 'bottle', null, 'Frasco completo', 229900, 10, 1),
  ('bharara', 'bottle', null, 'Frasco completo', 399900, 10, 1),
  ('al-haramain-amber-oud', 'bottle', null, 'Frasco completo', 399900, 10, 1),
  ('al-haramain-aqua-dubai', 'bottle', null, 'Frasco completo', 399900, 10, 1),
  ('tharwah', 'bottle', null, 'Frasco completo', 239900, 10, 1),
  ('odyssey-aqua', 'bottle', null, 'Frasco completo', 259900, 10, 1),
  ('odyssey-limoni', 'bottle', null, 'Frasco completo', 259900, 10, 1),
  ('odyssey-chocolat', 'bottle', null, 'Frasco completo', 259900, 10, 1),
  ('liquid-brun', 'bottle', null, 'Frasco completo', 309900, 10, 1),
  ('tag-her', 'bottle', null, 'Frasco completo', 269900, 10, 1),
  ('atlas', 'bottle', null, 'Frasco completo', 229900, 10, 1),
  ('island-bliss', 'bottle', null, 'Frasco completo', 369900, 10, 1),
  ('yum-yum', 'bottle', null, 'Frasco completo', 369900, 10, 1)
  ) as v (slug, kind, size_ml, label, price_cents, stock, sort_order)
  join public.products p on p.slug = v.slug;

update public.categories set description = null where description like '[PLACEHOLDER]%';

commit;

-- Comprobación: debe mostrar 82 perfumes y 99 formatos
select count(distinct p.id) as perfumes, count(v.id) as formatos
  from public.products p join public.product_variants v on v.product_id = p.id
 where p.slug in ('vulcan-feu', 'khamrah', 'club-de-nuit-bling', 'emeer', '9pm-night-out', 'asad', 'fakhar', 'mandarin-elixir', 'eclaire', 'scandal-pour-homme', 'jpg-paradise-garden', 'odyssey-candee', 'odyssey-mandarin-sky', 'odyssey-homme', 'odyssey-mega', 'honor-and-glory', 'oud-for-glory', 'amethyst', 'club-de-nuit-intense', 'odyssey-spectra', 'odyssey-pink-pop', 'island-breeze', 'veneno-scarlet', 'chants', 'set-yara', 'afeef', 'mayar-cherry-intense', 'victoria', 'hawas-ice', 'hawas-for-him', 'pacific-blue', 'odyssey-bahamas', 'cocoa-morado', 'azzure-aoud', 'lovely-cherie', 'club-de-nuit-elixir', 'club-de-nuit-iconic', 'club-de-nuit-precieux', 'club-de-nuit-imperiale', 'club-de-nuit-woman', 'club-de-nuit-maleka', 'khamrah-qahwa', 'khamrah-dukhan', 'sceptre-malachite', 'angham', 'fakhar-black', 'fakhar-gold-extrait', 'fakhar-rose', 'salvo-intense', 'hayaati-black', 'qaed-al-fursan-unlimited', 'qaed-al-fursan', '9am-dive', 'musamam', 'vintage-radio', 'ansaam-gold', 'asad-zanzibar', 'asad-bourbon', 'the-kingdom', 'nebras', 'sehr', 'tiramisu-coco', 'yara-moi', 'yara-rosa', 'yara-candy', 'yara-tous', 'mayar-natural-intense', 'haya', 'sakeena', 'emaan', 'bharara', 'al-haramain-amber-oud', 'al-haramain-aqua-dubai', 'tharwah', 'odyssey-aqua', 'odyssey-limoni', 'odyssey-chocolat', 'liquid-brun', 'tag-her', 'atlas', 'island-bliss', 'yum-yum');
