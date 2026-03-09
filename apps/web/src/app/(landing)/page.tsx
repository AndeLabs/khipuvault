"use client";

/**
 * @fileoverview Landing Page
 * @module app/(landing)/page
 *
 * Smart routing based on launch mode:
 * - khipuvault.com (mainnet/pre-launch): Shows landing page
 * - testnet.khipuvault.com (testnet/live): Redirects to /dashboard
 */

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { shouldShowLanding } from "@/config/launch";

// Lazy load heavy landing page components to avoid SSR issues
const Header = dynamic(() => import("@/components/layout/header").then((m) => m.Header), {
  ssr: false,
});
const Footer = dynamic(() => import("@/components/layout/footer").then((m) => m.Footer), {
  ssr: false,
});
const Hero = dynamic(() => import("@/components/sections/hero").then((m) => m.Hero), {
  ssr: false,
});
const Partners = dynamic(() => import("@/components/sections/partners").then((m) => m.Partners), {
  ssr: false,
});
const HowItWorks = dynamic(
  () => import("@/components/sections/how-it-works").then((m) => m.HowItWorks),
  { ssr: false }
);
const Products = dynamic(() => import("@/components/sections/products").then((m) => m.Products), {
  ssr: false,
});
const ProductGuides = dynamic(
  () => import("@/components/sections/product-guides").then((m) => m.ProductGuides),
  { ssr: false }
);
const MezoInfo = dynamic(() => import("@/components/sections/mezo-info").then((m) => m.MezoInfo), {
  ssr: false,
});
const FAQ = dynamic(() => import("@/components/sections/faq").then((m) => m.FAQ), { ssr: false });
const Contracts = dynamic(
  () => import("@/components/sections/contracts").then((m) => m.Contracts),
  { ssr: false }
);
const CTA = dynamic(() => import("@/components/sections/cta").then((m) => m.CTA), { ssr: false });

export default function LandingPage() {
  const router = useRouter();
  const [showLanding, setShowLanding] = useState<boolean | null>(null);

  useEffect(() => {
    const isLanding = shouldShowLanding();
    setShowLanding(isLanding);

    // If in live mode (testnet), redirect to dashboard
    if (!isLanding) {
      router.replace("/dashboard");
    }
  }, [router]);

  // Loading state while checking
  if (showLanding === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // Redirecting to dashboard
  if (!showLanding) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Show landing page (mainnet/pre-launch mode)
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main id="main-content" tabIndex={-1} className="flex-grow focus:outline-none">
        <Hero />
        <Partners />
        <HowItWorks />
        <Products />
        <ProductGuides />
        <MezoInfo />
        <FAQ />
        <Contracts />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
