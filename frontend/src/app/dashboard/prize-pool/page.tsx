'use client'

export const dynamic = 'force-dynamic'

import { AnimateOnScroll } from "@/components/animate-on-scroll";
import { ActiveRound } from "@/components/dashboard/prize-pool/active-round";
import { DrawHistory } from "@/components/dashboard/prize-pool/draw-history";
import { PrizePoolHero } from "@/components/dashboard/prize-pool/prize-pool-hero";
import { RulesFaq } from "@/components/dashboard/prize-pool/rules-faq";
import { YourStats } from "@/components/dashboard/prize-pool/your-stats";


export default function PrizePoolPage() {
  return (
    <div className="flex flex-col gap-8">
      <PrizePoolHero />

      <div className="space-y-8">
        <AnimateOnScroll>
          <ActiveRound />
        </AnimateOnScroll>
        <AnimateOnScroll delay="200ms">
          <YourStats />
        </AnimateOnScroll>
        <AnimateOnScroll delay="300ms">
          <DrawHistory />
        </AnimateOnScroll>
      </div>
      
      <AnimateOnScroll delay="500ms">
        <RulesFaq />
      </AnimateOnScroll>

    </div>
  );
}
