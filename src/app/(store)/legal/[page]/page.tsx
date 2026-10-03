import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container, PageHeader } from "@/components/ui/layout";
import { siteConfig } from "@/config/site";
import { publicEnv } from "@/lib/env";

/**
 * Textos legales adaptados a Uruguay (Ley 17.250 de Defensa del Consumidor,
 * Ley 18.331 de Protección de Datos Personales y su Decreto 414/009).
 * ⚠️ Orientativos: no sustituyen el asesoramiento de un abogado o contador.
 * Los datos del titular (nombre, RUT, domicilio) se completan en
 * src/config/site.ts → legal.
 */

type Section = { title: string; id?: string; body: Array<string | false> };
type LegalPage = { title: string; description: string; sections: Section[] };

const { legal } = siteConfig;
const contact = publicEnv.contactEmail || "el formulario de la página de contacto";
const owner = legal.ownerName || siteConfig.name;
const country = legal.jurisdiction || "la República Oriental del Uruguay";

const pages: Record<string, LegalPage> = {
  "aviso-legal": {
    title: "Aviso legal",
    description: "Información del titular de la web.",
    sections: [
      {
        title: "Titular",
        body: [
          `Esta tienda online es operada por ${owner}.`,
          legal.taxId && `RUT: ${legal.taxId}`,
          legal.address && `Domicilio: ${legal.address}`,
          `Contacto: ${contact}`,
        ],
      },
      {
        title: "Propiedad intelectual y marcas",
        body: [
          "Los textos, el diseño y los elementos gráficos propios de esta web pertenecen a su titular salvo indicación en contrario.",
          `Los nombres de perfumes y marcas mencionados pertenecen a sus respectivos titulares y se usan solo para identificar los productos que vendemos. ${siteConfig.name} no está afiliado, patrocinado ni autorizado por esas marcas.`,
          "Las fotografías de producto se usan con fines ilustrativos; el envase puede variar según el lote.",
        ],
      },
      {
        title: "Legislación aplicable",
        body: [
          `Estas condiciones se rigen por las leyes de ${country}, en particular la Ley N.º 17.250 de Defensa del Consumidor y la Ley N.º 18.331 de Protección de Datos Personales.`,
        ],
      },
    ],
  },
  privacidad: {
    title: "Política de privacidad",
    description: "Cómo tratamos tus datos personales (Ley N.º 18.331).",
    sections: [
      {
        title: "Responsable de la base de datos",
        body: [
          [owner, legal.taxId && `RUT ${legal.taxId}`, legal.address].filter(Boolean).join(" · "),
          `Contacto para temas de datos personales: ${contact}`,
          "Tratamos tus datos conforme a la Ley N.º 18.331 de Protección de Datos Personales y su Decreto reglamentario N.º 414/009.",
        ],
      },
      {
        title: "Qué datos recogemos",
        body: [
          "Al hacer un pedido: nombre, teléfono, email (opcional), dirección de entrega (si eliges envío) y notas del pedido.",
          "Al usar el formulario de contacto: nombre, email y/o teléfono y el mensaje.",
          "Por seguridad (prevención de abusos) guardamos un identificador cifrado e irreversible derivado de tu dirección IP; nunca la IP en claro.",
          "No pedimos ni guardamos datos de tarjetas de pago.",
        ],
      },
      {
        title: "Para qué los usamos",
        body: [
          "Únicamente para gestionar y entregar tus pedidos, contactarte sobre ellos y responder tus consultas.",
          "No vendemos ni cedemos tus datos a terceros para publicidad, y no te enviaremos promociones sin tu consentimiento.",
          "Al enviar un pedido o un mensaje nos das tu consentimiento libre, previo, expreso e informado para este tratamiento.",
        ],
      },
      {
        title: "Dónde se guardan (transferencia internacional)",
        body: [
          "Para que la web funcione usamos proveedores técnicos cuyos servidores pueden estar fuera de Uruguay: Vercel (alojamiento de la web) y Supabase (base de datos), con servidores en los Estados Unidos.",
          "Al aceptar esta política consientes expresamente esa transferencia internacional de datos, que se limita a lo necesario para prestar el servicio.",
          "Si eliges envío, la empresa de transporte recibe solo los datos necesarios para la entrega.",
        ],
      },
      {
        title: "Cuánto tiempo los conservamos",
        body: [
          "Los datos de pedidos se conservan mientras sean necesarios para gestionarlos y durante los plazos que exijan las obligaciones legales, contables o tributarias.",
          "Los mensajes del formulario de contacto se eliminan cuando dejan de ser necesarios para responder tu consulta.",
        ],
      },
      {
        title: "Tus derechos",
        body: [
          `Puedes ejercer en cualquier momento tus derechos de acceso, rectificación, actualización, inclusión y supresión de tus datos escribiendo a ${contact}. Te responderemos dentro de los plazos que fija la ley.`,
          "Si consideras que no atendimos correctamente tu solicitud, puedes presentar una denuncia ante la Unidad Reguladora y de Control de Datos Personales (URCDP).",
        ],
      },
      {
        title: "Almacenamiento local y cookies",
        body: [
          "Guardamos el contenido de tu carrito en el almacenamiento local de tu navegador para que no lo pierdas. No usamos cookies publicitarias ni de seguimiento.",
          "El panel de administración utiliza cookies técnicas de sesión, estrictamente necesarias para su funcionamiento.",
        ],
      },
    ],
  },
  terminos: {
    title: "Términos y condiciones",
    description: `Condiciones de compra en ${siteConfig.name}.`,
    sections: [
      {
        title: "Quién vende",
        body: [
          `${owner}${legal.taxId ? ` (RUT ${legal.taxId})` : ""}. Contacto: ${contact}.`,
          `Estas condiciones se aplican a las compras realizadas en esta web y se rigen por la Ley N.º 17.250 de Defensa del Consumidor de ${country}.`,
        ],
      },
      {
        title: "Precios",
        body: [
          "Los precios se muestran en pesos uruguayos (UYU) y son el precio final del producto.",
          "El costo de envío, si corresponde, no está incluido y se te informa antes de confirmar el pedido.",
          "Si hubiera un error evidente en un precio, te lo comunicaremos antes de confirmar y podrás cancelar el pedido sin costo.",
        ],
      },
      {
        title: "Cómo se hace un pedido",
        body: [
          "Al enviar un pedido recibes un número de referencia (por ejemplo SC-001234). El pedido queda confirmado cuando te contactamos para validar disponibilidad, forma de pago y entrega.",
          "Puedes cancelar el pedido sin costo antes de esa confirmación.",
        ],
      },
      {
        title: "Productos y decants",
        body: [
          "Vendemos perfumes originales en su frasco y decants.",
          `Un decant es una fracción de un perfume original que ${siteConfig.name} trasvasa desde el frasco original a un atomizador más pequeño (5 ml o 10 ml). Los decants no son productos oficiales de las marcas ni están envasados por ellas.`,
          `${siteConfig.name} no está afiliado a las marcas de los perfumes que vende. Las marcas pertenecen a sus respectivos titulares.`,
        ],
      },
      {
        title: "Pago",
        body: ["La forma de pago se acuerda contigo al confirmar el pedido. Esta web nunca pide ni guarda datos de tarjetas."],
      },
      {
        title: "Derecho de arrepentimiento",
        body: [
          "Como la compra se hace a distancia, tienes derecho a arrepentirte, según el artículo 16 de la Ley N.º 17.250. Ver los detalles en la página de envíos y devoluciones.",
        ],
      },
      {
        title: "Reclamos",
        body: [
          `Si tienes un problema con tu compra, escríbenos a ${contact} y lo resolveremos lo antes posible.`,
          "También puedes recurrir al Área de Defensa del Consumidor del Ministerio de Economía y Finanzas.",
        ],
      },
    ],
  },
  "envios-y-devoluciones": {
    title: "Envíos y devoluciones",
    description: "Envíos, derecho de arrepentimiento y devoluciones.",
    sections: [
      {
        title: "Envíos",
        body: [
          "El costo, el plazo y el método de envío dependen del destino y se confirman contigo antes de cerrar el pedido.",
          "También puedes elegir retirar el pedido o la entrega en mano al hacerlo.",
        ],
      },
      {
        title: "Derecho de arrepentimiento (5 días hábiles)",
        id: "arrepentimiento",
        body: [
          "Según el artículo 16 de la Ley N.º 17.250, puedes arrepentirte de tu compra dentro de los 5 días hábiles siguientes a la confirmación del pedido o a la entrega del producto, a tu elección, sin tener que dar explicaciones.",
          `Para hacerlo, avísanos dentro de ese plazo a ${contact} indicando tu número de pedido, y devuelve el producto en el estado en que lo recibiste.`,
          "Te reintegraremos el importe pagado por el producto sin costo adicional para ti.",
        ],
      },
      {
        title: "Productos con defectos o equivocados",
        body: [
          "Si un producto llega dañado, con un defecto o no coincide con lo que pediste, escríbenos lo antes posible con tu número de pedido y una foto. Te lo cambiamos o te devolvemos el dinero, como corresponde según la Ley N.º 17.250.",
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
    <>
    <PageHeader eyebrow="Información legal" title={data.title} description={`Última actualización: ${legal.lastUpdated}`} />
    <Container className="max-w-3xl py-12 sm:py-16">
      <div className="flex flex-col gap-10">
        {data.sections.map((s) => (
          <section key={s.title} id={s.id} data-reveal className="scroll-mt-28">
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
    </>
  );
}
