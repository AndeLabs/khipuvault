"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import { ConnectButton } from '@/components/wallet/connect-button';

const navLinks = [
  { href: '#features', label: 'Características' },
  { href: '#pools', label: 'Pools' },
  { href: '#how-it-works', label: 'Cómo Funciona' },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-primary/20 bg-background/90 backdrop-blur-sm">
      <div className="container mx-auto flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logos/khipu-logo.png"
            alt="KhipuVault Logo"
            width={40}
            height={40}
            className="h-10 w-10"
            priority
          />
          <span className="text-2xl font-bold hidden sm:inline">KhipuVault</span>
        </Link>
        
        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-base font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex">
            <Link href="/dashboard">
              <Button variant="secondary" size="default">
                Ir al Dashboard
              </Button>
            </Link>
          </div>
          <ConnectButton />
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Abrir menú</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-background border-l-primary/20">
              <div className="flex h-full flex-col">
                <div className="border-b border-primary/20 pb-4">
                  <Link href="/" className="flex items-center gap-2">
                    <Image
                      src="/logos/khipu-logo.png"
                      alt="KhipuVault Logo"
                      width={40}
                      height={40}
                      className="h-10 w-10"
                    />
                    <span className="text-2xl font-bold">KhipuVault</span>
                  </Link>
                </div>
                <nav className="mt-8 flex flex-col gap-6">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="text-xl font-medium text-foreground transition-colors hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>
                <div className="mt-auto w-full">
                  <Link href="/dashboard">
                    <Button variant="secondary" size="lg" className="w-full">
                      Ir al Dashboard
                    </Button>
                  </Link>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
