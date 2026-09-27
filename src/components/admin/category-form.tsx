"use client";

import { saveCategory } from "@/app/admin/(panel)/categories/actions";
import { ActionForm, SubmitButton, useFormState } from "@/components/admin/action-form";
import { CheckboxField, Field } from "@/components/ui/fields";
import type { Category } from "@/types/domain";

function Fields({ category }: { category?: Category }) {
  const e = useFormState().state.fieldErrors ?? {};
  const idp = category?.id ?? "new";
  return (
    <div className="grid gap-3 sm:grid-cols-[2fr_2fr_1fr]">
      {category && <input type="hidden" name="categoryId" value={category.id} />}
      <Field id={`name-${idp}`} label="Nombre" name="name" required maxLength={80} defaultValue={category?.name} error={e.name} />
      <Field id={`slug-${idp}`} label="Slug (URL)" name="slug" maxLength={100} defaultValue={category?.slug} error={e.slug} hint="Vacío = automático" />
      <Field id={`sort-${idp}`} label="Orden" name="sortOrder" type="number" defaultValue={category?.sortOrder ?? 0} error={e.sortOrder} />
      <Field
        id={`desc-${idp}`}
        label="Descripción (opcional)"
        name="description"
        maxLength={1000}
        defaultValue={category?.description ?? ""}
        error={e.description}
        className="sm:col-span-2"
      />
      <CheckboxField label="Activa (visible)" name="isActive" defaultChecked={category?.isActive ?? true} className="self-end" />
    </div>
  );
}

export function CategoryForm({ category }: { category?: Category }) {
  return (
    <ActionForm action={saveCategory} className="flex flex-col gap-3" resetOnSuccess={!category}>
      <Fields category={category} />
      <div>
        <SubmitButton variant={category ? "outline" : "primary"} size="sm">
          {category ? "Guardar" : "Crear categoría"}
        </SubmitButton>
      </div>
    </ActionForm>
  );
}
