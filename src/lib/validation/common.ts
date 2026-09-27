import { z } from "zod";

/**
 * Limpia texto de entrada: normaliza Unicode, elimina caracteres de
 * control (y saltos de línea si no es multilínea) y espacios sobrantes.
 * React escapa todo al renderizar (anti-XSS); esto evita basura invisible.
 */
export function cleanText(value: string, multiline = false): string {
  const normalized = value.normalize("NFC");
  const stripped = multiline
    ? normalized.replace(/\r\n?/g, "\n").replace(/[\u0000-\u0009\u000B-\u001F\u007F\u200B-\u200F\u202A-\u202E\u2066-\u2069]/g, "")
    : normalized.replace(/[\u0000-\u001F\u007F\u200B-\u200F\u202A-\u202E\u2066-\u2069]/g, " ");
  return multiline
    ? stripped.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim()
    : stripped.replace(/\s+/g, " ").trim();
}

export const text = (min: number, max: number, label = "Este campo") =>
  z
    .string({ error: `${label} es obligatorio` })
    .transform((v) => cleanText(v))
    .pipe(
      z
        .string()
        .min(min, min <= 1 ? `${label} es obligatorio` : `${label}: mínimo ${min} caracteres`)
        .max(max, `${label}: máximo ${max} caracteres`),
    );

export const multilineText = (max: number, label = "Este campo") =>
  z
    .string()
    .transform((v) => cleanText(v, true))
    .pipe(z.string().max(max, `${label}: máximo ${max} caracteres`));

/** Texto opcional: "" → null */
export const optionalText = (max: number, label = "Este campo", multiline = false) =>
  z
    .string()
    .optional()
    .transform((v) => (v ? cleanText(v, multiline) : ""))
    .pipe(z.string().max(max, `${label}: máximo ${max} caracteres`))
    .transform((v) => (v === "" ? null : v));

export const phone = z
  .string({ error: "El teléfono es obligatorio" })
  .transform((v) => cleanText(v))
  .pipe(z.string().regex(/^[0-9+() .-]{6,30}$/, "Teléfono no válido"))
  .refine((v) => v.replace(/\D/g, "").length >= 6, "Teléfono no válido");

export const optionalEmail = z
  .string()
  .optional()
  .transform((v) => (v ? cleanText(v).toLowerCase() : ""))
  .pipe(z.union([z.literal(""), z.email("Email no válido").max(254)]))
  .transform((v) => (v === "" ? null : v));

export const uuid = z.guid("Identificador no válido");

export const slug = z
  .string()
  .transform((v) => v.trim().toLowerCase())
  .pipe(
    z
      .string()
      .max(140, "Slug demasiado largo")
      .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug: solo minúsculas, números y guiones"),
  );

/** Casilla de formulario: ausente (desmarcada) → false */
export const checkbox = z
  .string()
  .nullish()
  .transform((v) => v === "on" || v === "true" || v === "1");

/** Convierte errores de Zod en { campo: mensaje } */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/** FormData → objeto plano (solo strings; ignora archivos) */
export function formToObject(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string" && !key.startsWith("$ACTION")) out[key] = value;
  }
  return out;
}
