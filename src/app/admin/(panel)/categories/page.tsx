import { ActionForm, SubmitButton } from "@/components/admin/action-form";
import { CategoryForm } from "@/components/admin/category-form";
import { Card, PageHeader } from "@/components/admin/ui";
import { adminListCategories } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/auth";
import { deleteCategory } from "./actions";

export const metadata = { title: "Categorías" };

export default async function AdminCategoriesPage() {
  const { supabase } = await requireAdmin();
  const categories = await adminListCategories(supabase);

  return (
    <>
      <PageHeader title="Categorías" description="Organizan el catálogo y los filtros de la tienda." />

      <Card title="Nueva categoría" className="mb-6">
        <CategoryForm />
      </Card>

      <div className="flex flex-col gap-4">
        {categories.map((c) => (
          <Card key={c.id}>
            <CategoryForm category={c} />
            <div className="mt-3 border-t border-line pt-3">
              <ActionForm
                action={deleteCategory}
                confirmMessage={`¿Eliminar «${c.name}»? Sus productos quedarán sin categoría.`}
              >
                <input type="hidden" name="categoryId" value={c.id} />
                <SubmitButton variant="danger" size="sm" pendingText="Eliminando…">
                  Eliminar
                </SubmitButton>
              </ActionForm>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
