import { AppShell } from "@/components/layout";
import { TransactionProvider, TransactionModal } from "@/features/transactions";

/**
 * Dashboard Layout - V4 Design
 *
 * Features:
 * - New AppShell with modern design
 * - Integrated transaction management
 * - Responsive sidebar and header
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <TransactionProvider>
      <AppShell>{children}</AppShell>
      <TransactionModal />
    </TransactionProvider>
  );
}
