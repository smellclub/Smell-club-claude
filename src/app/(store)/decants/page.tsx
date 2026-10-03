import type { Metadata } from "next";
import { ProductGrid } from "@/components/product/product-card";
import { ShopFilters } from "@/components/shop/filters";
import { Container, EmptyState, PageHeader, SectionHeading } from "@/components/ui/layout";
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
      <PageHeader
        icon={<DropIcon size={36} />}
        eyebrow="Decants 5 ml · 10 ml"
        title="Prueba antes de decidir"
        description="Descubre cómo evoluciona cada fragancia en tu piel antes de invertir en el frasco completo."
      />

      <Container className="py-12 sm:py-16">
        <div data-reveal>
          <ShopFilters params={params} categories={categories} activeCount={activeCount} action="/decants" />
        </div>
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
        <Container className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <SectionHeading eyebrow="Preguntas frecuentes" title="Todo sobre los decants" align="left" />
          </div>
          <dl className="grid gap-10 sm:grid-cols-2 lg:col-span-8">
            {faqs.map((f, i) => (
              <div key={f.q} data-reveal style={{ "--i": i } as React.CSSProperties} className="border-t border-gold/40 pt-6">
                <dt className="font-display text-2xl">{f.q}</dt>
                <dd className="mt-3 text-sm leading-relaxed text-muted">{f.a}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>
    </>
  );
}
