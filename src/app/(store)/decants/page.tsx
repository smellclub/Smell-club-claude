import type { Metadata } from "next";
import { ProductGrid } from "@/components/product/product-card";
import { ShopFilters } from "@/components/shop/filters";
import { Container, EmptyState, SectionHeading } from "@/components/ui/layout";
import { DropIcon } from "@/components/ui/icons";
import { getCatalog, getCategories } from "@/lib/catalog";
import { hasDecants } from "@/lib/product";
import { filterProducts, parseShopParams } from "@/lib/shop-filters";

export const metadata: Metadata = {
  title: "Decants",
  description: "Decants de 5 ml y 10 ml de perfumes árabes y de diseñador. Prueba antes de comprar el frasco.",
  alternates: { canonical: "/decants" },
};

const faqs = [
  {
    q: "¿Qué es un decant?",
    a: "Es una cantidad del perfume original trasvasada a un atomizador más pequeño. Permite probar la fragancia durante varios días sin comprar el frasco completo.",
  },
  {
    q: "¿Qué tamaño elijo?",
    a: "5 ml es ideal para descubrir un perfume. 10 ml es perfecto si ya sabes que te gusta o para llevarlo de viaje.",
  },
];

export default async function DecantsPage({ searchParams }: PageProps<"/decants">) {
  const params = parseShopParams(await searchParams);
  const [products, categories] = await Promise.all([getCatalog(), getCategories()]);
  const withDecants = products.filter(hasDecants);
  const results = filterProducts(withDecants, { ...params, decants: undefined });
  const activeCount = ["category", "gender", "family", "min", "max", "available", "offers"].filter(
    (k) => params[k as keyof typeof params] !== undefined,
  ).length;

  return (
    <>
      <section className="bg-ink py-16 text-ivory sm:py-20">
        <Container className="flex flex-col items-center text-center">
          <DropIcon size={32} className="text-gold" />
          <p className="eyebrow mt-5 text-gold">Decants 5 ml · 10 ml</p>
          <h1 className="mt-4 font-display text-4xl sm:text-6xl">Prueba antes de decidir</h1>
          <p className="mt-5 max-w-lg text-sm leading-relaxed text-ivory/65 sm:text-base">
            Descubre cómo evoluciona cada fragancia en tu piel antes de invertir en el frasco completo.
          </p>
        </Container>
      </section>

      <Container className="py-12 sm:py-16">
        <ShopFilters params={params} categories={categories} activeCount={activeCount} action="/decants" />
        <p className="mt-8 text-sm text-muted">
          {results.length} {results.length === 1 ? "perfume disponible" : "perfumes disponibles"} en decant
        </p>
        <div className="mt-6">
          {results.length > 0 ? (
            <ProductGrid products={results} variantKind="decant" />
          ) : (
            <EmptyState title="Sin decants disponibles" description="Pronto añadiremos nuevos decants. Síguenos para enterarte." />
          )}
        </div>
      </Container>

      <section className="border-t border-line bg-sand py-16 sm:py-20">
        <Container className="max-w-3xl">
          <SectionHeading eyebrow="Preguntas frecuentes" title="Todo sobre los decants" />
          <div className="mt-10 divide-y divide-line border-y border-line">
            {faqs.map((f) => (
              <details key={f.q} className="group py-5 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 font-display text-xl">
                  {f.q}
                  <span className="text-gold transition-transform group-open:rotate-45" aria-hidden="true">+</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
