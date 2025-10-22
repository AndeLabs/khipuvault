
import Link from "next/link";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../components/ui/tooltip";
import { Home, Settings, Handshake, Lightbulb, RotateCw, Trophy } from "lucide-react";

export const navItems = [
    { href: "/dashboard", icon: Home, label: "Dashboard" },
    { href: "/dashboard/individual-savings", icon: Lightbulb, label: "Individual Savings" },
    { href: "/dashboard/cooperative-savings", icon: Handshake, label: "Cooperative Savings" },
    { href: "/dashboard/prize-pool", icon: Trophy, label: "Prize Pool" },
    { href: "/dashboard/rotating-pool", icon: RotateCw, label: "Rotating Pool" },
];

export function DashboardSidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
        <TooltipProvider>
            <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
                <Link
                    href="/"
                    className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
                >
                    <span role="img" aria-label="mountain emoji">🏔️</span>
                    <span className="sr-only">KhipuVault</span>
                </Link>
                {navItems.map((item, index) => (
                <Tooltip key={index}>
                    <TooltipTrigger asChild>
                    <Link
                        href={item.href}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
                    >
                        <item.icon className="h-5 w-5" />
                        <span className="sr-only">{item.label}</span>
                    </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
                ))}
            </nav>
            <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
                <Tooltip>
                <TooltipTrigger asChild>
                    <Link
                    href="/dashboard/settings"
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
                    >
                    <Settings className="h-5 w-5" />
                    <span className="sr-only">Settings</span>
                    </Link>
                </TooltipTrigger>
                <TooltipContent side="right">Settings</TooltipContent>
                </Tooltip>
            </nav>
        </TooltipProvider>
    </aside>
  );
}
