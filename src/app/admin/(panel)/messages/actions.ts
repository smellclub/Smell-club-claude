"use server";

import { requireAdmin } from "@/lib/auth";
import { uuid } from "@/lib/validation/common";
import type { ActionState } from "@/types/domain";

export async function toggleMessageRead(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const id = uuid.safeParse(formData.get("messageId"));
  if (!id.success) return { ok: false, message: "Mensaje no válido." };
  const isRead = formData.get("isRead") === "true";

  const { error } = await supabase.from("contact_messages").update({ is_read: isRead }).eq("id", id.data);
  if (error) return { ok: false, message: "No se pudo actualizar." };
  return { ok: true };
}

export async function deleteMessage(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const id = uuid.safeParse(formData.get("messageId"));
  if (!id.success) return { ok: false, message: "Mensaje no válido." };

  const { error } = await supabase.from("contact_messages").delete().eq("id", id.data);
  if (error) return { ok: false, message: "No se pudo eliminar." };
  return { ok: true };
}
