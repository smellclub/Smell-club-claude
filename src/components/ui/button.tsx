import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "gold" | "outline" | "outline-light" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const base =
  "btn-fx inline-flex items-center justify-center gap-2 font-medium uppercase tracking-[0.18em] transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 select-none";

const variants: Record<Variant, string> = {
  primary: "bg-ink text-ivory hover:bg-ink-soft hover:text-gold-light",
  gold: "bg-gold text-ink hover:bg-gold-light hover:shadow-[0_12px_40px_-10px_rgba(197,162,90,0.8)]",
  outline: "border border-ink text-ink hover:bg-ink hover:text-ivory",
  "outline-light": "border border-ivory/40 text-ivory hover:border-gold hover:text-gold-light",
  ghost: "text-ink hover:text-gold-dark",
  danger: "border border-danger text-danger hover:bg-danger hover:text-white",
};

const sizes: Record<Size, string> = {
  sm: "min-h-10 px-4 text-[0.68rem]",
  md: "min-h-12 px-6 text-[0.72rem]",
  lg: "min-h-14 px-8 text-xs",
};

export function buttonClasses(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button type={type} className={buttonClasses(variant, size, className)} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClasses(variant, size, className)} {...props} />;
}
