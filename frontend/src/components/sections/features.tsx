import { ShieldCheck, DollarSign, Handshake, BarChart3 } from "lucide-react";
import { AnimateOnScroll } from "../components/animate-on-scroll";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

const featureData = [
  {
    icon: <ShieldCheck className="h-12 w-12 text-primary" />,
    title: "Sin Riesgo de Capital",
    description: "Tu Bitcoin siempre está seguro. Solo los rendimientos se distribuyen.",
  },
  {
    icon: <DollarSign className="h-12 w-12 text-primary" />,
    title: "MUSD Stablecoin",
    description: "100% respaldado por Bitcoin en Mezo Protocol.",
  },
  {
    icon: <Handshake className="h-12 w-12 text-primary" />,
    title: "Tradición + Blockchain",
    description: "Pasanaku y Tandas digitalizados con smart contracts.",
  },
  {
    icon: <BarChart3 className="h-12 w-12 text-primary" />,
    title: "Rendimientos Transparentes",
    description: "Todo verificable on-chain en Mezo Testnet.",
  },
];

export function Features() {
  return (
    <section id="features" className="bg-background py-16 sm:py-24">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AnimateOnScroll className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              ¿Por qué KhipuVault?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              La forma más segura e inteligente de poner a trabajar tu Bitcoin.
            </p>
        </AnimateOnScroll>

        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {featureData.map((feature, index) => (
            <AnimateOnScroll key={index} delay={`${150 + index * 150}ms`}>
              <Card className="h-full bg-card border border-primary/20 text-center transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10">
                <CardHeader className="items-center">
                  {feature.icon}
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-lg font-bold text-white">{feature.title}</CardTitle>
                  <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
