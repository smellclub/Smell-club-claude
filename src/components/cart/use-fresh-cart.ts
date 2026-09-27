"use client";

import { useEffect, useRef, useState } from "react";
import { refreshCart } from "@/app/(store)/cart/actions";
import { useCart, type CartItem } from "@/components/cart/cart-provider";
import { MAX_QTY_PER_ITEM } from "@/lib/constants";

/**
 * Sincroniza el carrito con el precio/stock real del servidor y
 * devuelve avisos para el usuario (precio cambiado, sin stock, etc.).
 */
export function useFreshCart() {
  const { items, hydrated, replaceItems } = useCart();
  const [checking, setChecking] = useState(true);
  const [notices, setNotices] = useState<string[]>([]);
  const [version, setVersion] = useState(0);
  const lastKey = useRef<string>("");

  const key = items
    .map((i) => i.variantId)
    .sort()
    .join(",");

  useEffect(() => {
    if (!hydrated) return;
    if (items.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- estado derivado de una petición externa
      setChecking(false);
      return;
    }
    const runKey = `${key}#${version}`;
    if (lastKey.current === runKey) return;
    lastKey.current = runKey;

    let cancelled = false;
    setChecking(true);
    refreshCart(items.map((i) => i.variantId))
      .then((fresh) => {
        if (cancelled) return;
        const byId = new Map(fresh.map((f) => [f.variantId, f]));
        const messages: string[] = [];
        const next: CartItem[] = [];

        for (const item of items) {
          const f = byId.get(item.variantId);
          if (!f || !f.available) {
            messages.push(`«${item.name} · ${item.label}» ya no está disponible y se ha quitado del carrito.`);
            continue;
          }
          if (f.priceCents !== item.priceCents) {
            messages.push(`El precio de «${f.name} · ${f.label}» se ha actualizado.`);
          }
          const maxQty = Math.min(f.stock, MAX_QTY_PER_ITEM);
          let quantity = item.quantity;
          if (quantity > maxQty) {
            quantity = maxQty;
            messages.push(`Solo quedan ${f.stock} de «${f.name} · ${f.label}». Hemos ajustado la cantidad.`);
          }
          next.push({
            ...item,
            productId: f.productId,
            slug: f.slug,
            name: f.name,
            brand: f.brand,
            label: f.label,
            priceCents: f.priceCents,
            image: f.image,
            maxStock: f.stock,
            quantity,
          });
        }

        const changed = JSON.stringify(next) !== JSON.stringify(items);
        setNotices(messages);
        setChecking(false);
        if (changed) {
          // Evita volver a consultar por el cambio que acabamos de aplicar
          lastKey.current = `${next.map((i) => i.variantId).sort().join(",")}#${version}`;
          replaceItems(next);
        }
      })
      .catch(() => {
        if (cancelled) return;
        setNotices(["No hemos podido comprobar el stock. Se verificará al enviar el pedido."]);
        setChecking(false);
      });

    return () => {
      cancelled = true;
    };
  }, [hydrated, key, version, items, replaceItems]);

  return {
    checking: !hydrated || checking,
    notices,
    recheck: () => {
      lastKey.current = "";
      setVersion((v) => v + 1);
    },
  };
}
