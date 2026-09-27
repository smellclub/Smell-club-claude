"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { deleteProductImage, setMainImage, updateImageAlt, uploadProductImage } from "@/app/admin/(panel)/products/actions";
import { ActionForm, SubmitButton } from "@/components/admin/action-form";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/fields";
import { IMAGE_MAX_BYTES, IMAGE_MAX_DIMENSION } from "@/lib/constants";
import type { ProductImage } from "@/types/domain";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/avif"];

/**
 * Redimensiona y recomprime en el navegador (WebP, máx. 1600 px).
 * Reduce el peso (web más rápida), elimina metadatos EXIF/GPS y
 * respeta el límite de 4,5 MB por petición de Vercel.
 */
async function compressImage(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, IMAGE_MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const toBlob = (type: string, quality: number) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));

  let blob = await toBlob("image/webp", 0.86);
  if (!blob || blob.type !== "image/webp") blob = await toBlob("image/jpeg", 0.88);
  if (!blob) throw new Error("encode");
  const ext = blob.type === "image/webp" ? "webp" : "jpg";
  return new File([blob], `imagen.${ext}`, { type: blob.type });
}

export function ImageManager({ productId, images }: { productId: string; images: ProductImage[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    setErrors([]);
    const list = Array.from(files).slice(0, 10);
    const problems: string[] = [];

    for (const [i, file] of list.entries()) {
      setProgress(`Subiendo ${i + 1} de ${list.length}…`);
      if (!ACCEPTED.includes(file.type)) {
        problems.push(`${file.name}: formato no permitido (usa JPG, PNG, WebP o AVIF).`);
        continue;
      }
      if (file.size > 25 * 1024 * 1024) {
        problems.push(`${file.name}: archivo demasiado grande (máx. 25 MB antes de comprimir).`);
        continue;
      }
      try {
        const compressed = await compressImage(file);
        if (compressed.size > IMAGE_MAX_BYTES) {
          problems.push(`${file.name}: sigue siendo demasiado grande tras comprimir.`);
          continue;
        }
        const fd = new FormData();
        fd.set("productId", productId);
        fd.set("file", compressed);
        const result = await uploadProductImage(fd);
        if (!result.ok) problems.push(`${file.name}: ${result.message}`);
      } catch {
        problems.push(`${file.name}: no se pudo procesar la imagen.`);
      }
    }

    setErrors(problems);
    setProgress("");
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      {errors.length > 0 && (
        <FormAlert>
          {errors.map((e) => (
            <p key={e}>{e}</p>
          ))}
        </FormAlert>
      )}

      {images.length === 0 ? (
        <p className="text-sm text-muted">Este producto aún no tiene imágenes.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((img, index) => (
            <li key={img.id} className="flex flex-col gap-2 border border-line p-2">
              <div className="relative aspect-[4/5] bg-sand">
                <Image src={img.url} alt={img.alt ?? ""} fill sizes="200px" className="object-cover" />
                {index === 0 && (
                  <span className="absolute top-2 left-2 bg-gold px-2 py-0.5 text-[0.6rem] font-semibold uppercase">Principal</span>
                )}
              </div>
              <ActionForm action={updateImageAlt} className="flex flex-col gap-1" showMessage={false}>
                <input type="hidden" name="imageId" value={img.id} />
                <input type="hidden" name="productId" value={productId} />
                <label className="text-xs text-muted">
                  Texto alternativo
                  <input name="alt" defaultValue={img.alt ?? ""} maxLength={200} className="field mt-1 min-h-10 py-1 text-sm" />
                </label>
                <SubmitButton variant="outline" size="sm">Guardar texto</SubmitButton>
              </ActionForm>
              <div className="flex gap-1">
                {index !== 0 && (
                  <ActionForm action={setMainImage} className="flex-1" showMessage={false}>
                    <input type="hidden" name="imageId" value={img.id} />
                    <input type="hidden" name="productId" value={productId} />
                    <SubmitButton variant="outline" size="sm" className="w-full" pendingText="…">Principal</SubmitButton>
                  </ActionForm>
                )}
                <ActionForm action={deleteProductImage} className="flex-1" confirmMessage="¿Eliminar esta imagen?" showMessage={false}>
                  <input type="hidden" name="imageId" value={img.id} />
                  <input type="hidden" name="productId" value={productId} />
                  <SubmitButton variant="danger" size="sm" className="w-full" pendingText="…">Eliminar</SubmitButton>
                </ActionForm>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(",")}
          multiple
          className="sr-only"
          id="image-upload"
          onChange={(e) => onFiles(e.target.files)}
          disabled={busy}
        />
        <Button variant="outline" onClick={() => inputRef.current?.click()} disabled={busy}>
          {busy ? progress || "Procesando…" : "Subir imágenes"}
        </Button>
        <p className="mt-2 text-xs text-muted">
          JPG, PNG, WebP o AVIF. Se optimizan automáticamente (máx. {IMAGE_MAX_DIMENSION}px). Recomendado: vertical 4:5, fondo limpio.
        </p>
      </div>
    </div>
  );
}
