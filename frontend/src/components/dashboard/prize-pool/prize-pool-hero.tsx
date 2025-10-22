"use client"

import { AnimateOnScroll } from "../components/animate-on-scroll";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export function PrizePoolHero() {
  return (
    <AnimateOnScroll>
       <Link href="/dashboard" className="flex items-center gap-2 text-primary hover:underline">
          <ChevronLeft className="h-4 w-4" />
          Volver al Dashboard
        </Link>
      <div className="text-center py-12">
        <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-6xl md:text-7xl">
          <span role="img" aria-label="slot machine emoji" className="mr-4">🎰</span>
          Prize Pool
        </h1>
        <p className="mt-4 text-xl text-muted-foreground">
          Lotería sin Riesgo - Tu Capital Siempre Seguro
        </p>
        <p className="mx-auto mt-2 max-w-2xl text-base text-muted-foreground/80">
          Los rendimientos generados por el pool se acumulan como premio. ¡Gana grande sin arriesgar tu depósito inicial!
        </p>
      </div>
    </AnimateOnScroll>
  );
}
