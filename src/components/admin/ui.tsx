import Link from "next/link";
import { ORDER_STATUSES, labelOf } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({ className, children, title }: { className?: string; children: React.ReactNode; title?: string }) {
  return (
    <section className={cn("border border-line bg-white p-5 sm:p-6", className)}>
      {title && <h2 className="mb-4 font-display text-xl">{title}</h2>}
      {children}
    </section>
  );
}

const statusTones: Record<string, string> = {
  pending: "bg-gold/20 text-gold-dark",
  confirmed: "bg-blue-100 text-blue-800",
  preparing: "bg-purple-100 text-purple-800",
  shipped: "bg-sky-100 text-sky-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-neutral-200 text-neutral-600",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("inline-flex px-2 py-0.5 text-xs font-medium", statusTones[status] ?? "bg-sand")}>
      {labelOf(ORDER_STATUSES, status)}
    </span>
  );
}

export function Pagination({ page, totalPages, hrefFor }: { page: number; totalPages: number; hrefFor: (p: number) => string }) {
  if (totalPages <= 1) return null;
  return (
    <nav aria-label="Paginación" className="mt-6 flex items-center justify-between text-sm">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className="min-h-10 border border-line bg-white px-4 py-2 hover:border-ink">
          ← Anterior
        </Link>
      ) : (
        <span />
      )}
      <span className="text-muted">
        Página {page} de {totalPages}
      </span>
      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} className="min-h-10 border border-line bg-white px-4 py-2 hover:border-ink">
          Siguiente →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
