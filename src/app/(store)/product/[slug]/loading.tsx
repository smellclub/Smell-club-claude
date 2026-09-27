import { Container } from "@/components/ui/layout";

export default function ProductLoading() {
  return (
    <Container className="py-6 sm:py-12">
      <div className="skeleton mb-6 h-3 w-40" />
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16" aria-busy="true" aria-label="Cargando producto">
        <div className="skeleton aspect-[4/5] w-full" />
        <div className="flex flex-col gap-4">
          <div className="skeleton h-3 w-24" />
          <div className="skeleton h-12 w-3/4" />
          <div className="skeleton h-8 w-32" />
          <div className="grid grid-cols-3 gap-2">
            <div className="skeleton h-16" />
            <div className="skeleton h-16" />
            <div className="skeleton h-16" />
          </div>
          <div className="skeleton h-14 w-full" />
        </div>
      </div>
    </Container>
  );
}
