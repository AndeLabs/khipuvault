"use client"

import * as React from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AmountDisplay } from "@/components/common"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TrendingUp, Calculator, BarChart3, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface YieldAnalyticsProps {
  currentAPR?: number
  currentDeposit?: string
  className?: string
}

export function YieldAnalytics({
  currentAPR = 6.2,
  currentDeposit = "0",
  className,
}: YieldAnalyticsProps) {
  // Projections calculator state
  const [amount, setAmount] = React.useState(currentDeposit)
  const [timePeriod, setTimePeriod] = React.useState<'1month' | '3months' | '6months' | '1year'>('1year')
  const [autoCompound, setAutoCompound] = React.useState(true)

  // Mock yield history data (in production, fetch from contract events)
  const yieldHistory = React.useMemo(() => {
    const now = Date.now()
    const days = 30
    return Array.from({ length: days }, (_, i) => {
      const date = new Date(now - (days - i) * 24 * 60 * 60 * 1000)
      // Simulate yield growth with some variance
      const baseYield = (Number(currentDeposit) * currentAPR / 100 / 365) * i
      const variance = Math.sin(i * 0.5) * baseYield * 0.1
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        yield: Math.max(0, baseYield + variance),
        cumulative: baseYield,
      }
    })
  }, [currentDeposit, currentAPR])

  // Calculate projections
  const projections = React.useMemo(() => {
    const principal = Number(amount) || 0
    const apr = currentAPR / 100

    const periods = {
      '1month': 1 / 12,
      '3months': 3 / 12,
      '6months': 6 / 12,
      '1year': 1,
    }

    const years = periods[timePeriod]

    // Simple interest (no auto-compound)
    const simpleInterest = principal * apr * years
    const simpleFinal = principal + simpleInterest

    // Compound interest (monthly compounding with auto-compound)
    const compoundingPeriods = years * 12 // Monthly
    const compoundFinal = principal * Math.pow(1 + (apr / 12), compoundingPeriods)
    const compoundInterest = compoundFinal - principal

    const finalAmount = autoCompound ? compoundFinal : simpleFinal
    const totalYield = autoCompound ? compoundInterest : simpleInterest

    // Performance fee (1%)
    const performanceFee = totalYield * 0.01
    const netYield = totalYield - performanceFee

    return {
      principal,
      grossYield: totalYield,
      performanceFee,
      netYield,
      finalAmount: principal + netYield,
      effectiveAPR: autoCompound ? (compoundInterest / principal / years) * 100 : currentAPR,
    }
  }, [amount, timePeriod, currentAPR, autoCompound])

  // Find max yield for chart scaling
  const maxYield = Math.max(...yieldHistory.map(d => d.cumulative))

  return (
    <Card variant="surface" className={className}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-lavanda flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle>Yield Analytics</CardTitle>
            <CardDescription>
              Track your earnings and project future yields
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="projections" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="projections" className="gap-2">
              <Calculator className="h-4 w-4" />
              Projections
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          {/* Projections Calculator */}
          <TabsContent value="projections" className="space-y-6 mt-6">
            {/* Calculator Inputs */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="calc-amount">Deposit Amount (mUSD)</Label>
                <Input
                  id="calc-amount"
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label>Time Period</Label>
                <Select value={timePeriod} onValueChange={(value: any) => setTimePeriod(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1month">1 Month</SelectItem>
                    <SelectItem value="3months">3 Months</SelectItem>
                    <SelectItem value="6months">6 Months</SelectItem>
                    <SelectItem value="1year">1 Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-surface-elevated border border-border">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Auto-Compound</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button" className="text-muted-foreground hover:text-foreground">
                          <Info className="h-3 w-3" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-sm max-w-xs">
                          With auto-compound enabled, your yields are automatically reinvested,
                          earning compound interest for higher returns.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoCompound(!autoCompound)}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                    autoCompound ? "bg-success" : "bg-surface"
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                      autoCompound ? "translate-x-6" : "translate-x-1"
                    )}
                  />
                </button>
              </div>
            </div>

            {/* Results */}
            {Number(amount) > 0 && (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-gradient-lavanda border border-lavanda/20">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Initial Deposit</span>
                      <AmountDisplay amount={projections.principal.toFixed(2)} symbol="mUSD" size="sm" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Gross Yield</span>
                      <AmountDisplay
                        amount={projections.grossYield.toFixed(4)}
                        symbol="mUSD"
                        size="sm"
                        className="text-success"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Performance Fee (1%)</span>
                      <AmountDisplay
                        amount={projections.performanceFee.toFixed(4)}
                        symbol="mUSD"
                        size="sm"
                        className="text-error"
                      />
                    </div>
                    <div className="h-px bg-border" />
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">Net Yield</span>
                      <AmountDisplay
                        amount={projections.netYield.toFixed(4)}
                        symbol="mUSD"
                        size="md"
                        className="text-success font-bold"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">Final Amount</span>
                      <AmountDisplay
                        amount={projections.finalAmount.toFixed(2)}
                        symbol="mUSD"
                        size="md"
                        className="font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* APR Info */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-surface-elevated border border-border text-sm">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-success" />
                    <span className="text-muted-foreground">
                      {autoCompound ? 'Effective APY' : 'Base APR'}
                    </span>
                  </div>
                  <span className="font-bold text-success">
                    {projections.effectiveAPR.toFixed(2)}%
                  </span>
                </div>

                {/* Comparison */}
                {autoCompound && (
                  <div className="p-3 rounded-lg bg-success/10 border border-success/20 text-xs">
                    <p className="text-success font-semibold mb-1">Auto-Compound Advantage</p>
                    <p className="text-muted-foreground">
                      You'll earn{' '}
                      <span className="font-semibold text-foreground">
                        {((projections.effectiveAPR - currentAPR) / currentAPR * 100).toFixed(1)}%
                      </span>{' '}
                      more compared to simple interest thanks to compound returns!
                    </p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* Yield History Chart */}
          <TabsContent value="history" className="space-y-6 mt-6">
            {Number(currentDeposit) > 0 ? (
              <>
                {/* Simple Bar Chart */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Last 30 Days</span>
                    <span className="font-semibold">
                      Total: <AmountDisplay amount={maxYield.toFixed(4)} symbol="mUSD" size="sm" />
                    </span>
                  </div>

                  <div className="h-64 flex items-end gap-1 p-4 rounded-lg bg-surface-elevated border border-border">
                    {yieldHistory.map((data, i) => (
                      <TooltipProvider key={i}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex-1 flex flex-col justify-end h-full">
                              <div
                                className="w-full bg-gradient-lavanda rounded-t hover:opacity-80 transition-opacity cursor-pointer"
                                style={{
                                  height: `${(data.cumulative / maxYield) * 100}%`,
                                  minHeight: '2px'
                                }}
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-xs space-y-1">
                              <p className="font-semibold">{data.date}</p>
                              <p>Yield: {data.cumulative.toFixed(4)} mUSD</p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                  </div>

                  {/* X-axis labels (showing every 7th day) */}
                  <div className="flex justify-between text-xs text-muted-foreground px-4">
                    {yieldHistory.filter((_, i) => i % 7 === 0).map((data, i) => (
                      <span key={i}>{data.date}</span>
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-surface-elevated border border-border">
                    <p className="text-xs text-muted-foreground mb-1">7-Day Yield</p>
                    <AmountDisplay
                      amount={(yieldHistory[yieldHistory.length - 1].cumulative - yieldHistory[yieldHistory.length - 8]?.cumulative || 0).toFixed(4)}
                      symbol="mUSD"
                      size="sm"
                      className="font-bold"
                    />
                  </div>
                  <div className="p-3 rounded-lg bg-surface-elevated border border-border">
                    <p className="text-xs text-muted-foreground mb-1">30-Day Yield</p>
                    <AmountDisplay
                      amount={maxYield.toFixed(4)}
                      symbol="mUSD"
                      size="sm"
                      className="font-bold"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <div className="mx-auto w-16 h-16 rounded-full bg-surface-elevated flex items-center justify-center mb-4">
                  <BarChart3 className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Yield History</h3>
                <p className="text-muted-foreground text-sm max-w-md mx-auto">
                  Make your first deposit to start tracking your yield performance over time.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
