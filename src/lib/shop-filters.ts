import { z } from "zod";
import { GENDERS, OLFACTORY_FAMILIES, values } from "@/lib/constants";
import { hasDecants, isInStock, maxDiscount, minPriceCents } from "@/lib/product";
import { normalizeForSearch } from "@/lib/utils";
import type { Product } from "@/types/domain";

export const SORT_OPTIONS = [
  { value: "featured", label: "Destacados" },
  { value: "newest", label: "Novedades" },
  { value: "price-asc", label: "Precio: menor a mayor" },
  { value: "price-desc", label: "Precio: mayor a menor" },
  { value: "name", label: "Nombre (A-Z)" },
] as const;

const one = (v: unknown) => (Array.isArray(v) ? v[0] : v);

const optionalEnum = <T extends [string, ...string[]]>(options: T) =>
  z.preprocess(one, z.enum(options).optional().catch(undefined));

// Un campo vacío del formulario ("min=") NO es 0: se ignora. Si no, el
// formulario de búsqueda (que envía min= y max= vacíos) dejaba 0 resultados.
const optionalPrice = z.preprocess(
  (v) => {
    const x = one(v);
    return typeof x === "string" && x.trim() === "" ? undefined : x;
  },
  z.coerce.number().min(0).max(1_000_000).optional().catch(undefined),
);

/** Parámetros de URL validados: cualquier valor no reconocido se ignora. */
export const shopParamsSchema = z.object({
  q: z.preprocess(one, z.string().max(80).optional().catch(undefined)),
  category: z.preprocess(one, z.string().regex(/^[a-z0-9-]{1,100}$/).optional().catch(undefined)),
  gender: optionalEnum(values(GENDERS)),
  family: optionalEnum(values(OLFACTORY_FAMILIES)),
  min: optionalPrice,
  max: optionalPrice,
  sort: optionalEnum(SORT_OPTIONS.map((s) => s.value) as [string, ...string[]]),
  available: z.preprocess(one, z.literal("1").optional().catch(undefined)),
  decants: z.preprocess(one, z.literal("1").optional().catch(undefined)),
  offers: z.preprocess(one, z.literal("1").optional().catch(undefined)),
});

export type ShopParams = z.infer<typeof shopParamsSchema>;

export function parseShopParams(raw: Record<string, string | string[] | undefined>): ShopParams {
  const parsed = shopParamsSchema.safeParse(raw);
  return parsed.success ? parsed.data : {};
}

export function filterProducts(products: Product[], params: ShopParams): Product[] {
  const q = params.q ? normalizeForSearch(params.q) : "";
  const minCents = params.min !== undefined ? Math.round(params.min * 100) : undefined;
  const maxCents = params.max !== undefined ? Math.round(params.max * 100) : undefined;

  const result = products.filter((p) => {
    if (q) {
      const haystack = normalizeForSearch(
        [p.name, p.brand, p.category?.name ?? "", ...p.notes.top, ...p.notes.heart, ...p.notes.base].join(" "),
      );
      if (!q.split(/\s+/).every((term) => haystack.includes(term))) return false;
    }
    if (params.category && p.category?.slug !== params.category) return false;
    if (params.gender && p.gender !== params.gender) return false;
    if (params.family && p.family !== params.family) return false;
    if (params.available && !isInStock(p)) return false;
    if (params.decants && !hasDecants(p)) return false;
    if (params.offers && maxDiscount(p) <= 0) return false;
    if (minCents !== undefined || maxCents !== undefined) {
      const price = minPriceCents(p);
      if (price === null) return false;
      if (minCents !== undefined && price < minCents) return false;
      if (maxCents !== undefined && price > maxCents) return false;
    }
    return true;
  });

  const byPrice = (p: Product, fallback: number) => minPriceCents(p) ?? fallback;

  switch (params.sort) {
    case "newest":
      return result.sort((a, b) => Number(b.isNew) - Number(a.isNew) || b.createdAt.localeCompare(a.createdAt));
    case "price-asc":
      return result.sort((a, b) => byPrice(a, Infinity) - byPrice(b, Infinity));
    case "price-desc":
      return result.sort((a, b) => byPrice(b, -Infinity) - byPrice(a, -Infinity));
    case "name":
      return result.sort((a, b) => a.name.localeCompare(b.name, "es"));
    default:
      return result.sort(
        (a, b) =>
          Number(b.isFeatured) - Number(a.isFeatured) ||
          Number(isInStock(b)) - Number(isInStock(a)) ||
          a.sortOrder - b.sortOrder,
      );
  }
}

export function hasActiveFilters(params: ShopParams): boolean {
  return Object.entries(params).some(([key, value]) => key !== "sort" && value !== undefined && value !== "");
}
