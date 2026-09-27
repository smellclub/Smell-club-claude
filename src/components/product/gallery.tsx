"use client";

import { useState } from "react";
import { ProductImage } from "@/components/product/product-image";
import { cn } from "@/lib/utils";
import type { ProductImage as ProductImageType } from "@/types/domain";

export function ProductGallery({ images, name, brand }: { images: ProductImageType[]; name: string; brand: string }) {
  const [active, setActive] = useState(0);
  const current = images[active] ?? null;

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-sand">
        <ProductImage
          src={current?.url ?? null}
          alt={current?.alt ?? `${name} de ${brand}`}
          name={name}
          brand={brand}
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
        />
      </div>
      {images.length > 1 && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto" role="list" aria-label="Imágenes del producto">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              role="listitem"
              onClick={() => setActive(i)}
              aria-label={`Ver imagen ${i + 1}`}
              aria-current={i === active}
              className={cn(
                "relative aspect-square w-20 shrink-0 overflow-hidden border-2 transition-colors",
                i === active ? "border-gold" : "border-transparent opacity-70 hover:opacity-100",
              )}
            >
              <ProductImage src={img.url} alt="" name={name} sizes="80px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
