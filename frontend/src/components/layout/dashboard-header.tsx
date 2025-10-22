
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../components/ui/dropdown-menu";
import { Icons } from "../components/icons";
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";
import { Menu, Settings, User, LogOut } from "lucide-react";
import Link from "next/link";
import { navItems } from "./dashboard-sidebar";

export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
        <Sheet>
            <SheetTrigger asChild>
                <Button size="icon" variant="outline" className="sm:hidden">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle Menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="sm:max-w-xs">
                <nav className="grid gap-6 text-lg font-medium">
                    <Link
                        href="#"
                        className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
                    >
                         <span role="img" aria-label="mountain emoji">🏔️</span>
                        <span className="sr-only">KhipuVault</span>
                    </Link>
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                        >
                            <item.icon className="h-5 w-5" />
                            {item.label}
                        </Link>
                    ))}
                     <Link
                        href="/dashboard/settings"
                        className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                        >
                        <Settings className="h-5 w-5" />
                        Configuración
                    </Link>
                </nav>
            </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2 ml-auto">
            <div className="flex items-center gap-2">
                <Icons.bitcoin className="h-6 w-6" style={{ color: '#F7931A' }} />
                <span className="font-bold">0.005 BTC</span>
            </div>
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                variant="outline"
                size="icon"
                className="overflow-hidden rounded-full"
                >
                <Avatar>
                    <AvatarImage src="https://picsum.photos/seed/user/32/32" alt="@user" />
                    <AvatarFallback>KV</AvatarFallback>
                </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>0x1234...5678</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Link href="/dashboard/settings" passHref>
                    <DropdownMenuItem>
                        <User className="mr-2 h-4 w-4" />
                        Ver Perfil
                    </DropdownMenuItem>
                </Link>
                <Link href="/dashboard/settings" passHref>
                    <DropdownMenuItem>
                        <Settings className="mr-2 h-4 w-4" />
                        Configuración
                    </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                    <LogOut className="mr-2 h-4 w-4" />
                    Desconectar
                </DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
        </div>
    </header>
  );
}
