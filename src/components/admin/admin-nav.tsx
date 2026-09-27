"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/admin/actions";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/orders", label: "Pedidos" },
  { href: "/admin/products", label: "Productos" },
  { href: "/admin/categories", label: "Categorías" },
  { href: "/admin/messages", label: "Mensajes" },
];

export function AdminNav({ email }: { email: string }) {
  const pathname = usePathname();
  const isActive = (href: string, exact?: boolean) => (exact ? pathname === href : pathname.startsWith(href));

  return (
    <aside className="sticky top-0 z-30 bg-ink text-ivory lg:h-dvh lg:w-60 lg:shrink-0">
      <div className="flex items-center justify-between px-4 py-3 lg:block lg:px-6 lg:py-8">
        <Link href="/admin" className="font-display text-xl tracking-[0.2em] uppercase">
          Smell<span className="text-gold">club</span>
        </Link>
        <p className="hidden truncate pt-1 text-xs text-ivory/40 lg:block" title={email}>
          {email}
        </p>
        <form action={logoutAction} className="lg:hidden">
          <button type="submit" className="min-h-10 px-2 text-xs text-ivory/70 hover:text-gold">
            Salir
          </button>
        </form>
      </div>
      <nav aria-label="Administración" className="no-scrollbar flex gap-1 overflow-x-auto px-2 pb-2 lg:flex-col lg:px-3">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "flex min-h-11 shrink-0 items-center px-3 text-sm whitespace-nowrap transition-colors",
              isActive(l.href, l.exact) ? "bg-ivory/10 text-gold" : "text-ivory/70 hover:text-ivory",
            )}
          >
            {l.label}
          </Link>
        ))}
        <Link
          href="/"
          target="_blank"
          className="flex min-h-11 shrink-0 items-center px-3 text-sm whitespace-nowrap text-ivory/50 hover:text-ivory lg:mt-6"
        >
          Ver tienda ↗
        </Link>
      </nav>
      <form action={logoutAction} className="hidden px-3 pt-4 lg:block">
        <button type="submit" className="flex min-h-11 w-full items-center px-3 text-sm text-ivory/50 hover:text-gold">
          Cerrar sesión
        </button>
      </form>
    </aside>
  );
}
