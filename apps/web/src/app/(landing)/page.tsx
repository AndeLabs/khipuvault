"use client";

/**
 * @fileoverview Landing Page
 * @module app/(landing)/page
 *
 * Smart routing based on launch mode:
 * - khipuvault.com (mainnet/pre-launch): Shows landing page
 * - testnet.khipuvault.com (testnet/live): Redirects to /dashboard
 */

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { Contracts } from "@/components/sections/contracts";
import { CTA } from "@/components/sections/cta";
import { FAQ } from "@/components/sections/faq";
import { Hero } from "@/components/sections/hero";
import { HowItWorks } from "@/components/sections/how-it-works";
import { MezoInfo } from "@/components/sections/mezo-info";
import { Partners } from "@/components/sections/partners";
import { ProductGuides } from "@/components/sections/product-guides";
import { Products } from "@/components/sections/products";
import { shouldShowLanding } from "@/config/launch";

export const dynamic = "force-dynamic";

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
