"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import * as React from "react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Next.js Global Error Boundary
 *
 * This catches errors in the root layout and provides a minimal fallback UI.
 * It's a last resort error handler for critical failures that prevent the app from rendering.
 *
 * IMPORTANT:
 * - This must NOT rely on any providers or context (they may have failed)
 * - Use minimal inline styles (Tailwind may not be available)
 * - Keep dependencies to absolute minimum
 * - Must include its own <html> and <body> tags
 *
 * Note: This component must be a Client Component ('use client')
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/error#global-errorjs
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  React.useEffect(() => {
    // Log error to console
    // eslint-disable-next-line no-console
    console.error("Global Error:", error);

    // You can log to an external error service here
    // Keep it simple - external services might also be failing
  }, [error]);

  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Error - KhipuVault</title>
        <style>{`
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%);
            color: #ffffff;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
          }

          .container {
            max-width: 600px;
            width: 100%;
          }

          .card {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            padding: 2rem;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(10px);
          }

          .header {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 1.5rem;
          }

          .icon-container {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background: rgba(239, 68, 68, 0.1);
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }

          .icon {
            width: 24px;
            height: 24px;
            color: #ef4444;
          }

          .title {
            font-size: 1.875rem;
            font-weight: 700;
            line-height: 1.2;
            color: #ffffff;
          }

          .description {
            font-size: 0.875rem;
            color: rgba(255, 255, 255, 0.6);
            margin-top: 0.25rem;
          }

          .content {
            margin-bottom: 1.5rem;
          }

          .error-box {
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.3);
            border-radius: 8px;
            padding: 1rem;
            margin-bottom: 1rem;
          }

          .error-message {
            font-family: 'Courier New', monospace;
            font-size: 0.875rem;
            color: #fca5a5;
            word-break: break-word;
          }

          .digest {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 8px;
            padding: 0.75rem;
            margin-bottom: 1rem;
          }

          .digest-label {
            font-size: 0.75rem;
            color: rgba(255, 255, 255, 0.6);
            margin-bottom: 0.25rem;
          }

          .digest-value {
            font-family: 'Courier New', monospace;
            font-size: 0.75rem;
            color: rgba(255, 255, 255, 0.8);
          }

          .instructions {
            margin-bottom: 1rem;
          }

          .instructions-title {
            font-size: 0.875rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
          }

          .instructions-list {
            list-style: none;
            font-size: 0.875rem;
            color: rgba(255, 255, 255, 0.7);
          }

          .instructions-list li {
            margin-bottom: 0.5rem;
            padding-left: 1.5rem;
            position: relative;
          }

          .instructions-list li:before {
            content: '•';
            position: absolute;
            left: 0.5rem;
            color: #8b5cf6;
          }

          .footer-note {
            padding-top: 1rem;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            font-size: 0.75rem;
            color: rgba(255, 255, 255, 0.5);
            line-height: 1.5;
          }

          .actions {
            display: flex;
            gap: 0.75rem;
            flex-wrap: wrap;
          }

          .button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            padding: 0.75rem 1.5rem;
            font-size: 1rem;
            font-weight: 600;
            border-radius: 8px;
            border: none;
            cursor: pointer;
            transition: all 0.2s;
            text-decoration: none;
            flex: 1;
            min-width: 140px;
          }

          .button-primary {
            background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
            color: #ffffff;
          }

          .button-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
          }

          .button-secondary {
            background: rgba(255, 255, 255, 0.1);
            color: #ffffff;
            border: 1px solid rgba(255, 255, 255, 0.2);
          }

          .button-secondary:hover {
            background: rgba(255, 255, 255, 0.15);
          }

          .button-icon {
            width: 16px;
            height: 16px;
          }

          @media (max-width: 640px) {
            .title {
              font-size: 1.5rem;
            }

            .actions {
              flex-direction: column;
            }

            .button {
              width: 100%;
            }
          }
        `}</style>
      </head>
      <body>
        <div className="container">
          <div className="card">
            <div className="header">
              <div className="icon-container">
                <AlertTriangle className="icon" />
              </div>
              <div>
                <h1 className="title">Error Critico</h1>
                <p className="description">La aplicacion encontro un error grave</p>
              </div>
            </div>

            <div className="content">
              <div className="error-box">
                <p className="error-message">{error.message || "Error desconocido"}</p>
              </div>

              {error.digest && (
                <div className="digest">
                  <p className="digest-label">ID de Error:</p>
                  <p className="digest-value">{error.digest}</p>
                  <p className="digest-label" style={{ marginTop: "0.5rem" }}>
                    Por favor incluye este ID al contactar soporte
                  </p>
                </div>
              )}

              <div className="instructions">
                <p className="instructions-title">Que puedes hacer:</p>
                <ul className="instructions-list">
                  <li>Intenta recargar la pagina usando el boton de abajo</li>
                  <li>Si el problema persiste, limpia el cache de tu navegador</li>
                  <li>Verifica tu conexion a internet</li>
                  <li>Intenta acceder desde otro navegador</li>
                </ul>
              </div>

              <div className="footer-note">
                Este es un error critico que ha afectado la carga completa de la aplicacion. El
                equipo de KhipuVault ha sido notificado automaticamente.
              </div>
            </div>

            <div className="actions">
              <button onClick={reset} className="button button-primary">
                <RefreshCw className="button-icon" />
                Reintentar
              </button>
              <a href="/" className="button button-secondary">
                Recargar Pagina
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
