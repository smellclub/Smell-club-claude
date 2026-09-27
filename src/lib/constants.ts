export const GENDERS = [
  { value: "masculino", label: "Masculino" },
  { value: "femenino", label: "Femenino" },
  { value: "unisex", label: "Unisex" },
] as const;

export const OLFACTORY_FAMILIES = [
  { value: "amaderada", label: "Amaderada" },
  { value: "ambarada", label: "Ambarada / Oriental" },
  { value: "aromatica", label: "Aromática" },
  { value: "citrica", label: "Cítrica" },
  { value: "cuero", label: "Cuero" },
  { value: "especiada", label: "Especiada" },
  { value: "floral", label: "Floral" },
  { value: "frutal", label: "Frutal" },
  { value: "fresca", label: "Fresca / Acuática" },
  { value: "gourmand", label: "Gourmand" },
  { value: "chipre", label: "Chipre" },
  { value: "fougere", label: "Fougère" },
  { value: "almizclada", label: "Almizclada" },
] as const;

export const PRODUCT_STATUSES = [
  { value: "active", label: "Publicado" },
  { value: "draft", label: "Borrador" },
  { value: "archived", label: "Archivado" },
] as const;

export const VARIANT_KINDS = [
  { value: "bottle", label: "Frasco" },
  { value: "decant", label: "Decant" },
] as const;

export const ORDER_STATUSES = [
  { value: "pending", label: "Pendiente" },
  { value: "confirmed", label: "Confirmado" },
  { value: "preparing", label: "Preparando" },
  { value: "shipped", label: "Enviado" },
  { value: "delivered", label: "Entregado" },
  { value: "cancelled", label: "Cancelado" },
] as const;

export const DELIVERY_METHODS = [
  { value: "shipping", label: "Envío a domicilio" },
  { value: "pickup", label: "Recogida / entrega en mano" },
] as const;

export const CONTACT_METHODS = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "instagram", label: "Instagram" },
  { value: "phone", label: "Llamada" },
  { value: "email", label: "Email" },
] as const;

export const PAYMENT_METHODS = [
  { value: "to_agree", label: "A acordar al confirmar el pedido" },
  { value: "transfer", label: "Transferencia / Bizum" },
  { value: "payment_link", label: "Enlace de pago" },
  { value: "cash", label: "Efectivo (entrega en mano)" },
] as const;

type Option = { readonly value: string; readonly label: string };
type Values<T extends readonly Option[]> = T[number]["value"];

export type Gender = Values<typeof GENDERS>;
export type OlfactoryFamily = Values<typeof OLFACTORY_FAMILIES>;
export type ProductStatus = Values<typeof PRODUCT_STATUSES>;
export type VariantKind = Values<typeof VARIANT_KINDS>;
export type OrderStatus = Values<typeof ORDER_STATUSES>;
export type DeliveryMethod = Values<typeof DELIVERY_METHODS>;
export type ContactMethod = Values<typeof CONTACT_METHODS>;
export type PaymentMethod = Values<typeof PAYMENT_METHODS>;

export function values<T extends readonly Option[]>(list: T): [Values<T>, ...Values<T>[]] {
  return list.map((o) => o.value) as [Values<T>, ...Values<T>[]];
}

export function labelOf(list: readonly Option[], value: string | null | undefined): string {
  return list.find((o) => o.value === value)?.label ?? "—";
}

/** Límites de compra (deben coincidir con la función SQL create_order) */
export const MAX_QTY_PER_ITEM = 10;
export const MAX_CART_LINES = 30;

/** Imágenes */
/** Máximo por imagen tras la compresión en el navegador (Vercel limita a 4,5 MB) */
export const IMAGE_MAX_BYTES = 3.5 * 1024 * 1024;
/** Lado mayor tras redimensionar */
export const IMAGE_MAX_DIMENSION = 1600;
export const PRODUCT_IMAGES_BUCKET = "product-images";

/** Umbral de "pocas unidades" */
export const LOW_STOCK_THRESHOLD = 3;
