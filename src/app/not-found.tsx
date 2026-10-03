import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-ink px-6 text-center text-ivory">
      <p className="eyebrow text-gold">Error 404</p>
      <h1 className="font-display text-5xl">Esta página se ha evaporado</h1>
      <p className="max-w-sm text-sm text-ivory/60">La página que buscas no existe o ha cambiado de dirección.</p>
      <div className="flex gap-3">
        <ButtonLink href="/" variant="gold">
          Inicio
        </ButtonLink>
        <ButtonLink href="/shop" variant="outline-light">
          Tienda
        </ButtonLink>
      </div>
    </main>
  );
}
