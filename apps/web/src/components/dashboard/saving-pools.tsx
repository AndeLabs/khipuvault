import { Handshake, Lightbulb, RotateCw, Trophy } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const pools = [
  {
    icon: <Lightbulb className="h-8 w-8 text-primary" />,
    title: "Individual Savings",
    min: "0.005 BTC",
    apr: "5-8%",
    features: [
      "Retiro cuando quieras",
      "Sin compromisos",
      "Rendimientos diarios",
    ],
    buttonLabel: "Entrar",
    primary: true,
    href: "/dashboard/individual-savings",
  },
  {
    icon: <Handshake className="h-8 w-8 text-primary" />,
    title: "Cooperative Savings",
    min: "0.001 BTC",
    apr: "6-9%",
    features: ["Ahorro en grupo", "Hasta 100 miembros", "Mayor rendimiento"],
    buttonLabel: "Entrar",
    href: "/dashboard/cooperative-savings",
  },
  {
    icon: <Trophy className="h-8 w-8 text-primary" />,
    title: "Prize Pool (Lotería)",
    min: "0.0005 BTC",
    apr: "Variable",
    features: ["Sin riesgo de capital", "Sorteos semanales", "Grandes premios"],
    buttonLabel: "Entrar",
    href: "/dashboard/prize-pool",
  },
  {
    icon: <RotateCw className="h-8 w-8 text-primary" />,
    title: "Rotating Pool (Pasanaku)",
    min: "0.01 BTC",
    apr: "Rotativo",
    features: ["Tradición digitalizada", "3-50 miembros", "Pagos programados"],
    buttonLabel: "Entrar",
    href: "/dashboard/rotating-pool",
  },
];

export function SavingPools() {
  return (
    <section>
      <h2 className="text-2xl font-bold tracking-tight text-white mb-6">
        Elige tu Pool de Ahorro
      </h2>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {pools.map((pool) => (
          <Card
            key={pool.title}
            className={`flex flex-col ${pool.primary ? "bg-card border-primary/50" : "bg-card border-primary/20"} shadow-custom hover:border-primary/60 transition-all`}
          >
            <CardHeader className="flex-row items-start gap-4 space-y-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                {pool.icon}
              </div>
              <div>
                <CardTitle>{pool.title}</CardTitle>
                <CardDescription className="mt-1">
                  Mínimo: {pool.min}
                </CardDescription>
              </div>
              <div className="ml-auto text-right">
                <p className="text-sm font-bold text-secondary">{pool.apr}</p>
                <p className="text-xs text-muted-foreground">APR</p>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col flex-grow">
              <ul className="space-y-2 text-sm text-muted-foreground flex-grow">
                {pool.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <span className="text-primary">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link href={pool.href} passHref>
                <Button
                  variant={
                    pool.href === "/dashboard/prize-pool" ||
                    pool.href === "/dashboard/rotating-pool" ||
                    pool.primary
                      ? "secondary"
                      : "outline"
                  }
                  className="mt-6 w-full"
                >
                  {pool.buttonLabel}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
