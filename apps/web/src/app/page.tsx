'use client'

import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Hero } from "@/components/sections/hero";
import { Stats } from "@/components/sections/stats";
import { Features } from "@/components/sections/features";
import { ContractsSection } from "@/components/sections/contracts-section";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = 'force-dynamic'

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-grow">
        <Hero />
        <Stats />
        <Features />
        <ContractsSection />
        <div className="text-center py-20">
          <Link href="/dashboard" className={cn(buttonVariants({ size: "lg", variant: "secondary" }))}>
            Ir al Dashboard
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
