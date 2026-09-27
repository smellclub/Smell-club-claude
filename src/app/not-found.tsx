import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-ink px-6 text-center text-ivory">
      <p className="eyebrow text-gold">Error 404</p>
      <h1 className="font-display text-5xl">Esta página se ha evaporado</h1>
      <p className="max-w-sm text-sm text-ivory/60">La página que buscas no existe o ha cambiado de dirección.</p>
      <div className="flex gap-3">
        <Link href="/" className="inline-flex min-h-12 items-center bg-gold px-6 text-[0.72rem] font-medium tracking-[0.18em] text-ink uppercase">
          Inicio
        </Link>
        <Link href="/shop" className="inline-flex min-h-12 items-center border border-ivory/30 px-6 text-[0.72rem] font-medium tracking-[0.18em] uppercase">
          Tienda
        </Link>
      </div>
    </main>
  );
}
