"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

import { DashboardHeader } from "./dashboard-header";
import { Sidebar } from "./sidebar";

interface AppShellProps {
  children: React.ReactNode;
  className?: string;
}

export function AppShell({ children, className }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Dashboard Header */}
      <DashboardHeader onMenuClick={toggleSidebar} />

      <div className="flex">
        {/* Sidebar */}
        <Sidebar open={sidebarOpen} onClose={closeSidebar} />

        {/* Main Content */}
        <main
          id="main-content"
          tabIndex={-1}
          className={cn(
            "w-full flex-1 md:ml-0",
            "px-4 py-6 md:px-6",
            "mx-auto max-w-[1600px]",
            "focus:outline-none",
            className
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

/**
 * Page Header - Reusable header for pages within the AppShell
 */
interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("mb-6 md:mb-8", className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-heading text-3xl font-bold md:text-4xl">{title}</h1>
          {description && (
            <p className="text-base text-muted-foreground md:text-lg">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

/**
 * Page Section - Reusable section wrapper for organizing page content
 */
interface PageSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function PageSection({ title, description, children, className }: PageSectionProps) {
  return (
    <section className={cn("space-y-4", className)}>
      {(title ?? description) && (
        <div className="space-y-1">
          {title && <h2 className="font-heading text-xl font-semibold md:text-2xl">{title}</h2>}
          {description && <p className="text-muted-foreground">{description}</p>}
        </div>
      )}
      {children}
    </section>
  );
}
