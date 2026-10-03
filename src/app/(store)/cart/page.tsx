import type { Metadata } from "next";
import { CartView } from "@/components/cart/cart-view";
import { Container, PageHeader } from "@/components/ui/layout";

export const metadata: Metadata = {
  title: "Carrito",
  robots: { index: false, follow: true },
};

export default function CartPage() {
  return (
    <>
      <PageHeader eyebrow="Tu selección" title="Carrito" />
      <Container className="py-12 sm:py-16">
        <div data-reveal>
          <CartView />
        </div>
      </Container>
    </>
  );
}
