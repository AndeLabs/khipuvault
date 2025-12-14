import { ShieldCheck, DollarSign, Handshake, BarChart3 } from "lucide-react";
import { AnimateOnScroll } from "@/components/animate-on-scroll";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const featureData = [
  {
    icon: <ShieldCheck className="h-12 w-12 text-primary" />,
    title: "No Capital Risk",
    description:
      "Your Bitcoin is always safe. Only yields are distributed as prizes.",
  },
  {
    icon: <DollarSign className="h-12 w-12 text-primary" />,
    title: "mUSD Stablecoin",
    description: "100% backed by Bitcoin on Mezo Protocol.",
  },
  {
    icon: <Handshake className="h-12 w-12 text-primary" />,
    title: "Tradition + Blockchain",
    description: "Pasanaku and Tandas digitized with smart contracts.",
  },
  {
    icon: <BarChart3 className="h-12 w-12 text-primary" />,
    title: "Transparent Yields",
    description: "Everything verifiable on-chain on Mezo Testnet.",
  },
];

export function Features() {
  return (
    <section id="features" className="bg-background py-16 sm:py-24">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AnimateOnScroll className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Why KhipuVault?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            The safest and smartest way to put your Bitcoin to work.
          </p>
        </AnimateOnScroll>

        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {featureData.map((feature, index) => (
            <AnimateOnScroll key={index} delay={`${150 + index * 150}ms`}>
              <Card className="h-full bg-card border border-primary/20 text-center transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10">
                <CardHeader className="items-center">{feature.icon}</CardHeader>
                <CardContent>
                  <CardTitle className="text-lg font-bold text-white">
                    {feature.title}
                  </CardTitle>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
