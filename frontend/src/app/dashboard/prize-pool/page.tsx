import { AnimateOnScroll } from "@/components/animate-on-scroll";
import { ActiveRound } from "@/components/dashboard/prize-pool/active-round";
import { DrawHistory } from "@/components/dashboard/prize-pool/draw-history";
import { PrizePoolHero } from "@/components/dashboard/prize-pool/prize-pool-hero";
import { ProbabilityCalculator } from "@/components/dashboard/prize-pool/probability-calculator";
import { RulesFaq } from "@/components/dashboard/prize-pool/rules-faq";
import { UpcomingDraws } from "@/components/dashboard/prize-pool/upcoming-draws";
import { YourStats } from "@/components/dashboard/prize-pool/your-stats";


export default function PrizePoolPage() {
  return (
    <div className="flex flex-col gap-8">
      <PrizePoolHero />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-8">
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
        <div className="lg:col-span-1 space-y-8">
          <AnimateOnScroll delay="100ms">
            <UpcomingDraws />
          </AnimateOnScroll>
          <AnimateOnScroll delay="400ms">
            <ProbabilityCalculator />
          </AnimateOnScroll>
        </div>
      </div>
      
      <AnimateOnScroll delay="500ms">
        <RulesFaq />
      </AnimateOnScroll>

    </div>
  );
}
