"use client";

import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { Menu } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

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
          <span className="hidden text-2xl font-bold sm:inline">KhipuVault</span>
        </Link>

        {/* Navigation Links - Desktop */}
        <nav className="hidden items-center gap-6 md:flex">
          <a
            href="https://docs.khipuvault.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Documentation
          </a>
          <a
            href="https://github.com/khipuvault"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            GitHub
          </a>
        </nav>

        <div className="flex items-center gap-3">
          {/* Testnet Button + Mainnet Coming Soon */}
          <div className="hidden items-center gap-3 md:flex">
            <a href="https://testnet.khipuvault.com" target="_blank" rel="noopener noreferrer">
              <Button className="gap-2 bg-gradient-to-r from-primary to-accent font-semibold text-white hover:opacity-90">
                Try Testnet
              </Button>
            </a>
            <span className="rounded-full border border-muted-foreground/30 bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
              Mainnet Coming Soon
            </span>
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
                  {/* Try Testnet Button */}
                  <a
                    href="https://testnet.khipuvault.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full"
                  >
                    <Button
                      size="lg"
                      className="w-full bg-gradient-to-r from-primary to-accent font-semibold text-white"
                    >
                      Try Testnet
                    </Button>
                  </a>

                  {/* Mainnet Coming Soon Badge */}
                  <div className="flex justify-center">
                    <span className="rounded-full border border-muted-foreground/30 bg-muted/50 px-4 py-2 text-sm font-medium text-muted-foreground">
                      Mainnet Coming Soon
                    </span>
                  </div>

                  <div className="border-t border-border pt-4">
                    <a
                      href="https://docs.khipuvault.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full"
                    >
                      <Button variant="ghost" size="lg" className="w-full justify-start">
                        Documentation
                      </Button>
                    </a>
                    <a
                      href="https://github.com/khipuvault"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full"
                    >
                      <Button variant="ghost" size="lg" className="w-full justify-start">
                        GitHub
                      </Button>
                    </a>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
