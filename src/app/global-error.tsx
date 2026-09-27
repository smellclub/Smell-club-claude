"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="es">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#0a0a0a", color: "#faf8f4" }}>
        <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 24, textAlign: "center" }}>
          <h1 style={{ fontWeight: 400 }}>Algo salió mal</h1>
          <p style={{ opacity: 0.6 }}>Inténtalo de nuevo en unos segundos.</p>
          <button type="button" onClick={reset} style={{ padding: "12px 24px", background: "#c5a25a", border: 0, cursor: "pointer" }}>
            Reintentar
          </button>
        </main>
      </body>
    </html>
  );
}
