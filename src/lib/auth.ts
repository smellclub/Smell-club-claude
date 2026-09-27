import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getServerSupabase } from "@/lib/supabase/server";

export type AdminSession = {
  userId: string;
  email: string;
  role: "owner" | "admin";
  supabase: SupabaseClient;
};

/**
 * Devuelve la sesión SOLO si el usuario está autenticado (token validado
 * contra Supabase Auth con getUser) y figura en admin_users.
 * Cacheado por petición.
 */
export const getAdminSession = cache(async (): Promise<AdminSession | null> => {
  const supabase = await getServerSupabase();
  if (!supabase) return null;

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;

  const { data: admin } = await supabase
    .from("admin_users")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!admin) return null;

  return {
    userId: user.id,
    email: user.email ?? "",
    role: admin.role === "owner" ? "owner" : "admin",
    supabase,
  };
});

/** Para páginas y Server Actions del panel: redirige si no es admin. */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return session;
}
