import type { MetadataRoute } from "next";
import { getCatalog } from "@/lib/catalog";
import { publicEnv } from "@/lib/env";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = publicEnv.siteUrl;
  const products = await getCatalog();
  const staticRoutes = ["", "/shop", "/decants", "/recommendations", "/contact"].map((path) => ({
    url: `${base}${path}`,
    changeFrequency: "daily" as const,
    priority: path === "" ? 1 : 0.8,
  }));
  const legal = ["aviso-legal", "privacidad", "terminos", "envios-y-devoluciones"].map((p) => ({
    url: `${base}/legal/${p}`,
    changeFrequency: "yearly" as const,
    priority: 0.2,
  }));
  const productRoutes = products.map((p) => ({
    url: `${base}/product/${p.slug}`,
    lastModified: p.updatedAt ? new Date(p.updatedAt) : undefined,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));
  return [...staticRoutes, ...productRoutes, ...legal];
}
