import { cn } from "@/lib/utils";

export function Container({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-7xl px-5 sm:px-8", className)}>{children}</div>;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  tone = "dark",
  as: Tag = "h2",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "center" | "left";
  tone?: "dark" | "light";
  as?: "h1" | "h2";
}) {
  return (
    <div data-reveal className={cn("flex flex-col gap-3", align === "center" ? "items-center text-center" : "items-start")}>
      {eyebrow && <p className={cn("eyebrow", tone === "light" ? "text-gold" : "text-gold-dark")}>{eyebrow}</p>}
      <Tag
        className={cn(
          "font-display text-3xl leading-tight font-medium sm:text-4xl md:text-5xl",
          tone === "light" ? "text-ivory" : "text-ink",
        )}
      >
        {title}
      </Tag>
      <span className="gold-rule" aria-hidden="true" />
      {description && (
        <p className={cn("max-w-xl text-sm leading-relaxed sm:text-base", tone === "light" ? "text-ivory/70" : "text-muted")}>
          {description}
        </p>
      )}
    </div>
  );
}

/**
 * Cabecera de las páginas interiores: banda oscura con resplandor dorado
 * en movimiento, polvo dorado y título que aparece con animación.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  icon,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <section className="relative isolate overflow-hidden bg-ink text-ivory">
      <div aria-hidden="true" className="aurora -z-10" />
      <div aria-hidden="true" className="gold-dust -z-10" />
      <Container className="relative flex flex-col items-center py-16 text-center sm:py-24">
        {icon && <span className="float-slow mb-5 text-gold">{icon}</span>}
        {eyebrow && (
          <p data-reveal className="eyebrow text-gold">
            {eyebrow}
          </p>
        )}
        <h1 data-reveal style={{ "--i": 1 } as React.CSSProperties} className="mt-4 font-display text-4xl leading-tight sm:text-6xl">
          {title}
        </h1>
        <span data-reveal style={{ "--i": 2 } as React.CSSProperties} className="gold-rule mt-6 w-24" aria-hidden="true" />
        {description && (
          <p data-reveal style={{ "--i": 3 } as React.CSSProperties} className="mt-6 max-w-xl text-sm leading-relaxed text-ivory/65 sm:text-base">
            {description}
          </p>
        )}
        {children}
      </Container>
    </section>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-4 border border-dashed border-line px-6 py-16 text-center">
      <span className="gold-rule" aria-hidden="true" />
      <h2 className="font-display text-2xl">{title}</h2>
      {description && <p className="max-w-md text-sm text-muted">{description}</p>}
      {action}
    </div>
  );
}

export function Badge({ children, tone = "dark" }: { children: React.ReactNode; tone?: "dark" | "gold" | "light" | "muted" }) {
  const tones = {
    dark: "bg-ink text-ivory",
    gold: "bg-gold text-ink",
    light: "bg-ivory text-ink",
    muted: "bg-sand text-muted",
  };
  return (
    <span className={cn("inline-flex items-center px-2 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.16em]", tones[tone])}>
      {children}
    </span>
  );
}
