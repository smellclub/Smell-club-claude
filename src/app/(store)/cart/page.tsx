import type { Metadata } from "next";
import { CartView } from "@/components/cart/cart-view";
import { Container, SectionHeading } from "@/components/ui/layout";

export const metadata: Metadata = {
  title: "Carrito",
  robots: { index: false, follow: true },
};

export default function CartPage() {
  return (
    <Container className="py-12 sm:py-16">
      <SectionHeading as="h1" eyebrow="Tu selección" title="Carrito" />
      <div className="mt-10">
        <CartView />
      </div>
    </Container>
  );
}
