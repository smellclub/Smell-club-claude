import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCart } from "@/components/product/add-to-cart";
import { ProductGallery } from "@/components/product/gallery";
import { ProductRail } from "@/components/product/product-card";
import { Container, SectionHeading } from "@/components/ui/layout";
import { siteConfig } from "@/config/site";
import { getCatalog, getProductBySlug } from "@/lib/catalog";
import { GENDERS, OLFACTORY_FAMILIES, labelOf } from "@/lib/constants";
import { publicEnv } from "@/lib/env";
import { isPurchasable, mainImage, pricedVariants } from "@/lib/product";
import { safeJsonLd } from "@/lib/utils";

const absoluteUrl = (url: string) => (url.startsWith("/") ? `${publicEnv.siteUrl}${url}` : url);
import { whatsappLink } from "@/lib/whatsapp";

export const revalidate = 300;

export async function generateStaticParams() {
  const products = await getCatalog();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/product/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Producto no encontrado", robots: { index: false } };

  const description =
    product.description && !product.description.startsWith("[PLACEHOLDER]")
      ? product.description.slice(0, 160)
      : `${product.name} de ${product.brand}. Disponible en Smellclub${product.variants.some((v) => v.kind === "decant") ? " también en decants" : ""}.`;
  const image = mainImage(product);

  return {
    title: `${product.name} · ${product.brand}`,
    description,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      type: "website",
      title: `${product.name} · ${product.brand}`,
      description,
      url: `/product/${product.slug}`,
      ...(image ? { images: [{ url: absoluteUrl(image.url), alt: image.alt ?? product.name }] } : {}),
    },
  };
}

function NotesBlock({ title, notes }: { title: string; notes: string[] }) {
  if (notes.length === 0) return null;
  return (
    <div className="flex flex-col gap-2 border-t border-line pt-4">
      <dt className="eyebrow text-[0.6rem] text-gold-dark">{title}</dt>
      <dd className="text-sm leading-relaxed">{notes.join(" · ")}</dd>
    </div>
  );
}

export default async function ProductPage({ params }: PageProps<"/product/[slug]">) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const catalog = await getCatalog();
  const related = catalog
    .filter((p) => p.id !== product.id && (p.category?.id === product.category?.id || p.family === product.family))
    .slice(0, 4);

  const image = mainImage(product);
  const productUrl = `${publicEnv.siteUrl}/product/${product.slug}`;
  const wa = whatsappLink(`Hola Smellclub 👋 Me interesa ${product.name} de ${product.brand}. ${productUrl}`);
  const hasNotes = product.notes.top.length + product.notes.heart.length + product.notes.base.length > 0;
  const isPlaceholderDescription = product.description.startsWith("[PLACEHOLDER]");

  const priced = pricedVariants(product);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    brand: { "@type": "Brand", name: product.brand },
    url: productUrl,
    ...(image ? { image: product.images.map((i) => absoluteUrl(i.url)) } : {}),
    ...(!isPlaceholderDescription && product.description ? { description: product.description.slice(0, 500) } : {}),
    ...(product.category ? { category: product.category.name } : {}),
    ...(priced.length
      ? {
          offers: priced.map((v) => ({
            "@type": "Offer",
            name: v.label,
            price: (v.priceCents / 100).toFixed(2),
            priceCurrency: publicEnv.currency,
            availability: isPurchasable(v) ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            url: productUrl,
            ...(v.sku ? { sku: v.sku } : {}),
          })),
        }
      : {}),
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: publicEnv.siteUrl },
      { "@type": "ListItem", position: 2, name: "Tienda", item: `${publicEnv.siteUrl}/shop` },
      { "@type": "ListItem", position: 3, name: product.name, item: productUrl },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbLd) }} />

      <Container className="py-6 sm:py-12">
        <nav aria-label="Ruta de navegación" className="mb-6 text-xs text-muted">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li><Link href="/" className="hover:text-ink">Inicio</Link></li>
            <li aria-hidden="true">/</li>
            <li><Link href="/shop" className="hover:text-ink">Tienda</Link></li>
            {product.category && (
              <>
                <li aria-hidden="true">/</li>
                <li><Link href={`/shop?category=${product.category.slug}`} className="hover:text-ink">{product.category.name}</Link></li>
              </>
            )}
          </ol>
        </nav>

        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <ProductGallery images={product.images} name={product.name} brand={product.brand} />

          <div className="flex flex-col gap-8 lg:sticky lg:top-28 lg:self-start">
            <div className="flex flex-col gap-3">
              <p className="eyebrow text-gold-dark">{product.brand}</p>
              <h1 className="font-display text-4xl leading-tight sm:text-5xl">{product.name}</h1>
              <div className="flex flex-wrap gap-2 text-xs text-muted">
                {product.gender && <span className="border border-line px-2 py-1">{labelOf(GENDERS, product.gender)}</span>}
                {product.family && <span className="border border-line px-2 py-1">{labelOf(OLFACTORY_FAMILIES, product.family)}</span>}
                {product.isNew && <span className="border border-gold px-2 py-1 text-gold-dark">Nuevo</span>}
              </div>
            </div>

            <AddToCart
              productId={product.id}
              slug={product.slug}
              name={product.name}
              brand={product.brand}
              image={image?.url ?? null}
              variants={product.variants}
              whatsappHref={wa}
            />

            {product.description && (
              <div className="flex flex-col gap-3 border-t border-line pt-6">
                <h2 className="eyebrow text-[0.62rem] text-muted">Descripción</h2>
                <p className="text-sm leading-relaxed whitespace-pre-line text-ink/85">{product.description}</p>
              </div>
            )}

            {hasNotes && (
              <div className="flex flex-col gap-4">
                <h2 className="eyebrow text-[0.62rem] text-muted">Pirámide olfativa</h2>
                <dl className="flex flex-col gap-4">
                  <NotesBlock title="Notas de salida" notes={product.notes.top} />
                  <NotesBlock title="Notas de corazón" notes={product.notes.heart} />
                  <NotesBlock title="Notas de fondo" notes={product.notes.base} />
                </dl>
              </div>
            )}

            {product.isRecommended && product.recommendationText && (
              <blockquote className="border-l-2 border-gold bg-sand p-5 font-display text-lg italic">
                {product.recommendationText}
              </blockquote>
            )}

            <p className="text-xs leading-relaxed text-muted">{siteConfig.shippingNote}</p>
          </div>
        </div>
      </Container>

      {related.length > 0 && (
        <section className="border-t border-line py-16 sm:py-20">
          <Container>
            <SectionHeading eyebrow="También te puede gustar" title="Fragancias similares" />
            <div className="mt-10">
              <ProductRail products={related} />
            </div>
          </Container>
        </section>
      )}
    </>
  );
}
