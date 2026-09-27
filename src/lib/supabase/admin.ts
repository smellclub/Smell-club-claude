import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/env";
import { serverEnv } from "@/lib/env.server";

let client: SupabaseClient | null = null;

/**
 * Cliente con la clave SECRETA (ignora RLS). Uso MUY restringido:
 *  - crear pedidos mediante la función SQL create_order
 *  - guardar mensajes de contacto
 *  - rate limiting
 * Nunca se usa para acciones del panel admin (esas usan la sesión + RLS).
 */
export function getServiceSupabase(): SupabaseClient | null {
  if (!publicEnv.supabaseUrl || !serverEnv.supabaseSecretKey) return null;
  if (!client) {
    client = createClient(publicEnv.supabaseUrl, serverEnv.supabaseSecretKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  }
  return client;
}
