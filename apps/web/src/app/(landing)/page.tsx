"use client";

import {
  ArrowRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Github,
  Globe,
  Repeat,
  Shield,
  Sparkles,
  Trophy,
  Twitter,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { shouldShowLanding, getCurrentNetwork } from "@/config/launch";

/**
 * Home Page - Smart Router
 *
 * Routes based on launch configuration:
 * - Pre-launch mode: Shows landing page
 * - Live mode: Redirects to /dashboard (full app)
 *
 * Configuration in Vercel:
 * - NEXT_PUBLIC_LAUNCH_MODE: "pre-launch" | "live"
 * - NEXT_PUBLIC_NETWORK: "testnet" | "mainnet"
 */
export default function HomePage() {
  const router = useRouter();
  const [isPreLaunch, setIsPreLaunch] = useState(true);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Check launch mode on client
    const prelaunch = shouldShowLanding();
    setIsPreLaunch(prelaunch);
    setChecking(false);

    // If live mode, redirect to dashboard
    if (!prelaunch) {
      router.replace("/dashboard");
    }
  }, [router]);

  // Show loading while checking
  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If live mode, show loading (will redirect)
  if (!isPreLaunch) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
          <p className="text-muted-foreground">Launching app...</p>
        </div>
      </div>
    );
  }

  // Pre-launch mode: Show landing page
  return <LandingPage />;
}

/**
 * Pre-Launch Landing Page
 */
function LandingPage() {
  const network = getCurrentNetwork();
  const isMainnet = network === "mainnet";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <HeroSection isMainnet={isMainnet} />
      <ProgressSection />
      <ProductsSection />
      <WhySection />
      <RoadmapSection />
      <CTASection isMainnet={isMainnet} />
      <Footer />
    </div>
  );
}

function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? "border-b border-border/50 bg-background/80 backdrop-blur-lg" : ""
      }`}
    >
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logos/khipu-logo.png"
            alt="KhipuVault"
            width={40}
            height={40}
            className="h-10 w-10"
          />
          <span className="text-xl font-bold">KhipuVault</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href="https://docs.khipuvault.com"
            target="_blank"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Docs
          </Link>
          <Link
            href="https://github.com/khipuvault"
            target="_blank"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            GitHub
          </Link>
          <Link
            href="https://testnet.khipuvault.com"
            className="group flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-5 py-2.5 text-sm font-medium text-white transition-all hover:opacity-90"
          >
            Try Testnet
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </nav>

        <Link
          href="https://testnet.khipuvault.com"
          className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-white md:hidden"
        >
          Try Testnet
        </Link>
      </div>
    </header>
  );
}

function HeroSection({ isMainnet }: { isMainnet: boolean }) {
  return (
    <section className="relative overflow-hidden pb-20 pt-32 md:pb-32 md:pt-40">
      {/* Animated background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/4 top-20 h-[500px] w-[500px] animate-pulse rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute bottom-20 right-1/4 h-[400px] w-[400px] animate-pulse rounded-full bg-accent/20 blur-[120px] delay-1000" />
        <div className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-success/10 blur-[100px]" />
      </div>

      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center">
          {/* Status Badge */}
          <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-success/30 bg-success/10 px-5 py-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success" />
            </span>
            <span className="text-sm font-medium text-success">Testnet Live</span>
            <span className="text-sm text-muted-foreground">•</span>
            <span className="text-sm text-muted-foreground">Mainnet Coming Soon</span>
          </div>

          {/* Main Headline */}
          <h1 className="mb-6 text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Your Bitcoin,
            <br />
            <span className="animate-gradient bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] bg-clip-text text-transparent">
              Earning Real Yields
            </span>
          </h1>

          {/* Subheadline */}
          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground md:text-xl">
            Decentralized savings on Mezo blockchain. Individual pools, community circles, rotating
            ROSCAs, and prize pools—all non-custodial, audited, and gas-optimized.
          </p>

          {/* CTA Buttons */}
          <div className="mb-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="https://testnet.khipuvault.com"
              className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-8 py-4 text-lg font-semibold text-white shadow-xl shadow-primary/25 transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/30"
            >
              <Globe className="h-5 w-5" />
              Try Testnet Now
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="https://docs.khipuvault.com"
              target="_blank"
              className="flex items-center gap-2 rounded-xl border border-border px-8 py-4 text-lg font-semibold transition-all hover:border-primary/50 hover:bg-primary/5"
            >
              <FileText className="h-5 w-5" />
              Read Docs
            </Link>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span>Non-Custodial</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span>Smart Contracts Audited</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span>Open Source</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span>Built on Mezo</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProgressSection() {
  const steps = [
    { label: "Smart Contracts", status: "complete", icon: Shield },
    { label: "Testnet Launch", status: "complete", icon: Zap },
    { label: "Security Audit", status: "complete", icon: CheckCircle2 },
    { label: "Mainnet Launch", status: "upcoming", icon: Sparkles },
  ];

  return (
    <section className="border-y border-border/50 bg-surface/50 py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8">
          {steps.map((step, index) => (
            <div key={step.label} className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    step.status === "complete"
                      ? "bg-success/20 text-success"
                      : "bg-warning/20 text-warning"
                  }`}
                >
                  <step.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium">{step.label}</p>
                  <p
                    className={`text-xs ${step.status === "complete" ? "text-success" : "text-warning"}`}
                  >
                    {step.status === "complete" ? "Complete ✓" : "Coming Soon"}
                  </p>
                </div>
              </div>
              {index < steps.length - 1 && <div className="hidden h-px w-12 bg-border md:block" />}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductsSection() {
  const products = [
    {
      icon: Wallet,
      title: "Individual Savings",
      description:
        "Deposit mUSD and earn passive yields through Mezo's stability pool. Auto-compounding, no lockups, withdraw anytime.",
      color: "primary",
      features: ["Auto-compound yields", "No minimum deposit", "Withdraw anytime"],
    },
    {
      icon: Users,
      title: "Community Pools",
      description:
        "Save together in trusted circles. Inspired by Latin America's Pasanaku and Tandas traditions, now on Bitcoin.",
      color: "accent",
      features: ["Create or join pools", "Shared yields", "Democratic governance"],
    },
    {
      icon: Repeat,
      title: "Rotating Pool (ROSCA)",
      description:
        "Turn-based savings circles. Members contribute periodically and take turns receiving the pot. Flash-loan protected.",
      color: "accent",
      features: ["Native BTC support", "Flash loan protection", "Gas optimized"],
    },
    {
      icon: Trophy,
      title: "Prize Pool",
      description:
        "No-loss lottery where yields become prizes. Your capital is always safe—win big or keep earning.",
      color: "success",
      features: ["Zero capital risk", "Provably fair", "Weekly draws"],
    },
  ];

  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <span className="mb-4 inline-block rounded-full border border-accent/20 bg-accent/10 px-4 py-1.5 text-sm font-medium text-accent">
            Products
          </span>
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl md:text-5xl">
            Four Ways to{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Grow Your Bitcoin
            </span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            All products are live on testnet. Try them risk-free before mainnet launch.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <div
              key={product.title}
              className={`group relative rounded-2xl border bg-surface-elevated/50 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                product.color === "primary"
                  ? "border-primary/20 hover:border-primary/40 hover:shadow-primary/10"
                  : product.color === "accent"
                    ? "border-accent/20 hover:border-accent/40 hover:shadow-accent/10"
                    : "border-success/20 hover:border-success/40 hover:shadow-success/10"
              }`}
            >
              <div
                className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${
                  product.color === "primary"
                    ? "bg-primary/10 text-primary"
                    : product.color === "accent"
                      ? "bg-accent/10 text-accent"
                      : "bg-success/10 text-success"
                }`}
              >
                <product.icon className="h-6 w-6" />
              </div>

              <h3 className="mb-2 text-lg font-semibold">{product.title}</h3>
              <p className="mb-4 text-sm text-muted-foreground">{product.description}</p>

              <ul className="space-y-2">
                {product.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <CheckCircle2
                      className={`h-4 w-4 ${
                        product.color === "primary"
                          ? "text-primary"
                          : product.color === "accent"
                            ? "text-accent"
                            : "text-success"
                      }`}
                    />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="https://testnet.khipuvault.com"
            className="group inline-flex items-center gap-2 text-primary transition-colors hover:text-primary/80"
          >
            Try all products on testnet
            <ExternalLink className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function WhySection() {
  const reasons = [
    {
      icon: Shield,
      title: "Security First",
      description:
        "Smart contracts follow CEI pattern, use OpenZeppelin libraries, and are fully audited. Your funds are protected by battle-tested code.",
    },
    {
      icon: Zap,
      title: "Gas Optimized",
      description:
        "Every transaction is optimized for minimum gas costs. Save more of your yields instead of paying fees.",
    },
    {
      icon: Users,
      title: "Community Driven",
      description:
        "Built for Latin America's savings culture. Pasanaku, Tandas, and ROSCAs digitized for the Bitcoin age.",
    },
  ];

  return (
    <section className="bg-surface/30 py-24">
      <div className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <span className="mb-4 inline-block rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            Why KhipuVault
          </span>
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">Built Different</h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            We&apos;re not just another DeFi protocol. We&apos;re bringing proven community savings
            traditions to Bitcoin.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {reasons.map((reason) => (
            <div
              key={reason.title}
              className="rounded-2xl border border-border/50 bg-surface-elevated/50 p-8 text-center"
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <reason.icon className="h-7 w-7 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">{reason.title}</h3>
              <p className="text-muted-foreground">{reason.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function RoadmapSection() {
  const phases = [
    {
      phase: "Phase 1",
      title: "Testnet",
      status: "live",
      items: [
        "Smart contracts deployed",
        "All 4 products live",
        "Community testing",
        "Bug bounty program",
      ],
    },
    {
      phase: "Phase 2",
      title: "Security",
      status: "complete",
      items: ["Full security audit", "Code review", "Gas optimization", "Performance testing"],
    },
    {
      phase: "Phase 3",
      title: "Mainnet",
      status: "upcoming",
      items: ["Mainnet deployment", "Real yields live", "Community launch", "Governance token"],
    },
  ];

  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <span className="mb-4 inline-block rounded-full border border-warning/20 bg-warning/10 px-4 py-1.5 text-sm font-medium text-warning">
            <Clock className="mr-1 inline h-4 w-4" />
            Roadmap
          </span>
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">Path to Mainnet</h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            We&apos;re building in public. Follow our progress from testnet to mainnet.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {phases.map((phase) => (
            <div
              key={phase.phase}
              className={`relative rounded-2xl border p-6 ${
                phase.status === "live"
                  ? "border-success/30 bg-success/5"
                  : phase.status === "complete"
                    ? "border-primary/30 bg-primary/5"
                    : "border-warning/30 bg-warning/5"
              }`}
            >
              <div
                className={`absolute -top-3 left-6 rounded-full px-3 py-1 text-xs font-medium ${
                  phase.status === "live"
                    ? "bg-success text-white"
                    : phase.status === "complete"
                      ? "bg-primary text-white"
                      : "bg-warning text-black"
                }`}
              >
                {phase.status === "live"
                  ? "🟢 Live"
                  : phase.status === "complete"
                    ? "✓ Complete"
                    : "⏳ Upcoming"}
              </div>

              <div className="mt-4">
                <p className="text-sm text-muted-foreground">{phase.phase}</p>
                <h3 className="mb-4 text-xl font-semibold">{phase.title}</h3>
                <ul className="space-y-2">
                  {phase.items.map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <CheckCircle2
                        className={`h-4 w-4 ${
                          phase.status === "upcoming" ? "text-muted-foreground" : "text-success"
                        }`}
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection({ isMainnet }: { isMainnet: boolean }) {
  return (
    <section className="relative overflow-hidden py-24">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
      </div>

      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl md:text-5xl">
            Ready to Start Earning?
          </h2>
          <p className="mb-8 text-lg text-muted-foreground">
            Join thousands of early users on testnet. Be first when mainnet launches.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="https://testnet.khipuvault.com"
              className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-8 py-4 text-lg font-semibold text-white shadow-xl shadow-primary/25 transition-all hover:scale-[1.02]"
            >
              <Globe className="h-5 w-5" />
              Launch Testnet App
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-8">
            <Link
              href="https://testnet.khipuvault.com"
              className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <Globe className="h-5 w-5" />
              <span>testnet.khipuvault.com</span>
            </Link>
            <Link
              href="https://docs.khipuvault.com"
              target="_blank"
              className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <FileText className="h-5 w-5" />
              <span>docs.khipuvault.com</span>
            </Link>
            <Link
              href="https://github.com/khipuvault"
              target="_blank"
              className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <Github className="h-5 w-5" />
              <span>GitHub</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/50 py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-3">
            <Image src="/logos/khipu-logo.png" alt="KhipuVault" width={32} height={32} />
            <span className="font-semibold">KhipuVault</span>
          </div>

          <p className="text-sm text-muted-foreground">
            Decentralized Bitcoin savings. Built on Mezo.
          </p>

          <div className="flex items-center gap-4">
            <Link
              href="https://twitter.com/khipuvault"
              target="_blank"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <Twitter className="h-5 w-5" />
            </Link>
            <Link
              href="https://github.com/khipuvault"
              target="_blank"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <Github className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
