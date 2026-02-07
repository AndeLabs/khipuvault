"use client";

import { Wallet, Users, Trophy, ArrowRight } from "lucide-react";
import Link from "next/link";

import { AnimateOnScroll } from "@/components/animate-on-scroll";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const products = [
  {
    icon: Wallet,
    title: "Individual Savings",
    description:
      "Deposit mUSD and earn yields automatically through Mezo's stability pool. Perfect for solo savers who want consistent, passive returns.",
    features: [
      "Auto-compounding yields",
      "No lockup periods",
      "Referral rewards",
      "Withdraw anytime",
    ],
    href: "/dashboard/individual-savings",
    color: "primary",
    badge: "Live",
    highlight: "Yield",
  },
  {
    icon: Users,
    title: "Community Pools",
    description:
      "Save together with friends and family. Inspired by Pasanaku, Tandas, and Roscas - traditional Latin American savings circles.",
    features: [
      "Create or join pools",
      "Flexible contributions",
      "Proportional yield sharing",
      "Community governance",
    ],
    href: "/dashboard/cooperative-savings",
    color: "accent",
    badge: "Live",
    highlight: "Yield",
  },
  {
    icon: Trophy,
    title: "Prize Pool",
    description:
      "No-loss lottery where your capital is always safe. Only the yields are distributed as prizes to lucky winners.",
    features: [
      "Never lose your capital",
      "Weekly prize draws",
      "Fair probability system",
      "Withdraw anytime",
    ],
    href: "/dashboard/prize-pool",
    color: "success",
    badge: "Beta",
    highlight: "Prizes",
  },
];

export function Products() {
  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto max-w-7xl px-4">
        <AnimateOnScroll className="mb-16 text-center">
          <span className="mb-4 inline-block rounded-full border border-accent/20 bg-accent/10 px-4 py-1.5 text-sm font-medium text-accent">
            Products
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
            Choose Your <span className="text-gradient-brand">Savings Strategy</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Whether you prefer solo saving or community pools, we have the right product for you.
          </p>
        </AnimateOnScroll>

        {/* Product Cards */}
        <div className="grid gap-6 md:grid-cols-3 lg:gap-8">
          {products.map((product, index) => (
            <AnimateOnScroll key={product.title} delay={`${index * 100}ms`}>
              <div
                className={cn(
                  "group relative h-full rounded-2xl border bg-surface-elevated/50 p-6 backdrop-blur-sm transition-all duration-300 lg:p-8",
                  "hover:-translate-y-1 hover:border-opacity-50 hover:shadow-xl",
                  product.color === "primary" &&
                    "border-primary/20 hover:border-primary/50 hover:shadow-primary/10",
                  product.color === "accent" &&
                    "border-accent/20 hover:border-accent/50 hover:shadow-accent/10",
                  product.color === "success" &&
                    "border-success/20 hover:border-success/50 hover:shadow-success/10"
                )}
              >
                {/* Badge */}
                {product.badge && (
                  <Badge
                    className={cn(
                      "absolute -top-3 left-6",
                      product.badge === "Live" && "border-success/30 bg-success/20 text-success",
                      product.badge === "Beta" && "border-accent/30 bg-accent/20 text-accent"
                    )}
                  >
                    {product.badge === "Live" && (
                      <span className="relative mr-1.5 flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
                      </span>
                    )}
                    {product.badge}
                  </Badge>
                )}

                {/* Header */}
                <div className="mb-6 flex items-start justify-between">
                  <div
                    className={cn(
                      "flex h-14 w-14 items-center justify-center rounded-xl",
                      product.color === "primary" && "bg-primary/10",
                      product.color === "accent" && "bg-accent/10",
                      product.color === "success" && "bg-success/10"
                    )}
                  >
                    <product.icon
                      className={cn(
                        "h-7 w-7",
                        product.color === "primary" && "text-primary",
                        product.color === "accent" && "text-accent",
                        product.color === "success" && "text-success"
                      )}
                    />
                  </div>

                  {/* Highlight Badge */}
                  <div
                    className={cn(
                      "rounded-full px-3 py-1 text-sm font-semibold",
                      product.color === "primary" && "bg-primary/10 text-primary",
                      product.color === "accent" && "bg-accent/10 text-accent",
                      product.color === "success" && "bg-success/10 text-success"
                    )}
                  >
                    {product.highlight}
                  </div>
                </div>

                {/* Content */}
                <h3 className="mb-3 text-xl font-semibold text-white">{product.title}</h3>
                <p className="mb-6 leading-relaxed text-muted-foreground">{product.description}</p>

                {/* Features */}
                <ul className="mb-8 space-y-3">
                  {product.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-sm">
                      <svg
                        className={cn(
                          "h-4 w-4 flex-shrink-0",
                          product.color === "primary" && "text-primary",
                          product.color === "accent" && "text-accent",
                          product.color === "success" && "text-success"
                        )}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link
                  href={product.href}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "group/btn w-full justify-center",
                    product.color === "primary" &&
                      "border-primary/30 hover:border-primary/50 hover:bg-primary/10",
                    product.color === "accent" &&
                      "border-accent/30 hover:border-accent/50 hover:bg-accent/10",
                    product.color === "success" &&
                      "border-success/30 hover:border-success/50 hover:bg-success/10"
                  )}
                >
                  {product.badge === "Beta" ? "Try Beta" : "Start Now"}
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                </Link>
              </div>
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
