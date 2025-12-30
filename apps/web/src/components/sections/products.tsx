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
        <AnimateOnScroll className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-medium mb-4">
            Products
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
            Choose Your{" "}
            <span className="text-gradient-brand">Savings Strategy</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Whether you prefer solo saving or community pools, we have the right
            product for you.
          </p>
        </AnimateOnScroll>

        {/* Product Cards */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {products.map((product, index) => (
            <AnimateOnScroll key={product.title} delay={`${index * 100}ms`}>
              <div
                className={cn(
                  "relative group h-full rounded-2xl border bg-surface-elevated/50 backdrop-blur-sm p-6 lg:p-8 transition-all duration-300",
                  "hover:border-opacity-50 hover:shadow-xl hover:-translate-y-1",
                  product.color === "primary" &&
                    "border-primary/20 hover:border-primary/50 hover:shadow-primary/10",
                  product.color === "accent" &&
                    "border-accent/20 hover:border-accent/50 hover:shadow-accent/10",
                  product.color === "success" &&
                    "border-success/20 hover:border-success/50 hover:shadow-success/10",
                )}
              >
                {/* Badge */}
                {product.badge && (
                  <Badge
                    className={cn(
                      "absolute -top-3 left-6",
                      product.badge === "Live" &&
                        "bg-success/20 text-success border-success/30",
                      product.badge === "Beta" &&
                        "bg-accent/20 text-accent border-accent/30",
                    )}
                  >
                    {product.badge === "Live" && (
                      <span className="relative flex h-2 w-2 mr-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
                      </span>
                    )}
                    {product.badge}
                  </Badge>
                )}

                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div
                    className={cn(
                      "w-14 h-14 rounded-xl flex items-center justify-center",
                      product.color === "primary" && "bg-primary/10",
                      product.color === "accent" && "bg-accent/10",
                      product.color === "success" && "bg-success/10",
                    )}
                  >
                    <product.icon
                      className={cn(
                        "w-7 h-7",
                        product.color === "primary" && "text-primary",
                        product.color === "accent" && "text-accent",
                        product.color === "success" && "text-success",
                      )}
                    />
                  </div>

                  {/* Highlight Badge */}
                  <div
                    className={cn(
                      "px-3 py-1 rounded-full text-sm font-semibold",
                      product.color === "primary" &&
                        "bg-primary/10 text-primary",
                      product.color === "accent" && "bg-accent/10 text-accent",
                      product.color === "success" &&
                        "bg-success/10 text-success",
                    )}
                  >
                    {product.highlight}
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold text-white mb-3">
                  {product.title}
                </h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  {product.description}
                </p>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {product.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-3 text-sm"
                    >
                      <svg
                        className={cn(
                          "w-4 h-4 flex-shrink-0",
                          product.color === "primary" && "text-primary",
                          product.color === "accent" && "text-accent",
                          product.color === "success" && "text-success",
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
                    "w-full justify-center group/btn",
                    product.color === "primary" &&
                      "border-primary/30 hover:bg-primary/10 hover:border-primary/50",
                    product.color === "accent" &&
                      "border-accent/30 hover:bg-accent/10 hover:border-accent/50",
                    product.color === "success" &&
                      "border-success/30 hover:bg-success/10 hover:border-success/50",
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
