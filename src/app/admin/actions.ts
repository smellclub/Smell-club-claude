"use server";

import { redirect } from "next/navigation";
import { getClientIpHash, hashIdentifier, rateLimit } from "@/lib/security";
import { getServerSupabase } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validation/schemas";
import type { ActionState } from "@/types/domain";

const INVALID = "Email o contraseña incorrectos.";

/**
 * Login del panel. Mensaje genérico (no revela si el email existe),
 * rate limit por IP y por email, y cierre de sesión inmediato si el
 * usuario no es administrador.
 */
export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email") ?? "",
    password: formData.get("password") ?? "",
  });
  if (!parsed.success) return { ok: false, message: INVALID };

  const ipHash = await getClientIpHash();
  const [ipOk, emailOk] = await Promise.all([
    rateLimit("login-ip", ipHash, 10, 900),
    rateLimit("login-email", hashIdentifier(parsed.data.email), 5, 900),
  ]);
  if (!ipOk || !emailOk) {
    return { ok: false, message: "Demasiados intentos. Espera 15 minutos y vuelve a intentarlo." };
  }

  const supabase = await getServerSupabase();
  if (!supabase) return { ok: false, message: "El panel no está configurado todavía (faltan variables de Supabase)." };

  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error || !data.user) return { ok: false, message: INVALID };

  const { data: admin } = await supabase.from("admin_users").select("user_id").eq("user_id", data.user.id).maybeSingle();
  if (!admin) {
    await supabase.auth.signOut();
    return { ok: false, message: INVALID };
  }

  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  const supabase = await getServerSupabase();
  if (supabase) await supabase.auth.signOut();
  redirect("/admin/login");
}
