import type { Metadata } from "next";
import { ProductGrid } from "@/components/product/product-card";
import { ShopFilters } from "@/components/shop/filters";
import { ButtonLink } from "@/components/ui/button";
import { Container, EmptyState, SectionHeading } from "@/components/ui/layout";
import { getCatalog, getCategories } from "@/lib/catalog";
import { filterProducts, hasActiveFilters, parseShopParams } from "@/lib/shop-filters";

export const metadata: Metadata = {
  title: "Tienda",
  description: "Catálogo de perfumes árabes, de diseñador y decants. Busca, filtra y encuentra tu fragancia.",
  alternates: { canonical: "/shop" },
};

export default async function ShopPage({ searchParams }: PageProps<"/shop">) {
  const params = parseShopParams(await searchParams);
  const [products, categories] = await Promise.all([getCatalog(), getCategories()]);
  const results = filterProducts(products, params);
  const activeCount = ["category", "gender", "family", "min", "max", "available", "decants", "offers"].filter(
    (k) => params[k as keyof typeof params] !== undefined,
  ).length;
  const category = categories.find((c) => c.slug === params.category);

  return (
    <Container className="py-12 sm:py-16">
      <SectionHeading as="h1" eyebrow="Tienda" title={category?.name ?? "Todos los perfumes"} />

      <div className="mt-10">
        <ShopFilters params={params} categories={categories} activeCount={activeCount} />
      </div>

      <p className="mt-8 text-sm text-muted" aria-live="polite">
        {results.length} {results.length === 1 ? "perfume" : "perfumes"}
        {params.q ? ` para «${params.q}»` : ""}
      </p>

      <div className="mt-6">
        {results.length > 0 ? (
          <ProductGrid products={results} />
        ) : (
          <EmptyState
            title={products.length === 0 ? "Catálogo en preparación" : "Sin resultados"}
            description={
              products.length === 0
                ? "Muy pronto encontrarás aquí nuestras fragancias."
                : hasActiveFilters(params)
                  ? "Prueba con otros filtros o con otra búsqueda."
                  : "No hay productos disponibles ahora mismo."
            }
            action={
              hasActiveFilters(params) ? (
                <ButtonLink href="/shop" variant="outline">
                  Ver todos
                </ButtonLink>
              ) : undefined
            }
          />
        )}
      </div>
    </Container>
  );
}
