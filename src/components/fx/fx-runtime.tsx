"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Motor de animaciones de la tienda (un solo componente para toda la web):
 *  - Aparición al hacer scroll: a cada elemento con [data-reveal] le añade
 *    [data-revealed] cuando entra en pantalla (y deja de observarlo).
 *  - Foco de luz: en los elementos .spotlight actualiza --mx/--my con la
 *    posición del mouse.
 * Con "reducir movimiento" todo aparece directamente.
 */
export function FxRuntime() {
  const pathname = usePathname();

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const reveal = (el: Element) => el.setAttribute("data-revealed", "");

    const io = reduce
      ? null
      : new IntersectionObserver(
          (entries) => {
            for (const e of entries) {
              if (e.isIntersecting) {
                reveal(e.target);
                io?.unobserve(e.target);
              }
            }
          },
          { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
        );

    const scan = (root: ParentNode) => {
      root.querySelectorAll("[data-reveal]:not([data-revealed])").forEach((el) => {
        if (io) io.observe(el);
        else reveal(el);
      });
    };
    scan(document);

    // Contenido que aparece después (filtros, carrito, etc.)
    const mo = new MutationObserver((records) => {
      for (const r of records) {
        r.addedNodes.forEach((n) => {
          if (n instanceof Element) {
            if (n.matches("[data-reveal]:not([data-revealed])")) {
              if (io) io.observe(n);
              else reveal(n);
            }
            scan(n);
          }
        });
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });

    const onMove = (e: PointerEvent) => {
      const el = (e.target as Element | null)?.closest?.(".spotlight") as HTMLElement | null;
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - r.left}px`);
      el.style.setProperty("--my", `${e.clientY - r.top}px`);
    };
    if (!reduce) document.addEventListener("pointermove", onMove, { passive: true });

    return () => {
      io?.disconnect();
      mo.disconnect();
      document.removeEventListener("pointermove", onMove);
    };
  }, [pathname]);

  return null;
}
