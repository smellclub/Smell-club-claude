import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";
import { InstagramIcon, MailIcon, WhatsAppIcon } from "@/components/ui/icons";
import { Container, PageHeader } from "@/components/ui/layout";
import { publicEnv } from "@/lib/env";
import { whatsappLink } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Contacto",
  description: "Escríbenos por WhatsApp, Instagram o email. Te asesoramos para elegir tu perfume.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  const wa = whatsappLink("Hola Smellclub 👋");
  const channels = [
    wa && { href: wa, label: "WhatsApp", detail: "Respuesta más rápida", Icon: WhatsAppIcon, external: true },
    publicEnv.instagramUrl && {
      href: publicEnv.instagramUrl,
      label: "Instagram",
      detail: "Mensaje directo",
      Icon: InstagramIcon,
      external: true,
    },
    publicEnv.contactEmail && {
      href: `mailto:${publicEnv.contactEmail}`,
      label: "Email",
      detail: publicEnv.contactEmail,
      Icon: MailIcon,
      external: false,
    },
  ].filter(Boolean) as Array<{ href: string; label: string; detail: string; Icon: typeof MailIcon; external: boolean }>;

  return (
    <>
    <PageHeader
      eyebrow="Contacto"
      title="Hablemos de perfumes"
      description="¿Dudas sobre una fragancia, un pedido o quieres una recomendación? Escríbenos."
    />
    <Container className="py-12 sm:py-16">
      <div className="mx-auto grid max-w-5xl gap-12 md:grid-cols-2">
        <div data-reveal="left" className="flex flex-col gap-3">
          {channels.length === 0 && (
            <p className="text-sm text-muted">Escríbenos con el formulario y te responderemos lo antes posible.</p>
          )}
          {channels.map(({ href, label, detail, Icon, external }) => (
            <a
              key={label}
              href={href}
              {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="group flex min-h-20 items-center gap-4 border border-line bg-white px-5 transition-all duration-500 hover:-translate-y-0.5 hover:border-gold hover:shadow-[0_18px_40px_-24px_rgba(140,109,47,0.7)]"
            >
              <span className="flex size-12 items-center justify-center rounded-full bg-ink text-gold transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">
                <Icon size={22} />
              </span>
              <span className="flex flex-col">
                <span className="font-display text-xl">{label}</span>
                <span className="text-sm text-muted">{detail}</span>
              </span>
            </a>
          ))}
        </div>

        <div data-reveal="right">
          <h2 className="mb-6 font-display text-2xl">O déjanos un mensaje</h2>
          <ContactForm />
        </div>
      </div>
    </Container>
    </>
  );
}
