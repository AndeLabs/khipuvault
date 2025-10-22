import Link from "next/link";
import { ChevronLeft, Plus } from "lucide-react";
import { Button } from "../components/ui/button";
import { YourPosition } from "../components/dashboard/individual-savings/your-position";
import { Deposits } from "../components/dashboard/individual-savings/deposits";
import { YieldHistoryChart } from "../components/dashboard/individual-savings/yield-history-chart";
import { TransactionsTable } from "../components/dashboard/individual-savings/transactions-table";
import { ProjectionsCalculator } from "../components/dashboard/individual-savings/projections-calculator";
import { PoolStats } from "../components/dashboard/individual-savings/pool-stats";
import { AnimateOnScroll } from "../components/animate-on-scroll";

export default function IndividualSavingsPage() {
  return (
    <div className="flex flex-col gap-8">
      <AnimateOnScroll>
        <Link href="/dashboard" className="flex items-center gap-2 text-primary hover:underline">
          <ChevronLeft className="h-4 w-4" />
          Volver al Dashboard
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-white mt-4 flex items-center gap-3">
          <span role="img" aria-label="lightbulb emoji" className="text-2xl">💡</span>
          Individual Savings Pool
        </h1>
      </AnimateOnScroll>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-8">
          <AnimateOnScroll delay="100ms">
            <YourPosition />
          </AnimateOnScroll>
          <AnimateOnScroll delay="200ms">
            <Deposits />
          </AnimateOnScroll>
          <AnimateOnScroll delay="300ms">
            <YieldHistoryChart />
          </AnimateOnScroll>
        </div>
        <div className="lg:col-span-1">
          <AnimateOnScroll delay="400ms">
            <PoolStats />
          </AnimateOnScroll>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
            <AnimateOnScroll delay="500ms">
                <TransactionsTable />
            </AnimateOnScroll>
        </div>
        <div className="lg:col-span-1">
            <AnimateOnScroll delay="600ms">
                <ProjectionsCalculator />
            </AnimateOnScroll>
        </div>
      </div>

      <Button
        className="fixed bottom-6 right-6 h-16 w-16 rounded-full bg-secondary text-secondary-foreground shadow-lg animate-pulse-glow hover:scale-110 transition-transform duration-300 z-50 flex items-center justify-center gap-2 group"
      >
        <span className="text-2xl" role="img" aria-label="money bag emoji">💰</span>
        <span className="sr-only group-hover:not-sr-only group-hover:w-auto w-0 transition-all duration-300">Depósitar Rápido</span>
      </Button>
    </div>
  );
}
