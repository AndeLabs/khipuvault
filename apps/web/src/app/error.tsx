"use client";

import * as React from "react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Next.js Page-level Error Boundary
 *
 * SIMPLIFIED VERSION: Uses only basic HTML/CSS to avoid
 * component-related errors when wallet extensions conflict.
 */
export default function Error({ error, reset }: ErrorProps) {
  React.useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("Page Error:", error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        backgroundColor: "var(--background, #0a0a0f)",
        color: "var(--foreground, #ffffff)",
      }}
    >
      <div
        style={{
          maxWidth: "28rem",
          width: "100%",
          padding: "2rem",
          borderRadius: "0.75rem",
          backgroundColor: "var(--card, #131320)",
          border: "1px solid var(--border, #2a2a3c)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: "4rem",
            height: "4rem",
            margin: "0 auto 1.5rem",
            borderRadius: "50%",
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "2rem",
          }}
        >
          ⚠️
        </div>

        <h2
          style={{
            fontSize: "1.5rem",
            fontWeight: "bold",
            marginBottom: "0.5rem",
          }}
        >
          Algo salió mal
        </h2>

        <p
          style={{
            color: "var(--muted-foreground, #a1a1aa)",
            marginBottom: "1.5rem",
            fontSize: "0.875rem",
          }}
        >
          Ocurrió un error inesperado. Intenta recargar la página.
        </p>

        {error.digest && (
          <p
            style={{
              fontSize: "0.75rem",
              color: "var(--muted-foreground, #a1a1aa)",
              marginBottom: "1.5rem",
              fontFamily: "monospace",
            }}
          >
            ID: {error.digest}
          </p>
        )}

        <div style={{ display: "flex", gap: "0.75rem", flexDirection: "column" }}>
          <button
            onClick={reset}
            style={{
              width: "100%",
              padding: "0.75rem 1rem",
              borderRadius: "0.5rem",
              backgroundColor: "var(--primary, #8b5cf6)",
              color: "white",
              border: "none",
              cursor: "pointer",
              fontWeight: "500",
              fontSize: "0.875rem",
            }}
          >
            Reintentar
          </button>

          <button
            onClick={() => (window.location.href = "/")}
            style={{
              width: "100%",
              padding: "0.75rem 1rem",
              borderRadius: "0.5rem",
              backgroundColor: "transparent",
              color: "var(--foreground, #ffffff)",
              border: "1px solid var(--border, #2a2a3c)",
              cursor: "pointer",
              fontWeight: "500",
              fontSize: "0.875rem",
            }}
          >
            Ir al Inicio
          </button>
        </div>
      </div>
    </div>
  );
}
