"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { YourTickets } from "./your-tickets";
import { useCurrentRound, formatBTC, formatUSD, getRoundStatus } from "@/hooks/web3/use-lottery-pool";
import { useBTCPrice } from "@/hooks/use-btc-price";

interface CountdownTimerProps {
  endTime: bigint;
}

const CountdownTimer = ({ endTime }: CountdownTimerProps) => {
    const calculateTimeLeft = (): { d?: number; h?: number; m?: number; s?: number } => {
        const difference = Number(endTime) * 1000 - Date.now();
        let timeLeft: { d?: number; h?: number; m?: number; s?: number } = {};

        if (difference > 0) {
            timeLeft = {
                d: Math.floor(difference / (1000 * 60 * 60 * 24)),
                h: Math.floor((difference / (1000 * 60 * 60)) % 24),
                m: Math.floor((difference / 1000 / 60) % 60),
                s: Math.floor((difference / 1000) % 60),
            };
        }
        return timeLeft;
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        const timer = setTimeout(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);
        return () => clearTimeout(timer);
    });

    const timerComponents = Object.entries(timeLeft).map(([interval, value]) => {
        if (value === undefined) return null;
        return (
            <span key={interval} className="font-mono text-3xl font-bold">
              {String(value).padStart(2, '0')}{interval}
            </span>
        );
    });

    return (
        <div className="flex items-center gap-2">
            <span role="img" aria-label="clock emoji" className="text-3xl">⏰</span>
            <div className={`flex gap-2 ${Object.keys(timeLeft).length > 0 && (timeLeft.d ?? 1) < 1 ? 'text-secondary animate-pulse' : 'text-white'}`}>
                {timerComponents.length ? timerComponents : <span>Finalizado!</span>}
            </div>
        </div>
    );
};

export function ActiveRound() {
  const { currentRoundId, roundInfo, isLoading } = useCurrentRound();
  const { price: btcPrice } = useBTCPrice();

  if (isLoading) {
    return (
      <Card className="border-primary/50">
        <CardContent className="py-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando sorteo activo...</p>
        </CardContent>
      </Card>
    );
  }

  if (!roundInfo || !currentRoundId) {
    return (
      <Card className="border-primary/50">
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No hay sorteos activos en este momento</p>
        </CardContent>
      </Card>
    );
  }

  const participationRate = roundInfo.maxTickets > 0n 
    ? (Number(roundInfo.totalTicketsSold) / Number(roundInfo.maxTickets)) * 100 
    : 0;

  const totalPrizeUSD = Number(roundInfo.totalPrize) * btcPrice / 1e18;
  const ticketPriceUSD = Number(roundInfo.ticketPrice) * btcPrice / 1e18;

  const status = getRoundStatus(roundInfo.status);
  const isActive = status === "Activo";

  return (
    <Card className="border-primary/50 bg-gradient-to-br from-card to-card/80 shadow-custom shadow-primary/20 animate-pulse-glow">
        <CardHeader>
            <div className="flex justify-between items-center">
                <CardTitle className="text-2xl">Sorteo Semanal</CardTitle>
                <Badge className={`${isActive ? 'bg-primary/20 text-primary border-primary/30' : 'bg-muted text-muted-foreground'} text-base`}>
                  🎪 Ronda #{currentRoundId.toString()} {status.toUpperCase()}
                </Badge>
            </div>
        </CardHeader>
        <CardContent className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div className="p-4 bg-background/50 rounded-lg flex flex-col justify-between">
                   <div className="flex items-center justify-between text-muted-foreground text-sm">
                       <span>Premio Principal</span>
                       <span className="text-2xl">🏆</span>
                   </div>
                   <div>
                        <p className="font-code font-bold text-secondary text-4xl">{formatBTC(roundInfo.totalPrize)}</p>
                        <p className="text-xs text-muted-foreground">{formatUSD(totalPrizeUSD)}</p>
                   </div>
                </div>

                <div className="p-4 bg-background/50 rounded-lg flex flex-col justify-between">
                   <div className="flex items-center justify-between text-muted-foreground text-sm">
                       <span>Precio Ticket</span>
                       <span className="text-2xl">🎟️</span>
                   </div>
                   <div>
                        <p className="font-code font-bold text-white text-3xl">{formatBTC(roundInfo.ticketPrice)}</p>
                        <p className="text-xs text-muted-foreground">{formatUSD(ticketPriceUSD)}</p>
                   </div>
                </div>

                <div className="p-4 bg-background/50 rounded-lg flex flex-col justify-between">
                   <div className="flex items-center justify-between text-muted-foreground text-sm">
                       <span>Participantes</span>
                       <span className="text-2xl">👥</span>
                   </div>
                   <div>
                        <p className="font-code font-bold text-white text-3xl">{roundInfo.totalTicketsSold.toString()}/{roundInfo.maxTickets.toString()}</p>
                   </div>
                   <div className="mt-2">
                    <Progress value={participationRate} className="h-2 [&>div]:bg-gradient-to-r from-primary to-secondary" />
                    <p className="text-xs text-right mt-1 text-muted-foreground">{participationRate.toFixed(1)}% lleno</p>
                   </div>
                </div>

                <div className="p-4 bg-background/50 rounded-lg flex flex-col justify-between">
                   <div className="flex items-center justify-between text-muted-foreground text-sm">
                       <span>Bote Total</span>
                       <span className="text-2xl">💰</span>
                   </div>
                   <div>
                        <p className="font-code font-bold text-white text-3xl">{formatBTC(roundInfo.totalPrize)}</p>
                        <p className="text-xs text-muted-foreground">{formatUSD(totalPrizeUSD)}</p>
                   </div>
                </div>

                <div className="p-4 bg-background/50 rounded-lg flex flex-col justify-between">
                   <div className="flex items-center justify-between text-muted-foreground text-sm">
                       <span>Termina en</span>
                       <span className="text-2xl">⏰</span>
                   </div>
                   <CountdownTimer endTime={roundInfo.endTime} />
                </div>

                <div className="p-4 bg-background/50 rounded-lg flex flex-col justify-between">
                   <div className="flex items-center justify-between text-muted-foreground text-sm">
                       <span>Probabilidad</span>
                       <span className="text-2xl">🎲</span>
                   </div>
                   <div>
                        <p className="font-code font-bold text-white text-3xl">
                          {roundInfo.maxTickets > 0n ? `1/${roundInfo.maxTickets.toString()}` : "N/A"}
                        </p>
                        <p className="text-xs text-muted-foreground">por ticket</p>
                   </div>
                </div>
            </div>
            <YourTickets />
        </CardContent>
    </Card>
  );
}
