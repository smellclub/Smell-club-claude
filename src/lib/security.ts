import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { serverEnv } from "@/lib/env.server";
import { getServiceSupabase } from "@/lib/supabase/admin";

/**
 * IP del cliente. En Vercel, x-forwarded-for lo fija la plataforma
 * (el primer valor es la IP real del visitante).
 */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || h.get("x-real-ip")?.trim() || "unknown";
  return ip.slice(0, 64);
}

/** Hash SHA-256 con sal: nunca guardamos IPs en claro. */
export function hashIdentifier(value: string): string {
  return createHash("sha256")
    .update(`${serverEnv.rateLimitSalt}:${value}`)
    .digest("hex");
}

export async function getClientIpHash(): Promise<string> {
  return hashIdentifier(await getClientIp());
}

/**
 * Rate limiting persistente en PostgreSQL (funciona en serverless).
 * Devuelve true si se permite la acción. Si algo falla → bloquea
 * (fail-closed) para no dejar la puerta abierta a abusos.
 */
export async function rateLimit(
  action: string,
  identifier: string,
  max: number,
  windowSeconds: number,
): Promise<boolean> {
  const supabase = getServiceSupabase();
  if (!supabase) return false;
  const { data, error } = await supabase.rpc("rate_limit_hit", {
    p_key: `${action}:${identifier}`,
    p_max: max,
    p_window_seconds: windowSeconds,
  });
  if (error) {
    console.error("[rate-limit] error", error.code);
    return false;
  }
  return data === true;
}

/** Campo trampa anti-bots: si viene relleno, es un bot. */
export function isHoneypotFilled(formData: FormData): boolean {
  const value = formData.get("website");
  return typeof value === "string" && value.trim().length > 0;
}
