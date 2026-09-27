/**
 * Variables PÚBLICAS (NEXT_PUBLIC_*). Se incrustan en el navegador:
 * aquí nunca debe haber secretos. Los secretos están en env.server.ts.
 */

function clean(value: string | undefined): string {
  return (value ?? "").trim();
}

function parseSiteUrl(value: string): string {
  try {
    const url = new URL(value);
    return url.origin;
  } catch {
    return "http://localhost:3000";
  }
}

function parseWhatsapp(value: string): string {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15 ? digits : "";
}

function parseInstagram(value: string): string {
  try {
    const url = new URL(value);
    const okHost = url.hostname === "instagram.com" || url.hostname === "www.instagram.com";
    return url.protocol === "https:" && okHost ? url.toString() : "";
  } catch {
    return "";
  }
}

function parseEmail(value: string): string {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value) && value.length <= 254 ? value : "";
}

const currency = clean(process.env.NEXT_PUBLIC_CURRENCY).toUpperCase();
const locale = clean(process.env.NEXT_PUBLIC_LOCALE);

export const publicEnv = {
  siteUrl: parseSiteUrl(clean(process.env.NEXT_PUBLIC_SITE_URL)),
  supabaseUrl: clean(process.env.NEXT_PUBLIC_SUPABASE_URL),
  supabasePublishableKey: clean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
  currency: /^[A-Z]{3}$/.test(currency) ? currency : "EUR",
  locale: /^[a-z]{2}(-[A-Z]{2})?$/.test(locale) ? locale : "es-ES",
  whatsappNumber: parseWhatsapp(clean(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER)),
  instagramUrl: parseInstagram(clean(process.env.NEXT_PUBLIC_INSTAGRAM_URL)),
  contactEmail: parseEmail(clean(process.env.NEXT_PUBLIC_CONTACT_EMAIL)),
} as const;

export function isSupabaseConfigured(): boolean {
  return Boolean(publicEnv.supabaseUrl && publicEnv.supabasePublishableKey);
}
