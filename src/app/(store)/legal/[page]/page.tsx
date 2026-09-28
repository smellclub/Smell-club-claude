import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/layout";
import { siteConfig } from "@/config/site";
import { publicEnv } from "@/lib/env";

/**
 * ⚠️ PLANTILLAS LEGALES ORIENTATIVAS. No son asesoramiento jurídico.
 * Revisa y adapta el texto a la normativa de tu país antes de publicar.
 */

type Section = { title: string; body: Array<string | false> };
type LegalPage = { title: string; description: string; sections: Section[] };

const { legal } = siteConfig;
const contact = publicEnv.contactEmail || "el formulario de la página de contacto";

const pages: Record<string, LegalPage> = {
  "aviso-legal": {
    title: "Aviso legal",
    description: "Información del titular de la web.",
    sections: [
      {
        title: "Titular",
        body: [
          legal.ownerName && `Titular: ${legal.ownerName}`,
          legal.taxId && `Identificación fiscal: ${legal.taxId}`,
          legal.address && `Domicilio: ${legal.address}`,
          `Contacto: ${contact}`,
        ],
      },
      {
        title: "Propiedad intelectual",
        body: [
          "Los textos, diseño y elementos gráficos de esta web pertenecen a su titular salvo indicación en contrario.",
          "Los nombres de perfumes y marcas mencionados pertenecen a sus respectivos propietarios y se usan únicamente con fines descriptivos.",
        ],
      },
      {
        title: "Legislación aplicable",
        body: [legal.jurisdiction && `Estas condiciones se rigen por la legislación de ${legal.jurisdiction}.`],
      },
    ],
  },
  privacidad: {
    title: "Política de privacidad",
    description: "Cómo tratamos tus datos personales.",
    sections: [
      {
        title: "Responsable del tratamiento",
        body: [
          [legal.ownerName, legal.taxId, legal.address].filter(Boolean).join(" · ") || "Smellclub",
          `Contacto: ${contact}`,
        ],
      },
      {
        title: "Qué datos recogemos",
        body: [
          "Al hacer un pedido: nombre, teléfono, email (opcional), dirección de entrega (si eliges envío) y notas del pedido.",
          "Al usar el formulario de contacto: nombre, email y/o teléfono y el mensaje.",
          "Por seguridad (prevención de abusos) guardamos un identificador cifrado e irreversible derivado de tu dirección IP; nunca la IP en claro.",
          "No recogemos ni almacenamos datos de tarjetas de pago.",
        ],
      },
      {
        title: "Para qué los usamos",
        body: [
          "Gestionar y entregar tus pedidos, contactarte sobre ellos y responder tus consultas.",
          "Base legal: ejecución del contrato de compraventa y tu consentimiento al enviar formularios.",
        ],
      },
      {
        title: "Cuánto tiempo los conservamos",
        body: ["Conservamos tus datos el tiempo necesario para gestionar tu pedido o consulta y cumplir las obligaciones legales aplicables."],
      },
      {
        title: "Con quién los compartimos",
        body: [
          "Proveedores técnicos necesarios para prestar el servicio: alojamiento web (Vercel) y base de datos (Supabase).",
          "Si eliges envío, la empresa de transporte recibe los datos necesarios para la entrega.",
        ],
      },
      {
        title: "Almacenamiento local y cookies",
        body: [
          "Guardamos el contenido de tu carrito en el almacenamiento local de tu navegador para que no lo pierdas. No usamos cookies publicitarias ni de seguimiento.",
          "El panel de administración utiliza cookies técnicas de sesión, estrictamente necesarias.",
        ],
      },
      {
        title: "Tus derechos",
        body: [`Puedes solicitar acceso, rectificación o supresión de tus datos escribiendo a ${contact}.`],
      },
    ],
  },
  terminos: {
    title: "Términos y condiciones",
    description: "Condiciones de compra en Smellclub.",
    sections: [
      {
        title: "Pedidos",
        body: [
          "Al enviar un pedido recibes un número de referencia. El pedido queda confirmado cuando te contactamos para validar disponibilidad, pago y entrega.",
          "Los precios mostrados se verifican en el momento del pedido. Si hubiera un error evidente de precio, te lo comunicaremos antes de confirmar.",
        ],
      },
      {
        title: "Decants",
        body: [
          "Los decants son fracciones del perfume original trasvasadas a atomizadores de menor tamaño.",
        ],
      },
      {
        title: "Pago",
        body: [
          "El método de pago se acuerda contigo al confirmar el pedido. Esta web nunca solicita ni almacena datos de tarjetas.",
        ],
      },
      {
        title: "Envíos",
        body: ["Consulta la página de envíos y devoluciones."],
      },
    ],
  },
  "envios-y-devoluciones": {
    title: "Envíos y devoluciones",
    description: "Plazos, costes de envío y política de devoluciones.",
    sections: [
      {
        title: "Envíos",
        body: [
          "El coste, el plazo y el método de envío dependen del destino y se confirman contigo antes de cerrar el pedido.",
          "También puedes elegir recogida o entrega en mano al hacer el pedido.",
        ],
      },
      {
        title: "Devoluciones",
        body: [
          "Si tienes cualquier incidencia con tu pedido, escríbenos lo antes posible y buscaremos una solución.",
          "Por motivos de higiene, los perfumes abiertos y los decants pueden tener condiciones de devolución específicas según la normativa aplicable.",
        ],
      },
    ],
  },
};

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(pages).map((page) => ({ page }));
}

export async function generateMetadata({ params }: PageProps<"/legal/[page]">): Promise<Metadata> {
  const { page } = await params;
  const data = pages[page];
  if (!data) return {};
  return { title: data.title, description: data.description, alternates: { canonical: `/legal/${page}` } };
}

export default async function LegalPage({ params }: PageProps<"/legal/[page]">) {
  const { page } = await params;
  const data = pages[page];
  if (!data) notFound();

  return (
    <Container className="max-w-3xl py-12 sm:py-16">
      <p className="eyebrow text-gold-dark">Información legal</p>
      <h1 className="mt-3 font-display text-4xl sm:text-5xl">{data.title}</h1>
      <p className="mt-3 text-xs text-muted">Última actualización: {legal.lastUpdated}</p>
      <div className="mt-10 flex flex-col gap-10">
        {data.sections.map((s) => (
          <section key={s.title}>
            <h2 className="font-display text-2xl">{s.title}</h2>
            <div className="mt-3 flex flex-col gap-3 text-sm leading-relaxed text-ink/80">
              {s.body.filter((p): p is string => Boolean(p)).map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </Container>
  );
}
