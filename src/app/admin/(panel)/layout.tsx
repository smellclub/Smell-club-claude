import type { Metadata } from "next";
import { AdminNav } from "@/components/admin/admin-nav";
import { requireAdmin } from "@/lib/auth";

/** El panel nunca se cachea ni se genera de forma estática. */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Panel", template: "%s · Panel Smellclub" },
  robots: { index: false, follow: false },
};

/**
 * Segunda capa de protección: aunque el proxy fallara, ninguna página
 * del panel se renderiza sin una sesión de administrador válida.
 */
export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();

  return (
    <div className="min-h-dvh bg-sand/50 lg:flex">
      <AdminNav email={session.email} />
      <div className="min-w-0 flex-1">
        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
