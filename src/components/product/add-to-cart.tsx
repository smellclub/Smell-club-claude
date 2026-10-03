"use client";

import { useState } from "react";
import { useCart } from "@/components/cart/cart-provider";
import { Price } from "@/components/product/price";
import { Button } from "@/components/ui/button";
import { MinusIcon, PlusIcon, WhatsAppIcon } from "@/components/ui/icons";
import { LOW_STOCK_THRESHOLD, MAX_QTY_PER_ITEM } from "@/lib/constants";
import { formatPrice } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { Variant } from "@/types/domain";

type Props = {
  productId: string;
  slug: string;
  name: string;
  brand: string;
  image: string | null;
  variants: Variant[];
  whatsappHref: string | null;
};

export function AddToCart({ productId, slug, name, brand, image, variants, whatsappHref }: Props) {
  const { addItem } = useCart();
  const initial = variants.find((v) => v.priceCents > 0 && v.stock > 0) ?? variants[0];
  const [selectedId, setSelectedId] = useState(initial?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  const selected = variants.find((v) => v.id === selectedId) ?? null;
  const hasPrice = Boolean(selected && selected.priceCents > 0);
  const available = Boolean(selected && hasPrice && selected.stock > 0);
  const maxQty = selected ? Math.max(1, Math.min(selected.stock, MAX_QTY_PER_ITEM)) : 1;

  if (variants.length === 0) {
    return <p className="text-sm text-muted">Este perfume estará disponible próximamente.</p>;
  }

  function onAdd() {
    if (!selected) return;
    const result = addItem(
      {
        variantId: selected.id,
        productId,
        slug,
        name,
        brand,
        label: selected.label,
        priceCents: selected.priceCents,
        image,
        maxStock: selected.stock,
      },
      quantity,
    );
    setFeedback(result);
    if (result.ok) setQuantity(1);
  }

  return (
    <div className="flex flex-col gap-6">
      <Price
        cents={selected?.priceCents ?? null}
        compareAtCents={selected?.compareAtPriceCents}
        size="lg"
      />

      <fieldset>
        <legend className="eyebrow mb-3 text-[0.62rem] text-muted">Elige formato</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {variants.map((v) => {
            const soldOut = v.stock <= 0 || v.priceCents <= 0;
            const active = v.id === selectedId;
            return (
              <label
                key={v.id}
                className={cn(
                  "relative flex min-h-16 cursor-pointer flex-col justify-center border px-3 py-2 text-left transition-colors",
                  active ? "border-ink bg-ink text-ivory" : "border-line bg-white hover:border-ink",
                  soldOut && !active && "text-muted",
                )}
              >
                <input
                  type="radio"
                  name="variant"
                  value={v.id}
                  checked={active}
                  onChange={() => {
                    setSelectedId(v.id);
                    setQuantity(1);
                    setFeedback(null);
                  }}
                  className="sr-only"
                />
                <span className="text-sm font-medium">{v.label}</span>
                <span className={cn("text-xs", active ? "text-gold-light" : "text-muted")}>
                  {v.priceCents <= 0 ? "Por confirmar" : soldOut ? "Agotado" : formatPrice(v.priceCents)}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {selected && (
        <p className="text-sm" aria-live="polite">
          {!hasPrice ? (
            <span className="text-muted">Precio y disponibilidad por confirmar. Consúltanos.</span>
          ) : selected.stock <= 0 ? (
            <span className="text-danger">Agotado temporalmente</span>
          ) : selected.stock <= LOW_STOCK_THRESHOLD ? (
            <span className="text-gold-dark">Quedan solo {selected.stock}</span>
          ) : (
            <span className="text-success">Disponible</span>
          )}
        </p>
      )}

      {available && (
        <div className="flex gap-3">
          <div className="flex items-center border border-line bg-white" role="group" aria-label="Cantidad">
            <button
              type="button"
              className="flex size-12 items-center justify-center disabled:opacity-30"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              aria-label="Reducir cantidad"
            >
              <MinusIcon size={16} />
            </button>
            <span className="w-8 text-center text-sm tabular-nums" aria-live="polite">
              {quantity}
            </span>
            <button
              type="button"
              className="flex size-12 items-center justify-center disabled:opacity-30"
              onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
              disabled={quantity >= maxQty}
              aria-label="Aumentar cantidad"
            >
              <PlusIcon size={16} />
            </button>
          </div>
          <Button onClick={onAdd} size="lg" className="flex-1">
            Añadir al carrito
          </Button>
        </div>
      )}

      {feedback && (
        <p role="status" className={cn("text-sm", feedback.ok ? "text-success" : "text-danger")}>
          {feedback.message}
        </p>
      )}

      {whatsappHref && (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-12 items-center justify-center gap-2 border border-line bg-white text-[0.7rem] font-medium tracking-[0.18em] uppercase hover:border-ink"
        >
          <WhatsAppIcon size={18} className="text-[#25D366]" />
          {available ? "Consultar por WhatsApp" : "Avísame / consultar"}
        </a>
      )}
    </div>
  );
}
