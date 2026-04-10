"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          backgroundColor: "#fafafa",
        }}
      >
        <div style={{ textAlign: "center", padding: 24, maxWidth: 360 }}>
          <p style={{ fontSize: 48, margin: 0 }}>!</p>
          <h1 style={{ fontSize: 20, margin: "8px 0" }}>
            Algo deu errado
          </h1>
          <p style={{ color: "#666", fontSize: 14, marginBottom: 24 }}>
            Ocorreu um erro inesperado no aplicativo.
          </p>
          <button
            onClick={reset}
            style={{
              padding: "10px 24px",
              fontSize: 14,
              border: "1px solid #ddd",
              borderRadius: 8,
              background: "#fff",
              cursor: "pointer",
              marginRight: 8,
            }}
          >
            Tentar novamente
          </button>
          <button
            onClick={() => (window.location.href = "/")}
            style={{
              padding: "10px 24px",
              fontSize: 14,
              border: "1px solid #ddd",
              borderRadius: 8,
              background: "#fff",
              cursor: "pointer",
            }}
          >
            Início
          </button>
        </div>
      </body>
    </html>
  );
}
