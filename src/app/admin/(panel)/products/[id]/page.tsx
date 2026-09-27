import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm, SubmitButton } from "@/components/admin/action-form";
import { ImageManager } from "@/components/admin/image-manager";
import { ProductForm } from "@/components/admin/product-form";
import { Card, PageHeader } from "@/components/admin/ui";
import { FormAlert } from "@/components/ui/fields";
import { adminGetProduct, adminListCategories } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/auth";
import { uuid } from "@/lib/validation/common";
import { deleteProduct } from "../actions";

export const metadata = { title: "Editar producto" };

export default async function EditProductPage({ params, searchParams }: PageProps<"/admin/products/[id]">) {
  const { supabase } = await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;
  if (!uuid.safeParse(id).success) notFound();

  const [product, categories] = await Promise.all([adminGetProduct(supabase, id), adminListCategories(supabase)]);
  if (!product) notFound();

  return (
    <>
      <Link href="/admin/products" className="mb-4 inline-block text-sm text-muted hover:text-ink">
        ← Productos
      </Link>
      <PageHeader
        title={product.name}
        description={product.brand}
        action={
          product.status === "active" ? (
            <Link href={`/product/${product.slug}`} target="_blank" className="text-sm underline">
              Ver en la tienda ↗
            </Link>
          ) : undefined
        }
      />

      {sp.created === "1" && (
        <div className="mb-6">
          <FormAlert tone="success">Producto creado. Ahora puedes subir sus imágenes.</FormAlert>
        </div>
      )}

      <div className="flex flex-col gap-6">
        <Card title="Imágenes">
          <ImageManager productId={product.id} images={product.images} />
        </Card>

        <ProductForm product={product} categories={categories} />

        <Card title="Zona peligrosa" className="border-danger/30">
          <p className="mb-4 text-sm text-muted">
            Eliminar borra el producto, sus variantes e imágenes. Los pedidos antiguos conservan sus datos. Si solo quieres ocultarlo,
            cambia el estado a «Archivado».
          </p>
          <ActionForm action={deleteProduct} confirmMessage={`¿Eliminar definitivamente «${product.name}»? Esta acción no se puede deshacer.`}>
            <input type="hidden" name="productId" value={product.id} />
            <SubmitButton variant="danger" pendingText="Eliminando…">
              Eliminar producto
            </SubmitButton>
          </ActionForm>
        </Card>
      </div>
    </>
  );
}
