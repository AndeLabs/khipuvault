"use client";

import { Rocket, Twitter, Github, Globe } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Coming Soon Page for Mainnet
 *
 * Displayed when NEXT_PUBLIC_NETWORK=mainnet
 * Shows launch announcement and links to testnet
 */
export function ComingSoon() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background via-surface to-background px-4">
      <div className="mx-auto max-w-2xl text-center">
        {/* Logo/Icon */}
        <div className="mb-8 flex justify-center">
          <div className="bg-gradient-lavanda flex h-24 w-24 items-center justify-center rounded-full">
            <Rocket className="h-12 w-12 text-white" />
          </div>
        </div>

        {/* Heading */}
        <h1 className="mb-4 text-5xl font-bold tracking-tight">
          KhipuVault is{" "}
          <span className="bg-gradient-to-r from-lavanda to-success bg-clip-text text-transparent">
            Coming Soon
          </span>
        </h1>

        {/* Description */}
        <p className="mb-8 text-xl text-muted-foreground">
          Decentralized Bitcoin savings on Mezo blockchain. Mainnet launching soon!
        </p>

        {/* Features */}
        <div className="mb-12 grid gap-4 text-left sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-surface-elevated p-4">
            <h3 className="mb-2 font-semibold">Individual Savings</h3>
            <p className="text-sm text-muted-foreground">
              Earn yields on your mUSD deposits with auto-compound
            </p>
          </div>
          <div className="rounded-lg border border-border bg-surface-elevated p-4">
            <h3 className="mb-2 font-semibold">Community Pools</h3>
            <p className="text-sm text-muted-foreground">
              Collaborate with others to maximize returns
            </p>
          </div>
          <div className="rounded-lg border border-border bg-surface-elevated p-4">
            <h3 className="mb-2 font-semibold">Rotating Pool (ROSCA)</h3>
            <p className="text-sm text-muted-foreground">
              Traditional savings circles on blockchain
            </p>
          </div>
          <div className="rounded-lg border border-border bg-surface-elevated p-4">
            <h3 className="mb-2 font-semibold">Prize Pool Lottery</h3>
            <p className="text-sm text-muted-foreground">
              Win prizes while your principal stays safe
            </p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Button size="lg" asChild className="gap-2">
            <a href="https://testnet.khipuvault.com" target="_blank" rel="noopener noreferrer">
              <Globe className="h-5 w-5" />
              Try Testnet Now
            </a>
          </Button>
          <Button size="lg" variant="outline" asChild className="gap-2">
            <a href="https://twitter.com/khipuvault" target="_blank" rel="noopener noreferrer">
              <Twitter className="h-5 w-5" />
              Follow for Updates
            </a>
          </Button>
        </div>

        {/* Social Links */}
        <div className="flex justify-center gap-4">
          <a
            href="https://github.com/khipuvault"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground transition-colors hover:text-foreground"
            aria-label="GitHub"
          >
            <Github className="h-6 w-6" />
          </a>
          <a
            href="https://twitter.com/khipuvault"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Twitter"
          >
            <Twitter className="h-6 w-6" />
          </a>
        </div>

        {/* Network Badge */}
        <div className="mt-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm text-muted-foreground">
            <div className="h-2 w-2 animate-pulse rounded-full bg-warning" />
            <span>Currently in Testnet • Mainnet Coming Soon</span>
          </div>
        </div>
      </div>
    </div>
  );
}
