import { Card, CardContent } from "../components/ui/card";

const summaryData = [
  {
    emoji: "💎",
    value: "0.005 BTC",
    label: "Tu Bitcoin",
    subLabel: "≈ $300.25 USD",
    valueColor: "text-primary",
  },
  {
    emoji: "💰",
    value: "150 MUSD",
    label: "Stablecoin",
    subLabel: "Staked",
    valueColor: "text-primary",
  },
  {
    emoji: "📈",
    value: "+5.2%",
    label: "Rendimiento Total",
    subLabel: "≈ 0.00026 BTC",
    valueColor: "text-secondary",
  },
  {
    emoji: "🎯",
    value: "$450 USD",
    label: "Valor Total",
    subLabel: "+1.5% (24h)",
    valueColor: "text-primary",
  },
];

export function SummaryCards() {
  return (
    <section>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {summaryData.map((stat, index) => (
            <Card key={index} className="bg-card border-primary/20 p-6 text-center shadow-custom hover:border-primary/40 transition-all">
            <CardContent className="p-0 flex flex-col items-center justify-center">
                <div className="text-4xl">{stat.emoji}</div>
                <p className={`font-code mt-4 text-2xl font-bold ${stat.valueColor}`}>
                {stat.value}
                </p>
                <p className="mt-1 text-base font-semibold text-white">{stat.label}</p>
                <p className="text-xs text-muted-foreground">{stat.subLabel}</p>
            </CardContent>
            </Card>
        ))}
        </div>
    </section>
  );
}
