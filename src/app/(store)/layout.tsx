import { CartProvider } from "@/components/cart/cart-provider";
import { CartToast } from "@/components/cart/cart-toast";
import { FxRuntime } from "@/components/fx/fx-runtime";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { WhatsAppFab } from "@/components/layout/whatsapp-fab";
import { publicEnv } from "@/lib/env";
import { whatsappLink } from "@/lib/whatsapp";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  const wa = whatsappLink("Hola Smellclub 👋 Tengo una consulta.");

  return (
    <CartProvider>
      <a
        href="#contenido"
        className="sr-only z-50 bg-gold px-4 py-2 text-ink focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Saltar al contenido
      </a>
      <Header whatsappHref={wa} instagramHref={publicEnv.instagramUrl || null} />
      <main id="contenido" className="min-h-[60vh]">
        {children}
      </main>
      <Footer />
      <CartToast />
      <FxRuntime />
      {wa && <WhatsAppFab href={wa} />}
    </CartProvider>
  );
}
