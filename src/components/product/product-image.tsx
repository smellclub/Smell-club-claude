import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Imagen de producto optimizada (next/image: AVIF/WebP, lazy loading,
 * tamaños responsive). Si no hay foto, muestra un placeholder elegante.
 */
export function ProductImage({
  src,
  alt,
  name,
  brand,
  sizes = "(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw",
  priority = false,
  className,
  padded = true,
}: {
  src: string | null;
  alt: string;
  name: string;
  brand?: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
  /** Muestra el frasco completo (sin recortar) con margen sobre fondo blanco */
  padded?: boolean;
}) {
  if (!src) {
    return (
      <div
        role="img"
        aria-label={`${name}: imagen próximamente`}
        className={cn(
          "relative flex h-full w-full flex-col items-center justify-center gap-3 overflow-hidden bg-gradient-to-b from-ink-soft to-ink text-center",
          className,
        )}
      >
        <div className="absolute inset-6 border border-gold/20" aria-hidden="true" />
        {brand && <span className="eyebrow px-6 text-[0.55rem] text-gold/70">{brand}</span>}
        <span className="px-6 font-display text-xl leading-tight text-ivory/90 sm:text-2xl">{name}</span>
        <span className="gold-rule" aria-hidden="true" />
        <span className="text-[0.6rem] tracking-[0.2em] text-ivory/40 uppercase">Foto próximamente</span>
      </div>
    );
  }

  if (!padded) {
    return <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={cn("object-cover", className)} />;
  }

  // Fotos de producto (a menudo pequeñas y cuadradas): se muestran enteras,
  // centradas y sin ampliarse de más, para que se vean nítidas.
  return (
    <div className={cn("relative h-full w-full bg-white", className)}>
      <div className="absolute inset-[10%]">
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-contain mix-blend-multiply" />
      </div>
    </div>
  );
}
