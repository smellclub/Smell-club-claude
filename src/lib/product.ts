import type { Product, Variant } from "@/types/domain";
import { discountPercent } from "@/lib/money";
import { publicEnv } from "@/lib/env";
import { PRODUCT_IMAGES_BUCKET } from "@/lib/constants";

/** Una variante se puede comprar si tiene precio real y stock. */
export function isPurchasable(v: Variant): boolean {
  return v.isActive && v.priceCents > 0 && v.stock > 0;
}

export function hasPrice(v: Variant): boolean {
  return v.isActive && v.priceCents > 0;
}

export function pricedVariants(p: Product): Variant[] {
  return p.variants.filter(hasPrice);
}

export function minPriceCents(p: Product, kind?: Variant["kind"]): number | null {
  const prices = pricedVariants(p)
    .filter((v) => !kind || v.kind === kind)
    .map((v) => v.priceCents);
  return prices.length ? Math.min(...prices) : null;
}

export function isInStock(p: Product): boolean {
  return p.variants.some(isPurchasable);
}

export function hasDecants(p: Product): boolean {
  return p.variants.some((v) => v.isActive && v.kind === "decant");
}

export function maxDiscount(p: Product): number {
  return Math.max(0, ...pricedVariants(p).map((v) => discountPercent(v.priceCents, v.compareAtPriceCents)));
}

export function mainImage(p: Product) {
  return p.images[0] ?? null;
}

export function storagePublicUrl(path: string): string {
  const safePath = path.split("/").map(encodeURIComponent).join("/");
  return `${publicEnv.supabaseUrl}/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/${safePath}`;
}

export function sortVariants(variants: Variant[]): Variant[] {
  return [...variants].sort(
    (a, b) =>
      a.sortOrder - b.sortOrder ||
      (a.kind === b.kind ? 0 : a.kind === "decant" ? -1 : 1) ||
      (a.sizeMl ?? 9999) - (b.sizeMl ?? 9999),
  );
}
