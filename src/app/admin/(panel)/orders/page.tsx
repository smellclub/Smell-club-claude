import Link from "next/link";
import { z } from "zod";
import { PageHeader, Pagination, StatusBadge } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { ORDER_STATUSES, values } from "@/lib/constants";
import { formatPrice } from "@/lib/money";
import { cn, formatDate } from "@/lib/utils";

export const metadata = { title: "Pedidos" };

const PAGE_SIZE = 25;

const paramsSchema = z.object({
  status: z.enum(values(ORDER_STATUSES)).optional().catch(undefined),
  q: z.string().max(60).optional().catch(undefined),
  page: z.coerce.number().int().min(1).max(10000).catch(1),
});

/** Escapa comodines de LIKE para que la búsqueda sea literal */
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (m) => `\\${m}`);
}

export default async function AdminOrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  const { supabase } = await requireAdmin();
  const raw = await searchParams;
  const params = paramsSchema.parse({
    status: typeof raw.status === "string" && raw.status ? raw.status : undefined,
    q: typeof raw.q === "string" && raw.q.trim() ? raw.q.trim() : undefined,
    page: raw.page ?? 1,
  });

  let query = supabase
    .from("orders")
    .select("id, order_number, customer_name, customer_phone, status, total_cents, currency, created_at, delivery_method", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .range((params.page - 1) * PAGE_SIZE, params.page * PAGE_SIZE - 1);

  if (params.status) query = query.eq("status", params.status);
  if (params.q) {
    const q = params.q;
    if (/^sc-?\d+$/i.test(q)) {
      const digits = q.replace(/\D/g, "");
      query = query.ilike("order_number", `%${escapeLike(digits)}%`);
    } else if (/^[\d+ ().-]+$/.test(q)) {
      query = query.ilike("customer_phone", `%${escapeLike(q)}%`);
    } else {
      query = query.ilike("customer_name", `%${escapeLike(q)}%`);
    }
  }

  const { data, count, error } = await query;
  if (error) console.error("[admin] listar pedidos", error.code);
  const orders = data ?? [];
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  const hrefFor = (overrides: Record<string, string | number | undefined>) => {
    const sp = new URLSearchParams();
    const merged = { status: params.status, q: params.q, page: params.page, ...overrides };
    for (const [k, v] of Object.entries(merged)) if (v !== undefined && v !== "" && !(k === "page" && v === 1)) sp.set(k, String(v));
    const s = sp.toString();
    return `/admin/orders${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <PageHeader title="Pedidos" description={`${count ?? 0} pedidos`} />

      <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4">
        {[{ value: undefined, label: "Todos" }, ...ORDER_STATUSES].map((s) => (
          <Link
            key={s.label}
            href={hrefFor({ status: s.value, page: 1 })}
            className={cn(
              "flex min-h-10 shrink-0 items-center border px-4 text-sm",
              params.status === s.value ? "border-ink bg-ink text-ivory" : "border-line bg-white hover:border-ink",
            )}
          >
            {s.label}
          </Link>
        ))}
      </div>

      <form method="get" className="mb-6 flex gap-2">
        {params.status && <input type="hidden" name="status" value={params.status} />}
        <input
          type="search"
          name="q"
          defaultValue={params.q ?? ""}
          maxLength={60}
          placeholder="Nº pedido (SC-001001), nombre o teléfono"
          className="field"
        />
        <button type="submit" className="min-h-12 bg-ink px-5 text-sm text-ivory">
          Buscar
        </button>
      </form>

      {orders.length === 0 ? (
        <p className="border border-dashed border-line bg-white p-10 text-center text-sm text-muted">No hay pedidos con estos filtros.</p>
      ) : (
        <ul className="divide-y divide-line border border-line bg-white">
          {orders.map((o) => (
            <li key={o.id as string}>
              <Link href={`/admin/orders/${o.id}`} className="flex items-center justify-between gap-4 px-4 py-4 hover:bg-sand/60">
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <span className="font-medium">{o.order_number as string}</span>
                    <StatusBadge status={o.status as string} />
                  </span>
                  <span className="mt-1 block truncate text-sm">{o.customer_name as string}</span>
                  <span className="block text-xs text-muted">
                    {formatDate(o.created_at as string)} · {o.delivery_method === "shipping" ? "Envío" : "Recogida"}
                  </span>
                </span>
                <span className="shrink-0 text-sm font-medium tabular-nums">
                  {formatPrice(o.total_cents as number, o.currency as string)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Pagination page={params.page} totalPages={totalPages} hrefFor={(p) => hrefFor({ page: p })} />
    </>
  );
}
