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
    <div className={cn("flex flex-col gap-3", align === "center" ? "items-center text-center" : "items-start")}>
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
