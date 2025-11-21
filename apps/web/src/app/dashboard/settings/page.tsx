"use client"

import * as React from "react"
import { PageHeader } from "@/components/layout"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { ChevronRight, User, Wallet, Shield, Activity, Bell, Palette } from "lucide-react"

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
]

export default function SettingsPage() {
  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        title="Settings"
        description="Manage your account settings and preferences"
      />

      <div className="grid gap-6 md:grid-cols-2">
        {settingsSections.map((section) => {
          const Icon = section.icon
          return (
            <Link key={section.href} href={section.href}>
              <Card variant="surface" hover="glow" className="h-full cursor-pointer group">
                <CardContent className="pt-6">
                  <div className={`h-12 w-12 rounded-full ${section.bgColor} flex items-center justify-center mb-4`}>
                    <Icon className={`h-6 w-6 ${section.color}`} />
                  </div>
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-xl font-heading font-semibold">
                      {section.title}
                    </h3>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {section.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
