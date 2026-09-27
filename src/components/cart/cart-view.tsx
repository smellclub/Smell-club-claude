"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/cart/cart-provider";
import { useFreshCart } from "@/components/cart/use-fresh-cart";
import { ButtonLink } from "@/components/ui/button";
import { MinusIcon, PlusIcon, TrashIcon } from "@/components/ui/icons";
import { EmptyState } from "@/components/ui/layout";
import { MAX_QTY_PER_ITEM } from "@/lib/constants";
import { formatPrice } from "@/lib/money";

export function CartView() {
  const { items, hydrated, subtotalCents, setQuantity, removeItem } = useCart();
  const { checking, notices } = useFreshCart();

  if (!hydrated) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        {[0, 1].map((i) => (
          <div key={i} className="skeleton h-28 w-full" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="Tu carrito está vacío"
        description="Descubre nuestras fragancias o empieza probando con un decant."
        action={
          <div className="flex flex-col gap-2 sm:flex-row">
            <ButtonLink href="/shop">Ver la tienda</ButtonLink>
            <ButtonLink href="/decants" variant="outline">
              Ver decants
            </ButtonLink>
          </div>
        }
      />
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
      <div>
        {notices.length > 0 && (
          <div role="alert" className="mb-6 flex flex-col gap-1 border border-gold/50 bg-gold/10 p-4 text-sm">
            {notices.map((n) => (
              <p key={n}>{n}</p>
            ))}
          </div>
        )}

        <ul className="divide-y divide-line border-y border-line">
          {items.map((item) => {
            const maxQty = Math.min(item.maxStock, MAX_QTY_PER_ITEM);
            return (
              <li key={item.variantId} className="flex gap-4 py-5">
                <Link href={`/product/${item.slug}`} className="relative aspect-[4/5] w-20 shrink-0 overflow-hidden bg-ink sm:w-24">
                  {item.image ? (
                    <Image src={item.image} alt="" fill sizes="96px" className="object-cover" />
                  ) : (
                    <span className="flex h-full items-center justify-center p-2 text-center font-display text-xs text-ivory/80">
                      {item.name}
                    </span>
                  )}
                </Link>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <p className="eyebrow text-[0.58rem] text-muted">{item.brand}</p>
                  <Link href={`/product/${item.slug}`} className="font-display text-xl leading-tight hover:text-gold-dark">
                    {item.name}
                  </Link>
                  <p className="text-sm text-muted">{item.label}</p>
                  <div className="mt-auto flex items-center justify-between gap-3 pt-2">
                    <div className="flex items-center border border-line bg-white" role="group" aria-label={`Cantidad de ${item.name}`}>
                      <button
                        type="button"
                        className="flex size-11 items-center justify-center disabled:opacity-30"
                        onClick={() => setQuantity(item.variantId, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        aria-label="Reducir cantidad"
                      >
                        <MinusIcon size={14} />
                      </button>
                      <span className="w-7 text-center text-sm tabular-nums">{item.quantity}</span>
                      <button
                        type="button"
                        className="flex size-11 items-center justify-center disabled:opacity-30"
                        onClick={() => setQuantity(item.variantId, item.quantity + 1)}
                        disabled={item.quantity >= maxQty}
                        aria-label="Aumentar cantidad"
                      >
                        <PlusIcon size={14} />
                      </button>
                    </div>
                    <p className="text-sm font-medium tabular-nums">{formatPrice(item.priceCents * item.quantity)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(item.variantId)}
                  className="flex size-11 shrink-0 items-center justify-center self-start text-muted hover:text-danger"
                  aria-label={`Eliminar ${item.name} ${item.label}`}
                >
                  <TrashIcon size={18} />
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <aside className="h-fit border border-line bg-white p-6 lg:sticky lg:top-28">
        <h2 className="font-display text-2xl">Resumen</h2>
        <dl className="mt-6 flex flex-col gap-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Subtotal</dt>
            <dd className="tabular-nums">{formatPrice(subtotalCents)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Envío</dt>
            <dd className="text-right text-muted">Se confirma con el pedido</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-3 text-base font-medium">
            <dt>Total estimado</dt>
            <dd className="tabular-nums">{formatPrice(subtotalCents)}</dd>
          </div>
        </dl>
        <ButtonLink
          href="/checkout"
          size="lg"
          className="mt-6 w-full"
          aria-disabled={checking}
          onClick={(e) => checking && e.preventDefault()}
        >
          {checking ? "Comprobando stock…" : "Finalizar pedido"}
        </ButtonLink>
        <Link href="/shop" className="mt-4 block text-center text-sm text-muted underline-offset-4 hover:text-ink hover:underline">
          Seguir comprando
        </Link>
      </aside>
    </div>
  );
}
