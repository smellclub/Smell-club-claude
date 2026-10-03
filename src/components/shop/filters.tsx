import Link from "next/link";
import { AutoSubmitSelect } from "@/components/shop/auto-submit-select";
import { FilterIcon, SearchIcon } from "@/components/ui/icons";
import { GENDERS, OLFACTORY_FAMILIES } from "@/lib/constants";
import { SORT_OPTIONS, type ShopParams } from "@/lib/shop-filters";
import type { Category } from "@/types/domain";

/**
 * Filtros como formulario GET: funcionan sin JavaScript, las URLs se
 * pueden compartir (Instagram, WhatsApp) y no cargan librerías extra.
 */
export function ShopFilters({
  params,
  categories,
  activeCount,
  action = "/shop",
}: {
  params: ShopParams;
  categories: Category[];
  activeCount: number;
  action?: string;
}) {
  return (
    <form action={action} method="get" role="search" className="flex flex-col gap-4">
      <div className="flex gap-2">
        <label className="relative flex-1">
          <span className="sr-only">Buscar perfume, marca o nota</span>
          <SearchIcon size={18} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted" />
          <input
            type="search"
            name="q"
            defaultValue={params.q ?? ""}
            maxLength={80}
            placeholder="Buscar perfume, marca o nota…"
            className="field pl-10"
            autoComplete="off"
            enterKeyHint="search"
          />
        </label>
        <button type="submit" className="btn-fx min-h-12 bg-ink px-5 text-[0.7rem] font-medium tracking-[0.18em] text-ivory uppercase transition-colors hover:text-gold-light">
          Buscar
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <details className="group w-full sm:w-auto [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 border border-line bg-white px-4 text-sm select-none">
            <FilterIcon size={18} />
            Filtros
            {activeCount > 0 && (
              <span className="rounded-full bg-gold px-2 text-xs font-semibold text-ink">{activeCount}</span>
            )}
          </summary>

          <div className="mt-3 grid gap-4 border border-line bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="eyebrow text-[0.6rem] text-muted">Categoría</span>
              <select name="category" defaultValue={params.category ?? ""} className="field">
                <option value="">Todas</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="eyebrow text-[0.6rem] text-muted">Género</span>
              <select name="gender" defaultValue={params.gender ?? ""} className="field">
                <option value="">Todos</option>
                {GENDERS.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="eyebrow text-[0.6rem] text-muted">Familia olfativa</span>
              <select name="family" defaultValue={params.family ?? ""} className="field">
                <option value="">Todas</option>
                {OLFACTORY_FAMILIES.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </label>
            <fieldset className="flex flex-col gap-1.5 text-sm">
              <legend className="eyebrow mb-1.5 text-[0.6rem] text-muted">Precio</legend>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  name="min"
                  min={0}
                  step="1"
                  inputMode="numeric"
                  placeholder="Mín."
                  aria-label="Precio mínimo"
                  defaultValue={params.min ?? ""}
                  className="field"
                />
                <span className="text-muted">–</span>
                <input
                  type="number"
                  name="max"
                  min={0}
                  step="1"
                  inputMode="numeric"
                  placeholder="Máx."
                  aria-label="Precio máximo"
                  defaultValue={params.max ?? ""}
                  className="field"
                />
              </div>
            </fieldset>
            <div className="flex flex-wrap gap-x-6 gap-y-2 sm:col-span-2 lg:col-span-4">
              {[
                { name: "available", label: "Solo disponibles", checked: Boolean(params.available) },
                { name: "decants", label: "Con decants", checked: Boolean(params.decants) },
                { name: "offers", label: "En oferta", checked: Boolean(params.offers) },
              ].map((c) => (
                <label key={c.name} className="flex min-h-11 items-center gap-2 text-sm">
                  <input type="checkbox" name={c.name} value="1" defaultChecked={c.checked} className="size-5 accent-ink" />
                  {c.label}
                </label>
              ))}
            </div>
            <div className="flex gap-2 sm:col-span-2 lg:col-span-4">
              <button type="submit" className="min-h-12 flex-1 bg-ink px-5 text-[0.7rem] font-medium tracking-[0.18em] text-ivory uppercase hover:text-gold-light sm:flex-none">
                Aplicar filtros
              </button>
              <Link href={action} className="flex min-h-12 items-center justify-center border border-line px-5 text-[0.7rem] font-medium tracking-[0.18em] uppercase hover:border-ink">
                Limpiar
              </Link>
            </div>
          </div>
        </details>

        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted">Ordenar</span>
          <AutoSubmitSelect name="sort" defaultValue={params.sort ?? "featured"} className="field w-auto min-w-48">
            {SORT_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </AutoSubmitSelect>
        </label>
      </div>
    </form>
  );
}
