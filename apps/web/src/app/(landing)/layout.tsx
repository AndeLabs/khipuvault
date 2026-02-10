import { ReactNode } from "react";

/**
 * Landing Layout - No Web3 Provider
 *
 * Simple passthrough layout for landing pages.
 * No Web3Provider = no wallet detection = no conflicts.
 */
export default function LandingLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
