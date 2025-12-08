"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useAccount } from "wagmi";
import { useUserLotteryStats, formatBTC } from "@/hooks/web3/use-lottery-pool";

export function YourStats() {
  const { address } = useAccount();
  const { stats, isLoading } = useUserLotteryStats(address as `0x${string}`);

  if (!address) {
    return (
      <Card className="bg-card border-primary/20 shadow-custom">
        <CardHeader>
          <CardTitle>Tus Estadísticas Históricas</CardTitle>
          <CardDescription>
            Tu rendimiento en el Prize Pool a lo largo del tiempo.
          </CardDescription>
        </CardHeader>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">
            Conecta tu wallet para ver tus estadísticas
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="bg-card border-primary/20 shadow-custom">
        <CardHeader>
          <CardTitle>Tus Estadísticas Históricas</CardTitle>
          <CardDescription>
            Tu rendimiento en el Prize Pool a lo largo del tiempo.
          </CardDescription>
        </CardHeader>
        <CardContent className="py-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </CardContent>
      </Card>
    );
  }

  const displayStats = [
    { label: "Total Invertido", value: formatBTC(stats?.totalInvested || 0n) },
    { label: "Rondas Jugadas", value: stats?.roundsPlayed.toString() || "0" },
    { label: "Total Tickets", value: stats?.totalTickets.toString() || "0" },
    { label: "Premios Ganados", value: formatBTC(stats?.totalWinnings || 0n) },
  ];

  return (
    <Card className="bg-card border-primary/20 shadow-custom">
      <CardHeader>
        <CardTitle>Tus Estadísticas Históricas</CardTitle>
        <CardDescription>
          Tu rendimiento en el Prize Pool a lo largo del tiempo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {displayStats.map((stat) => (
            <div
              key={stat.label}
              className="p-4 bg-background/50 rounded-lg text-center"
            >
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-xl font-bold font-code text-primary">
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
