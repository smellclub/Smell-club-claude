-- =====================================================================
-- Smellclub · 0004 · Supabase Storage (imágenes de producto)
-- Bucket público de SOLO LECTURA por URL directa. Subida, reemplazo y
-- borrado exclusivamente para administradores. Límite 5 MB y solo
-- JPEG / PNG / WebP / AVIF (se valida también en el servidor).
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Sin política SELECT pública: las imágenes se sirven por URL pública,
-- pero nadie puede LISTAR el contenido del bucket salvo un admin.
create policy "product-images: admin lista"
  on storage.objects for select to authenticated
  using (bucket_id = 'product-images' and (select public.is_admin()));

create policy "product-images: admin sube"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'product-images'
    and (select public.is_admin())
    and name ~ '^products/[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|png|webp|avif)$'
  );

create policy "product-images: admin actualiza"
  on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and (select public.is_admin()))
  with check (bucket_id = 'product-images' and (select public.is_admin()));

create policy "product-images: admin elimina"
  on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and (select public.is_admin()));
