"use client";

import Link from "next/link";
import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { placeOrder, type CheckoutState } from "@/app/(store)/checkout/actions";
import { useCart } from "@/components/cart/cart-provider";
import { useFreshCart } from "@/components/cart/use-fresh-cart";
import { Button, ButtonLink } from "@/components/ui/button";
import { CheckboxField, Field, FormAlert, Honeypot, SelectField, TextAreaField } from "@/components/ui/fields";
import { CheckIcon, WhatsAppIcon } from "@/components/ui/icons";
import { EmptyState } from "@/components/ui/layout";
import { siteConfig } from "@/config/site";
import { CONTACT_METHODS, DELIVERY_METHODS, PAYMENT_METHODS } from "@/lib/constants";
import { formatPrice } from "@/lib/money";
import { whatsappLink } from "@/lib/whatsapp";

const initialState: CheckoutState = { status: "idle" };

export function CheckoutForm() {
  const { items, hydrated, subtotalCents, clear } = useCart();
  const { checking, notices, recheck } = useFreshCart();
  const [state, formAction, pending] = useActionState(placeOrder, initialState);
  const [delivery, setDelivery] = useState<string>("shipping");
  const handledRef = useRef<CheckoutState | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (handledRef.current === state) return;
    handledRef.current = state;
    if (state.status === "success") {
      clear();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (state.status === "error") {
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      if (state.problemVariantId) recheck();
    }
  }, [state, clear, recheck]);

  if (state.status === "success") {
    const { order } = state;
    const lines = order.items.map((i) => `• ${i.quantity} × ${i.name} (${i.label})`).join("\n");
    const wa = whatsappLink(
      `Hola Smellclub 👋 Acabo de hacer el pedido ${order.orderNumber}:\n${lines}\nTotal: ${formatPrice(order.totalCents, order.currency)}`,
    );
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-6 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-gold text-ink">
          <CheckIcon size={30} />
        </span>
        <h2 className="font-display text-4xl">Pedido recibido</h2>
        <p className="text-sm text-muted">
          Tu número de pedido es <strong className="text-ink">{order.orderNumber}</strong>. Guárdalo: te contactaremos
          para confirmar disponibilidad, pago y entrega.
        </p>
        <div className="w-full border border-line bg-white p-5 text-left">
          <ul className="flex flex-col gap-2 text-sm">
            {order.items.map((i) => (
              <li key={`${i.name}-${i.label}`} className="flex justify-between gap-4">
                <span>
                  {i.quantity} × {i.name} <span className="text-muted">· {i.label}</span>
                </span>
                <span className="tabular-nums">{formatPrice(i.lineTotalCents, order.currency)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 flex justify-between border-t border-line pt-4 font-medium">
            <span>Total</span>
            <span className="tabular-nums">{formatPrice(order.totalCents, order.currency)}</span>
          </p>
          <p className="mt-2 text-xs text-muted">{siteConfig.shippingNote}</p>
        </div>
        {wa && (
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-14 w-full items-center justify-center gap-2 bg-[#25D366] px-6 text-xs font-semibold tracking-[0.14em] text-white uppercase"
          >
            <WhatsAppIcon size={20} /> Enviar pedido por WhatsApp
          </a>
        )}
        <ButtonLink href="/shop" variant="outline" className="w-full">
          Seguir comprando
        </ButtonLink>
      </div>
    );
  }

  if (!hydrated) return <div className="skeleton h-96 w-full" aria-busy="true" />;

  if (items.length === 0) {
    return (
      <EmptyState
        title="No hay nada que pedir todavía"
        description="Tu carrito está vacío."
        action={<ButtonLink href="/shop">Ver la tienda</ButtonLink>}
      />
    );
  }

  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    const fd = new FormData(e.currentTarget);
    fd.set("items", JSON.stringify(items.map((i) => ({ variantId: i.variantId, quantity: i.quantity }))));
    // startTransition manual: evita que React vacíe el formulario si hay errores
    startTransition(() => formAction(fd));
  }

  return (
    <div ref={topRef} className="scroll-mt-28">
      <form onSubmit={onSubmit} noValidate className="relative grid gap-10 lg:grid-cols-[1fr_380px]">
        <Honeypot />
        <div className="flex flex-col gap-8">

        {state.status === "error" && <FormAlert>{state.message}</FormAlert>}
        {notices.length > 0 && (
          <div role="alert" className="flex flex-col gap-1 border border-gold/50 bg-gold/10 p-4 text-sm">
            {notices.map((n) => (
              <p key={n}>{n}</p>
            ))}
          </div>
        )}

        <fieldset className="flex flex-col gap-4">
          <legend className="mb-4 font-display text-2xl">Tus datos</legend>
          <Field label="Nombre y apellidos" name="name" autoComplete="name" required maxLength={120} error={errors.name} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Teléfono" name="phone" type="tel" inputMode="tel" autoComplete="tel" required maxLength={30} error={errors.phone} />
            <Field label="Email (opcional)" name="email" type="email" autoComplete="email" maxLength={254} error={errors.email} />
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-4">
          <legend className="mb-4 font-display text-2xl">Entrega</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {DELIVERY_METHODS.map((m) => (
              <label
                key={m.value}
                className="flex min-h-14 cursor-pointer items-center gap-3 border border-line bg-white px-4 text-sm has-[:checked]:border-ink"
              >
                <input
                  type="radio"
                  name="deliveryMethod"
                  value={m.value}
                  checked={delivery === m.value}
                  onChange={() => setDelivery(m.value)}
                  className="size-5 accent-ink"
                />
                {m.label}
              </label>
            ))}
          </div>
          {errors.deliveryMethod && <p className="text-xs text-danger">{errors.deliveryMethod}</p>}
          {delivery === "shipping" && (
            <div className="flex flex-col gap-4">
              <Field label="Dirección" name="address" autoComplete="street-address" required maxLength={300} error={errors.address} />
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Ciudad" name="city" autoComplete="address-level2" required maxLength={100} error={errors.city} />
                <Field label="Provincia / región" name="region" autoComplete="address-level1" maxLength={100} error={errors.region} />
                <Field label="Código postal" name="postalCode" autoComplete="postal-code" inputMode="numeric" maxLength={20} error={errors.postalCode} />
              </div>
            </div>
          )}
        </fieldset>

        <fieldset className="grid gap-4 sm:grid-cols-2">
          <legend className="mb-4 font-display text-2xl">Contacto y pago</legend>
          <SelectField label="¿Cómo prefieres que te contactemos?" name="contactMethod" options={CONTACT_METHODS} defaultValue="whatsapp" error={errors.contactMethod} />
          <SelectField label="Método de pago" name="paymentMethod" options={PAYMENT_METHODS} defaultValue="to_agree" error={errors.paymentMethod} hint="No pedimos datos de tarjeta en esta web." />
          <TextAreaField label="Notas del pedido (opcional)" name="notes" maxLength={1000} className="sm:col-span-2" error={errors.notes} />
        </fieldset>

        <div className="flex flex-col gap-2">
          <CheckboxField
            name="acceptTerms"
            required
            label={
              <>
                Acepto los <Link href="/legal/terminos" target="_blank" className="underline">términos</Link> y la{" "}
                <Link href="/legal/privacidad" target="_blank" className="underline">política de privacidad</Link>, incluido el tratamiento
                de mis datos en servidores fuera de Uruguay para gestionar el pedido.
              </>
            }
          />
          {errors.acceptTerms && <p className="text-xs text-danger">{errors.acceptTerms}</p>}
        </div>

        <Button type="submit" size="lg" disabled={pending || checking} className="w-full lg:hidden">
          {pending ? "Enviando pedido…" : `Confirmar pedido · ${formatPrice(subtotalCents)}`}
        </Button>
        </div>

        <aside className="order-first h-fit border border-line bg-white p-6 lg:sticky lg:top-28 lg:order-none" aria-label="Resumen del pedido">
          <h2 className="font-display text-2xl">Tu pedido</h2>
          <ul className="mt-5 flex flex-col gap-3 text-sm">
            {items.map((i) => (
              <li key={i.variantId} className="flex justify-between gap-3">
                <span className="min-w-0">
                  <span className="block truncate">{i.quantity} × {i.name}</span>
                  <span className="text-xs text-muted">{i.label}</span>
                </span>
                <span className="shrink-0 tabular-nums">{formatPrice(i.priceCents * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-5 flex flex-col gap-2 border-t border-line pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Envío</dt>
              <dd className="text-muted">A confirmar</dd>
            </div>
            <div className="flex justify-between text-base font-medium">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatPrice(subtotalCents)}</dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-muted">{siteConfig.shippingNote}</p>
          <Button type="submit" size="lg" disabled={pending || checking} className="mt-6 hidden w-full lg:flex">
            {pending ? "Enviando pedido…" : "Confirmar pedido"}
          </Button>
          <p className="mt-3 text-center text-xs text-muted">
            El precio final se verifica en el servidor al confirmar.
          </p>
        </aside>
      </form>
    </div>
  );
}
