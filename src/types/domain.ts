import type { Gender, OlfactoryFamily, OrderStatus, ProductStatus, VariantKind } from "@/lib/constants";

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
};

export type Variant = {
  id: string;
  kind: VariantKind;
  sizeMl: number | null;
  label: string;
  priceCents: number;
  compareAtPriceCents: number | null;
  stock: number;
  sku: string | null;
  isActive: boolean;
  sortOrder: number;
};

export type ProductImage = {
  id: string;
  path: string;
  url: string;
  alt: string | null;
  position: number;
};

export type Product = {
  id: string;
  name: string;
  brand: string;
  slug: string;
  description: string;
  status: ProductStatus;
  category: Pick<Category, "id" | "name" | "slug"> | null;
  gender: Gender | null;
  family: OlfactoryFamily | null;
  notes: { top: string[]; heart: string[]; base: string[] };
  isFeatured: boolean;
  isNew: boolean;
  isRecommended: boolean;
  recommendationText: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  variants: Variant[];
  images: ProductImage[];
};

export type OrderSummary = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  status: OrderStatus;
  totalCents: number;
  currency: string;
  createdAt: string;
};

export type ActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
};
