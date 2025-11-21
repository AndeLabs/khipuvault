/**
 * @fileoverview Probability Calculator Component
 * @module features/prize-pool/components/probability-calculator
 *
 * Interactive tool to calculate win probability based on ticket count
 */

'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Calculator, TrendingUp, DollarSign, Percent } from 'lucide-react'
import { formatEther } from 'viem'
import type { LotteryRound } from '@/lib/blockchain/fetch-lottery-pools'

interface ProbabilityCalculatorProps {
  roundInfo: LotteryRound | null
}

export function ProbabilityCalculator({ roundInfo }: ProbabilityCalculatorProps) {
  const [ticketCount, setTicketCount] = React.useState(1)

  if (!roundInfo) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-sm text-muted-foreground">
            No active lottery to calculate
          </p>
        </CardContent>
      </Card>
    )
  }

  const maxTickets = 10 // MAX_TICKETS_PER_USER
  const ticketPrice = roundInfo.ticketPrice
  const totalPrize = roundInfo.totalPrize

  // Calculate metrics
  const totalCost = ticketPrice * BigInt(ticketCount)
  const estimatedTotalTickets = Number(roundInfo.totalTicketsSold) + ticketCount
  const probability = estimatedTotalTickets > 0
    ? (ticketCount / estimatedTotalTickets) * 100
    : 0

  // Expected value calculation (simplified)
  const expectedWinnings = totalPrize
  const expectedValue = (probability / 100) * Number(formatEther(expectedWinnings))
  const costInEther = Number(formatEther(totalCost))
  const netExpectedValue = expectedValue - costInEther
  const roi = costInEther > 0 ? ((netExpectedValue / costInEther) * 100) : 0

  const handleSliderChange = (value: number[]) => {
    setTicketCount(value[0])
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 1
    setTicketCount(Math.max(1, Math.min(maxTickets, value)))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-lavanda" />
          Probability Calculator
        </CardTitle>
        <CardDescription>
          Calculate your chances based on ticket count
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Ticket Count Input */}
        <div className="space-y-3">
          <Label htmlFor="calc-tickets">Number of Tickets</Label>
          <div className="flex gap-3">
            <Input
              id="calc-tickets"
              type="number"
              min="1"
              max={maxTickets}
              value={ticketCount}
              onChange={handleInputChange}
              className="flex-1"
            />
            <Badge variant="secondary" className="px-4 flex items-center justify-center">
              {ticketCount} / {maxTickets}
            </Badge>
          </div>

          {/* Slider */}
          <Slider
            value={[ticketCount]}
            onValueChange={handleSliderChange}
            min={1}
            max={maxTickets}
            step={1}
            className="w-full"
          />
        </div>

        {/* Results Grid */}
        <div className="grid gap-3">
          {/* Win Probability */}
          <div className="p-4 rounded-lg bg-gradient-to-br from-lavanda/10 to-lavanda/5 border border-lavanda/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-lavanda/20 flex items-center justify-center">
                  <Percent className="h-5 w-5 text-lavanda" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Win Probability</div>
                  <div className="text-2xl font-bold text-lavanda">{probability.toFixed(2)}%</div>
                </div>
              </div>
            </div>
          </div>

          {/* Total Cost */}
          <div className="p-4 rounded-lg bg-surface-elevated border border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Total Cost</div>
                  <div className="text-xl font-bold">{formatEther(totalCost)} BTC</div>
                </div>
              </div>
            </div>
          </div>

          {/* Expected Value */}
          <div className="p-4 rounded-lg bg-surface-elevated border border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-success/20 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-success" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Expected Value</div>
                  <div className={`text-xl font-bold ${netExpectedValue >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {netExpectedValue >= 0 ? '+' : ''}{netExpectedValue.toFixed(4)} BTC
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ROI */}
          <div className="p-4 rounded-lg bg-surface-elevated border border-border">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-xs text-muted-foreground mb-1">Return on Investment</div>
                <div className={`text-xl font-bold ${roi >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {roi >= 0 ? '+' : ''}{roi.toFixed(2)}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="p-3 rounded-lg bg-info/10 border border-info/20">
          <p className="text-xs text-info-foreground">
            <strong>Note:</strong> These are estimates. Actual probability depends on total tickets sold. Expected value assumes ticket prices contribute to prize pool.
          </p>
        </div>

        {/* Comparison Table */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Probability Comparison</div>
          <div className="space-y-1">
            {[1, 3, 5, 10].map((count) => {
              const prob = ((count / (Number(roundInfo.totalTicketsSold) + count)) * 100).toFixed(2)
              return (
                <div
                  key={count}
                  className={`flex justify-between p-2 rounded text-sm ${
                    count === ticketCount ? 'bg-lavanda/10 border border-lavanda/20' : 'bg-surface-elevated'
                  }`}
                >
                  <span className="text-muted-foreground">{count} ticket{count > 1 ? 's' : ''}</span>
                  <span className="font-medium">{prob}%</span>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
