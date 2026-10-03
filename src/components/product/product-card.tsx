import Link from "next/link";
import { Price } from "@/components/product/price";
import { ProductImage } from "@/components/product/product-image";
import { ArrowRightIcon } from "@/components/ui/icons";
import { Badge } from "@/components/ui/layout";
import { hasDecants, isInStock, mainImage, maxDiscount, minPriceCents, pricedVariants } from "@/lib/product";
import type { Product } from "@/types/domain";

export function ProductCard({
  product,
  priority = false,
  variantKind,
  index = 0,
}: {
  product: Product;
  priority?: boolean;
  /** Muestra el precio mínimo de un tipo concreto (p. ej. solo decants) */
  variantKind?: "decant" | "bottle";
  /** Posición en la rejilla: escalona la animación de aparición */
  index?: number;
}) {
  const image = mainImage(product);
  const price = minPriceCents(product, variantKind) ?? (variantKind ? null : minPriceCents(product));
  const discount = maxDiscount(product);
  const inStock = isInStock(product);
  const priced = pricedVariants(product).filter((v) => !variantKind || v.kind === variantKind);
  const cheapest = priced.find((v) => v.priceCents === price);
  const decantSizes = product.variants
    .filter((v) => v.kind === "decant" && v.sizeMl)
    .map((v) => `${v.sizeMl} ml`);

  return (
    <article
      data-reveal
      style={{ "--i": index % 4 } as React.CSSProperties}
      className="product-card group relative flex flex-col"
    >
      <Link href={`/product/${product.slug}`} className="flex flex-col gap-4" aria-label={`${product.name} de ${product.brand}`}>
        <div className="card-media relative aspect-[4/5] overflow-hidden bg-white ring-1 ring-line/60">
          <div className="h-full w-full transition-transform duration-[900ms] ease-out group-hover:scale-[1.08] group-hover:-rotate-1">
            <ProductImage
              src={image?.url ?? null}
              alt={image?.alt ?? `${product.name} de ${product.brand}`}
              name={product.name}
              brand={product.brand}
              priority={priority}
            />
          </div>
          <span aria-hidden="true" className="card-shine" />
          <div className="absolute top-3 left-3 flex flex-col items-start gap-1.5">
            {product.isNew && <Badge tone="light">Nuevo</Badge>}
            {discount > 0 && <Badge tone="gold">-{discount}%</Badge>}
          </div>
          {!inStock ? (
            <div className="absolute inset-x-0 bottom-0 bg-ink/80 py-2 text-center">
              <span className="eyebrow text-[0.6rem] text-ivory">{price ? "Agotado" : "Próximamente"}</span>
            </div>
          ) : (
            <div
              aria-hidden="true"
              className="card-cta absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-ink/90 py-3 text-ivory backdrop-blur-sm"
            >
              <span className="eyebrow text-[0.6rem] text-gold-light">Ver perfume</span>
              <ArrowRightIcon size={14} className="text-gold" />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5 px-0.5">
          <p className="eyebrow text-[0.6rem] text-muted transition-colors group-hover:text-gold-dark">{product.brand}</p>
          <h3 className="font-display text-xl leading-snug text-ink transition-colors group-hover:text-gold-dark">
            {product.name}
          </h3>
          <Price cents={price} compareAtCents={cheapest?.compareAtPriceCents} from={priced.length > 1} size="sm" />
          {hasDecants(product) && decantSizes.length > 0 && (
            <p className="text-xs text-muted">Decants {decantSizes.join(" · ")}</p>
          )}
        </div>
      </Link>
    </article>
  );
}

export function ProductGrid({ products, variantKind }: { products: Product[]; variantKind?: "decant" | "bottle" }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4">
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < 4} variantKind={variantKind} index={i} />
      ))}
    </div>
  );
}

/** Carrusel horizontal en móvil, rejilla en escritorio */
export function ProductRail({ products }: { products: Product[] }) {
  return (
    <div className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pt-2 pb-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-6 sm:overflow-visible sm:px-0 lg:grid-cols-4">
      {products.map((p, i) => (
        <div key={p.id} className="w-[68%] shrink-0 snap-start sm:w-auto">
          <ProductCard product={p} index={i} />
        </div>
      ))}
    </div>
  );
}
