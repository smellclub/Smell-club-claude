import type { Metadata } from "next";
import { CheckoutForm } from "@/components/cart/checkout-form";
import { Container, PageHeader } from "@/components/ui/layout";

export const metadata: Metadata = {
  title: "Finalizar pedido",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <>
      <PageHeader eyebrow="Último paso" title="Finalizar pedido" />
      <Container className="py-12 sm:py-16">
        <div data-reveal>
          <CheckoutForm />
        </div>
      </Container>
    </>
  );
}
