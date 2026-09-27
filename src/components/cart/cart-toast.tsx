"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useCart } from "@/components/cart/cart-provider";
import { CheckIcon, CloseIcon } from "@/components/ui/icons";

export function CartToast() {
  const { toast, dismissToast } = useCart();

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(dismissToast, 4000);
    return () => window.clearTimeout(t);
  }, [toast, dismissToast]);

  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4 sm:justify-end sm:px-6">
      {toast && (
        <div
          key={toast.id}
          role="status"
          className="animate-fade-up pointer-events-auto flex w-full max-w-sm items-center gap-3 border border-gold/40 bg-ink px-4 py-3 text-ivory shadow-2xl"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gold text-ink">
            <CheckIcon size={16} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{toast.name}</p>
            <p className="truncate text-xs text-ivory/60">{toast.label} · añadido al carrito</p>
          </div>
          <Link href="/cart" onClick={dismissToast} className="eyebrow shrink-0 text-gold hover:text-gold-light">
            Ver
          </Link>
          <button type="button" onClick={dismissToast} aria-label="Cerrar aviso" className="p-1 text-ivory/60 hover:text-ivory">
            <CloseIcon size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
