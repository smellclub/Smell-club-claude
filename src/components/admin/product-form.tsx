"use client";

import { useState } from "react";
import { saveProduct } from "@/app/admin/(panel)/products/actions";
import { ActionForm, SubmitButton, useFormState } from "@/components/admin/action-form";
import { Card } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { CheckboxField, Field, SelectField, TextAreaField } from "@/components/ui/fields";
import { PlusIcon, TrashIcon } from "@/components/ui/icons";
import { GENDERS, OLFACTORY_FAMILIES, PRODUCT_STATUSES, VARIANT_KINDS } from "@/lib/constants";
import { centsToInput } from "@/lib/money";
import type { Category, Product } from "@/types/domain";

type VariantRow = {
  key: string;
  id: string;
  kind: "bottle" | "decant";
  sizeMl: string;
  label: string;
  price: string;
  compareAtPrice: string;
  stock: string;
  sku: string;
  isActive: boolean;
};

let counter = 0;
const newKey = () => `new-${++counter}`;

function defaultVariants(): VariantRow[] {
  return [
    { key: newKey(), id: "", kind: "bottle", sizeMl: "", label: "Frasco completo", price: "", compareAtPrice: "", stock: "0", sku: "", isActive: true },
    { key: newKey(), id: "", kind: "decant", sizeMl: "5", label: "Decant 5 ml", price: "", compareAtPrice: "", stock: "0", sku: "", isActive: true },
    { key: newKey(), id: "", kind: "decant", sizeMl: "10", label: "Decant 10 ml", price: "", compareAtPrice: "", stock: "0", sku: "", isActive: true },
  ];
}

export function ProductForm({ product, categories }: { product?: Product; categories: Category[] }) {
  return (
    <ActionForm action={saveProduct} className="flex flex-col gap-6">
      {product && <input type="hidden" name="productId" value={product.id} />}
      <ProductFields product={product} categories={categories} />
    </ActionForm>
  );
}

function ProductFields({ product, categories }: { product?: Product; categories: Category[] }) {
  const { state } = useFormState();
  const e = state.fieldErrors ?? {};
  const [variants, setVariants] = useState<VariantRow[]>(() =>
    product
      ? product.variants.map((v) => ({
          key: v.id,
          id: v.id,
          kind: v.kind,
          sizeMl: v.sizeMl?.toString() ?? "",
          label: v.label,
          price: centsToInput(v.priceCents),
          compareAtPrice: centsToInput(v.compareAtPriceCents),
          stock: String(v.stock),
          sku: v.sku ?? "",
          isActive: v.isActive,
        }))
      : defaultVariants(),
  );

  const update = (key: string, patch: Partial<VariantRow>) =>
    setVariants((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const serialized = JSON.stringify(
    variants.map(({ id, kind, sizeMl, label, price, compareAtPrice, stock, sku, isActive }) => ({
      id,
      kind,
      sizeMl,
      label,
      price,
      compareAtPrice,
      stock,
      sku,
      isActive,
    })),
  );

  return (
    <>
      <input type="hidden" name="variants" value={serialized} />

      <Card title="Información">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre" name="name" required maxLength={120} defaultValue={product?.name} error={e.name} />
          <Field label="Marca" name="brand" required maxLength={80} defaultValue={product?.brand} error={e.brand} />
          <Field
            label="Slug (URL)"
            name="slug"
            maxLength={140}
            defaultValue={product?.slug}
            error={e.slug}
            hint="Vacío = se genera desde el nombre. Solo minúsculas, números y guiones."
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
          />
          <SelectField
            label="Categoría"
            name="categoryId"
            options={categories.map((c) => ({ value: c.id, label: c.isActive ? c.name : `${c.name} (inactiva)` }))}
            placeholder="Sin categoría"
            defaultValue={product?.category?.id ?? ""}
            error={e.categoryId}
          />
          <SelectField label="Género" name="gender" options={GENDERS} placeholder="Sin especificar" defaultValue={product?.gender ?? ""} error={e.gender} />
          <SelectField
            label="Familia olfativa"
            name="family"
            options={OLFACTORY_FAMILIES}
            placeholder="Sin especificar"
            defaultValue={product?.family ?? ""}
            error={e.family}
          />
          <TextAreaField
            label="Descripción"
            name="description"
            maxLength={5000}
            rows={5}
            defaultValue={product?.description}
            error={e.description}
            className="sm:col-span-2"
          />
        </div>
      </Card>

      <Card title="Notas olfativas">
        <p className="mb-4 text-xs text-muted">Separa las notas con comas. Ej.: bergamota, pimienta rosa, lavanda</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Salida" name="notesTop" defaultValue={product?.notes.top.join(", ")} error={e.notesTop} />
          <Field label="Corazón" name="notesHeart" defaultValue={product?.notes.heart.join(", ")} error={e.notesHeart} />
          <Field label="Fondo" name="notesBase" defaultValue={product?.notes.base.join(", ")} error={e.notesBase} />
        </div>
      </Card>

      <Card title="Formatos, precios y stock">
        <p className="mb-4 text-xs text-muted">
          Precio 0 = «Precio por confirmar» (no se puede comprar). Stock 0 = «Agotado». El precio anterior (opcional) muestra el descuento.
        </p>
        {e.variants && <p className="mb-3 text-sm text-danger">{e.variants}</p>}
        <div className="flex flex-col gap-4">
          {variants.map((v, i) => (
            <fieldset key={v.key} className="grid gap-3 border border-line p-4 sm:grid-cols-6">
              <legend className="px-1 text-xs text-muted">Variante {i + 1}</legend>
              <label className="flex flex-col gap-1 text-sm sm:col-span-1">
                Tipo
                <select
                  className="field"
                  value={v.kind}
                  onChange={(ev) => update(v.key, { kind: ev.target.value as VariantRow["kind"] })}
                >
                  {VARIANT_KINDS.map((k) => (
                    <option key={k.value} value={k.value}>{k.label}</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm sm:col-span-1">
                Tamaño (ml)
                <input
                  className="field"
                  inputMode="numeric"
                  value={v.sizeMl}
                  onChange={(ev) => update(v.key, { sizeMl: ev.target.value.replace(/\D/g, "").slice(0, 4) })}
                  aria-invalid={Boolean(e[`variants.${i}.sizeMl`])}
                />
                {e[`variants.${i}.sizeMl`] && <span className="text-xs text-danger">{e[`variants.${i}.sizeMl`]}</span>}
              </label>
              <label className="flex flex-col gap-1 text-sm sm:col-span-2">
                Etiqueta visible
                <input
                  className="field"
                  maxLength={60}
                  value={v.label}
                  onChange={(ev) => update(v.key, { label: ev.target.value })}
                  aria-invalid={Boolean(e[`variants.${i}.label`])}
                />
                {e[`variants.${i}.label`] && <span className="text-xs text-danger">{e[`variants.${i}.label`]}</span>}
              </label>
              <label className="flex flex-col gap-1 text-sm sm:col-span-2">
                SKU (opcional)
                <input className="field" maxLength={64} value={v.sku} onChange={(ev) => update(v.key, { sku: ev.target.value })} />
              </label>
              <label className="flex flex-col gap-1 text-sm sm:col-span-2">
                Precio
                <input
                  className="field"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={v.price}
                  onChange={(ev) => update(v.key, { price: ev.target.value })}
                  aria-invalid={Boolean(e[`variants.${i}.price`])}
                />
                {e[`variants.${i}.price`] && <span className="text-xs text-danger">{e[`variants.${i}.price`]}</span>}
              </label>
              <label className="flex flex-col gap-1 text-sm sm:col-span-2">
                Precio anterior (opcional)
                <input
                  className="field"
                  inputMode="decimal"
                  placeholder="—"
                  value={v.compareAtPrice}
                  onChange={(ev) => update(v.key, { compareAtPrice: ev.target.value })}
                  aria-invalid={Boolean(e[`variants.${i}.compareAtPrice`])}
                />
                {e[`variants.${i}.compareAtPrice`] && (
                  <span className="text-xs text-danger">{e[`variants.${i}.compareAtPrice`]}</span>
                )}
              </label>
              <label className="flex flex-col gap-1 text-sm sm:col-span-1">
                Stock
                <input
                  className="field"
                  inputMode="numeric"
                  value={v.stock}
                  onChange={(ev) => update(v.key, { stock: ev.target.value.replace(/\D/g, "").slice(0, 6) })}
                  aria-invalid={Boolean(e[`variants.${i}.stock`])}
                />
                {e[`variants.${i}.stock`] && <span className="text-xs text-danger">{e[`variants.${i}.stock`]}</span>}
              </label>
              <div className="flex items-end justify-between gap-2 sm:col-span-1">
                <label className="flex min-h-12 items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="size-5 accent-ink"
                    checked={v.isActive}
                    onChange={(ev) => update(v.key, { isActive: ev.target.checked })}
                  />
                  Activa
                </label>
                <button
                  type="button"
                  onClick={() => {
                    if (v.id && !window.confirm("¿Quitar esta variante? Se eliminará al guardar.")) return;
                    setVariants((rows) => rows.filter((r) => r.key !== v.key));
                  }}
                  className="flex size-12 items-center justify-center text-muted hover:text-danger"
                  aria-label={`Quitar variante ${v.label}`}
                >
                  <TrashIcon size={18} />
                </button>
              </div>
            </fieldset>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() =>
            setVariants((rows) => [
              ...rows,
              { key: newKey(), id: "", kind: "decant", sizeMl: "", label: "", price: "", compareAtPrice: "", stock: "0", sku: "", isActive: true },
            ])
          }
          disabled={variants.length >= 20}
        >
          <PlusIcon size={16} /> Añadir variante
        </Button>
      </Card>

      <Card title="Publicación">
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label="Estado" name="status" options={PRODUCT_STATUSES} defaultValue={product?.status ?? "draft"} error={e.status} hint="Solo los productos «Publicado» aparecen en la tienda." />
          <Field label="Orden (menor = primero)" name="sortOrder" type="number" defaultValue={product?.sortOrder ?? 0} error={e.sortOrder} />
          <div className="flex flex-col sm:col-span-2 sm:flex-row sm:gap-8">
            <CheckboxField label="Destacado" name="isFeatured" defaultChecked={product?.isFeatured} />
            <CheckboxField label="Nuevo" name="isNew" defaultChecked={product?.isNew} />
            <CheckboxField label="Recomendado" name="isRecommended" defaultChecked={product?.isRecommended} />
          </div>
          <TextAreaField
            label="Por qué lo recomendamos (opcional)"
            name="recommendationText"
            maxLength={500}
            rows={3}
            defaultValue={product?.recommendationText ?? ""}
            error={e.recommendationText}
            className="sm:col-span-2"
          />
        </div>
      </Card>

      <div className="sticky bottom-0 z-10 -mx-4 flex justify-end border-t border-line bg-ivory/95 px-4 py-3 backdrop-blur sm:mx-0 sm:border sm:px-4">
        <SubmitButton size="lg" className="w-full sm:w-auto">
          {product ? "Guardar cambios" : "Crear producto"}
        </SubmitButton>
      </div>
    </>
  );
}
