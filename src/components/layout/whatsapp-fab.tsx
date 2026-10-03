"use client";

import { usePathname } from "next/navigation";
import { WhatsAppIcon } from "@/components/ui/icons";

/** Botón flotante de WhatsApp (se oculta en carrito/checkout para no tapar botones). */
export function WhatsAppFab({ href }: { href: string }) {
  const pathname = usePathname();
  if (pathname.startsWith("/checkout") || pathname.startsWith("/cart") || pathname.startsWith("/product/")) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escríbenos por WhatsApp"
      className="animate-fade-in fixed right-4 bottom-4 z-30 flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl transition-transform hover:scale-110 sm:right-6 sm:bottom-6"
    >
      <span aria-hidden="true" className="absolute inset-0 animate-ping rounded-full bg-[#25D366] opacity-30 [animation-duration:2.4s]" />
      <WhatsAppIcon size={28} className="relative" />
    </a>
  );
}
