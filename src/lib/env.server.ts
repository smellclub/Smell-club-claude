import "server-only";

/**
 * Variables SECRETAS. `server-only` hace fallar la compilación si algún
 * componente de cliente importa este archivo por error.
 */
export const serverEnv = {
  supabaseSecretKey: (process.env.SUPABASE_SECRET_KEY ?? "").trim(),
  rateLimitSalt: (process.env.RATE_LIMIT_SALT ?? "").trim(),
} as const;
