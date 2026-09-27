import { Container } from "@/components/ui/layout";

export default function ShopLoading() {
  return (
    <Container className="py-12 sm:py-16" >
      <div className="flex flex-col items-center gap-3" aria-busy="true" aria-label="Cargando catálogo">
        <div className="skeleton h-3 w-20" />
        <div className="skeleton h-10 w-64" />
      </div>
      <div className="skeleton mt-10 h-12 w-full" />
      <div className="mt-12 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-3">
            <div className="skeleton aspect-[4/5] w-full" />
            <div className="skeleton h-3 w-1/3" />
            <div className="skeleton h-5 w-2/3" />
            <div className="skeleton h-4 w-1/4" />
          </div>
        ))}
      </div>
    </Container>
  );
}
