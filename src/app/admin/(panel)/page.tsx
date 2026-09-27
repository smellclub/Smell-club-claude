import Link from "next/link";
import { Card, PageHeader, StatusBadge } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { LOW_STOCK_THRESHOLD } from "@/lib/constants";
import { formatPrice } from "@/lib/money";
import { daysAgoIso, formatDate } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

export default async function AdminDashboard() {
  const { supabase } = await requireAdmin();
  const since = daysAgoIso(30);

  const [pending, recent, last30, products, lowStock, unread] = await Promise.all([
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase
      .from("orders")
      .select("id, order_number, customer_name, status, total_cents, currency, created_at")
      .order("created_at", { ascending: false })
      .limit(8),
    supabase.from("orders").select("total_cents, currency").neq("status", "cancelled").gte("created_at", since).limit(5000),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase
      .from("product_variants")
      .select("id, label, stock, price_cents, product:products(id, name, status)")
      .eq("is_active", true)
      .gt("price_cents", 0)
      .lte("stock", LOW_STOCK_THRESHOLD)
      .order("stock", { ascending: true })
      .limit(10),
    supabase.from("contact_messages").select("id", { count: "exact", head: true }).eq("is_read", false),
  ]);

  const revenueByCurrency = new Map<string, number>();
  for (const o of last30.data ?? []) {
    revenueByCurrency.set(o.currency as string, (revenueByCurrency.get(o.currency as string) ?? 0) + (o.total_cents as number));
  }
  const revenue = [...revenueByCurrency.entries()].map(([cur, cents]) => formatPrice(cents, cur)).join(" · ") || formatPrice(0);

  const stats = [
    { label: "Pedidos pendientes", value: String(pending.count ?? 0), href: "/admin/orders?status=pending" },
    { label: "Ventas 30 días (sin cancelados)", value: revenue, href: "/admin/orders" },
    { label: "Pedidos 30 días", value: String(last30.data?.length ?? 0), href: "/admin/orders" },
    { label: "Productos publicados", value: String(products.count ?? 0), href: "/admin/products" },
    { label: "Mensajes sin leer", value: String(unread.count ?? 0), href: "/admin/messages" },
  ];

  type LowStockRow = { id: string; label: string; stock: number; product: { id: string; name: string; status: string } | null };
  const low = ((lowStock.data ?? []) as unknown as LowStockRow[]).filter((v) => v.product?.status === "active");

  return (
    <>
      <PageHeader title="Dashboard" description="Resumen de la tienda." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="border border-line bg-white p-4 transition-colors hover:border-ink">
            <p className="text-xs text-muted">{s.label}</p>
            <p className="mt-2 font-display text-2xl">{s.value}</p>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card title="Últimos pedidos">
          {(recent.data ?? []).length === 0 ? (
            <p className="text-sm text-muted">Todavía no hay pedidos.</p>
          ) : (
            <ul className="divide-y divide-line">
              {(recent.data ?? []).map((o) => (
                <li key={o.id as string}>
                  <Link href={`/admin/orders/${o.id}`} className="flex items-center justify-between gap-3 py-3 hover:text-gold-dark">
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">{o.order_number as string}</span>
                      <span className="block truncate text-xs text-muted">
                        {o.customer_name as string} · {formatDate(o.created_at as string)}
                      </span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1">
                      <span className="text-sm tabular-nums">{formatPrice(o.total_cents as number, o.currency as string)}</span>
                      <StatusBadge status={o.status as string} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title={`Stock bajo (≤ ${LOW_STOCK_THRESHOLD})`}>
          {low.length === 0 ? (
            <p className="text-sm text-muted">Sin alertas de stock en productos publicados con precio.</p>
          ) : (
            <ul className="divide-y divide-line">
              {low.map((v) => (
                <li key={v.id}>
                  <Link href={`/admin/products/${v.product?.id}`} className="flex justify-between gap-3 py-3 text-sm hover:text-gold-dark">
                    <span className="truncate">
                      {v.product?.name} · <span className="text-muted">{v.label}</span>
                    </span>
                    <span className={v.stock === 0 ? "font-medium text-danger" : "text-gold-dark"}>{v.stock}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
