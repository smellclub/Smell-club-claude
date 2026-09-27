import type { Metadata } from "next";
import { CheckoutForm } from "@/components/cart/checkout-form";
import { Container, SectionHeading } from "@/components/ui/layout";

export const metadata: Metadata = {
  title: "Finalizar pedido",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <Container className="py-12 sm:py-16">
      <SectionHeading as="h1" eyebrow="Último paso" title="Finalizar pedido" />
      <div className="mt-10">
        <CheckoutForm />
      </div>
    </Container>
  );
}
