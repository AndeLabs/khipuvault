"use client";

import Link from "next/link";

import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { ContractsSection } from "@/components/sections/contracts-section";
import { Features } from "@/components/sections/features";
import { Hero } from "@/components/sections/hero";
import { Stats } from "@/components/sections/stats";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
        <Stats />
        <Features />
        <ContractsSection />
        <div className="text-center py-20">
          <Link
            href="/dashboard"
            className={cn(buttonVariants({ size: "lg", variant: "secondary" }))}
          >
            Go to Dashboard
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
