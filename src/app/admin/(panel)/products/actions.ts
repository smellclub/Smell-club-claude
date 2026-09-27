"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { CATALOG_TAG } from "@/lib/catalog";
import { IMAGE_MAX_BYTES, PRODUCT_IMAGES_BUCKET } from "@/lib/constants";
import { slugify } from "@/lib/utils";
import { cleanText, fieldErrors, formToObject, uuid } from "@/lib/validation/common";
import { productSchema, variantsSchema } from "@/lib/validation/schemas";
import type { ActionState } from "@/types/domain";

function invalidateCatalog() {
  updateTag(CATALOG_TAG);
  revalidatePath("/", "layout");
}

// ---------------------------------------------------------------------
// Crear / editar producto + variantes
// ---------------------------------------------------------------------
export async function saveProduct(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const raw = formToObject(formData);

  const productId = raw.productId ? uuid.safeParse(raw.productId) : null;
  if (productId && !productId.success) return { ok: false, message: "Producto no válido." };

  const parsed = productSchema.safeParse(raw);

  let variantsJson: unknown = [];
  try {
    variantsJson = JSON.parse(raw.variants ?? "[]");
  } catch {
    return { ok: false, message: "Variantes no válidas." };
  }
  const variants = variantsSchema.safeParse(variantsJson);

  if (!parsed.success || !variants.success) {
    const errors = {
      ...(parsed.success ? {} : fieldErrors(parsed.error)),
      ...(variants.success
        ? {}
        : Object.fromEntries(Object.entries(fieldErrors(variants.error)).map(([k, v]) => [`variants.${k}`, v]))),
    };
    return { ok: false, message: "Revisa los campos marcados.", fieldErrors: errors };
  }

  // Tamaños duplicados dentro del formulario
  const keys = variants.data.map((v) => `${v.kind}:${v.sizeMl ?? 0}`);
  if (new Set(keys).size !== keys.length) {
    return { ok: false, message: "Hay dos variantes con el mismo tipo y tamaño." };
  }

  const p = parsed.data;
  const slug = p.slug || slugify(`${p.name}`) || `producto-${Date.now()}`;
  const row = {
    name: p.name,
    brand: p.brand,
    slug,
    description: p.description,
    category_id: p.categoryId,
    gender: p.gender,
    olfactory_family: p.family,
    notes_top: p.notesTop,
    notes_heart: p.notesHeart,
    notes_base: p.notesBase,
    status: p.status,
    is_featured: p.isFeatured,
    is_new: p.isNew,
    is_recommended: p.isRecommended,
    recommendation_text: p.recommendationText,
    sort_order: p.sortOrder,
  };

  let id = productId?.success ? productId.data : null;

  if (id) {
    const { error } = await supabase.from("products").update(row).eq("id", id);
    if (error) return productError(error);
  } else {
    const { data, error } = await supabase.from("products").insert(row).select("id").single();
    if (error || !data) return productError(error);
    id = data.id as string;
  }

  // Sincroniza variantes: actualiza existentes, crea nuevas, borra las quitadas
  const { data: existing, error: exErr } = await supabase.from("product_variants").select("id").eq("product_id", id);
  if (exErr) return { ok: false, message: "No se pudieron leer las variantes." };
  const existingIds = new Set((existing ?? []).map((v) => v.id as string));
  const keepIds = new Set(variants.data.map((v) => v.id).filter((v): v is string => Boolean(v && existingIds.has(v))));

  const toDelete = [...existingIds].filter((vid) => !keepIds.has(vid));
  if (toDelete.length) {
    const { error } = await supabase.from("product_variants").delete().eq("product_id", id).in("id", toDelete);
    if (error) return { ok: false, message: "No se pudieron eliminar variantes antiguas." };
  }

  for (const [index, v] of variants.data.entries()) {
    const variantRow = {
      product_id: id,
      kind: v.kind,
      size_ml: v.sizeMl,
      label: v.label,
      price_cents: v.price,
      compare_at_price_cents: v.compareAtPrice,
      stock: v.stock,
      sku: v.sku,
      is_active: v.isActive,
      sort_order: index,
    };
    const { error } =
      v.id && existingIds.has(v.id)
        ? await supabase.from("product_variants").update(variantRow).eq("id", v.id).eq("product_id", id)
        : await supabase.from("product_variants").insert(variantRow);
    if (error) {
      if (error.code === "23505") {
        return { ok: false, message: `Variante «${v.label}»: tamaño o SKU duplicado.` };
      }
      console.error("[admin] guardar variante", error.code);
      return { ok: false, message: `No se pudo guardar la variante «${v.label}».` };
    }
  }

  invalidateCatalog();

  if (!productId) redirect(`/admin/products/${id}?created=1`);
  return { ok: true, message: "Producto guardado." };
}

function productError(error: { code?: string } | null): ActionState {
  if (error?.code === "23505") {
    return { ok: false, message: "Ya existe un producto con ese slug.", fieldErrors: { slug: "Este slug ya existe" } };
  }
  console.error("[admin] guardar producto", error?.code);
  return { ok: false, message: "No se pudo guardar el producto." };
}

// ---------------------------------------------------------------------
// Eliminar producto (borra también sus imágenes del Storage).
// Los pedidos conservan su copia de nombre/precio.
// ---------------------------------------------------------------------
export async function deleteProduct(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const id = uuid.safeParse(formData.get("productId"));
  if (!id.success) return { ok: false, message: "Producto no válido." };

  const { data: images } = await supabase.from("product_images").select("storage_path").eq("product_id", id.data);
  const paths = (images ?? []).map((i) => i.storage_path as string);
  if (paths.length) await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove(paths);

  const { error } = await supabase.from("products").delete().eq("id", id.data);
  if (error) {
    console.error("[admin] eliminar producto", error.code);
    return { ok: false, message: "No se pudo eliminar. Prueba a archivarlo." };
  }

  invalidateCatalog();
  redirect("/admin/products?deleted=1");
}

// ---------------------------------------------------------------------
// Imágenes
// ---------------------------------------------------------------------
type DetectedImage = { mime: "image/jpeg" | "image/png" | "image/webp" | "image/avif"; ext: "jpg" | "png" | "webp" | "avif" };

/** Detecta el tipo REAL por su firma binaria (no confía en el nombre ni en el MIME enviado). */
function detectImage(bytes: Uint8Array): DetectedImage | null {
  const ascii = (start: number, end: number) => String.fromCharCode(...bytes.slice(start, end));
  if (bytes.length < 12) return null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return { mime: "image/jpeg", ext: "jpg" };
  if (bytes[0] === 0x89 && ascii(1, 4) === "PNG" && bytes[4] === 0x0d && bytes[5] === 0x0a) return { mime: "image/png", ext: "png" };
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return { mime: "image/webp", ext: "webp" };
  if (ascii(4, 8) === "ftyp" && ["avif", "avis"].includes(ascii(8, 12))) return { mime: "image/avif", ext: "avif" };
  return null;
}

export async function uploadProductImage(formData: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const productId = uuid.safeParse(formData.get("productId"));
  const file = formData.get("file");
  if (!productId.success) return { ok: false, message: "Producto no válido." };
  if (!(file instanceof File) || file.size === 0) return { ok: false, message: "Selecciona una imagen." };
  if (file.size > IMAGE_MAX_BYTES) {
    return { ok: false, message: `La imagen supera ${Math.round(IMAGE_MAX_BYTES / 1024 / 1024)} MB.` };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const detected = detectImage(bytes);
  if (!detected) return { ok: false, message: "Formato no permitido. Usa JPG, PNG, WebP o AVIF." };

  const { data: product } = await supabase.from("products").select("id, name").eq("id", productId.data).maybeSingle();
  if (!product) return { ok: false, message: "Producto no encontrado." };

  // Nombre aleatorio: evita colisiones, rutas maliciosas y nombres con datos personales
  const path = `products/${productId.data}/${randomUUID()}.${detected.ext}`;
  const { error: upErr } = await supabase.storage.from(PRODUCT_IMAGES_BUCKET).upload(path, bytes, {
    contentType: detected.mime,
    cacheControl: "31536000",
    upsert: false,
  });
  if (upErr) {
    console.error("[admin] subir imagen", upErr.message);
    return { ok: false, message: "No se pudo subir la imagen." };
  }

  const { data: last } = await supabase
    .from("product_images")
    .select("position")
    .eq("product_id", productId.data)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("product_images").insert({
    product_id: productId.data,
    storage_path: path,
    alt: product.name as string,
    position: last ? (last.position as number) + 1 : 0,
  });
  if (error) {
    await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove([path]);
    console.error("[admin] registrar imagen", error.code);
    return { ok: false, message: "No se pudo registrar la imagen." };
  }

  invalidateCatalog();
  return { ok: true, message: "Imagen subida." };
}

const imageIdSchema = z.object({ imageId: uuid, productId: uuid });

export async function deleteProductImage(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const parsed = imageIdSchema.safeParse(formToObject(formData));
  if (!parsed.success) return { ok: false, message: "Imagen no válida." };

  const { data: image } = await supabase
    .from("product_images")
    .select("id, storage_path")
    .eq("id", parsed.data.imageId)
    .eq("product_id", parsed.data.productId)
    .maybeSingle();
  if (!image) return { ok: false, message: "Imagen no encontrada." };

  await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove([image.storage_path as string]);
  const { error } = await supabase.from("product_images").delete().eq("id", image.id);
  if (error) return { ok: false, message: "No se pudo eliminar la imagen." };

  invalidateCatalog();
  return { ok: true, message: "Imagen eliminada." };
}

export async function setMainImage(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const parsed = imageIdSchema.safeParse(formToObject(formData));
  if (!parsed.success) return { ok: false, message: "Imagen no válida." };

  const { data: images } = await supabase
    .from("product_images")
    .select("id, position")
    .eq("product_id", parsed.data.productId)
    .order("position", { ascending: true });
  const list = images ?? [];
  if (!list.some((i) => i.id === parsed.data.imageId)) return { ok: false, message: "Imagen no encontrada." };

  const ordered = [parsed.data.imageId, ...list.map((i) => i.id as string).filter((i) => i !== parsed.data.imageId)];
  for (const [position, imageId] of ordered.entries()) {
    await supabase.from("product_images").update({ position }).eq("id", imageId).eq("product_id", parsed.data.productId);
  }

  invalidateCatalog();
  return { ok: true, message: "Imagen principal actualizada." };
}

export async function updateImageAlt(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const parsed = imageIdSchema.safeParse(formToObject(formData));
  if (!parsed.success) return { ok: false, message: "Imagen no válida." };
  const alt = cleanText(String(formData.get("alt") ?? "")).slice(0, 200) || null;

  const { error } = await supabase
    .from("product_images")
    .update({ alt })
    .eq("id", parsed.data.imageId)
    .eq("product_id", parsed.data.productId);
  if (error) return { ok: false, message: "No se pudo guardar el texto alternativo." };

  invalidateCatalog();
  return { ok: true, message: "Guardado." };
}
