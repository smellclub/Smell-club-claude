import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm, SubmitButton } from "@/components/admin/action-form";
import { Card, PageHeader, StatusBadge } from "@/components/admin/ui";
import { TextAreaField } from "@/components/ui/fields";
import { WhatsAppIcon } from "@/components/ui/icons";
import { requireAdmin } from "@/lib/auth";
import { CONTACT_METHODS, DELIVERY_METHODS, ORDER_STATUSES, PAYMENT_METHODS, labelOf } from "@/lib/constants";
import { formatPrice } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { uuid } from "@/lib/validation/common";
import { whatsappLink } from "@/lib/whatsapp";
import { updateOrderNotes, updateOrderStatus } from "../actions";

export const metadata = { title: "Detalle de pedido" };

type OrderRow = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  delivery_method: string;
  shipping_address: string | null;
  shipping_city: string | null;
  shipping_region: string | null;
  shipping_postal_code: string | null;
  contact_method: string;
  payment_method: string;
  customer_notes: string | null;
  admin_notes: string | null;
  status: string;
  subtotal_cents: number;
  shipping_cents: number;
  total_cents: number;
  currency: string;
  created_at: string;
  updated_at: string;
  items: Array<{
    id: string;
    product_id: string | null;
    product_name: string;
    product_brand: string;
    variant_label: string;
    unit_price_cents: number;
    quantity: number;
    line_total_cents: number;
  }>;
  history: Array<{ id: string; from_status: string | null; to_status: string; created_at: string }>;
};

export default async function AdminOrderDetail({ params }: PageProps<"/admin/orders/[id]">) {
  const { supabase } = await requireAdmin();
  const { id } = await params;
  if (!uuid.safeParse(id).success) notFound();

  const { data } = await supabase
    .from("orders")
    .select(
      `*, items:order_items(id, product_id, product_name, product_brand, variant_label, unit_price_cents, quantity, line_total_cents),
       history:order_status_history(id, from_status, to_status, created_at)`,
    )
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();
  const order = data as unknown as OrderRow;
  const history = [...order.history].sort((a, b) => a.created_at.localeCompare(b.created_at));
  const waCustomer = whatsappLink(`Hola ${order.customer_name}, te escribimos de Smellclub sobre tu pedido ${order.order_number}.`, order.customer_phone);
  const cancelled = order.status === "cancelled";

  return (
    <>
      <Link href="/admin/orders" className="mb-4 inline-block text-sm text-muted hover:text-ink">
        ← Pedidos
      </Link>
      <PageHeader
        title={order.order_number}
        description={`Recibido el ${formatDate(order.created_at)}`}
        action={<StatusBadge status={order.status} />}
      />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col gap-6">
          <Card title="Productos">
            <ul className="divide-y divide-line">
              {order.items.map((i) => (
                <li key={i.id} className="flex justify-between gap-4 py-3 text-sm">
                  <span>
                    <span className="font-medium">{i.quantity} × {i.product_name}</span>
                    <span className="block text-xs text-muted">
                      {i.product_brand} · {i.variant_label} · {formatPrice(i.unit_price_cents, order.currency)}/ud.
                    </span>
                    {i.product_id && (
                      <Link href={`/admin/products/${i.product_id}`} className="text-xs text-gold-dark hover:underline">
                        Ver producto
                      </Link>
                    )}
                  </span>
                  <span className="shrink-0 tabular-nums">{formatPrice(i.line_total_cents, order.currency)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-3 flex flex-col gap-1 border-t border-line pt-3 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatPrice(order.subtotal_cents, order.currency)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Envío</dt><dd>{formatPrice(order.shipping_cents, order.currency)}</dd></div>
              <div className="flex justify-between text-base font-medium"><dt>Total</dt><dd>{formatPrice(order.total_cents, order.currency)}</dd></div>
            </dl>
          </Card>

          <Card title="Cliente">
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-xs text-muted">Nombre</dt><dd>{order.customer_name}</dd></div>
              <div><dt className="text-xs text-muted">Teléfono</dt><dd><a href={`tel:${order.customer_phone.replace(/[^\d+]/g, "")}`} className="underline">{order.customer_phone}</a></dd></div>
              <div><dt className="text-xs text-muted">Email</dt><dd>{order.customer_email ? <a href={`mailto:${order.customer_email}`} className="underline">{order.customer_email}</a> : "—"}</dd></div>
              <div><dt className="text-xs text-muted">Prefiere contacto por</dt><dd>{labelOf(CONTACT_METHODS, order.contact_method)}</dd></div>
              <div><dt className="text-xs text-muted">Pago</dt><dd>{labelOf(PAYMENT_METHODS, order.payment_method)}</dd></div>
              <div><dt className="text-xs text-muted">Entrega</dt><dd>{labelOf(DELIVERY_METHODS, order.delivery_method)}</dd></div>
              {order.delivery_method === "shipping" && (
                <div className="sm:col-span-2">
                  <dt className="text-xs text-muted">Dirección</dt>
                  <dd>
                    {order.shipping_address}
                    <br />
                    {[order.shipping_postal_code, order.shipping_city, order.shipping_region].filter(Boolean).join(", ")}
                  </dd>
                </div>
              )}
              {order.customer_notes && (
                <div className="sm:col-span-2">
                  <dt className="text-xs text-muted">Notas del cliente</dt>
                  <dd className="whitespace-pre-line">{order.customer_notes}</dd>
                </div>
              )}
            </dl>
            {waCustomer && (
              <a
                href={waCustomer}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex min-h-11 items-center gap-2 bg-[#25D366] px-4 text-sm font-medium text-white"
              >
                <WhatsAppIcon size={18} /> Escribir por WhatsApp
              </a>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card title="Estado">
            {cancelled ? (
              <p className="text-sm text-muted">Pedido cancelado. El stock se repuso automáticamente.</p>
            ) : (
              <ActionForm action={updateOrderStatus} className="flex flex-col gap-3">
                <input type="hidden" name="orderId" value={order.id} />
                <label htmlFor="status" className="text-sm font-medium">Cambiar estado</label>
                <select id="status" name="status" defaultValue={order.status} className="field">
                  {ORDER_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                <p className="text-xs text-muted">Si cancelas, el stock de los productos se repone y no se podrá reabrir.</p>
                <SubmitButton>Guardar estado</SubmitButton>
              </ActionForm>
            )}
          </Card>

          <Card title="Notas internas">
            <ActionForm action={updateOrderNotes} className="flex flex-col gap-3">
              <input type="hidden" name="orderId" value={order.id} />
              <TextAreaField label="Solo visibles para administradores" name="adminNotes" defaultValue={order.admin_notes ?? ""} maxLength={2000} />
              <SubmitButton variant="outline">Guardar notas</SubmitButton>
            </ActionForm>
          </Card>

          <Card title="Historial">
            <ol className="flex flex-col gap-2 text-sm">
              {history.map((h) => (
                <li key={h.id} className="flex justify-between gap-3">
                  <span>
                    {h.from_status ? `${labelOf(ORDER_STATUSES, h.from_status)} → ` : ""}
                    <strong>{labelOf(ORDER_STATUSES, h.to_status)}</strong>
                  </span>
                  <span className="text-xs text-muted">{formatDate(h.created_at)}</span>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </>
  );
}
