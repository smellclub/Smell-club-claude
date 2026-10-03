"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { siteConfig } from "@/config/site";
import { useCart } from "@/components/cart/cart-provider";
import { Logo } from "@/components/layout/logo";
import { BagIcon, CloseIcon, InstagramIcon, MenuIcon, SearchIcon, WhatsAppIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

export function Header({ whatsappHref, instagramHref }: { whatsappHref: string | null; instagramHref: string | null }) {
  const pathname = usePathname();
  const { count, hydrated } = useCart();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);

  // Cierra el menú al navegar
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 8);
      // Barra dorada de progreso de lectura
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progressRef.current?.style.setProperty("--progress", String(max > 0 ? Math.min(1, window.scrollY / max) : 0));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b transition-colors duration-300",
        scrolled ? "border-ink-line bg-ink/95 backdrop-blur" : "border-transparent bg-ink",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3 sm:px-8 md:h-20">
        <button
          type="button"
          className="flex size-12 items-center justify-center text-ivory md:hidden"
          aria-label="Abrir menú"
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen(true)}
        >
          <MenuIcon size={24} />
        </button>

        <Logo className="text-xl md:text-2xl" />

        <nav aria-label="Principal" className="hidden items-center gap-9 md:flex">
          {siteConfig.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname.startsWith(item.href) ? "page" : undefined}
              className={cn(
                "nav-link eyebrow py-2 transition-colors",
                pathname.startsWith(item.href) ? "text-gold" : "text-ivory/80 hover:text-gold-light",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center">
          <Link href="/shop" aria-label="Buscar perfumes" className="hidden size-12 items-center justify-center text-ivory hover:text-gold-light sm:flex">
            <SearchIcon />
          </Link>
          <Link
            href="/cart"
            aria-label={`Carrito${hydrated && count ? `, ${count} artículos` : ""}`}
            className="relative flex size-12 items-center justify-center text-ivory hover:text-gold-light"
          >
            <BagIcon size={22} />
            {hydrated && count > 0 && (
              <span key={count} className="badge-pop absolute top-1.5 right-1 flex min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[0.65rem] leading-5 font-semibold text-ink">
                {count > 99 ? "99+" : count}
              </span>
            )}
          </Link>
        </div>
      </div>

      <div ref={progressRef} aria-hidden="true" className="scroll-progress absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-gold-dark via-gold-light to-gold" />

      {open && (
        <div id="mobile-menu" className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Menú">
          <button type="button" aria-label="Cerrar menú" className="animate-fade-in absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="animate-slide-in absolute inset-y-0 left-0 flex w-[85%] max-w-sm flex-col bg-ink text-ivory">
            <div className="flex h-16 items-center justify-between px-3">
              <Logo className="pl-2 text-xl" />
              <button type="button" aria-label="Cerrar menú" className="flex size-12 items-center justify-center" onClick={() => setOpen(false)}>
                <CloseIcon size={24} />
              </button>
            </div>
            <nav aria-label="Menú móvil" className="flex flex-1 flex-col px-6 pt-6">
              {[{ label: "Inicio", href: "/" }, ...siteConfig.nav, { label: "Carrito", href: "/cart" }].map((item, i) => (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{ animationDelay: `${120 + i * 60}ms` }}
                  className={cn(
                    "animate-fade-up border-b border-ink-line py-4 font-display text-2xl transition-colors hover:text-gold-light",
                    pathname === item.href ? "text-gold" : "text-ivory",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="flex gap-3 px-6 pb-8">
              {whatsappHref && (
                <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="flex min-h-12 flex-1 items-center justify-center gap-2 border border-ink-line text-sm hover:border-gold">
                  <WhatsAppIcon size={18} /> WhatsApp
                </a>
              )}
              {instagramHref && (
                <a href={instagramHref} target="_blank" rel="noopener noreferrer" className="flex min-h-12 flex-1 items-center justify-center gap-2 border border-ink-line text-sm hover:border-gold">
                  <InstagramIcon size={18} /> Instagram
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
