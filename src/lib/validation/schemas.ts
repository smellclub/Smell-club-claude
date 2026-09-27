import { z } from "zod";
import {
  CONTACT_METHODS,
  DELIVERY_METHODS,
  GENDERS,
  MAX_CART_LINES,
  MAX_QTY_PER_ITEM,
  OLFACTORY_FAMILIES,
  ORDER_STATUSES,
  PAYMENT_METHODS,
  PRODUCT_STATUSES,
  VARIANT_KINDS,
  values,
} from "@/lib/constants";
import { parsePriceToCents } from "@/lib/money";
import {
  checkbox,
  cleanText,
  multilineText,
  optionalEmail,
  optionalText,
  phone,
  slug,
  text,
  uuid,
} from "@/lib/validation/common";

// ---------------------------------------------------------------------
// Carrito / pedido (solo IDs y cantidades: el precio NUNCA viene del cliente)
// ---------------------------------------------------------------------
export const cartLineSchema = z.object({
  variantId: uuid,
  quantity: z.number().int().min(1).max(MAX_QTY_PER_ITEM),
});

export const cartLinesSchema = z.array(cartLineSchema).min(1, "El carrito está vacío").max(MAX_CART_LINES);

export const checkoutSchema = z
  .object({
    name: text(2, 120, "El nombre"),
    phone,
    email: optionalEmail,
    deliveryMethod: z.enum(values(DELIVERY_METHODS), { error: "Elige un método de entrega" }),
    address: optionalText(300, "La dirección"),
    city: optionalText(100, "La ciudad"),
    region: optionalText(100, "La provincia"),
    postalCode: optionalText(20, "El código postal"),
    contactMethod: z.enum(values(CONTACT_METHODS), { error: "Elige cómo contactarte" }),
    paymentMethod: z.enum(values(PAYMENT_METHODS), { error: "Elige un método de pago" }),
    notes: optionalText(1000, "Las notas", true),
    acceptTerms: z.literal("on", { error: "Debes aceptar los términos y la política de privacidad" }),
  })
  // `when`: se evalúan aunque otros campos tengan errores (todos los avisos a la vez)
  .refine((d) => d.deliveryMethod !== "shipping" || Boolean(d.address), {
    path: ["address"],
    message: "La dirección es obligatoria",
    when: () => true,
  })
  .refine((d) => d.deliveryMethod !== "shipping" || Boolean(d.city), {
    path: ["city"],
    message: "La ciudad es obligatoria",
    when: () => true,
  })
  .refine((d) => d.contactMethod !== "email" || Boolean(d.email), {
    path: ["email"],
    message: "Indica tu email para contactarte por email",
    when: () => true,
  });

export const contactSchema = z
  .object({
    name: text(2, 120, "El nombre"),
    email: optionalEmail,
    phone: z
      .string()
      .optional()
      .transform((v) => (v ? cleanText(v) : ""))
      .pipe(z.union([z.literal(""), z.string().regex(/^[0-9+() .-]{6,30}$/, "Teléfono no válido")]))
      .transform((v) => (v === "" ? null : v)),
    message: multilineText(2000, "El mensaje").pipe(z.string().min(5, "El mensaje es demasiado corto")),
  })
  .refine((d) => d.email || d.phone, { path: ["email"], message: "Indica un email o un teléfono" });

export const loginSchema = z.object({
  email: z
    .string()
    .transform((v) => v.trim().toLowerCase())
    .pipe(z.email("Email no válido").max(254)),
  password: z.string().min(1, "Introduce la contraseña").max(200),
});

// ---------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------
const price = (label: string) =>
  z
    .string()
    .transform((v, ctx) => {
      const cents = parsePriceToCents(v);
      if (cents === null) {
        ctx.addIssue({ code: "custom", message: `${label}: importe no válido` });
        return z.NEVER;
      }
      return cents;
    });

const optionalPrice = (label: string) =>
  z
    .string()
    .optional()
    .transform((v, ctx) => {
      if (!v || v.trim() === "") return null;
      const cents = parsePriceToCents(v);
      if (cents === null) {
        ctx.addIssue({ code: "custom", message: `${label}: importe no válido` });
        return z.NEVER;
      }
      return cents;
    });

/** "bergamota, pimienta rosa" → ["bergamota", "pimienta rosa"] */
const notesList = z
  .string()
  .optional()
  .transform((v) =>
    (v ?? "")
      .split(/[,\n]/)
      .map((n) => cleanText(n))
      .filter(Boolean),
  )
  .pipe(z.array(z.string().max(40, "Cada nota: máximo 40 caracteres")).max(20, "Máximo 20 notas por nivel"));

const optionalEnum = <T extends [string, ...string[]]>(options: T) =>
  z
    .string()
    .optional()
    .transform((v) => (v ? v : null))
    .pipe(z.enum(options).nullable());

export const productSchema = z.object({
  name: text(1, 120, "El nombre"),
  brand: text(1, 80, "La marca"),
  slug: z
    .string()
    .optional()
    .transform((v) => (v ?? "").trim())
    .pipe(z.union([z.literal(""), slug])),
  description: multilineText(5000, "La descripción"),
  categoryId: z
    .string()
    .optional()
    .transform((v) => (v ? v : null))
    .pipe(uuid.nullable()),
  gender: optionalEnum(values(GENDERS)),
  family: optionalEnum(values(OLFACTORY_FAMILIES)),
  notesTop: notesList,
  notesHeart: notesList,
  notesBase: notesList,
  status: z.enum(values(PRODUCT_STATUSES)),
  isFeatured: checkbox,
  isNew: checkbox,
  isRecommended: checkbox,
  recommendationText: optionalText(500, "El texto de recomendación", true),
  sortOrder: z.coerce.number().int().min(-10000).max(10000).catch(0),
});

export const variantInputSchema = z
  .object({
    id: z.union([uuid, z.literal("")]).optional(),
    kind: z.enum(values(VARIANT_KINDS)),
    sizeMl: z
      .string()
      .optional()
      .transform((v) => (v && v.trim() !== "" ? Number(v) : null))
      .pipe(z.number().int("Tamaño: número entero").min(1).max(1000).nullable()),
    label: text(1, 60, "La etiqueta de la variante"),
    price: price("Precio"),
    compareAtPrice: optionalPrice("Precio anterior"),
    stock: z.coerce.number().int("Stock: número entero").min(0, "Stock no puede ser negativo").max(100000),
    sku: optionalText(64, "SKU"),
    isActive: z.boolean(),
  })
  .superRefine((v, ctx) => {
    if (v.kind === "decant" && v.sizeMl === null) {
      ctx.addIssue({ code: "custom", path: ["sizeMl"], message: "Los decants necesitan tamaño en ml" });
    }
    if (v.compareAtPrice !== null && v.compareAtPrice <= v.price) {
      ctx.addIssue({ code: "custom", path: ["compareAtPrice"], message: "El precio anterior debe ser mayor que el precio" });
    }
  });

export const variantsSchema = z.array(variantInputSchema).max(20, "Máximo 20 variantes");

export const categorySchema = z.object({
  name: text(1, 80, "El nombre"),
  slug: z
    .string()
    .optional()
    .transform((v) => (v ?? "").trim())
    .pipe(z.union([z.literal(""), slug])),
  description: optionalText(1000, "La descripción", true),
  sortOrder: z.coerce.number().int().min(-10000).max(10000).catch(0),
  isActive: checkbox,
});

export const orderStatusSchema = z.object({
  orderId: uuid,
  status: z.enum(values(ORDER_STATUSES)),
});

export const orderNotesSchema = z.object({
  orderId: uuid,
  adminNotes: optionalText(2000, "Las notas", true),
});
