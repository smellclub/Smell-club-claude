import type { Metadata } from "next";
import { LoginForm } from "@/components/admin/login-form";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = {
  title: "Acceso administración",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-ink px-5 py-12">
      <div className="w-full max-w-sm">
        <p className="text-center font-display text-3xl tracking-[0.22em] text-ivory uppercase">
          Smell<span className="text-gold">club</span>
        </p>
        <p className="eyebrow mt-3 text-center text-ivory/50">Panel privado</p>
        <div className="mt-10 bg-ivory p-6 sm:p-8">
          {!isSupabaseConfigured() && (
            <p className="mb-4 border border-danger/40 bg-danger/5 p-3 text-sm text-danger">
              Supabase no está configurado. Revisa las variables de entorno (README, paso 3).
            </p>
          )}
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
