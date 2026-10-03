import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { FeaturedAura } from "@/components/home/featured-aura";
import { CountUp } from "@/components/fx/count-up";
import { Marquee } from "@/components/fx/marquee";
import { HeroTitle } from "@/components/home/hero-title";
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
  const aura = Boolean(hero.featured.cutout);
  return (
    <section className="relative isolate overflow-hidden bg-ink text-ivory">
      {/* Fondo base (visible también sin WebGL) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_60%,rgba(197,162,90,0.18),transparent_55%),radial-gradient(ellipse_at_50%_0%,rgba(197,162,90,0.12),transparent_50%)] md:bg-[radial-gradient(ellipse_at_72%_55%,rgba(197,162,90,0.2),transparent_50%),radial-gradient(ellipse_at_20%_0%,rgba(197,162,90,0.1),transparent_50%)]"
      />
      {/* Perfume destacado en escritorio (derecha, fuera del texto) */}
      <div className="absolute top-[14%] right-[6%] bottom-[14%] z-20 hidden w-[36%] items-center justify-center md:flex">
        {aura ? (
          <HeroFeatured aura className="h-full max-h-[640px] w-full" frameClassName="w-full min-h-0 flex-1" />
        ) : (
          <HeroFeatured className="aspect-[4/6] h-full max-h-[600px]" frameClassName="w-full min-h-0 flex-1" />
        )}
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-5 top-5 bottom-5 z-10 border border-gold/15 sm:inset-x-8" />

      {/* Efecto de apertura */}
      <div aria-hidden="true" className="hero-curtain hero-curtain-top" />
      <div aria-hidden="true" className="hero-curtain hero-curtain-bottom" />
      <div aria-hidden="true" className="hero-curtain-line" />

      <Container className="relative z-20 flex min-h-[calc(100svh-4rem)] flex-col py-14 text-center md:min-h-[calc(100svh-5rem)] md:justify-center md:py-20 md:text-left">
        <div className="md:max-w-[58%]">
          <p className="eyebrow animate-fade-up text-gold [animation-delay:900ms]">{hero.eyebrow}</p>
          <div className="mt-5 md:-ml-2">
            <HeroTitle />
          </div>
          <p className="animate-fade-up mt-5 font-display text-2xl text-ivory/90 italic [animation-delay:1300ms] sm:text-3xl">
            {siteConfig.tagline}
          </p>
        </div>

        {/* Perfume destacado en móvil (entre el texto y los botones) */}
        <div className="my-8 flex flex-1 items-center justify-center md:hidden">
          {aura ? (
            <HeroFeatured aura className="w-[88%] max-w-[300px]" frameClassName="w-full aspect-square" />
          ) : (
            <HeroFeatured className="w-[68%] max-w-[260px]" frameClassName="w-full aspect-[4/5]" />
          )}
        </div>

        <div className="md:mt-8 md:max-w-[50%]">
          <p className="animate-fade-up mx-auto max-w-md text-sm leading-relaxed text-ivory/70 [animation-delay:1450ms] sm:text-base md:mx-0">
            {hero.subtitle}
          </p>
          <div className="animate-fade-up mx-auto mt-7 flex w-full max-w-sm flex-col gap-3 [animation-delay:1600ms] sm:max-w-none sm:flex-row sm:justify-center md:justify-start">
            <ButtonLink href={hero.primaryCta.href} variant="gold" size="lg" className="shadow-[0_0_40px_rgba(197,162,90,0.35)]">
              {hero.primaryCta.label}
            </ButtonLink>
            <ButtonLink href={hero.secondaryCta.href} variant="outline-light" size="lg" className="backdrop-blur-sm">
              {hero.secondaryCta.label}
            </ButtonLink>
          </div>
        </div>
      </Container>

      <div aria-hidden="true" className="animate-fade-in absolute bottom-8 left-1/2 z-20 hidden -translate-x-1/2 flex-col items-center gap-2 [animation-delay:2200ms] md:flex">
        <span className="eyebrow text-[0.55rem] text-ivory/50">Descubre</span>
        <span className="block h-10 w-px bg-gold/70 [animation:hero-scroll_2s_ease-in-out_infinite]" />
      </div>
    </section>
  );
}

/** Vitrina del perfume destacado: foto sobre fondo claro con marco dorado */
function HeroFeatured({
  className = "",
  frameClassName = "",
  aura,
}: {
  className?: string;
  frameClassName?: string;
  aura?: boolean;
}) {
  const { featured } = siteConfig.hero;
  return (
    <Link
      href={featured.href}
      className={`group animate-fade-up flex max-w-full flex-col items-center [animation-delay:1500ms] ${className}`}
      aria-label={`Ver ${featured.name} de ${featured.brand}`}
    >
      {aura ? (
        <div className={`relative ${frameClassName}`}>
          <FeaturedAura image={featured.cutout} ratio={featured.cutoutRatio} alt={`${featured.name} de ${featured.brand}`} />
        </div>
      ) : (
        <div className={`relative overflow-hidden ${frameClassName} border border-gold/40 bg-white shadow-[0_30px_90px_-25px_rgba(197,162,90,0.55)] transition-shadow duration-500 group-hover:shadow-[0_30px_100px_-15px_rgba(197,162,90,0.7)]`}>
          <Image
            src={featured.image}
            alt={`${featured.name} de ${featured.brand}`}
            fill
            priority
            sizes="(min-width: 768px) 36vw, 70vw"
            className="scale-[1.12] object-contain p-2 transition-transform duration-700 ease-out group-hover:scale-[1.17]"
          />
          <div aria-hidden="true" className="pointer-events-none absolute inset-2 border border-gold/25" />
        </div>
      )}
      <p className="mt-4 text-center">
        <span className="eyebrow block text-[0.6rem] text-gold">Destacado</span>
        <span className="mt-1 block font-display text-xl text-ivory">
          {featured.name} <span className="text-ivory/60 italic">· {featured.brand}</span>
        </span>
      </p>
    </Link>
  );
}

/** Cinta con las marcas reales del catálogo, en movimiento continuo */
export function BrandsMarquee({ brands }: { brands: string[] }) {
  if (brands.length === 0) return null;
  return (
    <section aria-label="Marcas" className="relative overflow-hidden border-y border-gold/20 bg-ink py-6 text-ivory sm:py-8">
      <Marquee
        items={brands}
        duration={Math.max(30, brands.length * 3)}
        itemClassName="font-display text-2xl tracking-wide text-ivory/80 sm:text-4xl"
      />
    </section>
  );
}

/** Cifras reales del catálogo que cuentan hacia arriba al aparecer */
export function StatsStrip({ perfumes, brands, decants }: { perfumes: number; brands: number; decants: number }) {
  const stats = [
    { value: perfumes, label: "Fragancias en catálogo" },
    { value: brands, label: "Marcas" },
    { value: decants, label: "Perfumes en decant" },
  ].filter((s) => s.value > 0);
  if (stats.length === 0) return null;
  return (
    <section className="bg-ivory py-14 sm:py-20">
      <Container>
        <div className="grid grid-cols-3 gap-3 text-center sm:gap-10">
          {stats.map((s, i) => (
            <div key={s.label} data-reveal style={{ "--i": i } as React.CSSProperties} className="flex flex-col items-center gap-2">
              <span className="text-gold-shine font-display text-5xl leading-none sm:text-7xl">
                <CountUp value={s.value} />
              </span>
              <span className="gold-rule" aria-hidden="true" />
              <span className="eyebrow text-[0.55rem] leading-relaxed text-muted sm:text-[0.7rem]">{s.label}</span>
            </div>
          ))}
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
              data-reveal="scale"
              style={{ "--i": i } as React.CSSProperties}
              className="spotlight group relative flex min-h-48 flex-col justify-end overflow-hidden bg-ink p-7 text-ivory transition-transform duration-500 hover:-translate-y-1 sm:min-h-72"
            >
              <div
                aria-hidden="true"
                className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_80%_20%,rgba(197,162,90,0.25),transparent_55%)] opacity-60 transition-opacity duration-500 group-hover:opacity-100"
              />
              <div aria-hidden="true" className="gold-dust -z-10 opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
              <span className="text-outline absolute top-4 right-6 font-display text-7xl transition-all duration-700 group-hover:scale-110 group-hover:[-webkit-text-stroke-color:rgb(197_162_90/0.8)] sm:text-8xl">
                0{i + 1}
              </span>
              <span
                aria-hidden="true"
                className="absolute inset-x-7 bottom-0 h-px origin-left scale-x-0 bg-gradient-to-r from-gold via-gold-light to-transparent transition-transform duration-700 group-hover:scale-x-100"
              />
              <div className="relative transition-transform duration-500 group-hover:-translate-y-1">
                <h3 className="font-display text-3xl sm:text-4xl">{t.title}</h3>
                <p className="mt-2 flex items-center gap-2 text-sm text-ivory/60 transition-colors group-hover:text-gold-light">
                  {t.text} <ArrowRightIcon size={16} className="transition-transform duration-300 group-hover:translate-x-1.5" />
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
    <section className={tone === "sand" ? "relative overflow-hidden bg-sand py-20 sm:py-28" : "relative overflow-hidden py-20 sm:py-28"}>
      {title.length <= 12 && (
        <span
          aria-hidden="true"
          className="text-outline pointer-events-none absolute -top-4 left-1/2 -translate-x-1/2 font-display text-[22vw] leading-none whitespace-nowrap opacity-60 select-none sm:text-[14vw]"
        >
          {title}
        </span>
      )}
      <Container className="relative">
        <SectionHeading eyebrow={eyebrow} title={title} description={description} />
        <div className="mt-12">
          <ProductRail products={products} />
        </div>
        <div data-reveal className="mt-12 flex justify-center">
          <ButtonLink href={href} variant="outline">
            {linkLabel} <ArrowRightIcon size={16} />
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}

export function DecantsBand({ count }: { count: number }) {
  return (
    <section className="relative isolate overflow-hidden bg-ink py-20 text-ivory sm:py-28">
      <div aria-hidden="true" className="aurora -z-10" />
      <div aria-hidden="true" className="gold-dust -z-10" />
      <Container className="grid items-center gap-12 md:grid-cols-2">
        <div data-reveal="left">
          <p className="eyebrow text-gold">Decants</p>
          <h2 className="mt-4 font-display text-4xl leading-tight sm:text-6xl">
            Pruébalo antes de <em className="text-gold-shine not-italic sm:italic">enamorarte</em> del frasco
          </h2>
          <p className="mt-6 max-w-md text-sm leading-relaxed text-ivory/65 sm:text-base">
            Un decant es una pequeña cantidad del perfume original trasvasada a un atomizador. Ideal para
            descubrir cómo evoluciona en tu piel, llevarlo de viaje o probar varias fragancias.
          </p>
          <div className="mt-8">
            <ButtonLink href="/decants" variant="gold" size="lg" className="btn-glow">
              Ver decants{count > 0 ? ` (${count})` : ""} <ArrowRightIcon size={16} />
            </ButtonLink>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            { size: "5 ml", text: "Para descubrir una fragancia" },
            { size: "10 ml", text: "Para disfrutarla más tiempo" },
          ].map((d, i) => (
            <Link
              key={d.size}
              href="/decants"
              data-reveal="right"
              style={{ "--i": i + 1, "--ring-bg": "#0d0c0a" } as React.CSSProperties}
              className="ring-spin group flex aspect-square flex-col items-center justify-center gap-3 p-4 text-center transition-transform duration-500 hover:-translate-y-1.5"
            >
              <DropIcon
                size={30}
                className="float-slow text-gold"
                style={{ animationDelay: `${i * 1.2}s` }}
              />
              <span className="font-display text-4xl transition-colors group-hover:text-gold-light sm:text-6xl">{d.size}</span>
              <span className="text-xs text-ivory/60">{d.text}</span>
            </Link>
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
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {siteConfig.benefits.map((b, i) => {
            const Icon = benefitIcons[b.icon as keyof typeof benefitIcons] ?? SparkleIcon;
            return (
              <div
                key={b.title}
                data-reveal
                style={{ "--i": i } as React.CSSProperties}
                className="group flex flex-col items-center border border-transparent px-6 py-8 text-center transition-all duration-500 hover:-translate-y-1 hover:border-gold/40 hover:bg-white hover:shadow-[0_24px_50px_-30px_rgba(140,109,47,0.6)]"
              >
                <span className="icon-orbit flex size-16 items-center justify-center rounded-full border border-gold/40 text-gold-dark transition-colors duration-500 group-hover:bg-ink group-hover:text-gold">
                  <Icon size={26} />
                </span>
                <h3 className="mt-6 font-display text-2xl">{b.title}</h3>
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
          {testimonials.map((t, i) => (
            <figure
              key={t.name}
              data-reveal
              style={{ "--i": i } as React.CSSProperties}
              className="flex w-[85%] shrink-0 snap-start flex-col gap-5 bg-ivory p-8 transition-transform duration-500 hover:-translate-y-1 md:w-auto"
            >
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
  if (!instagramUrl) return null;
  const handle = instagramUrl ? instagramUrl.replace(/^https:\/\/(www\.)?instagram\.com\//, "@").replace(/\/$/, "") : "";
  return (
    <section className="relative overflow-hidden py-20 sm:py-28">
      <Container className="flex flex-col items-center text-center">
        <span data-reveal="scale" className="icon-orbit flex size-20 items-center justify-center rounded-full bg-ink text-gold">
          <InstagramIcon size={32} />
        </span>
        <p data-reveal className="eyebrow mt-8 text-gold-dark">Síguenos</p>
        <h2 data-reveal className="text-gold-shine mt-3 font-display text-5xl sm:text-7xl">{handle}</h2>
        <p data-reveal className="mt-4 max-w-md text-sm text-muted">
          Novedades, reseñas de fragancias y recomendaciones. Escríbenos por mensaje directo si tienes dudas.
        </p>
        <div data-reveal className="mt-8 flex w-full max-w-sm flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-fx inline-flex min-h-12 items-center justify-center gap-2 bg-ink px-6 text-[0.72rem] font-medium tracking-[0.18em] text-ivory uppercase transition-colors hover:text-gold-light"
          >
            <InstagramIcon size={18} /> Ver Instagram
          </a>
          {whatsappHref && (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-fx inline-flex min-h-12 items-center justify-center gap-2 border border-ink px-6 text-[0.72rem] font-medium tracking-[0.18em] uppercase transition-colors hover:bg-ink hover:text-ivory"
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
    <section className="relative isolate overflow-hidden bg-ink py-24 text-center text-ivory sm:py-36">
      <div aria-hidden="true" className="aurora -z-10" />
      <div aria-hidden="true" className="gold-dust -z-10" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_100%,rgba(197,162,90,0.25),transparent_60%)]"
      />
      <Container className="relative flex flex-col items-center">
        <p data-reveal className="eyebrow text-gold">Tu próxima fragancia</p>
        <h2 data-reveal style={{ "--i": 1 } as React.CSSProperties} className="mt-4 max-w-3xl font-display text-5xl leading-tight sm:text-7xl">
          Descubre el perfume que <span className="text-gold-shine italic">habla por ti</span>
        </h2>
        <div data-reveal style={{ "--i": 2 } as React.CSSProperties} className="mt-10 flex w-full max-w-sm flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
          <ButtonLink href="/shop" variant="gold" size="lg" className="btn-glow">
            Ver la tienda <ArrowRightIcon size={16} />
          </ButtonLink>
          <ButtonLink href="/recommendations" variant="outline-light" size="lg">
            Necesito ayuda para elegir
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
