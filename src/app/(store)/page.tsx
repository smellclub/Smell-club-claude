import {
  BenefitsSection,
  CategoriesSection,
  DecantsBand,
  FinalCta,
  Hero,
  InstagramSection,
  ProductsSection,
  TestimonialsSection,
} from "@/components/home/sections";
import { siteConfig } from "@/config/site";
import { getCatalog, getCategories } from "@/lib/catalog";
import { publicEnv } from "@/lib/env";
import { hasDecants } from "@/lib/product";
import { safeJsonLd } from "@/lib/utils";
import { whatsappLink } from "@/lib/whatsapp";

export const revalidate = 300;

export default async function HomePage() {
  const [products, categories] = await Promise.all([getCatalog(), getCategories()]);

  const featured = products.filter((p) => p.isFeatured).slice(0, 8);
  const newest = products.filter((p) => p.isNew).slice(0, 8);
  const decants = products.filter(hasDecants);
  const recommended = products.filter((p) => p.isRecommended).slice(0, 4);

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Store",
    name: siteConfig.name,
    description: siteConfig.description,
    url: publicEnv.siteUrl,
    ...(publicEnv.instagramUrl ? { sameAs: [publicEnv.instagramUrl] } : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(orgJsonLd) }} />
      <Hero />
      <ProductsSection
        eyebrow="Selección"
        title="Destacados"
        description="Las fragancias favoritas de la casa."
        products={featured}
        href="/shop"
        linkLabel="Ver toda la tienda"
      />
      <CategoriesSection categories={categories} />
      <ProductsSection
        eyebrow="Recién llegados"
        title="Novedades"
        products={newest}
        href="/shop?sort=newest"
        linkLabel="Ver novedades"
        tone="sand"
      />
      <DecantsBand count={decants.length} />
      <ProductsSection
        eyebrow="Te recomendamos"
        title="Nuestras recomendaciones"
        description="Si no sabes por dónde empezar, empieza aquí."
        products={recommended}
        href="/recommendations"
        linkLabel="Ver recomendaciones"
      />
      <BenefitsSection />
      <TestimonialsSection />
      <InstagramSection instagramUrl={publicEnv.instagramUrl} whatsappHref={whatsappLink("Hola Smellclub 👋")} />
      <FinalCta />
    </>
  );
}
