"use server";

import { getClientIpHash, isHoneypotFilled, rateLimit } from "@/lib/security";
import { getServiceSupabase } from "@/lib/supabase/admin";
import { fieldErrors, formToObject } from "@/lib/validation/common";
import { contactSchema } from "@/lib/validation/schemas";
import type { ActionState } from "@/types/domain";

export async function sendContactMessage(_prev: ActionState, formData: FormData): Promise<ActionState> {
  // A los bots se les responde "ok" para no darles pistas
  if (isHoneypotFilled(formData)) return { ok: true, message: "¡Mensaje enviado! Te responderemos pronto." };

  const parsed = contactSchema.safeParse(formToObject(formData));
  if (!parsed.success) {
    return { ok: false, message: "Revisa los campos marcados.", fieldErrors: fieldErrors(parsed.error) };
  }

  const ipHash = await getClientIpHash();
  if (!(await rateLimit("contact", ipHash, 3, 900))) {
    return { ok: false, message: "Has enviado varios mensajes seguidos. Inténtalo más tarde." };
  }

  const supabase = getServiceSupabase();
  if (!supabase) return { ok: false, message: "No se pudo enviar el mensaje. Inténtalo más tarde." };

  const { error } = await supabase.from("contact_messages").insert({
    name: parsed.data.name,
    email: parsed.data.email,
    phone: parsed.data.phone,
    message: parsed.data.message,
    ip_hash: ipHash,
  });

  if (error) {
    console.error("[contact] insert falló", error.code);
    return { ok: false, message: "No se pudo enviar el mensaje. Inténtalo más tarde." };
  }

  return { ok: true, message: "¡Mensaje enviado! Te responderemos lo antes posible." };
}
