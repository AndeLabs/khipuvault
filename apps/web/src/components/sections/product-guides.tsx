"use client";

import {
  Wallet,
  Users,
  Trophy,
  Repeat,
  Check,
  AlertCircle,
  Coins,
  TrendingUp,
  Shield,
  Clock,
  Gift,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

import { AnimateOnScroll } from "@/components/animate-on-scroll";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ProductGuide = {
  id: string;
  icon: typeof Wallet;
  title: string;
  subtitle: string;
  description: string;
  color: "primary" | "accent" | "success" | "warning";
  badge: string;
  href: string;

  // What you need
  requirements: {
    icon: typeof Wallet;
    title: string;
    description: string;
  }[];

  // How it works (steps)
  steps: {
    number: string;
    title: string;
    description: string;
    icon: typeof Wallet;
  }[];

  // Key benefits
  benefits: string[];

  // Important notes
  notes: {
    type: "info" | "warning" | "success";
    text: string;
  }[];
};

const productGuides: ProductGuide[] = [
  {
    id: "individual-savings",
    icon: Wallet,
    title: "Individual Savings",
    subtitle: "Your Personal Bitcoin Vault",
    description:
      "Deposit mUSD and earn yields automatically through Mezo's stability pool. Perfect for solo savers who want consistent, passive returns without complexity.",
    color: "primary",
    badge: "Live",
    href: "/dashboard/individual-savings",

    requirements: [
      {
        icon: Wallet,
        title: "Web3 Wallet",
        description: "MetaMask, WalletConnect, or any compatible Ethereum wallet",
      },
      {
        icon: Coins,
        title: "mUSD Tokens",
        description: "Mezo's Bitcoin-backed stablecoin (get it on Mezo Protocol)",
      },
      {
        icon: Shield,
        title: "Gas Fees",
        description: "Small amount of BTC for transaction fees on Mezo Network",
      },
    ],

    steps: [
      {
        number: "01",
        title: "Connect Wallet",
        description: "Connect your Web3 wallet to KhipuVault on Mezo Network",
        icon: Wallet,
      },
      {
        number: "02",
        title: "Deposit mUSD",
        description: "Choose your deposit amount - no minimum required",
        icon: Coins,
      },
      {
        number: "03",
        title: "Earn Yields",
        description: "Your mUSD automatically generates yields via Mezo's stability pool",
        icon: TrendingUp,
      },
      {
        number: "04",
        title: "Withdraw Anytime",
        description: "No lockup periods - withdraw your principal + yields whenever you want",
        icon: ArrowRight,
      },
    ],

    benefits: [
      "Auto-compounding yields - your earnings grow exponentially",
      "No lockup periods - complete flexibility",
      "Referral rewards - earn when friends join",
      "Withdraw anytime - your money, your control",
      "Non-custodial - you always own your funds",
    ],

    notes: [
      {
        type: "success",
        text: "Your mUSD is deployed to Mezo's stability pool, earning yields from liquidation rewards and protocol fees.",
      },
      {
        type: "info",
        text: "Yields are automatically compounded - you don't need to do anything!",
      },
    ],
  },

  {
    id: "community-pools",
    icon: Users,
    title: "Community Pools",
    subtitle: "Save Together, Grow Together",
    description:
      "Save together with friends, family, or community members. Inspired by traditional Latin American savings circles (Pasanaku, Tandas, Roscas), now powered by blockchain.",
    color: "accent",
    badge: "Live",
    href: "/dashboard/cooperative-savings",

    requirements: [
      {
        icon: Wallet,
        title: "Web3 Wallet",
        description: "MetaMask or compatible wallet connected to Mezo Network",
      },
      {
        icon: Coins,
        title: "mUSD Tokens",
        description: "For creating or joining a community pool",
      },
      {
        icon: Users,
        title: "Community (Optional)",
        description: "Invite friends/family, or join an existing pool",
      },
    ],

    steps: [
      {
        number: "01",
        title: "Create or Join Pool",
        description: "Start your own pool or join an existing community pool",
        icon: Users,
      },
      {
        number: "02",
        title: "Set Contributions",
        description: "Flexible contribution amounts - pools decide their own rules",
        icon: Coins,
      },
      {
        number: "03",
        title: "Pool Generates Yields",
        description: "Combined mUSD generates yields through Mezo's stability pool",
        icon: TrendingUp,
      },
      {
        number: "04",
        title: "Proportional Distribution",
        description: "Yields distributed based on your contribution percentage",
        icon: Gift,
      },
    ],

    benefits: [
      "Save with trusted people - family, friends, community",
      "Flexible contributions - no fixed amounts",
      "Proportional yield sharing - fair distribution",
      "Community governance - pools make their own rules",
      "Track contributions - transparent on-chain records",
    ],

    notes: [
      {
        type: "info",
        text: "Perfect for groups who want to save together while maintaining individual ownership of contributions.",
      },
      {
        type: "success",
        text: "Each member's yields are proportional to their contribution - completely fair and transparent.",
      },
    ],
  },

  {
    id: "rotating-pool",
    icon: Repeat,
    title: "Rotating Pool (ROSCA)",
    subtitle: "Turn-Based Savings Circles",
    description:
      "Traditional savings circles meet blockchain. Members contribute periodically and take turns receiving the full pot. Built with Native BTC & WBTC support, flash loan protection, and optimized gas costs.",
    color: "accent",
    badge: "Live",
    href: "/dashboard/rotating-pool",

    requirements: [
      {
        icon: Wallet,
        title: "Web3 Wallet",
        description: "Compatible wallet with Mezo Network configured",
      },
      {
        icon: Coins,
        title: "Native BTC or WBTC",
        description: "For participating in rotating pool rounds",
      },
      {
        icon: Users,
        title: "Trusted Members",
        description: "Form a group with people you trust for the rotation",
      },
    ],

    steps: [
      {
        number: "01",
        title: "Form Your Circle",
        description: "Create a rotating pool or join an existing one with trusted members",
        icon: Users,
      },
      {
        number: "02",
        title: "Set Cycle Rules",
        description: "Define contribution amount, cycle duration, and turn order",
        icon: Clock,
      },
      {
        number: "03",
        title: "Contribute Each Round",
        description: "All members contribute the agreed amount each cycle",
        icon: Coins,
      },
      {
        number: "04",
        title: "Receive Your Turn",
        description: "When it's your turn, receive the full pot (minus small fee)",
        icon: Gift,
      },
    ],

    benefits: [
      "Native BTC & WBTC support - use real Bitcoin",
      "Flash loan protected - secure against exploits",
      "Transparent turn system - on-chain fairness",
      "Gas optimized - ~1M gas saved compared to alternatives",
      "Traditional model - familiar to ROSCA participants",
    ],

    notes: [
      {
        type: "warning",
        text: "Only join rotating pools with people you trust. Once you receive your turn, you're still obligated to contribute in future rounds.",
      },
      {
        type: "success",
        text: "Perfect for communities who already practice Pasanaku, Tandas, or Roscas - now with blockchain transparency!",
      },
      {
        type: "info",
        text: "Flash loan protection ensures malicious actors can't manipulate the rotation order.",
      },
    ],
  },

  {
    id: "prize-pool",
    icon: Trophy,
    title: "Prize Pool (Lottery)",
    subtitle: "No-Loss Lottery - Never Lose Your Capital",
    description:
      "The only lottery where you can't lose! Your capital is always safe and generates yields. Only the yields are distributed as prizes. 99% gas optimized with secure commit-reveal randomness.",
    color: "success",
    badge: "Live",
    href: "/dashboard/prize-pool",

    requirements: [
      {
        icon: Wallet,
        title: "Web3 Wallet",
        description: "Connected to Mezo Network",
      },
      {
        icon: Coins,
        title: "mUSD for Tickets",
        description: "Each ticket costs 10 mUSD (returned after round ends)",
      },
      {
        icon: Users,
        title: "Minimum 2 Players",
        description: "Rounds require at least 2 participants for fairness",
      },
    ],

    steps: [
      {
        number: "01",
        title: "Buy Tickets",
        description: "Purchase lottery tickets with mUSD (10 mUSD per ticket)",
        icon: Coins,
      },
      {
        number: "02",
        title: "Yields Generate",
        description: "All tickets generate yields through Mezo's stability pool during the round",
        icon: TrendingUp,
      },
      {
        number: "03",
        title: "Winner Selected",
        description: "Secure commit-reveal randomness picks a fair winner (minimum 2 players)",
        icon: Trophy,
      },
      {
        number: "04",
        title: "Claim Your Prize",
        description: "Winner gets yields as prize. Non-winners get 100% of their mUSD back!",
        icon: Gift,
      },
    ],

    benefits: [
      "99% gas optimized - efficient ticket purchasing",
      "Secure randomness - commit-reveal prevents manipulation",
      "Fair minimum - at least 2 players required",
      "Never lose capital - only yields are distributed",
      "Weekly rounds - regular chances to win",
    ],

    notes: [
      {
        type: "success",
        text: "This is a NO-LOSS lottery! Even if you don't win, you get 100% of your mUSD back.",
      },
      {
        type: "info",
        text: "Winners receive the pooled yields as their prize. Your 10 mUSD ticket deposit is always returned.",
      },
      {
        type: "warning",
        text: "Rounds require minimum 2 participants to ensure fairness. If minimum not met, round is cancelled and all deposits returned.",
      },
    ],
  },
];

export function ProductGuides() {
  return (
    <section className="py-20 md:py-32">
      <div className="container mx-auto max-w-7xl px-4">
        {/* Header */}
        <AnimateOnScroll className="mb-20 text-center">
          <span className="mb-4 inline-block rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            Product Guides
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
            How to Use <span className="text-gradient-brand">Each Product</span>
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-lg text-muted-foreground">
            Detailed guides for each savings product. Learn what you need, how it works, and start
            earning.
          </p>
        </AnimateOnScroll>

        {/* Product Guides */}
        <div className="space-y-32">
          {productGuides.map((guide, guideIndex) => (
            <AnimateOnScroll key={guide.id} delay={`${guideIndex * 100}ms`}>
              <div className="rounded-3xl border border-border bg-surface-elevated/30 p-8 backdrop-blur-sm md:p-12">
                {/* Guide Header */}
                <div className="mb-12 flex flex-col items-center text-center md:flex-row md:items-start md:text-left">
                  <div
                    className={cn(
                      "mb-6 flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl md:mb-0 md:mr-8",
                      guide.color === "primary" && "bg-primary/10",
                      guide.color === "accent" && "bg-accent/10",
                      guide.color === "success" && "bg-success/10",
                      guide.color === "warning" && "bg-warning/10"
                    )}
                  >
                    <guide.icon
                      className={cn(
                        "h-10 w-10",
                        guide.color === "primary" && "text-primary",
                        guide.color === "accent" && "text-accent",
                        guide.color === "success" && "text-success",
                        guide.color === "warning" && "text-warning"
                      )}
                    />
                  </div>

                  <div className="flex-1">
                    <div className="mb-3 flex items-center justify-center gap-3 md:justify-start">
                      <h3 className="text-2xl font-bold text-white md:text-3xl">{guide.title}</h3>
                      <Badge
                        className={cn(
                          "border-success/30 bg-success/20 text-success",
                          guide.badge === "Beta" && "border-accent/30 bg-accent/20 text-accent"
                        )}
                      >
                        {guide.badge}
                      </Badge>
                    </div>
                    <p className="mb-4 text-lg font-medium text-muted-foreground">
                      {guide.subtitle}
                    </p>
                    <p className="leading-relaxed text-muted-foreground">{guide.description}</p>
                  </div>
                </div>

                {/* What You Need */}
                <div className="mb-12">
                  <h4 className="mb-6 text-xl font-semibold text-white">
                    📋 What You Need to Get Started
                  </h4>
                  <div className="grid gap-4 md:grid-cols-3">
                    {guide.requirements.map((req, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-border/50 bg-surface/50 p-6"
                      >
                        <div className="mb-3 flex items-center gap-3">
                          <div
                            className={cn(
                              "flex h-10 w-10 items-center justify-center rounded-lg",
                              guide.color === "primary" && "bg-primary/10",
                              guide.color === "accent" && "bg-accent/10",
                              guide.color === "success" && "bg-success/10",
                              guide.color === "warning" && "bg-warning/10"
                            )}
                          >
                            <req.icon
                              className={cn(
                                "h-5 w-5",
                                guide.color === "primary" && "text-primary",
                                guide.color === "accent" && "text-accent",
                                guide.color === "success" && "text-success",
                                guide.color === "warning" && "text-warning"
                              )}
                            />
                          </div>
                          <h5 className="font-semibold text-white">{req.title}</h5>
                        </div>
                        <p className="text-sm text-muted-foreground">{req.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* How It Works */}
                <div className="mb-12">
                  <h4 className="mb-8 text-xl font-semibold text-white">
                    🔄 How It Works - Step by Step
                  </h4>
                  <div className="relative grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {/* Connecting line (desktop only) */}
                    <div className="left-1/6 right-1/6 absolute top-10 hidden h-0.5 bg-gradient-to-r from-primary/30 via-accent/30 to-success/30 lg:block" />

                    {guide.steps.map((step, idx) => (
                      <div key={idx} className="relative">
                        <div className="flex flex-col items-center text-center">
                          {/* Step number & icon */}
                          <div className="relative mb-4">
                            <div
                              className={cn(
                                "flex h-16 w-16 items-center justify-center rounded-full border-2",
                                guide.color === "primary" && "border-primary/30 bg-primary/10",
                                guide.color === "accent" && "border-accent/30 bg-accent/10",
                                guide.color === "success" && "border-success/30 bg-success/10",
                                guide.color === "warning" && "border-warning/30 bg-warning/10"
                              )}
                            >
                              <step.icon
                                className={cn(
                                  "h-7 w-7",
                                  guide.color === "primary" && "text-primary",
                                  guide.color === "accent" && "text-accent",
                                  guide.color === "success" && "text-success",
                                  guide.color === "warning" && "text-warning"
                                )}
                              />
                            </div>
                            <div
                              className={cn(
                                "absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                                guide.color === "primary" && "bg-primary text-background",
                                guide.color === "accent" && "bg-accent text-background",
                                guide.color === "success" && "bg-success text-background",
                                guide.color === "warning" && "bg-warning text-background"
                              )}
                            >
                              {step.number}
                            </div>
                          </div>
                          <h5 className="mb-2 font-semibold text-white">{step.title}</h5>
                          <p className="text-sm leading-relaxed text-muted-foreground">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Key Benefits */}
                <div className="mb-12">
                  <h4 className="mb-6 text-xl font-semibold text-white">✨ Key Benefits</h4>
                  <div className="grid gap-3 md:grid-cols-2">
                    {guide.benefits.map((benefit, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <Check className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                        <span className="text-sm text-muted-foreground">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Important Notes */}
                {guide.notes.length > 0 && (
                  <div className="mb-8">
                    <h4 className="mb-4 text-xl font-semibold text-white">💡 Important Notes</h4>
                    <div className="space-y-3">
                      {guide.notes.map((note, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            "flex gap-3 rounded-lg border p-4",
                            note.type === "info" && "border-primary/30 bg-primary/5",
                            note.type === "warning" && "border-warning/30 bg-warning/5",
                            note.type === "success" && "border-success/30 bg-success/5"
                          )}
                        >
                          <AlertCircle
                            className={cn(
                              "mt-0.5 h-5 w-5 shrink-0",
                              note.type === "info" && "text-primary",
                              note.type === "warning" && "text-warning",
                              note.type === "success" && "text-success"
                            )}
                          />
                          <p className="text-sm text-muted-foreground">{note.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* CTA Button */}
                <div className="text-center">
                  <Link
                    href={guide.href}
                    className={cn(
                      buttonVariants({ size: "lg" }),
                      "group",
                      guide.color === "primary" && "bg-gradient-to-r from-primary to-primary/80",
                      guide.color === "accent" && "bg-gradient-to-r from-accent to-accent/80",
                      guide.color === "success" && "bg-gradient-to-r from-success to-success/80",
                      guide.color === "warning" && "bg-gradient-to-r from-warning to-warning/80"
                    )}
                  >
                    Start Using {guide.title}
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
