"use server";

import { updateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { CATALOG_TAG } from "@/lib/catalog";
import { fieldErrors, formToObject } from "@/lib/validation/common";
import { orderNotesSchema, orderStatusSchema } from "@/lib/validation/schemas";
import type { ActionState } from "@/types/domain";

export async function updateOrderStatus(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const parsed = orderStatusSchema.safeParse(formToObject(formData));
  if (!parsed.success) return { ok: false, message: "Datos no válidos.", fieldErrors: fieldErrors(parsed.error) };

  // La función SQL vuelve a comprobar is_admin() y repone stock al cancelar
  const { error } = await supabase.rpc("admin_set_order_status", {
    p_order_id: parsed.data.orderId,
    p_status: parsed.data.status,
  });

  if (error) {
    if (error.message === "ORDER_CANCELLED") {
      return { ok: false, message: "Un pedido cancelado no se puede reabrir (su stock ya se repuso). Crea un pedido nuevo si es necesario." };
    }
    if (error.message === "NOT_FOUND") return { ok: false, message: "Pedido no encontrado." };
    console.error("[admin] cambiar estado", error.code);
    return { ok: false, message: "No se pudo cambiar el estado." };
  }

  if (parsed.data.status === "cancelled") updateTag(CATALOG_TAG);
  return { ok: true, message: "Estado actualizado." };
}

export async function updateOrderNotes(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const parsed = orderNotesSchema.safeParse(formToObject(formData));
  if (!parsed.success) return { ok: false, message: "Revisa las notas.", fieldErrors: fieldErrors(parsed.error) };

  const { error } = await supabase
    .from("orders")
    .update({ admin_notes: parsed.data.adminNotes })
    .eq("id", parsed.data.orderId);

  if (error) {
    console.error("[admin] notas pedido", error.code);
    return { ok: false, message: "No se pudieron guardar las notas." };
  }
  return { ok: true, message: "Notas guardadas." };
}
