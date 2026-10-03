import Link from "next/link";
import { siteConfig } from "@/config/site";
import { Marquee } from "@/components/fx/marquee";
import { Logo } from "@/components/layout/logo";
import { InstagramIcon, MailIcon, WhatsAppIcon } from "@/components/ui/icons";
import { publicEnv } from "@/lib/env";
import { whatsappLink } from "@/lib/whatsapp";

export function Footer() {
  const wa = whatsappLink("Hola Smellclub 👋");
  const year = new Date().getFullYear();

  return (
    <footer className="relative isolate overflow-hidden bg-ink text-ivory">
      <div aria-hidden="true" className="gold-dust -z-10 opacity-60" />
      <div className="border-b border-ink-line py-5">
        <Marquee
          items={["Perfumería árabe", "Perfumes de diseñador", "Decants 5 ml y 10 ml", "Atención por WhatsApp", siteConfig.tagline]}
          duration={35}
          reverse
          itemClassName="eyebrow text-ivory/50"
        />
      </div>
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 md:grid-cols-4">
        <div data-reveal className="md:col-span-2">
          <Logo />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-ivory/60">{siteConfig.description}</p>
          <div className="mt-6 flex gap-2">
            {wa && (
              <a href={wa} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="flex size-12 items-center justify-center border border-ink-line hover:border-gold hover:text-gold">
                <WhatsAppIcon />
              </a>
            )}
            {publicEnv.instagramUrl && (
              <a href={publicEnv.instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="flex size-12 items-center justify-center border border-ink-line hover:border-gold hover:text-gold">
                <InstagramIcon />
              </a>
            )}
            {publicEnv.contactEmail && (
              <a href={`mailto:${publicEnv.contactEmail}`} aria-label="Email" className="flex size-12 items-center justify-center border border-ink-line hover:border-gold hover:text-gold">
                <MailIcon />
              </a>
            )}
          </div>
        </div>

        <nav data-reveal style={{ "--i": 1 } as React.CSSProperties} aria-label="Tienda">
          <p className="eyebrow text-gold">Tienda</p>
          <ul className="mt-4 space-y-1 text-sm text-ivory/70">
            {[{ label: "Todos los perfumes", href: "/shop" }, ...siteConfig.nav].map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="inline-block py-1.5 hover:text-gold-light">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav data-reveal style={{ "--i": 2 } as React.CSSProperties} aria-label="Legal">
          <p className="eyebrow text-gold">Información</p>
          <ul className="mt-4 space-y-1 text-sm text-ivory/70">
            <li><Link href="/legal/envios-y-devoluciones" className="inline-block py-1.5 hover:text-gold-light">Envíos y devoluciones</Link></li>
            <li><Link href="/legal/envios-y-devoluciones#arrepentimiento" className="inline-block py-1.5 hover:text-gold-light">Derecho de arrepentimiento</Link></li>
            <li><Link href="/legal/terminos" className="inline-block py-1.5 hover:text-gold-light">Términos y condiciones</Link></li>
            <li><Link href="/legal/privacidad" className="inline-block py-1.5 hover:text-gold-light">Política de privacidad</Link></li>
            <li><Link href="/legal/aviso-legal" className="inline-block py-1.5 hover:text-gold-light">Aviso legal</Link></li>
          </ul>
        </nav>
      </div>
      <p
        aria-hidden="true"
        className="text-outline pointer-events-none overflow-hidden px-5 text-center font-display text-[12.5vw] leading-[0.85] tracking-[0.04em] whitespace-nowrap select-none"
      >
        SMELLCLUB
      </p>
      <div className="border-t border-ink-line">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-6 text-xs text-ivory/40 sm:flex-row sm:justify-between sm:px-8">
          <p>
            © {year} {siteConfig.legal.ownerName || siteConfig.name}
            {siteConfig.legal.taxId ? ` · RUT ${siteConfig.legal.taxId}` : ""}. Todos los derechos reservados.
          </p>
          <p>Las marcas citadas pertenecen a sus respectivos propietarios.</p>
        </div>
      </div>
    </footer>
  );
}
