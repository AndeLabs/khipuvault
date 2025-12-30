"use client";

import { Wallet, ArrowDownToLine, TrendingUp, ArrowRight } from "lucide-react";
import Link from "next/link";

import { AnimateOnScroll } from "@/components/animate-on-scroll";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const steps = [
  {
    number: "01",
    icon: Wallet,
    title: "Connect Wallet",
    description:
      "Connect your Web3 wallet to get started. We support MetaMask, WalletConnect, and more.",
    color: "primary",
  },
  {
    number: "02",
    icon: ArrowDownToLine,
    title: "Deposit mUSD",
    description:
      "Deposit mUSD (Mezo's Bitcoin-backed stablecoin) into your preferred savings pool.",
    color: "accent",
  },
  {
    number: "03",
    icon: TrendingUp,
    title: "Earn Yields",
    description:
      "Watch your savings grow automatically. Withdraw anytime with no penalties or lockups.",
    color: "success",
  },
];

export function HowItWorks() {
  return (
    <section className="py-20 md:py-28 bg-surface/50">
      <div className="container mx-auto max-w-7xl px-4">
        <AnimateOnScroll className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-4">
            Simple Process
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
            Start Saving in{" "}
            <span className="text-gradient-brand">3 Easy Steps</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            No complicated DeFi knowledge required. Just connect, deposit, and
            earn.
          </p>
        </AnimateOnScroll>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8 md:gap-12 relative">
          {/* Connecting line (desktop only) */}
          <div className="hidden md:block absolute top-24 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-primary via-accent to-success opacity-30" />

          {steps.map((step, index) => (
            <AnimateOnScroll
              key={step.number}
              delay={`${index * 150}ms`}
              className="relative"
            >
              <div className="flex flex-col items-center text-center">
                {/* Step number & icon */}
                <div className="relative mb-6">
                  {/* Background glow */}
                  <div
                    className={cn(
                      "absolute inset-0 rounded-full blur-xl opacity-30",
                      step.color === "primary" && "bg-primary",
                      step.color === "accent" && "bg-accent",
                      step.color === "success" && "bg-success",
                    )}
                  />

                  {/* Icon container */}
                  <div
                    className={cn(
                      "relative w-20 h-20 rounded-full flex items-center justify-center border-2",
                      step.color === "primary" &&
                        "bg-primary/10 border-primary/30",
                      step.color === "accent" &&
                        "bg-accent/10 border-accent/30",
                      step.color === "success" &&
                        "bg-success/10 border-success/30",
                    )}
                  >
                    <step.icon
                      className={cn(
                        "w-8 h-8",
                        step.color === "primary" && "text-primary",
                        step.color === "accent" && "text-accent",
                        step.color === "success" && "text-success",
                      )}
                    />
                  </div>

                  {/* Step number badge */}
                  <div
                    className={cn(
                      "absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                      step.color === "primary" && "bg-primary text-background",
                      step.color === "accent" && "bg-accent text-background",
                      step.color === "success" && "bg-success text-background",
                    )}
                  >
                    {step.number}
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold text-white mb-3">
                  {step.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </AnimateOnScroll>
          ))}
        </div>

        {/* CTA */}
        <AnimateOnScroll delay="300ms" className="text-center mt-16">
          <Link
            href="/dashboard"
            className={cn(
              buttonVariants({ size: "lg" }),
              "bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-semibold px-8 group",
            )}
          >
            Get Started Now
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
