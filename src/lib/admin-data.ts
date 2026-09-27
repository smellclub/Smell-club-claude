import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { mapCategory, mapProduct, PRODUCT_SELECT } from "@/lib/catalog";
import type { Category, Product } from "@/types/domain";

/** Consultas del panel: usan la sesión del admin (RLS permite ver borradores). */

export async function adminListProducts(supabase: SupabaseClient): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(2000);
  if (error) {
    console.error("[admin] listar productos", error.code);
    return [];
  }
  return (data as Record<string, unknown>[]).map(mapProduct);
}

export async function adminGetProduct(supabase: SupabaseClient, id: string): Promise<Product | null> {
  const { data } = await supabase.from("products").select(PRODUCT_SELECT).eq("id", id).maybeSingle();
  return data ? mapProduct(data as Record<string, unknown>) : null;
}

export async function adminListCategories(supabase: SupabaseClient): Promise<Category[]> {
  const { data } = await supabase
    .from("categories")
    .select("id, name, slug, description, sort_order, is_active")
    .order("sort_order", { ascending: true });
  return ((data ?? []) as Record<string, unknown>[]).map(mapCategory);
}
