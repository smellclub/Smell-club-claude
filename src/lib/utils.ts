export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

/** "Honor & Glory" → "honor-and-glory"; "Éclaire" → "eclaire" */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 140)
    .replace(/-+$/g, "");
}

/** Normaliza texto para búsquedas sin tildes ni mayúsculas */
export function normalizeForSearch(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

export function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

export function formatDate(iso: string, withTime = true): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    ...(withTime ? { timeStyle: "short" } : {}),
    timeZone: "Europe/Madrid",
  }).format(d);
}

/**
 * Serializa JSON-LD de forma segura para <script>: escapa "<" para que
 * ningún texto (p. ej. una descripción) pueda cerrar la etiqueta (XSS).
 */
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c").replace(/[\u2028\u2029]/g, "");
}
