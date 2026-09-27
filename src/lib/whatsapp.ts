import { publicEnv } from "@/lib/env";

/** Devuelve el enlace wa.me con mensaje, o null si no hay número configurado. */
export function whatsappLink(message?: string, number: string = publicEnv.whatsappNumber): string | null {
  const digits = number.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15) return null;
  const text = message ? `?text=${encodeURIComponent(message.slice(0, 1500))}` : "";
  return `https://wa.me/${digits}${text}`;
}
