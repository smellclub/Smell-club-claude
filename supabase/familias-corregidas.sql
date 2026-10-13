-- Corrección de familias olfativas (octubre 2026).
-- Revisadas contra las notas publicadas por las marcas y varias tiendas;
-- las marcas no publican "familia", así que se asigna según las notas que
-- dominan. Una sola familia por perfume (la principal).
-- A diferencia de familias-y-notas.sql, este SÍ pisa lo cargado antes.

update public.products p
   set olfactory_family = v.family
  from (values
    -- Ambarada / Oriental
    ('khamrah', 'ambarada'), ('khamrah-qahwa', 'ambarada'), ('khamrah-dukhan', 'ambarada'),
    ('asad', 'ambarada'), ('asad-bourbon', 'ambarada'), ('liquid-brun', 'ambarada'),
    ('al-haramain-amber-oud', 'ambarada'), ('amethyst', 'ambarada'), ('azzure-aoud', 'ambarada'),
    ('musamam', 'ambarada'), ('odyssey-spectra', 'ambarada'), ('odyssey-mandarin-sky', 'ambarada'),
    ('mandarin-elixir', 'ambarada'), ('9pm-night-out', 'ambarada'),
    -- Gourmand
    ('honor-and-glory', 'gourmand'), ('odyssey-chocolat', 'gourmand'), ('eclaire', 'gourmand'),
    ('nebras', 'gourmand'), ('tiramisu-coco', 'gourmand'), ('odyssey-candee', 'gourmand'),
    ('odyssey-pink-pop', 'gourmand'), ('yara-candy', 'gourmand'), ('sehr', 'gourmand'),
    ('cocoa-morado', 'gourmand'), ('angham', 'gourmand'), ('victoria', 'gourmand'),
    -- Amaderada
    ('odyssey-homme', 'amaderada'), ('odyssey-mega', 'amaderada'), ('club-de-nuit-intense', 'amaderada'),
    ('club-de-nuit-precieux', 'amaderada'), ('vintage-radio', 'amaderada'), ('hayaati-black', 'amaderada'),
    ('atlas', 'amaderada'), ('club-de-nuit-iconic', 'amaderada'), ('oud-for-glory', 'amaderada'),
    ('sceptre-malachite', 'amaderada'), ('club-de-nuit-bling', 'amaderada'),
    -- Cuero
    ('fakhar-gold-extrait', 'cuero'),
    -- Aromática
    ('emeer', 'aromatica'), ('club-de-nuit-elixir', 'aromatica'),
    -- Fougère
    ('fakhar', 'fougere'), ('the-kingdom', 'fougere'), ('salvo-intense', 'fougere'),
    -- Cítrica
    ('odyssey-limoni', 'citrica'), ('pacific-blue', 'citrica'),
    -- Fresca / Acuática
    ('hawas-ice', 'fresca'), ('hawas-for-him', 'fresca'), ('odyssey-aqua', 'fresca'),
    ('al-haramain-aqua-dubai', 'fresca'), ('9am-dive', 'fresca'), ('asad-zanzibar', 'fresca'),
    ('odyssey-bahamas', 'fresca'), ('jpg-paradise-garden', 'fresca'),
    -- Floral
    ('yara-moi', 'floral'), ('yara-rosa', 'floral'), ('emaan', 'floral'), ('afeef', 'floral'),
    ('chants', 'floral'), ('tag-her', 'floral'), ('mayar-natural-intense', 'floral'), ('tharwah', 'floral'),
    -- Chipre
    ('club-de-nuit-woman', 'chipre'), ('club-de-nuit-imperiale', 'chipre'), ('club-de-nuit-maleka', 'chipre'),
    -- Frutal
    ('vulcan-feu', 'frutal'), ('mayar-cherry-intense', 'frutal'), ('sakeena', 'frutal'),
    ('yara-tous', 'frutal'), ('qaed-al-fursan', 'frutal'), ('qaed-al-fursan-unlimited', 'frutal'),
    ('island-bliss', 'frutal'), ('island-breeze', 'frutal'), ('veneno-scarlet', 'frutal'),
    ('haya', 'frutal'), ('lovely-cherie', 'frutal'), ('bharara', 'frutal')
  ) as v(slug, family)
 where p.slug = v.slug;
