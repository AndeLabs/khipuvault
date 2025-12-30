"use client";

import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { Contracts } from "@/components/sections/contracts";
import { CTA } from "@/components/sections/cta";
import { FAQ } from "@/components/sections/faq";
import { Hero } from "@/components/sections/hero";
import { HowItWorks } from "@/components/sections/how-it-works";
import { Partners } from "@/components/sections/partners";
import { Products } from "@/components/sections/products";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main
        id="main-content"
        tabIndex={-1}
        className="flex-grow focus:outline-none"
      >
        <Hero />
        <Partners />
        <HowItWorks />
        <Products />
        <FAQ />
        <Contracts />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
