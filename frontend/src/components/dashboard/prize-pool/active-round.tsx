"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { YourTickets } from "./your-tickets";

const CountdownTimer = () => {
    const calculateTimeLeft = (): { d?: number; h?: number; m?: number; s?: number } => {
        const difference = +new Date("2025-01-20") - +new Date();
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


const stats = [
    { label: "Premio Principal", value: "0.1 BTC", subValue: "$6,000 USD", emoji: "🏆", valueColor: "text-secondary text-4xl" },
    { label: "Precio Ticket", value: "0.0005 BTC", subValue: "$30 USD", emoji: "🎟️" },
    { label: "Participantes", value: "847/1000", emoji: "👥", progress: 84.7 },
    { label: "Bote Total", value: "0.5 BTC", subValue: "$30,000 USD", emoji: "💰" },
    { label: "Termina en", value: "", emoji: "⏰", isTimer: true },
    { label: "Probabilidad", value: "1/1000", subValue: "por ticket", emoji: "🎲" },
];

export function ActiveRound() {
  return (
    <Card className="border-primary/50 bg-gradient-to-br from-card to-card/80 shadow-custom shadow-primary/20 animate-pulse-glow">
        <CardHeader>
            <div className="flex justify-between items-center">
                <CardTitle className="text-2xl">Sorteo Semanal</CardTitle>
                <Badge className="bg-primary/20 text-primary border-primary/30 text-base">🎪 Ronda #123 ACTIVA</Badge>
            </div>
        </CardHeader>
        <CardContent className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {stats.map(stat => (
                    <div key={stat.label} className="p-4 bg-background/50 rounded-lg flex flex-col justify-between">
                       <div className="flex items-center justify-between text-muted-foreground text-sm">
                           <span>{stat.label}</span>
                           <span className="text-2xl">{stat.emoji}</span>
                       </div>
                       {stat.isTimer ? (
                           <CountdownTimer />
                       ) : (
                           <div>
                                <p className={`font-code font-bold ${stat.valueColor || 'text-white text-3xl'}`}>{stat.value}</p>
                                {stat.subValue && <p className="text-xs text-muted-foreground">{stat.subValue}</p>}
                           </div>
                       )}
                       {stat.progress !== undefined && (
                           <div className="mt-2">
                            <Progress value={stat.progress} className="h-2 [&>div]:bg-gradient-to-r from-primary to-secondary" />
                            <p className="text-xs text-right mt-1 text-muted-foreground">{stat.progress}% lleno</p>
                           </div>
                       )}
                    </div>
                ))}
            </div>
            <YourTickets />
        </CardContent>
    </Card>
  );
}
