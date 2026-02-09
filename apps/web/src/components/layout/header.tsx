"use client";

import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { Menu } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ConnectButton } from "@/components/wallet/connect-button";

export function Header() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
          <span className="hidden text-2xl font-bold sm:inline">KhipuVault</span>
        </Link>

        {/* Navigation Links - Desktop */}
        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href="https://testnet.khipuvault.com"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Testnet
          </Link>
          <Link
            href={process.env.NEXT_PUBLIC_DOCS_URL || "https://docs.khipuvault.com"}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Docs
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {/* Connect Wallet Button */}
          {mounted && <ConnectButton />}

          <div className="hidden md:flex">
            <Link href="/dashboard">
              <Button variant="secondary" size="default">
                Dashboard
              </Button>
            </Link>
          </div>

          <Sheet>
            <SheetTrigger className="inline-flex h-10 w-10 items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:hidden">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Open menu</span>
            </SheetTrigger>
            <SheetContent side="right" className="border-l-primary/20 bg-background">
              <VisuallyHidden.Root>
                <SheetTitle>Navigation Menu</SheetTitle>
              </VisuallyHidden.Root>
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
                <div className="mt-8 w-full space-y-4">
                  {/* Connect Wallet Button en mobile */}
                  {mounted && (
                    <div className="w-full">
                      <ConnectButton />
                    </div>
                  )}
                  <Link href="/dashboard">
                    <Button variant="secondary" size="lg" className="w-full">
                      Dashboard
                    </Button>
                  </Link>
                  <Link href="https://testnet.khipuvault.com">
                    <Button variant="outline" size="lg" className="w-full">
                      Probar Testnet
                    </Button>
                  </Link>
                  <Link
                    href={process.env.NEXT_PUBLIC_DOCS_URL || "https://docs.khipuvault.com"}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" size="lg" className="w-full">
                      Documentacion
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
