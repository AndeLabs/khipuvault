"use client";

import { LayoutDashboard, Wallet, Users, Trophy, Settings, ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useProtocolStats } from "@/hooks/use-protocol-stats";
import { cn } from "@/lib/utils";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  children?: {
    title: string;
    href: string;
    icon?: React.ComponentType<{ className?: string }>;
  }[];
}

const navItems: NavItem[] = [
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
    title: "Prize Pool",
    href: "/dashboard/prize-pool",
    icon: Trophy,
    badge: "New",
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    children: [
      {
        title: "Preferences",
        href: "/dashboard/settings/preferences",
      },
      {
        title: "Wallets",
        href: "/dashboard/settings/wallets",
      },
      {
        title: "Security",
        href: "/dashboard/settings/security",
      },
      {
        title: "Activity",
        href: "/dashboard/settings/activity",
      },
    ],
  },
];

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
  className?: string;
}

export function Sidebar({ open = true, onClose, className }: SidebarProps) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = React.useState<string[]>([]);
  const { formattedTVL, formattedAPY, isLoading } = useProtocolStats();

  const toggleExpanded = (title: string) => {
    setExpandedItems((prev) =>
      prev.includes(title) ? prev.filter((item) => item !== title) : [...prev, title]
    );
  };

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
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[280px] border-r border-border bg-surface transition-transform duration-base sm:w-64 md:sticky md:top-16 md:h-[calc(100vh-4rem)] md:translate-x-0",
          !open && "-translate-x-full",
          className
        )}
      >
        <nav className="flex h-full flex-col gap-2 overflow-y-auto p-3 md:p-4">
          {/* Navigation Items */}
          <div className="flex-1 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActiveRoute(item.href);
              const isExpanded = expandedItems.includes(item.title);
              const hasChildren = item.children && item.children.length > 0;

              if (hasChildren) {
                return (
                  <Collapsible
                    key={item.title}
                    open={isExpanded || isActive}
                    onOpenChange={() => toggleExpanded(item.title)}
                  >
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-between",
                          isActive && "bg-surface-elevated text-lavanda"
                        )}
                        aria-label={`${isExpanded || isActive ? "Collapse" : "Expand"} ${item.title} menu`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="h-5 w-5" />
                          <span className="font-medium">{item.title}</span>
                        </div>
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 transition-transform duration-fast",
                            (isExpanded || isActive) && "rotate-180"
                          )}
                          aria-hidden="true"
                        />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-1 space-y-1 pl-4">
                      {item.children?.map((child) => {
                        const isChildActive = pathname === child.href;
                        return (
                          <Link key={child.href} href={child.href}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={cn(
                                "w-full justify-start",
                                isChildActive && "bg-surface-elevated text-lavanda"
                              )}
                            >
                              {child.title}
                            </Button>
                          </Link>
                        );
                      })}
                    </CollapsibleContent>
                  </Collapsible>
                );
              }

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
                    <Icon className="h-5 w-5" />
                    <span className="flex-1 text-left font-medium">{item.title}</span>
                    {item.badge && (
                      <span className="badge-orange px-1.5 py-0.5 text-[10px]">{item.badge}</span>
                    )}
                  </Button>
                </Link>
              );
            })}
          </div>

          {/* Bottom section - Quick stats or info */}
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
