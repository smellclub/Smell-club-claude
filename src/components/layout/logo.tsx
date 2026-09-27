import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Logotipo tipográfico. Si tienes un logo en imagen, colócalo en
 * /public/brand/logo.svg y sustituye el contenido por <Image>.
 */
export function Logo({ className, tone = "light" }: { className?: string; tone?: "light" | "dark" }) {
  return (
    <Link
      href="/"
      aria-label="Smellclub · Inicio"
      className={cn(
        "font-display text-2xl leading-none font-medium tracking-[0.22em] uppercase",
        tone === "light" ? "text-ivory" : "text-ink",
        className,
      )}
    >
      Smell<span className="text-gold">club</span>
    </Link>
  );
}
