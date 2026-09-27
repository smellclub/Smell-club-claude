"use server";

import { updateTag } from "next/cache";
import { CATALOG_TAG } from "@/lib/catalog";
import { publicEnv } from "@/lib/env";
import { getClientIpHash, isHoneypotFilled, rateLimit } from "@/lib/security";
import { getServiceSupabase } from "@/lib/supabase/admin";
import { fieldErrors, formToObject } from "@/lib/validation/common";
import { cartLinesSchema, checkoutSchema } from "@/lib/validation/schemas";

export type PlacedOrder = {
  orderNumber: string;
  totalCents: number;
  currency: string;
  items: Array<{ name: string; brand: string; label: string; quantity: number; lineTotalCents: number }>;
};

export type CheckoutState =
  | { status: "idle" }
  | { status: "error"; message: string; fieldErrors?: Record<string, string>; problemVariantId?: string }
  | { status: "success"; order: PlacedOrder };

const GENERIC_ERROR = "No hemos podido registrar tu pedido. Inténtalo de nuevo en unos minutos.";

/**
 * Crea un pedido.
 * Seguridad:
 *  - Rate limit por IP (hash) → evita spam y reservas masivas de stock.
 *  - Solo se aceptan IDs de variante y cantidades. Precios, nombres y
 *    totales se leen de la base de datos dentro de create_order.
 *  - Stock validado y descontado de forma atómica (FOR UPDATE).
 *  - Next.js verifica el Origin de las Server Actions (anti-CSRF).
 */
export async function placeOrder(_prev: CheckoutState, formData: FormData): Promise<CheckoutState> {
  if (isHoneypotFilled(formData)) {
    return { status: "error", message: GENERIC_ERROR };
  }

  // Líneas del carrito (JSON pequeño con IDs y cantidades)
  const rawItems = formData.get("items");
  if (typeof rawItems !== "string" || rawItems.length > 10_000) {
    return { status: "error", message: "Carrito no válido." };
  }
  let itemsJson: unknown;
  try {
    itemsJson = JSON.parse(rawItems);
  } catch {
    return { status: "error", message: "Carrito no válido." };
  }
  const items = cartLinesSchema.safeParse(itemsJson);
  if (!items.success) {
    return { status: "error", message: "Tu carrito no es válido o está vacío. Revísalo e inténtalo de nuevo." };
  }

  const parsed = checkoutSchema.safeParse(formToObject(formData));
  if (!parsed.success) {
    return {
      status: "error",
      message: "Revisa los campos marcados.",
      fieldErrors: fieldErrors(parsed.error),
    };
  }

  // Rate limit tras validar (los errores de formulario no consumen intentos)
  const ipHash = await getClientIpHash();
  const allowed = await rateLimit("checkout", ipHash, 5, 600);
  if (!allowed) {
    return {
      status: "error",
      message: "Has realizado varios pedidos seguidos. Espera unos minutos o escríbenos por WhatsApp.",
    };
  }

  const supabase = getServiceSupabase();
  if (!supabase) {
    console.error("[checkout] Supabase no configurado");
    return { status: "error", message: GENERIC_ERROR };
  }

  const c = parsed.data;
  const { data, error } = await supabase.rpc("create_order", {
    p_customer: {
      name: c.name,
      phone: c.phone,
      email: c.email ?? "",
      delivery_method: c.deliveryMethod,
      address: c.address ?? "",
      city: c.city ?? "",
      region: c.region ?? "",
      postal_code: c.postalCode ?? "",
      contact_method: c.contactMethod,
      payment_method: c.paymentMethod,
      notes: c.notes ?? "",
    },
    p_items: items.data.map((i) => ({ variant_id: i.variantId, quantity: i.quantity })),
    p_currency: publicEnv.currency,
    p_ip_hash: ipHash,
  });

  if (error) {
    const msg = error.message ?? "";
    const match = msg.match(/^(OUT_OF_STOCK|UNAVAILABLE):([0-9a-f-]{36})$/);
    if (match) {
      return {
        status: "error",
        problemVariantId: match[2],
        message:
          match[1] === "OUT_OF_STOCK"
            ? "Uno de los productos ya no tiene stock suficiente. Hemos actualizado tu carrito; revísalo y vuelve a intentarlo."
            : "Uno de los productos ya no está disponible. Hemos actualizado tu carrito; revísalo y vuelve a intentarlo.",
      };
    }
    // No se revelan detalles internos al cliente
    console.error("[checkout] create_order falló", error.code);
    return { status: "error", message: GENERIC_ERROR };
  }

  const result = data as {
    order_number: string;
    total_cents: number;
    currency: string;
    items: Array<{ product_name: string; product_brand: string; variant_label: string; quantity: number; line_total_cents: number }>;
  };

  // El stock ha cambiado: invalida el catálogo cacheado
  updateTag(CATALOG_TAG);

  return {
    status: "success",
    order: {
      orderNumber: result.order_number,
      totalCents: result.total_cents,
      currency: result.currency,
      items: result.items.map((i) => ({
        name: i.product_name,
        brand: i.product_brand,
        label: i.variant_label,
        quantity: i.quantity,
        lineTotalCents: i.line_total_cents,
      })),
    },
  };
}
