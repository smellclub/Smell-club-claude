import "server-only";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { isSupabaseConfigured, publicEnv } from "@/lib/env";

/**
 * Opciones de las cookies de sesión. httpOnly porque toda la
 * autenticación ocurre en el servidor (el navegador nunca lee el token).
 */
export const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

/**
 * Cliente con la sesión del usuario (cookies). Se usa en el panel admin:
 * todas las escrituras pasan por RLS con el rol `authenticated`.
 */
export async function getServerSupabase(): Promise<SupabaseClient | null> {
  // cookies() primero: marca la ruta como dinámica aunque falte configuración
  const cookieStore = await cookies();
  if (!isSupabaseConfigured()) return null;

  return createServerClient(publicEnv.supabaseUrl, publicEnv.supabasePublishableKey, {
    cookieOptions: AUTH_COOKIE_OPTIONS,
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, { ...options, ...AUTH_COOKIE_OPTIONS });
          }
        } catch {
          // Llamado desde un Server Component: el proxy refresca la sesión.
        }
      },
    },
  });
}
