import { Card, CardContent } from "@/components/ui/card";
import { AnimateOnScroll } from "@/components/animate-on-scroll";

const statsData = [
  {
    emoji: "💰",
    value: "5-8%",
    label: "APR Promedio",
    subLabel: "En Individual & Cooperative Pools",
    colorClass: "text-primary",
  },
  {
    emoji: "🔒",
    value: "V3",
    label: "Contratos Auditados",
    subLabel: "Optimizados y seguros",
    colorClass: "text-primary",
  },
  {
    emoji: "⚡",
    value: "Gas",
    label: "Optimizado",
    subLabel: "Reducción de costos",
    colorClass: "text-secondary",
  },
];

export function Stats() {
  return (
    <section id="pools" className="py-16 sm:py-24">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {statsData.map((stat, index) => (
            <AnimateOnScroll key={index} delay={`${index * 150}ms`}>
              <Card className="transform-gpu bg-card border-2 border-primary/50 p-6 text-center transition-transform duration-300 hover:-translate-y-1 animate-pulse-glow hover:shadow-[0_10px_40px_-5px_hsl(var(--primary)/0.3)]">
                <CardContent className="p-0">
                  <div className="text-5xl">{stat.emoji}</div>
                  <p className={`font-code mt-4 text-4xl font-bold ${stat.colorClass}`}>
                    {stat.value}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">{stat.label}</p>
                  <p className="text-sm text-muted-foreground">{stat.subLabel}</p>
                </CardContent>
              </Card>
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
