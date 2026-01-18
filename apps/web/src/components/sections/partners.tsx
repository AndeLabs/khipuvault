"use client";

import { Shield, Zap, Lock } from "lucide-react";

import { AnimateOnScroll } from "@/components/animate-on-scroll";

export function Partners() {
  return (
    <section className="border-y border-border/50 py-16">
      <div className="container mx-auto max-w-7xl px-4">
        <AnimateOnScroll className="text-center">
          {/* Partner Badge */}
          <div className="flex flex-col items-center gap-6">
            <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Powered by
            </p>

            {/* Mezo Logo/Brand */}
            <a
              href="https://mezo.org"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-4 rounded-2xl border border-border bg-surface-elevated/50 px-8 py-4 transition-all duration-300 hover:border-primary/30"
            >
              {/* Mezo Icon */}
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-600">
                <svg className="h-7 w-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.5L19 8l-7 3.5L5 8l7-3.5zM4 9.5l7 3.5v7l-7-3.5v-7zm16 0v7l-7 3.5v-7l7-3.5z" />
                </svg>
              </div>

              {/* Mezo Text */}
              <div className="text-left">
                <div className="text-2xl font-bold text-white transition-colors group-hover:text-primary">
                  Mezo Protocol
                </div>
                <div className="text-sm text-muted-foreground">
                  Bitcoin-Backed Stablecoin Infrastructure
                </div>
              </div>
            </a>

            {/* Trust Points */}
            <div className="mt-8 flex flex-wrap justify-center gap-8">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/10">
                  <Shield className="h-4 w-4 text-success" />
                </div>
                <span>100% Bitcoin-Backed</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Lock className="h-4 w-4 text-primary" />
                </div>
                <span>Non-Custodial</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
                  <Zap className="h-4 w-4 text-accent" />
                </div>
                <span>Real Yield Generation</span>
              </div>
            </div>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
