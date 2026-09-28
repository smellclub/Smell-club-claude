"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { MAX_CART_LINES, MAX_QTY_PER_ITEM } from "@/lib/constants";

/**
 * Carrito en localStorage. Los precios guardados aquí son SOLO para
 * mostrar: el servidor recalcula todo desde la base de datos al pedir.
 */
export type CartItem = {
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  brand: string;
  label: string;
  priceCents: number;
  image: string | null;
  quantity: number;
  maxStock: number;
};

type AddResult = { ok: boolean; message: string };

type CartContextValue = {
  items: CartItem[];
  hydrated: boolean;
  count: number;
  subtotalCents: number;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => AddResult;
  setQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  replaceItems: (items: CartItem[]) => void;
  clear: () => void;
  toast: { id: number; name: string; label: string } | null;
  dismissToast: () => void;
};

const STORAGE_KEY = "smellclub:cart:v1";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const CartContext = createContext<CartContextValue | null>(null);

function isCartItem(v: unknown): v is CartItem {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.variantId === "string" &&
    UUID_RE.test(o.variantId) &&
    typeof o.productId === "string" &&
    typeof o.slug === "string" &&
    /^[a-z0-9-]{1,140}$/.test(o.slug) &&
    typeof o.name === "string" &&
    typeof o.brand === "string" &&
    typeof o.label === "string" &&
    typeof o.priceCents === "number" &&
    Number.isInteger(o.priceCents) &&
    o.priceCents >= 0 &&
    (o.image === null ||
      (typeof o.image === "string" && (o.image.startsWith("https://") || /^\/products\/[a-z0-9-]+\.(jpg|png)$/.test(o.image)))) &&
    typeof o.quantity === "number" &&
    Number.isInteger(o.quantity) &&
    o.quantity >= 1 &&
    typeof o.maxStock === "number"
  );
}

function readStorage(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(isCartItem)
      .slice(0, MAX_CART_LINES)
      .map((i) => ({ ...i, quantity: Math.min(i.quantity, MAX_QTY_PER_ITEM) }));
  } catch {
    return [];
  }
}

function clampQty(quantity: number, maxStock: number): number {
  return Math.max(1, Math.min(Math.floor(quantity), MAX_QTY_PER_ITEM, Math.max(maxStock, 1)));
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [toast, setToast] = useState<CartContextValue["toast"]>(null);
  const itemsRef = useRef<CartItem[]>([]);

  useEffect(() => {
    // Carga inicial desde localStorage (solo existe en el navegador)
    const initial = readStorage();
    itemsRef.current = initial;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sincronización con un sistema externo (localStorage)
    setItems(initial);
    setHydrated(true);

    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        const next = readStorage();
        itemsRef.current = next;
        setItems(next);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const commit = useCallback((next: CartItem[]) => {
    itemsRef.current = next;
    setItems(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Almacenamiento lleno o bloqueado (modo privado): el carrito sigue en memoria.
    }
  }, []);

  const addItem = useCallback<CartContextValue["addItem"]>(
    (item, quantity = 1) => {
      const current = itemsRef.current;
      const existing = current.find((i) => i.variantId === item.variantId);
      const limit = Math.min(item.maxStock, MAX_QTY_PER_ITEM);

      if (item.maxStock <= 0 || item.priceCents <= 0) {
        return { ok: false, message: "Esta opción no está disponible ahora mismo." };
      }
      if (!existing && current.length >= MAX_CART_LINES) {
        return { ok: false, message: "Has alcanzado el máximo de productos en el carrito." };
      }
      const desired = (existing?.quantity ?? 0) + quantity;
      if (desired > limit) {
        return {
          ok: false,
          message: `Solo puedes añadir ${limit} ${limit === 1 ? "unidad" : "unidades"} de esta opción.`,
        };
      }

      const next = existing
        ? current.map((i) =>
            i.variantId === item.variantId ? { ...i, ...item, quantity: clampQty(desired, item.maxStock) } : i,
          )
        : [...current, { ...item, quantity: clampQty(quantity, item.maxStock) }];
      commit(next);
      setToast({ id: Date.now(), name: item.name, label: item.label });
      return { ok: true, message: "Añadido al carrito" };
    },
    [commit],
  );

  const setQuantity = useCallback(
    (variantId: string, quantity: number) => {
      commit(
        itemsRef.current.map((i) => (i.variantId === variantId ? { ...i, quantity: clampQty(quantity, i.maxStock) } : i)),
      );
    },
    [commit],
  );

  const removeItem = useCallback(
    (variantId: string) => commit(itemsRef.current.filter((i) => i.variantId !== variantId)),
    [commit],
  );

  const replaceItems = useCallback((next: CartItem[]) => commit(next), [commit]);
  const clear = useCallback(() => commit([]), [commit]);
  const dismissToast = useCallback(() => setToast(null), []);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      hydrated,
      count: items.reduce((sum, i) => sum + i.quantity, 0),
      subtotalCents: items.reduce((sum, i) => sum + i.priceCents * i.quantity, 0),
      addItem,
      setQuantity,
      removeItem,
      replaceItems,
      clear,
      toast,
      dismissToast,
    }),
    [items, hydrated, addItem, setQuantity, removeItem, replaceItems, clear, toast, dismissToast],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de <CartProvider>");
  return ctx;
}
