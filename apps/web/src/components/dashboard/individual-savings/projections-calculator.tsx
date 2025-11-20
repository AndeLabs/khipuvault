"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useIndividualPoolV3 } from "@/hooks/web3/use-individual-pool-v3"

export function ProjectionsCalculator() {
  const [deposit, setDeposit] = useState(100) // MUSD amount
  const [period, setPeriod] = useState("12") // in months
  const { userInfo } = useIndividualPoolV3()
  
  // Use estimated APR from user's position or default to 5%
  const apr = userInfo && userInfo.estimatedAPR > BigInt(0) 
    ? Number(userInfo.estimatedAPR) / 10000 // APR is in basis points (10000 = 100%)
    : 0.05 // Default 5% APR

  const finalCapital = deposit * Math.pow(1 + apr / 12, parseInt(period));
  const earnings = finalCapital - deposit;
  const roi = (earnings / deposit) * 100;

  return (
    <Card className="bg-card border-primary/20 shadow-custom">
      <CardHeader>
        <CardTitle>Calculadora de Proyecciones</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="calc-deposit">¿Cuánto MUSD quieres depositar?</Label>
          <div className="relative">
            <Input
              id="calc-deposit"
              type="number"
              value={deposit}
              onChange={(e) => setDeposit(parseFloat(e.target.value))}
              className="font-code bg-background pr-12"
              min="10"
              step="10"
            />
            <span className="absolute inset-y-0 right-0 flex items-center pr-3 font-code text-muted-foreground">MUSD</span>
          </div>
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
            <span className="font-code font-bold text-white">{finalCapital.toFixed(2)} MUSD</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Rendimientos:</span>
            <span className="font-code font-bold text-secondary">+{earnings.toFixed(2)} MUSD</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">ROI:</span>
            <span className="font-code font-bold text-secondary">{roi.toFixed(2)}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
