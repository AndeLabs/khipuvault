"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { AnimateOnScroll } from "@/components/animate-on-scroll";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CTA() {
  return (
    <section className="relative overflow-hidden py-20 md:py-28">
      {/* Background effects */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 h-[400px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 opacity-50 blur-3xl" />
      </div>

      <div className="container mx-auto max-w-4xl px-4">
        <AnimateOnScroll className="text-center">
          {/* Main content */}
          <div className="rounded-3xl border border-primary/20 bg-surface-elevated/80 p-8 backdrop-blur-xl md:p-12 lg:p-16">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
              Ready to Grow Your <span className="text-gradient-brand">Bitcoin Savings?</span>
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
              Join KhipuVault today and start earning real yields on your Bitcoin. No complicated
              setup, no hidden fees.
            </p>

            {/* CTAs */}
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/dashboard"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "group bg-gradient-to-r from-primary to-accent px-8 font-semibold text-white hover:opacity-90"
                )}
              >
                Launch App
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <a
                href="https://github.com/khipuvault"
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "border-border hover:border-primary/50"
                )}
              >
                View on GitHub
              </a>
            </div>

            {/* Stats row */}
            <div className="mt-12 grid grid-cols-3 gap-8 border-t border-border/50 pt-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary md:text-3xl">~8.5%</div>
                <div className="mt-1 text-sm text-muted-foreground">Current APY</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent md:text-3xl">0%</div>
                <div className="mt-1 text-sm text-muted-foreground">Withdrawal Fees</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-success md:text-3xl">24/7</div>
                <div className="mt-1 text-sm text-muted-foreground">Access</div>
              </div>
            </div>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
