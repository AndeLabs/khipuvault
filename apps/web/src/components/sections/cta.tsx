"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { AnimateOnScroll } from "@/components/animate-on-scroll";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CTA() {
  return (
    <section className="py-20 md:py-28 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-full blur-3xl opacity-50" />
      </div>

      <div className="container mx-auto max-w-4xl px-4">
        <AnimateOnScroll className="text-center">
          {/* Main content */}
          <div className="bg-surface-elevated/80 backdrop-blur-xl border border-primary/20 rounded-3xl p-8 md:p-12 lg:p-16">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl mb-4">
              Ready to Grow Your{" "}
              <span className="text-gradient-brand">Bitcoin Savings?</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Join KhipuVault today and start earning real yields on your
              Bitcoin. No complicated setup, no hidden fees.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/dashboard"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-semibold px-8 group",
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
                  "border-border hover:border-primary/50",
                )}
              >
                View on GitHub
              </a>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-8 mt-12 pt-8 border-t border-border/50">
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-primary">
                  ~8.5%
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Current APY
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-accent">
                  0%
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Withdrawal Fees
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-success">
                  24/7
                </div>
                <div className="text-sm text-muted-foreground mt-1">Access</div>
              </div>
            </div>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
