import Link from "next/link";
import { ProductForm } from "@/components/admin/product-form";
import { PageHeader } from "@/components/admin/ui";
import { adminListCategories } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/auth";

export const metadata = { title: "Nuevo producto" };

export default async function NewProductPage() {
  const { supabase } = await requireAdmin();
  const categories = await adminListCategories(supabase);

  return (
    <>
      <Link href="/admin/products" className="mb-4 inline-block text-sm text-muted hover:text-ink">
        ← Productos
      </Link>
      <PageHeader title="Nuevo producto" description="Podrás subir imágenes después de crearlo." />
      <ProductForm categories={categories} />
    </>
  );
}
