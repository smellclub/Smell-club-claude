/**
 * ============================================================
 *  CONTENIDO EDITABLE DE LA MARCA
 *  Los campos vacíos ("") se ocultan automáticamente en la web.
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
    /**
     * Perfume destacado en la portada. Para cambiarlo, sube la foto a
     * public/products/ (o public/hero/) y cambia estos datos.
     * Mejor una foto cuadrada o vertical de al menos 1000 px.
     */
    featured: {
      image: "/hero/liquid-brun-original.jpg",
      /**
       * Misma foto recortada (PNG sin fondo). Si existe, se muestra con la
       * estela de seda dorada; si se deja vacía (""), se muestra la foto
       * normal en una vitrina con fondo blanco.
       */
      cutout: "/hero/liquid-brun.png",
      /** Proporción de la foto recortada: ancho / alto en píxeles */
      cutoutRatio: 375 / 977,
      name: "Liquid Brun",
      brand: "Fragrance World",
      href: "/product/liquid-brun",
    },
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
  ],

  /**
   * Testimonios REALES de clientes. Vacío ([]) = sección oculta.
   * Ejemplo: { name: "Laura M.", text: "Me encantó el decant de Khamrah", product: "Khamrah" }
   */
  testimonials: [] as Array<{ name: string; text: string; product: string }>,

  /** Datos legales del titular. Vacío = no se muestra esa línea. */
  legal: {
    ownerName: "", // Nombre o razón social (como figura en DGI)
    taxId: "", // RUT
    address: "", // Domicilio fiscal
    jurisdiction: "la República Oriental del Uruguay",
    lastUpdated: "octubre de 2026",
  },

  /** Texto informativo sobre envíos en el checkout. */
  shippingNote:
    "El costo y el plazo de envío se confirman contigo al validar el pedido.",

  nav: [
    { label: "Tienda", href: "/shop" },
    { label: "Decants", href: "/decants" },
    { label: "Recomendaciones", href: "/recommendations" },
    { label: "Contacto", href: "/contact" },
  ],
} as const;
