"use client";

import Link from "next/link";

/** Error genérico: nunca muestra detalles técnicos al visitante. */
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="eyebrow text-gold-dark">Algo salió mal</p>
      <h1 className="font-display text-4xl">No hemos podido cargar esta página</h1>
      <p className="max-w-sm text-sm text-muted">Inténtalo de nuevo en unos segundos.</p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex min-h-12 items-center bg-ink px-6 text-[0.72rem] font-medium tracking-[0.18em] text-ivory uppercase"
        >
          Reintentar
        </button>
        <Link href="/" className="inline-flex min-h-12 items-center border border-ink px-6 text-[0.72rem] font-medium tracking-[0.18em] uppercase">
          Inicio
        </Link>
      </div>
    </main>
  );
}
