-- Familia olfativa y notas principales de los perfumes del catálogo.
-- Sin estos datos, el filtro "Familia olfativa" y la búsqueda por nota
-- ("vainilla", "café") no devolvían nada.
-- Solo se cargan los perfumes con notas conocidas; el resto se completa
-- desde el panel (Admin → Productos). No pisa datos ya cargados a mano.

update public.products p
   set olfactory_family = coalesce(p.olfactory_family, v.family),
       notes_top   = case when cardinality(p.notes_top)   = 0 then v.top   else p.notes_top   end,
       notes_heart = case when cardinality(p.notes_heart) = 0 then v.heart else p.notes_heart end,
       notes_base  = case when cardinality(p.notes_base)  = 0 then v.base  else p.notes_base  end
  from (values
    ('khamrah', 'ambarada', array['Canela','Nuez moscada','Bergamota'], array['Dátiles','Praliné','Nardo'], array['Vainilla','Haba tonka','Benjuí','Mirra','Ámbar']),
    ('khamrah-qahwa', 'ambarada', array['Canela','Cardamomo','Jengibre'], array['Praliné','Frutas confitadas','Flores blancas'], array['Café','Vainilla','Haba tonka','Almizcle']),
    ('khamrah-dukhan', 'ambarada', array['Especias'], array['Incienso','Tabaco'], array['Vainilla','Ámbar']),
    ('asad', 'ambarada', array['Pimienta negra','Piña','Tabaco'], array['Café','Pachulí','Iris'], array['Vainilla','Ámbar','Benjuí','Ládano']),
    ('asad-bourbon', 'ambarada', array[]::text[], array[]::text[], array[]::text[]),
    ('liquid-brun', 'ambarada', array['Canela','Cardamomo','Azahar','Bergamota'], array['Vainilla bourbon','Elemí'], array['Praliné','Almizcle','Guayaco','Ámbar']),
    ('scandal-pour-homme', 'ambarada', array['Mandarina','Salvia'], array['Caramelo','Haba tonka'], array['Vetiver']),
    ('odyssey-mandarin-sky', 'ambarada', array['Mandarina','Naranja'], array['Salvia','Caramelo'], array['Haba tonka','Vetiver']),
    ('mandarin-elixir', 'ambarada', array['Mandarina'], array[]::text[], array[]::text[]),
    ('al-haramain-amber-oud', 'ambarada', array['Bergamota','Notas verdes'], array['Melón','Frutas'], array['Ámbar','Almizcle','Vainilla','Maderas']),
    ('oud-for-glory', 'amaderada', array['Azafrán','Nuez moscada','Lavanda'], array['Oud','Pachulí'], array['Oud','Almizcle','Pachulí']),
    ('amethyst', 'amaderada', array[]::text[], array['Rosa'], array['Oud']),
    ('club-de-nuit-iconic', 'amaderada', array['Pomelo','Menta','Bergamota','Limón'], array['Jengibre','Jazmín','Nuez moscada'], array['Incienso','Sándalo','Cedro','Ámbar']),
    ('club-de-nuit-intense', 'chipre', array['Limón','Piña','Bergamota','Grosella negra','Manzana'], array['Abedul','Jazmín','Rosa'], array['Almizcle','Ámbar gris','Pachulí','Vainilla']),
    ('club-de-nuit-woman', 'floral', array['Pomelo','Naranja','Bergamota'], array['Rosa','Jazmín','Geranio'], array['Pachulí','Almizcle','Vainilla']),
    ('club-de-nuit-elixir', 'aromatica', array['Pomelo','Bergamota'], array['Lavanda','Pimienta'], array['Ambroxan','Vetiver']),
    ('fakhar', 'fougere', array['Manzana','Jengibre','Bergamota'], array['Salvia','Geranio','Enebro'], array['Ámbar','Haba tonka','Cedro','Vetiver']),
    ('salvo-intense', 'aromatica', array['Pomelo','Canela','Nuez moscada','Cardamomo'], array['Lavanda'], array['Regaliz','Sándalo','Ámbar','Pachulí','Vetiver']),
    ('hawas-for-him', 'fresca', array['Manzana','Bergamota','Limón','Canela'], array['Ciruela','Cardamomo','Notas acuáticas','Azahar'], array['Ámbar gris','Almizcle','Pachulí','Maderas']),
    ('hawas-ice', 'fresca', array[]::text[], array[]::text[], array[]::text[]),
    ('9am-dive', 'fresca', array['Limón','Menta','Grosella negra'], array['Incienso','Jengibre'], array['Ámbar','Cedro','Pachulí']),
    ('al-haramain-aqua-dubai', 'fresca', array['Cítricos'], array['Notas acuáticas'], array['Almizcle','Ámbar']),
    ('asad-zanzibar', 'fresca', array[]::text[], array[]::text[], array[]::text[]),
    ('odyssey-aqua', 'fresca', array[]::text[], array[]::text[], array[]::text[]),
    ('jpg-paradise-garden', 'aromatica', array['Menta','Notas verdes'], array['Higo','Coco'], array['Sándalo']),
    ('odyssey-limoni', 'citrica', array['Limón'], array[]::text[], array[]::text[]),
    ('honor-and-glory', 'gourmand', array['Piña'], array['Crème brûlée','Canela','Pimienta'], array['Vainilla','Sándalo']),
    ('eclaire', 'gourmand', array['Caramelo','Leche','Azúcar'], array['Miel','Flores blancas'], array['Vainilla','Almizcle','Praliné']),
    ('odyssey-chocolat', 'gourmand', array['Pistacho'], array['Chocolate'], array['Vainilla']),
    ('cocoa-morado', 'gourmand', array[]::text[], array['Cacao'], array[]::text[]),
    ('odyssey-candee', 'gourmand', array[]::text[], array[]::text[], array[]::text[]),
    ('yara-candy', 'gourmand', array[]::text[], array[]::text[], array[]::text[]),
    ('yum-yum', 'gourmand', array[]::text[], array[]::text[], array[]::text[]),
    ('tiramisu-coco', 'gourmand', array[]::text[], array['Café','Coco'], array[]::text[]),
    ('set-yara', 'gourmand', array['Orquídea','Heliotropo','Mandarina'], array['Acorde gourmand','Frutas tropicales'], array['Vainilla','Almizcle','Sándalo']),
    ('yara-tous', 'frutal', array['Mango','Coco','Maracuyá'], array['Jazmín','Azahar'], array['Vainilla','Almizcle']),
    ('mayar-cherry-intense', 'frutal', array['Cereza'], array[]::text[], array[]::text[]),
    ('qaed-al-fursan', 'frutal', array['Piña'], array[]::text[], array[]::text[]),
    ('chants', 'floral', array['Pomelo','Membrillo'], array['Jacinto','Jazmín'], array['Almizcle','Iris','Cedro','Ámbar']),
    ('fakhar-rose', 'floral', array[]::text[], array[]::text[], array[]::text[]),
    ('yara-moi', 'floral', array[]::text[], array[]::text[], array[]::text[]),
    ('mayar-natural-intense', 'floral', array[]::text[], array[]::text[], array[]::text[]),
    ('tag-her', 'floral', array[]::text[], array[]::text[], array[]::text[])
  ) as v(slug, family, top, heart, base)
 where p.slug = v.slug;
