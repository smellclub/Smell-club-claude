import { ButtonLink } from "@/components/ui/button";
import { Container, EmptyState } from "@/components/ui/layout";

export default function ProductNotFound() {
  return (
    <Container className="py-20">
      <EmptyState
        title="Perfume no encontrado"
        description="Puede que ya no esté disponible o que el enlace sea incorrecto."
        action={<ButtonLink href="/shop">Ver la tienda</ButtonLink>}
      />
    </Container>
  );
}
