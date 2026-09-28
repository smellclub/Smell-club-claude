"use server";

import { z } from "zod";
import { MAX_CART_LINES } from "@/lib/constants";
import { mapProduct, PRODUCT_SELECT, publicView } from "@/lib/catalog";
import { mainImage } from "@/lib/product";
import { getPublicSupabase } from "@/lib/supabase/public";
import { uuid } from "@/lib/validation/common";

export type FreshVariant = {
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  brand: string;
  label: string;
  priceCents: number;
  stock: number;
  image: string | null;
  available: boolean;
};

const idsSchema = z.array(uuid).max(MAX_CART_LINES);

/**
 * Devuelve el precio y stock ACTUALES de las variantes del carrito.
 * Solo datos públicos del catálogo (mismo nivel de acceso que la tienda).
 */
export async function refreshCart(variantIds: unknown): Promise<FreshVariant[]> {
  const parsed = idsSchema.safeParse(variantIds);
  if (!parsed.success || parsed.data.length === 0) return [];

  const supabase = getPublicSupabase();
  if (!supabase) return [];

  const { data: variantRows, error } = await supabase
    .from("product_variants")
    .select("id, product_id")
    .in("id", [...new Set(parsed.data)]);
  if (error || !variantRows) return [];

  const productIds = [...new Set(variantRows.map((v) => v.product_id as string))];
  if (productIds.length === 0) return [];

  const { data: productRows, error: pError } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .in("id", productIds)
    .eq("status", "active");
  if (pError || !productRows) return [];

  const out: FreshVariant[] = [];
  for (const row of productRows as Record<string, unknown>[]) {
    const product = publicView(mapProduct(row));
    const image = mainImage(product);
    for (const v of product.variants) {
      if (!parsed.data.includes(v.id)) continue;
      out.push({
        variantId: v.id,
        productId: product.id,
        slug: product.slug,
        name: product.name,
        brand: product.brand,
        label: v.label,
        priceCents: v.priceCents,
        stock: v.stock,
        image: image?.url ?? null,
        available: v.isActive && v.priceCents > 0 && v.stock > 0,
      });
    }
  }
  return out;
}
