"use client";

import { Wallet, ArrowDownToLine, TrendingUp, ArrowRight } from "lucide-react";

import { AnimateOnScroll } from "@/components/animate-on-scroll";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TESTNET_URL = "https://testnet.khipuvault.com";

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
    <section className="bg-surface/50 py-20 md:py-28">
      <div className="container mx-auto max-w-7xl px-4">
        <AnimateOnScroll className="mb-16 text-center">
          <span className="mb-4 inline-block rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            Simple Process
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
            Start Saving in <span className="text-gradient-brand">3 Easy Steps</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            No complicated DeFi knowledge required. Just connect, deposit, and earn.
          </p>
        </AnimateOnScroll>

        {/* Steps */}
        <div className="relative grid gap-8 md:grid-cols-3 md:gap-12">
          {/* Connecting line (desktop only) */}
          <div className="left-1/6 right-1/6 absolute top-24 hidden h-0.5 bg-gradient-to-r from-primary via-accent to-success opacity-30 md:block" />

          {steps.map((step, index) => (
            <AnimateOnScroll key={step.number} delay={`${index * 150}ms`} className="relative">
              <div className="flex flex-col items-center text-center">
                {/* Step number & icon */}
                <div className="relative mb-6">
                  {/* Background glow */}
                  <div
                    className={cn(
                      "absolute inset-0 rounded-full opacity-30 blur-xl",
                      step.color === "primary" && "bg-primary",
                      step.color === "accent" && "bg-accent",
                      step.color === "success" && "bg-success"
                    )}
                  />

                  {/* Icon container */}
                  <div
                    className={cn(
                      "relative flex h-20 w-20 items-center justify-center rounded-full border-2",
                      step.color === "primary" && "border-primary/30 bg-primary/10",
                      step.color === "accent" && "border-accent/30 bg-accent/10",
                      step.color === "success" && "border-success/30 bg-success/10"
                    )}
                  >
                    <step.icon
                      className={cn(
                        "h-8 w-8",
                        step.color === "primary" && "text-primary",
                        step.color === "accent" && "text-accent",
                        step.color === "success" && "text-success"
                      )}
                    />
                  </div>

                  {/* Step number badge */}
                  <div
                    className={cn(
                      "absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold",
                      step.color === "primary" && "bg-primary text-background",
                      step.color === "accent" && "bg-accent text-background",
                      step.color === "success" && "bg-success text-background"
                    )}
                  >
                    {step.number}
                  </div>
                </div>

                {/* Content */}
                <h3 className="mb-3 text-xl font-semibold text-white">{step.title}</h3>
                <p className="leading-relaxed text-muted-foreground">{step.description}</p>
              </div>
            </AnimateOnScroll>
          ))}
        </div>

        {/* CTA */}
        <AnimateOnScroll delay="300ms" className="mt-16 text-center">
          <a
            href={`${TESTNET_URL}/dashboard`}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ size: "lg" }),
              "group bg-gradient-to-r from-primary to-accent px-8 font-semibold text-white hover:opacity-90"
            )}
          >
            Get Started Now
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
