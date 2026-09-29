import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

function supabaseOrigin(): { origin: string; hostname: string; protocol: "http" | "https"; isLocal: boolean } | null {
  try {
    const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
    const isLocal = url.hostname === "127.0.0.1" || url.hostname === "localhost";
    return { origin: url.origin, hostname: url.hostname, protocol: url.protocol === "http:" ? "http" : "https", isLocal };
  } catch {
    return null;
  }
}

const supabase = supabaseOrigin();

/**
 * Content Security Policy.
 * - Scripts solo propios ('unsafe-inline' es necesario para Next.js sin
 *   nonces; mantiene el sitio estático/cacheable = más rápido).
 * - Sin iframes de terceros, sin <object>, sin envío de formularios a
 *   otros dominios y sin que otros sitios puedan incrustar la web.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob:${supabase ? ` ${supabase.origin}` : ""}`,
  "font-src 'self' data:",
  `connect-src 'self'${supabase ? ` ${supabase.origin}` : ""}${isDev ? " ws:" : ""}`,
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "manifest-src 'self'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
    // Solo para Supabase local (npx supabase start); nunca en producción
    dangerouslyAllowLocalIP: Boolean(supabase?.isLocal),
    remotePatterns: supabase
      ? [
          {
            protocol: supabase.protocol,
            hostname: supabase.hostname,
            ...(supabase.isLocal ? { port: new URL(supabase.origin).port } : {}),
            pathname: "/storage/v1/object/public/product-images/**",
          },
        ]
      : [],
  },
  experimental: {
    serverActions: {
      // Imágenes: se comprimen en el navegador y se suben de una en una.
      // Vercel limita el cuerpo de las peticiones a 4,5 MB.
      bodySizeLimit: "4mb",
    },
  },
  async headers() {
    return [
      { source: "/(.*)", headers: securityHeaders },
      {
        source: "/admin/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Cache-Control", value: "private, no-store" },
        ],
      },
    ];
  },
};

export default nextConfig;
