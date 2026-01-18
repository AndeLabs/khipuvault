"use client";

import { ChevronRight, User, Wallet, Shield, Activity } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { PageHeader } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";

const settingsSections = [
  {
    href: "/dashboard/settings/preferences",
    icon: User,
    title: "Preferences",
    description: "Customize your KhipuVault experience",
    color: "text-lavanda",
    bgColor: "bg-lavanda/20",
  },
  {
    href: "/dashboard/settings/wallets",
    icon: Wallet,
    title: "Wallets",
    description: "Manage your connected wallets",
    color: "text-accent",
    bgColor: "bg-accent/20",
  },
  {
    href: "/dashboard/settings/security",
    icon: Shield,
    title: "Security",
    description: "Security settings and best practices",
    color: "text-success",
    bgColor: "bg-success/20",
  },
  {
    href: "/dashboard/settings/activity",
    icon: Activity,
    title: "Activity",
    description: "View your account activity history",
    color: "text-info",
    bgColor: "bg-info/20",
  },
];

export default function SettingsPage() {
  return (
    <div className="animate-slide-up space-y-6">
      <PageHeader title="Settings" description="Manage your account settings and preferences" />

      <div className="grid gap-6 md:grid-cols-2">
        {settingsSections.map((section) => {
          const Icon = section.icon;
          return (
            <Link key={section.href} href={section.href}>
              <Card variant="surface" hover="glow" className="group h-full cursor-pointer">
                <CardContent className="pt-6">
                  <div
                    className={`h-12 w-12 rounded-full ${section.bgColor} mb-4 flex items-center justify-center`}
                  >
                    <Icon className={`h-6 w-6 ${section.color}`} />
                  </div>
                  <div className="mb-2 flex items-start justify-between">
                    <h3 className="font-heading text-xl font-semibold">{section.title}</h3>
                    <ChevronRight className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">{section.description}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
