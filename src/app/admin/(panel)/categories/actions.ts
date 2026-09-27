"use server";

import { revalidatePath, updateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { CATALOG_TAG } from "@/lib/catalog";
import { slugify } from "@/lib/utils";
import { fieldErrors, formToObject, uuid } from "@/lib/validation/common";
import { categorySchema } from "@/lib/validation/schemas";
import type { ActionState } from "@/types/domain";

export async function saveCategory(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const raw = formToObject(formData);
  const id = raw.categoryId ? uuid.safeParse(raw.categoryId) : null;
  if (id && !id.success) return { ok: false, message: "Categoría no válida." };

  const parsed = categorySchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: "Revisa los campos.", fieldErrors: fieldErrors(parsed.error) };

  const c = parsed.data;
  const row = {
    name: c.name,
    slug: c.slug || slugify(c.name),
    description: c.description,
    sort_order: c.sortOrder,
    is_active: c.isActive,
  };
  if (!row.slug) return { ok: false, message: "El slug no es válido.", fieldErrors: { slug: "Slug no válido" } };

  const { error } = id?.success
    ? await supabase.from("categories").update(row).eq("id", id.data)
    : await supabase.from("categories").insert(row);

  if (error) {
    if (error.code === "23505") return { ok: false, message: "Ya existe una categoría con ese slug.", fieldErrors: { slug: "Slug duplicado" } };
    console.error("[admin] guardar categoría", error.code);
    return { ok: false, message: "No se pudo guardar la categoría." };
  }

  updateTag(CATALOG_TAG);
  revalidatePath("/", "layout");
  return { ok: true, message: id ? "Categoría actualizada." : "Categoría creada." };
}

export async function deleteCategory(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const id = uuid.safeParse(formData.get("categoryId"));
  if (!id.success) return { ok: false, message: "Categoría no válida." };

  // Los productos de esta categoría quedan "sin categoría" (ON DELETE SET NULL)
  const { error } = await supabase.from("categories").delete().eq("id", id.data);
  if (error) return { ok: false, message: "No se pudo eliminar la categoría." };

  updateTag(CATALOG_TAG);
  revalidatePath("/", "layout");
  return { ok: true, message: "Categoría eliminada." };
}
