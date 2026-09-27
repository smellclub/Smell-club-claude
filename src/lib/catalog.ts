import "server-only";
import { unstable_cache } from "next/cache";
import { GENDERS, OLFACTORY_FAMILIES, PRODUCT_STATUSES, VARIANT_KINDS } from "@/lib/constants";
import { getPublicSupabase } from "@/lib/supabase/public";
import { sortVariants, storagePublicUrl } from "@/lib/product";
import type { Category, Product, Variant } from "@/types/domain";

export const CATALOG_TAG = "catalog";

export const PRODUCT_SELECT = `
  id, name, brand, slug, description, status, gender, olfactory_family,
  notes_top, notes_heart, notes_base, is_featured, is_new, is_recommended,
  recommendation_text, sort_order, created_at, updated_at,
  category:categories ( id, name, slug ),
  variants:product_variants ( id, kind, size_ml, label, price_cents, compare_at_price_cents, stock, sku, is_active, sort_order ),
  images:product_images ( id, storage_path, alt, position )
`;

type Row = Record<string, unknown>;

const str = (v: unknown): string => (typeof v === "string" ? v : "");
const num = (v: unknown): number => (typeof v === "number" && Number.isFinite(v) ? v : 0);
const nullableNum = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);
const nullableStr = (v: unknown): string | null => (typeof v === "string" && v.length ? v : null);
const strArray = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);

function oneOf<T extends string>(list: readonly { value: T }[], v: unknown): T | null {
  return list.find((o) => o.value === v)?.value ?? null;
}

function mapVariant(r: Row): Variant {
  return {
    id: str(r.id),
    kind: oneOf(VARIANT_KINDS, r.kind) ?? "bottle",
    sizeMl: nullableNum(r.size_ml),
    label: str(r.label),
    priceCents: num(r.price_cents),
    compareAtPriceCents: nullableNum(r.compare_at_price_cents),
    stock: num(r.stock),
    sku: nullableStr(r.sku),
    isActive: r.is_active === true,
    sortOrder: num(r.sort_order),
  };
}

export function mapProduct(r: Row): Product {
  const category = (Array.isArray(r.category) ? r.category[0] : r.category) as Row | null | undefined;
  const variants = Array.isArray(r.variants) ? (r.variants as Row[]).map(mapVariant) : [];
  const images = Array.isArray(r.images)
    ? (r.images as Row[])
        .map((i) => ({
          id: str(i.id),
          path: str(i.storage_path),
          url: storagePublicUrl(str(i.storage_path)),
          alt: nullableStr(i.alt),
          position: num(i.position),
        }))
        .sort((a, b) => a.position - b.position)
    : [];

  return {
    id: str(r.id),
    name: str(r.name),
    brand: str(r.brand),
    slug: str(r.slug),
    description: str(r.description),
    status: oneOf(PRODUCT_STATUSES, r.status) ?? "draft",
    category: category ? { id: str(category.id), name: str(category.name), slug: str(category.slug) } : null,
    gender: oneOf(GENDERS, r.gender),
    family: oneOf(OLFACTORY_FAMILIES, r.olfactory_family),
    notes: { top: strArray(r.notes_top), heart: strArray(r.notes_heart), base: strArray(r.notes_base) },
    isFeatured: r.is_featured === true,
    isNew: r.is_new === true,
    isRecommended: r.is_recommended === true,
    recommendationText: nullableStr(r.recommendation_text),
    sortOrder: num(r.sort_order),
    createdAt: str(r.created_at),
    updatedAt: str(r.updated_at),
    variants: sortVariants(variants),
    images,
  };
}

export function mapCategory(r: Row): Category {
  return {
    id: str(r.id),
    name: str(r.name),
    slug: str(r.slug),
    description: nullableStr(r.description),
    sortOrder: num(r.sort_order),
    isActive: r.is_active === true,
  };
}

class CatalogUnavailableError extends Error {}

/**
 * Las funciones cacheadas LANZAN si falla la carga (o falta configuración):
 * unstable_cache no guarda errores, así que nunca se cachea un catálogo
 * vacío por un fallo temporal. Los envoltorios públicos devuelven [].
 */
const cachedProducts = unstable_cache(
  async (): Promise<Product[]> => {
    const supabase = getPublicSupabase();
    if (!supabase) throw new CatalogUnavailableError("Supabase no configurado");
    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("status", "active")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(1000);
    if (error) throw new CatalogUnavailableError(error.code);
    return (data as Row[]).map(mapProduct);
  },
  ["catalog-products-v2"],
  { tags: [CATALOG_TAG], revalidate: 300 },
);

const cachedCategories = unstable_cache(
  async (): Promise<Category[]> => {
    const supabase = getPublicSupabase();
    if (!supabase) throw new CatalogUnavailableError("Supabase no configurado");
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, slug, description, sort_order, is_active")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (error) throw new CatalogUnavailableError(error.code);
    return (data as Row[]).map(mapCategory);
  },
  ["catalog-categories-v2"],
  { tags: [CATALOG_TAG], revalidate: 300 },
);

/** Catálogo público completo (se invalida al editar en el admin o al crear pedidos). */
export async function getCatalog(): Promise<Product[]> {
  try {
    return await cachedProducts();
  } catch (e) {
    console.error("[catalog] productos no disponibles:", e instanceof Error ? e.message : "error");
    return [];
  }
}

export async function getCategories(): Promise<Category[]> {
  try {
    return await cachedCategories();
  } catch (e) {
    console.error("[catalog] categorías no disponibles:", e instanceof Error ? e.message : "error");
    return [];
  }
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const products = await getCatalog();
  return products.find((p) => p.slug === slug) ?? null;
}
