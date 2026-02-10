"use client";

import { AppShell } from "@/components/layout";
import { ClientLayout } from "@/components/layout/client-layout";
import { TransactionProvider, TransactionModal } from "@/features/transactions";

/**
 * Dashboard Layout - V4 Design with Web3
 *
 * Features:
 * - Web3Provider via ClientLayout (only for dashboard routes)
 * - New AppShell with modern design
 * - Integrated transaction management
 * - Responsive sidebar and header
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClientLayout>
      <TransactionProvider>
        <AppShell>{children}</AppShell>
        <TransactionModal />
      </TransactionProvider>
    </ClientLayout>
  );
}
