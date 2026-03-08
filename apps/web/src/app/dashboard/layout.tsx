import type { Metadata } from "next";

import { DashboardShell } from "@/components/layout/dashboard-shell";

export const metadata: Metadata = {
  title: "Dashboard | KhipuVault",
  description:
    "Manage your Bitcoin savings portfolio on KhipuVault. View your individual and cooperative savings, track yields, and monitor your DeFi positions on Mezo blockchain.",
  openGraph: {
    title: "Dashboard | KhipuVault",
    description:
      "Manage your Bitcoin savings portfolio. Track yields and monitor your DeFi positions on Mezo blockchain.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Dashboard | KhipuVault",
    description:
      "Manage your Bitcoin savings portfolio. Track yields and monitor your DeFi positions on Mezo blockchain.",
  },
};

/**
 * Dashboard Layout - V4 Design with Web3
 *
 * Server component that exports metadata and wraps DashboardShell.
 * All client-side logic is in DashboardShell component.
 *
 * Features:
 * - SEO metadata for dashboard pages
 * - Web3Provider via ClientLayout (only for dashboard routes)
 * - New AppShell with modern design
 * - Integrated transaction management
 * - Responsive sidebar and header
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
