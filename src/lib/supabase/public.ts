import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, publicEnv } from "@/lib/env";

let client: SupabaseClient | null = null;

/**
 * Cliente anónimo SIN cookies para leer el catálogo público.
 * Permite cachear/generar páginas estáticas. Solo ve lo que RLS permite
 * al rol `anon` (productos activos).
 */
export function getPublicSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (!client) {
    client = createClient(publicEnv.supabaseUrl, publicEnv.supabasePublishableKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  }
  return client;
}
