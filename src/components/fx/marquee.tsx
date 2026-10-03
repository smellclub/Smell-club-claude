import { cn } from "@/lib/utils";

/** Cinta infinita (se duplica el contenido para que el bucle no se note). */
export function Marquee({
  items,
  reverse = false,
  duration = 40,
  className,
  itemClassName,
}: {
  items: string[];
  reverse?: boolean;
  duration?: number;
  className?: string;
  itemClassName?: string;
}) {
  if (items.length === 0) return null;
  const track = (hidden: boolean) => (
    <div className="marquee-track" aria-hidden={hidden || undefined}>
      {items.map((item, i) => (
        <span key={`${item}-${i}`} className={cn("flex shrink-0 items-center gap-12 whitespace-nowrap", itemClassName)}>
          {item}
          <span className="text-gold" aria-hidden="true">
            ✦
          </span>
        </span>
      ))}
    </div>
  );
  return (
    <div
      className={cn("marquee", reverse && "marquee-reverse", className)}
      style={{ "--marquee-duration": `${duration}s` } as React.CSSProperties}
    >
      {track(false)}
      {track(true)}
    </div>
  );
}
