import { PerformanceChart } from "../components/dashboard/performance-chart";
import { SavingPools } from "../components/dashboard/saving-pools";
import { SummaryCards } from "../components/dashboard/summary-cards";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <SummaryCards />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
            <SavingPools />
        </div>
        <div className="lg:col-span-1">
            <PerformanceChart />
        </div>
      </div>
    </div>
  );
}
