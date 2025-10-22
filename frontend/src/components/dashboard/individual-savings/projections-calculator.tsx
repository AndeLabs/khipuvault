"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bar, BarChart, Cell, ResponsiveContainer, XAxis, YAxis } from "recharts"

export function ProjectionsCalculator() {
  const [deposit, setDeposit] = useState(0.1)
  const [period, setPeriod] = useState("12") // in months
  const apr = 0.062

  const finalCapital = deposit * Math.pow(1 + apr / 12, parseInt(period));
  const earnings = finalCapital - deposit;
  const roi = (earnings / deposit) * 100;

  const chartData = [
    { name: "Inicial", value: deposit },
    { name: "Final", value: finalCapital },
  ];

  return (
    <Card className="bg-card border-primary/20 shadow-custom">
      <CardHeader>
        <CardTitle>Calculadora de Proyecciones</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="calc-deposit">¿Cuánto quieres depositar?</Label>
          <Input
            id="calc-deposit"
            type="number"
            value={deposit}
            onChange={(e) => setDeposit(parseFloat(e.target.value))}
            className="font-code bg-background"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="calc-period">Período</Label>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger id="calc-period" className="bg-background">
              <SelectValue placeholder="Selecciona período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 mes</SelectItem>
              <SelectItem value="3">3 meses</SelectItem>
              <SelectItem value="6">6 meses</SelectItem>
              <SelectItem value="12">1 año</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 rounded-lg bg-background/50 p-4 border border-primary/20">
            <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Capital al final:</span>
                <span className="font-code font-bold text-white">{finalCapital.toFixed(4)} BTC</span>
            </div>
            <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Rendimientos:</span>
                <span className="font-code font-bold text-secondary">+{earnings.toFixed(4)} BTC</span>
            </div>
            <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">ROI:</span>
                <span className="font-code font-bold text-secondary">{roi.toFixed(2)}%</span>
            </div>
        </div>
        <div className="h-[150px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false}/>
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false}/>
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {
                        chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === 0 ? "hsl(var(--primary))" : "hsl(var(--secondary))"} />
                        ))
                    }
                </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
