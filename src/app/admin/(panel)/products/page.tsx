import Image from "next/image";
import Link from "next/link";
import { PageHeader } from "@/components/admin/ui";
import { FormAlert } from "@/components/ui/fields";
import { ButtonLink } from "@/components/ui/button";
import { adminListProducts } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/auth";
import { PRODUCT_STATUSES, labelOf } from "@/lib/constants";
import { formatPrice } from "@/lib/money";
import { minPriceCents } from "@/lib/product";
import { cn, normalizeForSearch } from "@/lib/utils";

export const metadata = { title: "Productos" };

export default async function AdminProductsPage({ searchParams }: PageProps<"/admin/products">) {
  const { supabase } = await requireAdmin();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 80) : "";
  const status = typeof sp.status === "string" && PRODUCT_STATUSES.some((s) => s.value === sp.status) ? sp.status : "";

  const all = await adminListProducts(supabase);
  const needle = normalizeForSearch(q);
  const products = all.filter(
    (p) =>
      (!status || p.status === status) &&
      (!needle || normalizeForSearch(`${p.name} ${p.brand} ${p.slug}`).includes(needle)),
  );

  return (
    <>
      <PageHeader
        title="Productos"
        description={`${all.length} productos en total`}
        action={<ButtonLink href="/admin/products/new">+ Nuevo producto</ButtonLink>}
      />

      {sp.deleted === "1" && (
        <div className="mb-4">
          <FormAlert tone="success">Producto eliminado.</FormAlert>
        </div>
      )}

      <form method="get" className="mb-6 flex flex-col gap-2 sm:flex-row">
        <input type="search" name="q" defaultValue={q} placeholder="Buscar por nombre o marca" maxLength={80} className="field" />
        <select name="status" defaultValue={status} className="field sm:w-48">
          <option value="">Todos los estados</option>
          {PRODUCT_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <button type="submit" className="min-h-12 bg-ink px-5 text-sm text-ivory">Filtrar</button>
      </form>

      {products.length === 0 ? (
        <p className="border border-dashed border-line bg-white p-10 text-center text-sm text-muted">No hay productos.</p>
      ) : (
        <ul className="divide-y divide-line border border-line bg-white">
          {products.map((p) => {
            const price = minPriceCents(p);
            const stock = p.variants.reduce((s, v) => s + v.stock, 0);
            const img = p.images[0];
            return (
              <li key={p.id}>
                <Link href={`/admin/products/${p.id}`} className="flex items-center gap-4 px-4 py-3 hover:bg-sand/60">
                  <div className="relative size-14 shrink-0 overflow-hidden bg-ink">
                    {img && <Image src={img.url} alt="" fill sizes="56px" className="object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{p.name}</p>
                    <p className="truncate text-xs text-muted">
                      {p.brand} · {p.variants.length} variantes · stock total {stock}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1 text-[0.65rem]">
                      <span
                        className={cn(
                          "px-1.5 py-0.5",
                          p.status === "active" ? "bg-green-100 text-green-800" : p.status === "draft" ? "bg-gold/20 text-gold-dark" : "bg-neutral-200 text-neutral-600",
                        )}
                      >
                        {labelOf(PRODUCT_STATUSES, p.status)}
                      </span>
                      {p.isFeatured && <span className="bg-sand px-1.5 py-0.5">Destacado</span>}
                      {p.isNew && <span className="bg-sand px-1.5 py-0.5">Nuevo</span>}
                      {p.isRecommended && <span className="bg-sand px-1.5 py-0.5">Recomendado</span>}
                    </div>
                  </div>
                  <span className="shrink-0 text-sm tabular-nums">{price ? `desde ${formatPrice(price)}` : "Sin precio"}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
