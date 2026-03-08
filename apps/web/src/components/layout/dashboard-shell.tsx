"use client";

import { AppShell } from "@/components/layout";
import { ClientLayout } from "@/components/layout/client-layout";
import { TransactionProvider, TransactionModal } from "@/features/transactions";

/**
 * Dashboard Shell - Client-side wrapper
 *
 * Contains all the client-side providers and layout components
 * for the dashboard routes. Separated from layout.tsx to allow
 * server-side metadata exports.
 */
export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <ClientLayout>
      <TransactionProvider>
        <AppShell>{children}</AppShell>
        <TransactionModal />
      </TransactionProvider>
    </ClientLayout>
  );
}
