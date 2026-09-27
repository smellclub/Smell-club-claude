import Link from "next/link";
import { siteConfig } from "@/config/site";
import { ProductRail } from "@/components/product/product-card";
import { ButtonLink } from "@/components/ui/button";
import {
  ArrowRightIcon,
  ChatIcon,
  DropIcon,
  InstagramIcon,
  ShieldIcon,
  SparkleIcon,
  TruckIcon,
  WhatsAppIcon,
} from "@/components/ui/icons";
import { Container, SectionHeading } from "@/components/ui/layout";
import type { Category, Product } from "@/types/domain";

export function Hero() {
  const { hero } = siteConfig;
  return (
    <section className="relative overflow-hidden bg-ink text-ivory">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(197,162,90,0.22),transparent_60%),radial-gradient(ellipse_at_80%_100%,rgba(197,162,90,0.10),transparent_50%)]"
      />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-6 top-6 bottom-6 border border-gold/15 sm:inset-x-10" />
      <Container className="relative flex min-h-[82svh] flex-col items-center justify-center py-24 text-center md:min-h-[88vh]">
        <p className="eyebrow animate-fade-up text-gold">{hero.eyebrow}</p>
        <h1 className="animate-fade-up mt-6 font-display text-6xl leading-none font-medium tracking-[0.12em] uppercase [animation-delay:120ms] sm:text-8xl md:text-9xl">
          Smell<span className="text-gold">club</span>
        </h1>
        <p className="animate-fade-up mt-6 font-display text-2xl text-ivory/90 italic [animation-delay:240ms] sm:text-3xl">
          {siteConfig.tagline}
        </p>
        <span className="gold-rule animate-fade-up mt-8 [animation-delay:300ms]" aria-hidden="true" />
        <p className="animate-fade-up mt-8 max-w-md text-sm leading-relaxed text-ivory/65 [animation-delay:360ms] sm:text-base">
          {hero.subtitle}
        </p>
        <div className="animate-fade-up mt-10 flex w-full max-w-sm flex-col gap-3 [animation-delay:480ms] sm:max-w-none sm:flex-row sm:justify-center">
          <ButtonLink href={hero.primaryCta.href} variant="gold" size="lg">
            {hero.primaryCta.label}
          </ButtonLink>
          <ButtonLink href={hero.secondaryCta.href} variant="outline-light" size="lg">
            {hero.secondaryCta.label}
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}

export function CategoriesSection({ categories }: { categories: Category[] }) {
  const tiles = [
    ...categories.map((c) => ({
      href: `/shop?category=${c.slug}`,
      title: c.name,
      text: c.description && !c.description.startsWith("[PLACEHOLDER]") ? c.description : "Ver colección",
    })),
    { href: "/decants", title: "Decants", text: "Prueba en 5 ml o 10 ml" },
  ];

  return (
    <section className="py-20 sm:py-28">
      <Container>
        <SectionHeading eyebrow="Colecciones" title="Explora por categoría" />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tiles.map((t, i) => (
            <Link
              key={t.href}
              href={t.href}
              className="group relative flex min-h-44 flex-col justify-end overflow-hidden bg-ink p-7 text-ivory sm:min-h-64"
            >
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(197,162,90,0.25),transparent_55%)] opacity-60 transition-opacity duration-500 group-hover:opacity-100"
              />
              <span className="absolute top-6 right-7 font-display text-5xl text-gold/25">0{i + 1}</span>
              <div className="relative">
                <h3 className="font-display text-3xl">{t.title}</h3>
                <p className="mt-2 flex items-center gap-2 text-sm text-ivory/60 transition-colors group-hover:text-gold-light">
                  {t.text} <ArrowRightIcon size={16} />
                </p>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}

export function ProductsSection({
  eyebrow,
  title,
  description,
  products,
  href,
  linkLabel,
  tone = "light",
}: {
  eyebrow: string;
  title: string;
  description?: string;
  products: Product[];
  href: string;
  linkLabel: string;
  tone?: "light" | "sand";
}) {
  if (products.length === 0) return null;
  return (
    <section className={tone === "sand" ? "bg-sand py-20 sm:py-28" : "py-20 sm:py-28"}>
      <Container>
        <SectionHeading eyebrow={eyebrow} title={title} description={description} />
        <div className="mt-12">
          <ProductRail products={products} />
        </div>
        <div className="mt-12 flex justify-center">
          <ButtonLink href={href} variant="outline">
            {linkLabel}
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}

export function DecantsBand({ count }: { count: number }) {
  return (
    <section className="bg-ink py-20 text-ivory sm:py-28">
      <Container className="grid items-center gap-12 md:grid-cols-2">
        <div>
          <p className="eyebrow text-gold">Decants</p>
          <h2 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">
            Pruébalo antes de <em className="text-gold-light">enamorarte</em> del frasco
          </h2>
          <p className="mt-6 max-w-md text-sm leading-relaxed text-ivory/65 sm:text-base">
            Un decant es una pequeña cantidad del perfume original trasvasada a un atomizador. Ideal para
            descubrir cómo evoluciona en tu piel, llevarlo de viaje o probar varias fragancias.
          </p>
          <div className="mt-8">
            <ButtonLink href="/decants" variant="gold">
              Ver decants{count > 0 ? ` (${count})` : ""}
            </ButtonLink>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            { size: "5 ml", text: "Para descubrir una fragancia" },
            { size: "10 ml", text: "Para disfrutarla más tiempo" },
          ].map((d) => (
            <div key={d.size} className="flex aspect-square flex-col items-center justify-center gap-3 border border-gold/25 p-4 text-center">
              <DropIcon size={28} className="text-gold" />
              <span className="font-display text-4xl sm:text-5xl">{d.size}</span>
              <span className="text-xs text-ivory/60">{d.text}</span>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

const benefitIcons = { drop: DropIcon, chat: ChatIcon, shield: ShieldIcon, truck: TruckIcon } as const;

export function BenefitsSection() {
  return (
    <section className="border-y border-line py-20 sm:py-24">
      <Container>
        <SectionHeading eyebrow="Por qué Smellclub" title="Comprar perfume, sin dudas" />
        <div className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {siteConfig.benefits.map((b) => {
            const Icon = benefitIcons[b.icon as keyof typeof benefitIcons] ?? SparkleIcon;
            return (
              <div key={b.title} className="flex flex-col items-center text-center">
                <span className="flex size-14 items-center justify-center rounded-full border border-gold/40 text-gold-dark">
                  <Icon size={24} />
                </span>
                <h3 className="mt-5 font-display text-2xl">{b.title}</h3>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted">{b.text}</p>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

export function TestimonialsSection() {
  const testimonials = siteConfig.testimonials;
  if (testimonials.length === 0) return null;
  return (
    <section className="bg-sand py-20 sm:py-28">
      <Container>
        <SectionHeading eyebrow="Opiniones" title="Lo que dicen nuestros clientes" />
        <div className="no-scrollbar -mx-5 mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 md:mx-0 md:grid md:grid-cols-3 md:gap-6 md:px-0">
          {testimonials.map((t) => (
            <figure key={t.name} className="flex w-[85%] shrink-0 snap-start flex-col gap-5 bg-ivory p-8 md:w-auto">
              <span className="font-display text-5xl leading-none text-gold" aria-hidden="true">“</span>
              <blockquote className="font-display text-xl leading-snug">{t.text}</blockquote>
              <figcaption className="mt-auto text-xs tracking-[0.16em] text-muted uppercase">
                {t.name}
                {t.product && <span className="text-gold-dark"> · {t.product}</span>}
              </figcaption>
            </figure>
          ))}
        </div>
      </Container>
    </section>
  );
}

export function InstagramSection({ instagramUrl, whatsappHref }: { instagramUrl: string; whatsappHref: string | null }) {
  const handle = instagramUrl ? instagramUrl.replace(/^https:\/\/(www\.)?instagram\.com\//, "@").replace(/\/$/, "") : "";
  return (
    <section className="py-20 sm:py-28">
      <Container className="flex flex-col items-center text-center">
        <InstagramIcon size={32} className="text-gold-dark" />
        <p className="eyebrow mt-6 text-gold-dark">Síguenos</p>
        <h2 className="mt-3 font-display text-4xl sm:text-5xl">{handle || "Instagram [PLACEHOLDER]"}</h2>
        <p className="mt-4 max-w-md text-sm text-muted">
          Novedades, reseñas de fragancias y recomendaciones. Escríbenos por mensaje directo si tienes dudas.
        </p>
        <div className="mt-8 flex w-full max-w-sm flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
          {instagramUrl && (
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center justify-center gap-2 bg-ink px-6 text-[0.72rem] font-medium tracking-[0.18em] text-ivory uppercase hover:text-gold-light"
            >
              <InstagramIcon size={18} /> Ver Instagram
            </a>
          )}
          {whatsappHref && (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center justify-center gap-2 border border-ink px-6 text-[0.72rem] font-medium tracking-[0.18em] uppercase hover:bg-ink hover:text-ivory"
            >
              <WhatsAppIcon size={18} /> Escríbenos
            </a>
          )}
        </div>
      </Container>
    </section>
  );
}

export function FinalCta() {
  return (
    <section className="relative overflow-hidden bg-ink py-24 text-center text-ivory sm:py-32">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_100%,rgba(197,162,90,0.25),transparent_60%)]"
      />
      <Container className="relative flex flex-col items-center">
        <p className="eyebrow text-gold">Tu próxima fragancia</p>
        <h2 className="mt-4 max-w-2xl font-display text-4xl leading-tight sm:text-6xl">
          Descubre el perfume que habla por ti
        </h2>
        <div className="mt-10 flex w-full max-w-sm flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
          <ButtonLink href="/shop" variant="gold" size="lg">
            Ver la tienda
          </ButtonLink>
          <ButtonLink href="/recommendations" variant="outline-light" size="lg">
            Necesito ayuda para elegir
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
