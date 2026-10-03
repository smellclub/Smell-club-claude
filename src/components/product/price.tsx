import { discountPercent, formatPrice } from "@/lib/money";
import { cn } from "@/lib/utils";

export function Price({
  cents,
  compareAtCents,
  from = false,
  className,
  size = "md",
}: {
  cents: number | null;
  compareAtCents?: number | null;
  from?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  if (cents === null || cents <= 0) {
    return <p className={cn("text-sm text-muted italic", className)}>Precio por confirmar</p>;
  }
  const discount = discountPercent(cents, compareAtCents ?? null);
  const sizes = { sm: "text-sm", md: "text-base", lg: "text-2xl" };

  return (
    <p className={cn("flex flex-wrap items-baseline gap-x-2", className)}>
      {from && <span className="text-xs text-muted">Desde</span>}
      <span className={cn("font-medium tabular-nums", sizes[size])}>{formatPrice(cents)}</span>
      {discount > 0 && compareAtCents && (
        <>
          <span className="text-xs text-muted line-through">
            <span className="sr-only">Antes </span>
            {formatPrice(compareAtCents)}
          </span>
          <span className="text-xs font-semibold text-gold-dark">-{discount}%</span>
        </>
      )}
    </p>
  );
}
