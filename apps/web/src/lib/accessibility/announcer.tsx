/**
 * @fileoverview Screen Reader Announcer
 * @module lib/accessibility/announcer
 *
 * Provides live region announcements for screen readers.
 * Essential for WCAG 4.1.3 (Status Messages) compliance.
 */

"use client";

import * as React from "react";

type Politeness = "polite" | "assertive" | "off";

interface AnnouncerContextValue {
  announce: (message: string, politeness?: Politeness) => void;
}

const AnnouncerContext = React.createContext<AnnouncerContextValue | null>(null);

interface AnnouncerProps {
  children: React.ReactNode;
}

/**
 * Announcer Provider
 * Provides a way to announce messages to screen readers
 */
export function Announcer({ children }: AnnouncerProps) {
  const [politeMessage, setPoliteMessage] = React.useState("");
  const [assertiveMessage, setAssertiveMessage] = React.useState("");

  const announce = React.useCallback((message: string, politeness: Politeness = "polite") => {
    if (politeness === "off" || !message) {
      return;
    }

    // Clear first to ensure announcement even if same message
    if (politeness === "polite") {
      setPoliteMessage("");
      requestAnimationFrame(() => setPoliteMessage(message));
    } else {
      setAssertiveMessage("");
      requestAnimationFrame(() => setAssertiveMessage(message));
    }

    // Clear after announcement
    setTimeout(() => {
      if (politeness === "polite") {
        setPoliteMessage("");
      } else {
        setAssertiveMessage("");
      }
    }, 1000);
  }, []);

  const contextValue = React.useMemo(() => ({ announce }), [announce]);

  return (
    <AnnouncerContext.Provider value={contextValue}>
      {children}
      {/* Polite live region */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        style={{
          position: "absolute",
          width: "1px",
          height: "1px",
          padding: 0,
          margin: "-1px",
          overflow: "hidden",
          clip: "rect(0, 0, 0, 0)",
          whiteSpace: "nowrap",
          border: 0,
        }}
      >
        {politeMessage}
      </div>
      {/* Assertive live region */}
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
        style={{
          position: "absolute",
          width: "1px",
          height: "1px",
          padding: 0,
          margin: "-1px",
          overflow: "hidden",
          clip: "rect(0, 0, 0, 0)",
          whiteSpace: "nowrap",
          border: 0,
        }}
      >
        {assertiveMessage}
      </div>
    </AnnouncerContext.Provider>
  );
}

/**
 * Hook to access announcer
 */
export function useAnnounce() {
  const context = React.useContext(AnnouncerContext);

  if (!context) {
    // Return no-op if not wrapped in Announcer
    return {
      announce: (_message: string, _politeness?: Politeness) => {
        if (process.env.NODE_ENV === "development") {
          // eslint-disable-next-line no-console
          console.warn("[Announcer] useAnnounce called outside of Announcer provider");
        }
      },
      // Convenience methods
      announcePolite: (_message: string) => {},
      announceAssertive: (_message: string) => {},
    };
  }

  return {
    announce: context.announce,
    // Convenience methods
    announcePolite: (message: string) => context.announce(message, "polite"),
    announceAssertive: (message: string) => context.announce(message, "assertive"),
  };
}

/**
 * Pre-defined announcement messages for common actions
 */
export const AnnouncementMessages = {
  // Loading states
  LOADING: "Cargando...",
  LOADED: "Contenido cargado",

  // Transaction states
  TX_PENDING: "Transacción pendiente. Por favor espera...",
  TX_CONFIRMED: "Transacción confirmada exitosamente",
  TX_FAILED: "Transacción fallida. Por favor intenta de nuevo",
  TX_CANCELLED: "Transacción cancelada",

  // Form states
  FORM_ERROR: (field: string) => `Error en el campo ${field}`,
  FORM_SUCCESS: "Formulario enviado exitosamente",

  // Navigation
  PAGE_LOADED: (page: string) => `Página ${page} cargada`,
  MODAL_OPENED: (title: string) => `Diálogo abierto: ${title}`,
  MODAL_CLOSED: "Diálogo cerrado",

  // Wallet
  WALLET_CONNECTED: "Wallet conectada exitosamente",
  WALLET_DISCONNECTED: "Wallet desconectada",
  NETWORK_CHANGED: (network: string) => `Red cambiada a ${network}`,

  // Data updates
  DATA_REFRESHED: "Datos actualizados",
  BALANCE_UPDATED: (amount: string) => `Balance actualizado: ${amount}`,
} as const;
