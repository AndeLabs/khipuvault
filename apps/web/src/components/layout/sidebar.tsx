"use client";

/**
 * @fileoverview Sidebar Navigation Component
 * @module components/layout/sidebar
 *
 * Clean, modular sidebar with:
 * - Simple flat navigation (no nested menus)
 * - Mobile responsive with overlay
 * - Protocol stats display
 * - Active route highlighting
 */

import { LayoutDashboard, Wallet, Users, Trophy, RefreshCw } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useProtocolStats } from "@/hooks/use-protocol-stats";
import { cn } from "@/lib/utils";

/**
 * Navigation item configuration
 */
interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

/**
 * Main navigation items - flat structure for simplicity
 */
const NAV_ITEMS: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Individual Savings",
    href: "/dashboard/individual-savings",
    icon: Wallet,
  },
  {
    title: "Cooperative Pools",
    href: "/dashboard/cooperative-savings",
    icon: Users,
  },
  {
    title: "ROSCA Pools",
    href: "/dashboard/rotating-pool",
    icon: RefreshCw,
    badge: "New",
  },
  {
    title: "Prize Pool",
    href: "/dashboard/prize-pool",
    icon: Trophy,
  },
];

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
  className?: string;
}

/**
 * Sidebar Component
 *
 * Features:
 * - Responsive: slides in on mobile, sticky on desktop
 * - Shows protocol stats (TVL, APY)
 * - Active route highlighting
 */
export function Sidebar({ open = true, onClose, className }: SidebarProps) {
  const pathname = usePathname();
  const { formattedTVL, formattedAPY, isLoading } = useProtocolStats();

  const isActiveRoute = (href: string) => {
    if (href === "/dashboard") {
      return pathname === href;
    }
    return pathname?.startsWith(href);
  };

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[280px] border-r border-border bg-surface",
          "transition-transform duration-base sm:w-64",
          "md:sticky md:top-16 md:h-[calc(100vh-4rem)] md:translate-x-0",
          !open && "-translate-x-full",
          className
        )}
      >
        <nav className="flex h-full flex-col gap-2 overflow-y-auto p-3 md:p-4">
          {/* Navigation Items */}
          <div className="flex-1 space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = isActiveRoute(item.href);

              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start gap-3",
                      isActive && "bg-surface-elevated text-lavanda"
                    )}
                    onClick={onClose}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                    <span className="flex-1 text-left font-medium">{item.title}</span>
                    {item.badge && (
                      <span className="badge-orange px-1.5 py-0.5 text-[10px]">{item.badge}</span>
                    )}
                  </Button>
                </Link>
              );
            })}
          </div>

          {/* Protocol Stats */}
          <div className="mt-4 border-t border-border pt-4">
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center justify-between px-3">
                <span>Total Value Locked</span>
                <span className="font-semibold tabular-nums text-foreground">
                  {isLoading ? "..." : formattedTVL}
                </span>
              </div>
              <div className="flex items-center justify-between px-3">
                <span>APY</span>
                <span className="font-semibold tabular-nums text-success">
                  {isLoading ? "..." : formattedAPY}
                </span>
              </div>
            </div>
          </div>
        </nav>
      </aside>
    </>
  );
}
