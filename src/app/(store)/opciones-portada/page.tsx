import type { Metadata } from "next";
import { Hero } from "@/components/home/sections";
import type { AuraStyle } from "@/components/home/featured-aura";

/**
 * Página TEMPORAL para comparar tres estilos de estela alrededor del
 * perfume destacado. No aparece en buscadores ni en el menú.
 * Se puede borrar cuando se elija una opción.
 */
export const metadata: Metadata = {
  title: "Opciones de portada",
  robots: { index: false, follow: false },
};

const OPTIONS: Array<{ n: number; aura: AuraStyle; title: string; text: string }> = [
  { n: 1, aura: "seda", title: "Seda dorada", text: "Cintas de seda doradas que giran alrededor del frasco." },
  { n: 2, aura: "humo", title: "Espiral de humo y luz", text: "Hebras de humo y luz dorada que suben en espiral envolviendo el frasco." },
  { n: 3, aura: "polvo", title: "Polvo de oro", text: "Un remolino de polvo dorado que orbita el frasco." },
];

export default function PortadaOptionsPage() {
  return (
    <div className="bg-ink">
      {OPTIONS.map((o) => (
        <section key={o.aura} aria-label={`Opción ${o.n}: ${o.title}`}>
          <div className="border-y border-gold/30 bg-ink px-5 py-4 text-center text-ivory">
            <p className="eyebrow text-gold">Opción {o.n}</p>
            <p className="mt-1 font-display text-2xl">{o.title}</p>
            <p className="mt-1 text-sm text-ivory/60">{o.text}</p>
          </div>
          <Hero aura={o.aura} />
        </section>
      ))}
    </div>
  );
}
