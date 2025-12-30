"use client";

import { Shield, Zap, Lock } from "lucide-react";

import { AnimateOnScroll } from "@/components/animate-on-scroll";

export function Partners() {
  return (
    <section className="py-16 border-y border-border/50">
      <div className="container mx-auto max-w-7xl px-4">
        <AnimateOnScroll className="text-center">
          {/* Partner Badge */}
          <div className="flex flex-col items-center gap-6">
            <p className="text-sm text-muted-foreground uppercase tracking-wider font-medium">
              Powered by
            </p>

            {/* Mezo Logo/Brand */}
            <a
              href="https://mezo.org"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-4 px-8 py-4 rounded-2xl bg-surface-elevated/50 border border-border hover:border-primary/30 transition-all duration-300"
            >
              {/* Mezo Icon */}
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                <svg
                  className="w-7 h-7 text-white"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.5L19 8l-7 3.5L5 8l7-3.5zM4 9.5l7 3.5v7l-7-3.5v-7zm16 0v7l-7 3.5v-7l7-3.5z" />
                </svg>
              </div>

              {/* Mezo Text */}
              <div className="text-left">
                <div className="text-2xl font-bold text-white group-hover:text-primary transition-colors">
                  Mezo Protocol
                </div>
                <div className="text-sm text-muted-foreground">
                  Bitcoin-Backed Stablecoin Infrastructure
                </div>
              </div>
            </a>

            {/* Trust Points */}
            <div className="flex flex-wrap justify-center gap-8 mt-8">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-success" />
                </div>
                <span>100% Bitcoin-Backed</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Lock className="w-4 h-4 text-primary" />
                </div>
                <span>Non-Custodial</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-accent" />
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
