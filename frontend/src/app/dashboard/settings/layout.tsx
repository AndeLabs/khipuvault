
"use client";
import {
  Users,
  Wallet,
  Bell,
  Palette,
  Lock,
  Globe,
  Activity,
  User,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "../../lib/utils";
import { AnimateOnScroll } from "../../components/animate-on-scroll";

const settingsNav = [
  { href: "/dashboard/settings", icon: User, label: "Perfil" },
  { href: "/dashboard/settings/wallets", icon: Wallet, label: "Wallets" },
  { href: "/dashboard/settings/notifications", icon: Bell, label: "Notificaciones" },
  { href: "/dashboard/settings/appearance", icon: Palette, label: "Apariencia" },
  { href: "/dashboard/settings/security", icon: Lock, label: "Seguridad" },
  { href: "/dashboard/settings/preferences", icon: Globe, label: "Preferencias" },
  { href: "/dashboard/settings/activity", icon: Activity, label: "Actividad" },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col gap-8">
        <AnimateOnScroll>
            <h1 className="text-3xl font-bold tracking-tight text-white">
                Configuración y Perfil
            </h1>
        </AnimateOnScroll>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <aside className="md:col-span-1">
                <AnimateOnScroll delay="100ms">
                <nav className="flex flex-col gap-2">
                    {settingsNav.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:bg-card hover:text-primary",
                        pathname === item.href && "bg-card text-primary font-semibold"
                        )}
                    >
                        <item.icon className="h-5 w-5" />
                        {item.label}
                    </Link>
                    ))}
                </nav>
                </AnimateOnScroll>
            </aside>
            <main className="md:col-span-3">
                <AnimateOnScroll delay="200ms">
                    {children}
                </AnimateOnScroll>
            </main>
        </div>
    </div>
  );
}
