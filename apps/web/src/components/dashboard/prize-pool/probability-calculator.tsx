"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

export function ProbabilityCalculator() {
  const [tickets, setTickets] = useState(5);
  const totalTickets = 847;
  const probability = (tickets / (totalTickets + tickets)) * 100;

  const chartData = [
    {
      name: "Tu Probabilidad",
      value: probability.toFixed(2),
      fill: "hsl(var(--primary))",
    },
    {
      name: "Resto del Pool",
      value: (100 - probability).toFixed(2),
      fill: "hsl(var(--muted))",
    },
  ];

  return (
    <Card className="bg-card border-primary/20 shadow-custom">
      <CardHeader>
        <CardTitle>Calculadora de Probabilidad</CardTitle>
        <CardDescription>Estima tus chances de ganar.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="tickets-calc">¿Cuántos tickets quieres?</Label>
          <Input
            id="tickets-calc"
            type="number"
            value={tickets}
            onChange={(e) => setTickets(parseInt(e.target.value) || 0)}
            className="mt-1 font-code"
          />
          <Slider
            value={[tickets]}
            onValueChange={(v) => setTickets(v[0])}
            max={100}
            step={1}
            className="mt-2"
          />
        </div>
        <div className="p-4 bg-background/50 rounded-lg text-center space-y-1">
          <p className="text-sm text-muted-foreground">
            Tu probabilidad de ganar sería
          </p>
          <p className="text-2xl font-bold font-code text-secondary">
            {probability.toFixed(2)}%
          </p>
        </div>
        <div className="h-[100px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={chartData} stackOffset="expand">
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" hide />
              <Tooltip />
              <Bar dataKey="value" barSize={20} stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
