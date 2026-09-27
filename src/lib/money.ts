import { publicEnv } from "@/lib/env";

const formatters = new Map<string, Intl.NumberFormat>();

function formatter(currency: string): Intl.NumberFormat {
  let f = formatters.get(currency);
  if (!f) {
    f = new Intl.NumberFormat(publicEnv.locale, { style: "currency", currency });
    formatters.set(currency, f);
  }
  return f;
}

/** Formatea céntimos → "25,00 €" */
export function formatPrice(cents: number, currency: string = publicEnv.currency): string {
  return formatter(currency).format(cents / 100);
}

/**
 * Convierte texto del formulario ("25", "25,5", "25.50") a céntimos.
 * Devuelve null si no es un importe válido.
 */
export function parsePriceToCents(input: string): number | null {
  const normalized = input.trim().replace(/\s/g, "").replace(",", ".");
  if (!/^\d{1,7}(\.\d{1,2})?$/.test(normalized)) return null;
  const [intPart, decPart = ""] = normalized.split(".");
  return Number(intPart) * 100 + Number(decPart.padEnd(2, "0"));
}

/** Céntimos → texto editable "25.50" */
export function centsToInput(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return "";
  return (cents / 100).toFixed(2);
}

export function discountPercent(priceCents: number, compareAtCents: number | null): number {
  if (!compareAtCents || compareAtCents <= priceCents || priceCents <= 0) return 0;
  return Math.round((1 - priceCents / compareAtCents) * 100);
}
