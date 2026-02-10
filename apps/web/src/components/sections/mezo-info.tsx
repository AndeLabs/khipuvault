"use client";

import {
  Bitcoin,
  Building2,
  Coins,
  ExternalLink,
  Lock,
  Shield,
  TrendingUp,
  Zap,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

import { AnimateOnScroll } from "@/components/animate-on-scroll";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Testnet URL for dashboard links
const TESTNET_URL = "https://testnet.khipuvault.com";

const mezoFeatures = [
  {
    icon: Bitcoin,
    title: "Bitcoin-Native",
    description: "Built on Bitcoin with 10+ years of security expertise from Thesis",
  },
  {
    icon: Shield,
    title: "100% Bitcoin Backed",
    description: "Every mUSD is backed by verifiable BTC reserves on-chain",
  },
  {
    icon: Lock,
    title: "1% Fixed Interest",
    description: "Industry-leading rates (5-20% APR elsewhere)",
  },
  {
    icon: TrendingUp,
    title: "Up to 90% LTV",
    description: "Access 90% of your Bitcoin's value without selling",
  },
];

const officialLinks = [
  {
    label: "Mezo Website",
    url: "https://mezo.org",
    description: "Official Mezo Protocol homepage",
    icon: ExternalLink,
  },
  {
    label: "Documentation",
    url: "https://mezo.org/docs/users",
    description: "Complete user guides and documentation",
    icon: ExternalLink,
  },
  {
    label: "Get mUSD",
    url: "https://mezo.org/docs/users/musd",
    description: "Learn how to mint mUSD with Bitcoin",
    icon: ExternalLink,
  },
  {
    label: "Testnet Faucet",
    url: "https://faucet.test.mezo.org",
    description: "Get free testnet BTC and MEZO tokens",
    icon: ExternalLink,
  },
  {
    label: "Mainnet Bridges",
    url: "https://mezo.org/docs/users/mainnet/bridges",
    description: "Bridge assets to/from Mezo Network",
    icon: ExternalLink,
  },
  {
    label: "Explorer (Testnet)",
    url: "https://explorer.test.mezo.org",
    description: "View transactions and contracts on testnet",
    icon: ExternalLink,
  },
];

const howToGetStarted = [
  {
    step: "1",
    title: "Get Bitcoin (BTC)",
    description:
      "Buy Bitcoin on any exchange (Coinbase, Binance, Kraken) or receive it from someone else.",
    links: [
      { label: "Buy on Coinbase", url: "https://www.coinbase.com/how-to-buy/bitcoin" },
      { label: "Buy on Binance", url: "https://www.binance.com/en/how-to-buy/bitcoin" },
    ],
  },
  {
    step: "2",
    title: "Connect to Mezo Network",
    description: "Add Mezo to your wallet (MetaMask, etc.) using these settings:",
    networkInfo: {
      testnet: {
        name: "Mezo Testnet",
        chainId: "31611",
        rpc: "https://rpc.test.mezo.org",
      },
      mainnet: {
        name: "Mezo Mainnet",
        chainId: "31612",
        rpc: "https://rpc.mezo.org",
      },
    },
    links: [{ label: "Add to Wallet (ChainList)", url: "https://chainlist.org/chain/31611" }],
  },
  {
    step: "3",
    title: "Get Test Tokens (Testnet Only)",
    description:
      "Visit the Mezo faucet to get free testnet BTC and MEZO tokens for testing KhipuVault.",
    links: [{ label: "Mezo Testnet Faucet", url: "https://faucet.test.mezo.org" }],
  },
  {
    step: "4",
    title: "Mint mUSD with Your Bitcoin",
    description:
      "Use Mezo's Borrow feature to deposit BTC as collateral and mint mUSD. Only 1% fixed interest rate!",
    details: [
      "Deposit Bitcoin as collateral",
      "Mint mUSD at 110-150% collateralization",
      "Access up to 90% of your BTC value",
      "1% fixed interest (vs 5-20% elsewhere)",
    ],
    links: [
      { label: "How to Mint mUSD", url: "https://mezo.org/docs/users/musd" },
      { label: "Open Mezo App", url: "https://mezo.org" },
    ],
  },
  {
    step: "5",
    title: "Start Using KhipuVault",
    description:
      "Once you have mUSD, use it on KhipuVault to earn yields through Individual Savings, Community Pools, Rotating Pools, or Prize Pool!",
    links: [{ label: "Go to Dashboard", url: `${TESTNET_URL}/dashboard` }],
  },
];

export function MezoInfo() {
  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      {/* Background effects */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/4 top-0 h-96 w-96 animate-pulse rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-96 w-96 animate-pulse rounded-full bg-accent/10 blur-3xl delay-1000" />
      </div>

      <div className="container mx-auto max-w-7xl px-4">
        {/* Header */}
        <AnimateOnScroll className="mb-16 text-center">
          <Badge className="mb-4 border-primary/30 bg-primary/10 text-primary">
            Powered by Mezo Protocol
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
            What is <span className="text-gradient-brand">Mezo Protocol?</span>
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-lg text-muted-foreground">
            The bank-free Bitcoin finance platform. Built by Thesis with 10+ years of Bitcoin
            security expertise. Unlock your Bitcoin's utility without selling.
          </p>
        </AnimateOnScroll>

        {/* What is Mezo */}
        <AnimateOnScroll delay="100ms" className="mb-16">
          <div className="rounded-3xl border border-primary/20 bg-surface-elevated/50 p-8 backdrop-blur-sm md:p-12">
            <div className="mb-8 flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="mb-3 text-2xl font-bold text-white">
                  Bitcoin's First Full-Stack Economy
                </h3>
                <p className="leading-relaxed text-muted-foreground">
                  Mezo is the industry's first full-stack Bitcoin economy, enabling you to unlock
                  the practical utility of Bitcoin without selling it. Launched on mainnet in May
                  2025, Mezo offers traditional financial services (borrowing, lending, saving)
                  through DeFi-native products powered by mUSD.
                </p>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {mezoFeatures.map((feature, idx) => (
                <div key={idx} className="rounded-xl border border-border/50 bg-surface/30 p-6">
                  <feature.icon className="mb-3 h-8 w-8 text-primary" />
                  <h4 className="mb-2 font-semibold text-white">{feature.title}</h4>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </AnimateOnScroll>

        {/* What is mUSD */}
        <AnimateOnScroll delay="150ms" className="mb-16">
          <div className="rounded-3xl border border-accent/20 bg-surface-elevated/50 p-8 backdrop-blur-sm md:p-12">
            <div className="mb-8 flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-accent/10">
                <Coins className="h-8 w-8 text-accent" />
              </div>
              <div>
                <h3 className="mb-3 text-2xl font-bold text-white">
                  What is mUSD? (Mezo's Stablecoin)
                </h3>
                <p className="mb-4 leading-relaxed text-muted-foreground">
                  mUSD is a permissionless stablecoin 100% backed by Bitcoin reserves, maintaining a
                  1:1 peg with the US Dollar. It's the native stablecoin on Mezo Network and the
                  currency used across all KhipuVault products.
                </p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-success" />
                <div>
                  <h5 className="mb-1 font-semibold text-white">100% Bitcoin Backed</h5>
                  <p className="text-sm text-muted-foreground">
                    Every mUSD is backed by verifiable BTC reserves - proof-of-reserves available
                    24/7 on-chain
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-success" />
                <div>
                  <h5 className="mb-1 font-semibold text-white">1% Fixed Interest</h5>
                  <p className="text-sm text-muted-foreground">
                    Industry-leading borrowing rates - just 1% fixed APR compared to 5-20% elsewhere
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-success" />
                <div>
                  <h5 className="mb-1 font-semibold text-white">Up to 90% LTV</h5>
                  <p className="text-sm text-muted-foreground">
                    Access up to 90% of your Bitcoin's value without selling (110-150%
                    collateralization)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </AnimateOnScroll>

        {/* How to Get Started */}
        <AnimateOnScroll delay="200ms" className="mb-16">
          <div className="mb-12 text-center">
            <h3 className="mb-4 text-2xl font-bold text-white md:text-3xl">
              How to Get Started with Mezo & KhipuVault
            </h3>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Follow these steps to get everything you need to start earning on KhipuVault
            </p>
          </div>

          <div className="space-y-6">
            {howToGetStarted.map((item, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-border bg-surface-elevated/50 p-6 backdrop-blur-sm md:p-8"
              >
                <div className="mb-4 flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xl font-bold text-primary">
                    {item.step}
                  </div>
                  <div className="flex-1">
                    <h4 className="mb-2 text-xl font-semibold text-white">{item.title}</h4>
                    <p className="text-muted-foreground">{item.description}</p>
                  </div>
                </div>

                {/* Network Info */}
                {item.networkInfo && (
                  <div className="mb-4 ml-16 grid gap-4 md:grid-cols-2">
                    <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                      <h5 className="mb-2 flex items-center gap-2 font-semibold text-primary">
                        <Zap className="h-4 w-4" />
                        {item.networkInfo.testnet.name}
                      </h5>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>
                          <span className="font-medium text-white">Chain ID:</span>{" "}
                          {item.networkInfo.testnet.chainId}
                        </p>
                        <p className="break-all">
                          <span className="font-medium text-white">RPC:</span>{" "}
                          {item.networkInfo.testnet.rpc}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-lg border border-success/30 bg-success/5 p-4">
                      <h5 className="mb-2 flex items-center gap-2 font-semibold text-success">
                        <Zap className="h-4 w-4" />
                        {item.networkInfo.mainnet.name}
                      </h5>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>
                          <span className="font-medium text-white">Chain ID:</span>{" "}
                          {item.networkInfo.mainnet.chainId}
                        </p>
                        <p className="break-all">
                          <span className="font-medium text-white">RPC:</span>{" "}
                          {item.networkInfo.mainnet.rpc}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Details List */}
                {item.details && (
                  <div className="mb-4 ml-16 space-y-2">
                    {item.details.map((detail, detailIdx) => (
                      <div key={detailIdx} className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                        <span className="text-sm text-muted-foreground">{detail}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Links */}
                {item.links && item.links.length > 0 && (
                  <div className="ml-16 flex flex-wrap gap-3">
                    {item.links.map((link, linkIdx) => (
                      <a
                        key={linkIdx}
                        href={link.url}
                        target={link.url.startsWith("http") ? "_blank" : undefined}
                        rel={link.url.startsWith("http") ? "noopener noreferrer" : undefined}
                        className={cn(
                          buttonVariants({ variant: "outline", size: "sm" }),
                          "group gap-2"
                        )}
                      >
                        {link.label}
                        {link.url.startsWith("http") ? (
                          <ExternalLink className="h-3 w-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                        ) : (
                          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                        )}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </AnimateOnScroll>

        {/* Official Links */}
        <AnimateOnScroll delay="250ms">
          <div className="rounded-3xl border border-border bg-surface-elevated/50 p-8 backdrop-blur-sm md:p-12">
            <h3 className="mb-8 text-center text-2xl font-bold text-white">
              Official Mezo Resources
            </h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {officialLinks.map((link, idx) => (
                <a
                  key={idx}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-4 rounded-xl border border-border/50 bg-surface/30 p-6 transition-all hover:border-primary/50 hover:bg-primary/5"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20">
                    <link.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="mb-1 flex items-center gap-2 font-semibold text-white group-hover:text-primary">
                      {link.label}
                      <ExternalLink className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </h4>
                    <p className="text-sm text-muted-foreground">{link.description}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </AnimateOnScroll>

        {/* CTA */}
        <AnimateOnScroll delay="300ms" className="mt-16 text-center">
          <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-accent/10 p-8">
            <h3 className="mb-4 text-2xl font-bold text-white">
              Ready to Start Earning with Your Bitcoin?
            </h3>
            <p className="mb-6 text-lg text-muted-foreground">
              Get mUSD on Mezo and start using KhipuVault's 4 savings products
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <a
                href="https://mezo.org"
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "gap-2 bg-primary hover:bg-primary/90"
                )}
              >
                Get mUSD on Mezo
                <ExternalLink className="h-4 w-4" />
              </a>
              <a
                href={`${TESTNET_URL}/dashboard`}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(buttonVariants({ size: "lg", variant: "outline" }), "gap-2")}
              >
                Go to KhipuVault Dashboard
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
