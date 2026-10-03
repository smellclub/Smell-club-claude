import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/product/product-card";
import { ButtonLink } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/ui/icons";
import { Container, EmptyState, PageHeader, SectionHeading } from "@/components/ui/layout";
import { getCatalog } from "@/lib/catalog";
import { OLFACTORY_FAMILIES, labelOf } from "@/lib/constants";
import { whatsappLink } from "@/lib/whatsapp";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Recomendaciones",
  description: "Nuestra selección de perfumes recomendados y guía para elegir tu próxima fragancia.",
  alternates: { canonical: "/recommendations" },
};

export default async function RecommendationsPage() {
  const products = await getCatalog();
  const recommended = products.filter((p) => p.isRecommended);
  const wa = whatsappLink("Hola Smellclub 👋 ¿Me ayudáis a elegir un perfume? Me gustan fragancias…");

  // Agrupa por familia olfativa (los que no tienen familia van al final)
  const groups = new Map<string, typeof recommended>();
  for (const p of recommended) {
    const key = p.family ?? "otros";
    groups.set(key, [...(groups.get(key) ?? []), p]);
  }
  const ordered = [...groups.entries()].sort(([a], [b]) => (a === "otros" ? 1 : b === "otros" ? -1 : a.localeCompare(b)));

  const families = OLFACTORY_FAMILIES.filter((f) => products.some((p) => p.family === f.value));

  return (
    <>
      <PageHeader
        eyebrow="Recomendaciones"
        title="Elegidos por Smellclub"
        description="Fragancias que recomendamos por su calidad, versatilidad o personalidad."
      />
      <Container className="py-4 sm:py-8">

        {recommended.length === 0 ? (
          <div className="mt-12">
            <EmptyState
              title="Recomendaciones en preparación"
              description="Muy pronto publicaremos nuestra selección. Mientras tanto, escríbenos y te asesoramos."
              action={<ButtonLink href="/shop">Ver la tienda</ButtonLink>}
            />
          </div>
        ) : (
          <div className="mt-14 flex flex-col gap-16">
            {ordered.map(([family, items]) => (
              <section key={family} aria-labelledby={`fam-${family}`}>
                <h2 id={`fam-${family}`} data-reveal="left" className="border-b border-line pb-3 font-display text-3xl">
                  {family === "otros" ? "Más recomendaciones" : labelOf(OLFACTORY_FAMILIES, family)}
                </h2>
                <div className="mt-8 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((p) => (
                    <div key={p.id} className="flex flex-col gap-4">
                      <ProductCard product={p} />
                      {p.recommendationText && (
                        <p className="border-l-2 border-gold pl-4 font-display text-lg leading-snug italic text-ink/80">
                          {p.recommendationText}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </Container>

      {families.length > 0 && (
        <section className="border-t border-line bg-sand py-16">
          <Container>
            <SectionHeading eyebrow="Guía rápida" title="Explora por familia olfativa" />
            <div className="mt-10 flex flex-wrap justify-center gap-2">
              {families.map((f) => (
                <Link
                  key={f.value}
                  href={`/shop?family=${f.value}`}
                  className="flex min-h-11 items-center border border-ink/20 bg-ivory px-5 text-sm hover:border-ink"
                >
                  {f.label}
                </Link>
              ))}
            </div>
          </Container>
        </section>
      )}

      <section className="relative isolate overflow-hidden bg-ink py-20 text-center text-ivory">
        <div aria-hidden="true" className="aurora -z-10" />
        <div aria-hidden="true" className="gold-dust -z-10" />
        <Container className="flex flex-col items-center">
          <h2 data-reveal className="font-display text-4xl sm:text-5xl">¿No sabes cuál elegir?</h2>
          <p className="mt-3 max-w-md text-sm text-ivory/65">
            Cuéntanos qué perfumes te gustan, para qué ocasión lo quieres y tu presupuesto. Te respondemos con opciones.
          </p>
          {wa ? (
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-fx btn-glow mt-8 inline-flex min-h-12 items-center gap-2 bg-gold px-6 text-[0.72rem] font-medium tracking-[0.18em] text-ink uppercase hover:bg-gold-light"
            >
              <WhatsAppIcon size={18} /> Pedir recomendación
            </a>
          ) : (
            <ButtonLink href="/contact" variant="gold" className="mt-8">
              Contactar
            </ButtonLink>
          )}
        </Container>
      </section>
    </>
  );
}
