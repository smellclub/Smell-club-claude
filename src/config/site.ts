/**
 * ============================================================
 *  CONTENIDO EDITABLE DE LA MARCA
 *  Todo lo marcado [PLACEHOLDER] debe revisarse antes de publicar.
 *  WhatsApp, Instagram, email y moneda se configuran en .env.local
 *  / Vercel (ver .env.example), no aquí.
 * ============================================================
 */

export const siteConfig = {
  name: "Smellclub",
  tagline: "El arte de oler bien.",
  description:
    "Perfumes árabes, perfumes de diseñador y decants para descubrir tu próxima fragancia antes de comprar el frasco.",

  hero: {
    eyebrow: "Perfumería árabe & de diseñador",
    title: "Encuentra tu firma olfativa",
    subtitle:
      "Fragancias seleccionadas y decants de 5 y 10 ml para que pruebes antes de decidir.",
    primaryCta: { label: "Explorar colección", href: "/shop" },
    secondaryCta: { label: "Probar con decants", href: "/decants" },
  },

  /** Beneficios: solo afirmaciones que el negocio pueda cumplir. Revísalos. */
  benefits: [
    {
      icon: "drop",
      title: "Decants de 5 y 10 ml",
      text: "Prueba una fragancia varios días antes de invertir en el frasco completo.",
    },
    {
      icon: "chat",
      title: "Asesoramiento personal",
      text: "Cuéntanos qué te gusta y te recomendamos opciones por WhatsApp o Instagram.",
    },
    {
      icon: "shield",
      title: "Pedido sin complicaciones",
      text: "Haz tu pedido en un minuto y confirmamos contigo el pago y la entrega.",
    },
    {
      icon: "truck",
      title: "Envíos [PLACEHOLDER]",
      text: "[PLACEHOLDER] Indica aquí zonas, plazos y costes de envío reales.",
    },
  ],

  /**
   * Testimonios. ⚠️ Sustituye por reseñas REALES de clientes o deja el
   * array vacío ([]) para ocultar la sección.
   */
  testimonials: [
    { name: "[PLACEHOLDER] Cliente 1", text: "[PLACEHOLDER] Aquí irá un testimonio real de un cliente.", product: "" },
    { name: "[PLACEHOLDER] Cliente 2", text: "[PLACEHOLDER] Aquí irá un testimonio real de un cliente.", product: "" },
    { name: "[PLACEHOLDER] Cliente 3", text: "[PLACEHOLDER] Aquí irá un testimonio real de un cliente.", product: "" },
  ] as Array<{ name: string; text: string; product: string }>,

  /** Datos legales del titular (obligatorios en páginas legales). */
  legal: {
    ownerName: "[PLACEHOLDER] Nombre o razón social",
    taxId: "[PLACEHOLDER] NIF / CIF / RUT / RFC",
    address: "[PLACEHOLDER] Dirección fiscal",
    jurisdiction: "[PLACEHOLDER] País / jurisdicción",
    lastUpdated: "[PLACEHOLDER] Fecha de última actualización",
  },

  /** Texto informativo sobre envíos en el checkout. */
  shippingNote:
    "El coste y el plazo de envío se confirman contigo al validar el pedido. [PLACEHOLDER: ajusta este texto]",

  nav: [
    { label: "Tienda", href: "/shop" },
    { label: "Decants", href: "/decants" },
    { label: "Recomendaciones", href: "/recommendations" },
    { label: "Contacto", href: "/contact" },
  ],
} as const;
