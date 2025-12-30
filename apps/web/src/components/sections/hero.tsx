"use client";

import { ArrowRight, TrendingUp, Users, Wallet } from "lucide-react";
import Link from "next/link";

import { AnimateOnScroll } from "@/components/animate-on-scroll";
import { buttonVariants } from "@/components/ui/button";
import { useProtocolStats } from "@/hooks/use-protocol-stats";
import { cn } from "@/lib/utils";

export function Hero() {
  const { formattedTVL, isLoading } = useProtocolStats();

  return (
    <>
      <section className="relative w-full overflow-hidden">
        {/* Background gradient effects */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-accent/20 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-primary/5 to-transparent rounded-full" />
        </div>

        <div className="container mx-auto max-w-7xl px-4 py-20 md:py-28 lg:py-36">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Content */}
            <AnimateOnScroll className="text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
                </span>
                <span className="text-sm font-medium text-primary">
                  Live on Mezo Testnet
                </span>
              </div>

              {/* Headline */}
              <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-6xl xl:text-7xl">
                Bitcoin Savings
                <br />
                <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                  That Actually Grow
                </span>
              </h1>

              {/* Subheadline */}
              <p className="mt-6 text-lg text-muted-foreground md:text-xl max-w-xl mx-auto lg:mx-0">
                Earn real yields on your Bitcoin through Mezo&apos;s stability
                pool. No lockups, no complexity, just consistent returns.
              </p>

              {/* CTA Button */}
              <div className="mt-8 flex items-center justify-center lg:justify-start">
                <Link
                  href="/dashboard"
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-semibold px-8 group",
                  )}
                >
                  Start Earning
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>

              {/* Trust badges */}
              <div className="mt-8 flex items-center justify-center lg:justify-start gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4 text-success"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Non-custodial</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4 text-success"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Audited</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4 text-success"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Open Source</span>
                </div>
              </div>
            </AnimateOnScroll>

            {/* Right: 3D Illustration + Stats */}
            <AnimateOnScroll delay="150ms" className="relative">
              {/* 3D Visual Element */}
              <div className="relative mx-auto max-w-md lg:max-w-none">
                {/* Floating cards with stats */}
                <div className="relative aspect-square max-w-[500px] mx-auto">
                  {/* Central 3D coin/vault illustration */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative w-48 h-48 md:w-64 md:h-64">
                      {/* Outer ring animation */}
                      <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-spin-slow" />
                      <div className="absolute inset-4 rounded-full border-2 border-accent/30 animate-spin-reverse" />

                      {/* Center vault icon */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 backdrop-blur-sm border border-primary/30 flex items-center justify-center shadow-2xl shadow-primary/20">
                          <svg
                            className="w-16 h-16 md:w-20 md:h-20 text-primary"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          >
                            <path d="M12 2L2 7l10 5 10-5-10-5z" />
                            <path d="M2 17l10 5 10-5" />
                            <path d="M2 12l10 5 10-5" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Floating stat cards */}
                  {/* TVL Card - Top Left */}
                  <div className="absolute top-4 left-0 md:top-8 md:-left-4 animate-float">
                    <div className="bg-surface-elevated/90 backdrop-blur-md border border-primary/20 rounded-xl p-4 shadow-xl shadow-primary/10">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                          <Wallet className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Total Value Locked
                          </p>
                          <p className="text-xl font-bold text-white">
                            {isLoading ? "..." : formattedTVL}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Yield Card - Top Right */}
                  <div className="absolute top-4 right-0 md:top-8 md:-right-4 animate-float-delayed">
                    <div className="bg-surface-elevated/90 backdrop-blur-md border border-success/20 rounded-xl p-4 shadow-xl shadow-success/10">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-success/20 flex items-center justify-center">
                          <TrendingUp className="h-5 w-5 text-success" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Yield Type
                          </p>
                          <p className="text-xl font-bold text-success">
                            Real Yield
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Users Card - Bottom Center */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 animate-float">
                    <div className="bg-surface-elevated/90 backdrop-blur-md border border-accent/20 rounded-xl p-4 shadow-xl shadow-accent/10">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-accent/20 flex items-center justify-center">
                          <Users className="h-5 w-5 text-accent" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Active Savers
                          </p>
                          <p className="text-xl font-bold text-white">
                            Growing
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>
    </>
  );
}
