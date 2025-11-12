'use client'

export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { ChevronLeft, Plus, TrendingUp, Users, Activity, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { PositionSimple } from '@/components/dashboard/individual-savings/position-simple'
import { Deposits } from '@/components/dashboard/individual-savings/deposits'
import { Withdraw } from '@/components/dashboard/individual-savings/withdraw'
import { AnimateOnScroll } from '@/components/animate-on-scroll'
import { usePoolEvents } from '@/hooks/web3/use-pool-events'
import { useRealtimeIndividualEvents } from '@/hooks/web3/use-realtime-individual-events'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function IndividualSavingsPage() {
  // Legacy event hook (fallback)
  usePoolEvents()

  // Enterprise real-time system with Event Bus integration
  const { isLive, stats, recentActivity, latestEvent, refresh } = useRealtimeIndividualEvents({
    enabled: true,
    onDeposit: (event) => {
      toast.success('💰 New Deposit Detected', {
        description: `${formatBTC(event.amount)} deposited`,
      })
    },
    onWithdrawal: (event) => {
      toast.info('💸 Withdrawal Made', {
        description: `${formatBTC(event.amount)} withdrawn`,
      })
    },
    onYieldClaimed: (event) => {
      toast.success('📈 Yield Claimed', {
        description: `${formatBTC(event.netYield)} claimed`,
      })
    },
    enableNotifications: true,
    enableOptimistic: true,
    enableAnalytics: true,
    verbose: true,
  })

  /**
   * Format BTC amount
   */
  const formatBTC = (amount: bigint): string => {
    return `${(Number(amount) / 1e18).toFixed(4)} BTC`
  }

  /**
   * Format number
   */
  const formatNumber = (num: number): string => {
    return num.toLocaleString()
  }

  /**
   * Time ago helper
   */
  const timeAgo = (timestamp: number | bigint) => {
    const ts = typeof timestamp === 'bigint' ? Number(timestamp) * 1000 : timestamp
    const seconds = Math.floor((Date.now() - ts) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  return (
    <div className="flex flex-col gap-8">
      <AnimateOnScroll>
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-primary hover:underline"
        >
          <ChevronLeft className="h-4 w-4" />
          Volver al Dashboard
        </Link>
        <div className="flex items-center justify-between mt-4">
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <span role="img" aria-label="lightbulb emoji" className="text-2xl">
              💡
            </span>
            Individual Savings Pool
          </h1>

          {/* Real-time Status Badge */}
          <div className="flex items-center gap-2">
            <Badge
              variant={isLive ? 'default' : 'secondary'}
              className={cn(
                'px-3 py-1',
                isLive && 'bg-green-500 animate-pulse'
              )}
            >
              {isLive ? (
                <>
                  <span className="relative flex h-2 w-2 mr-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                  </span>
                  LIVE
                </>
              ) : (
                'Connecting...'
              )}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              className="text-xs"
            >
              Refresh
            </Button>
          </div>
        </div>
      </AnimateOnScroll>

      {/* Real-Time Statistics */}
      <AnimateOnScroll delay="50ms">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* TVL */}
          <Card className="p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <DollarSign className="h-4 w-4 text-purple-500" />
              </div>
              <Badge variant="secondary" className="text-xs">
                TVL
              </Badge>
            </div>
            <h3 className="text-xl font-bold">{formatBTC(stats.tvl)}</h3>
            <p className="text-xs text-muted-foreground">Total Value Locked</p>
          </Card>

          {/* Active Users */}
          <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Users className="h-4 w-4 text-blue-500" />
              </div>
              <Badge variant="secondary" className="text-xs">
                Users
              </Badge>
            </div>
            <h3 className="text-xl font-bold">{formatNumber(stats.activeUsers)}</h3>
            <p className="text-xs text-muted-foreground">Active Savers</p>
          </Card>

          {/* Total Yields */}
          <Card className="p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <TrendingUp className="h-4 w-4 text-green-500" />
              </div>
              <Badge variant="secondary" className="text-xs">
                Yields
              </Badge>
            </div>
            <h3 className="text-xl font-bold">{formatBTC(stats.totalYieldsPaid)}</h3>
            <p className="text-xs text-muted-foreground">Total Yields Paid</p>
          </Card>

          {/* Events Today */}
          <Card className="p-4 bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <Activity className="h-4 w-4 text-orange-500" />
              </div>
              <Badge variant="secondary" className="text-xs">
                Today
              </Badge>
            </div>
            <h3 className="text-xl font-bold">{stats.eventsToday}</h3>
            <p className="text-xs text-muted-foreground">Events Today</p>
          </Card>
        </div>
      </AnimateOnScroll>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Position + Actions */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          <AnimateOnScroll delay="100ms">
            <PositionSimple />
          </AnimateOnScroll>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <AnimateOnScroll delay="200ms">
              <Deposits />
            </AnimateOnScroll>
            <AnimateOnScroll delay="250ms">
              <Withdraw />
            </AnimateOnScroll>
          </div>
        </div>

        {/* Right Column: Activity Feed */}
        <AnimateOnScroll delay="300ms">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Recent Activity</h3>
              <Badge variant="outline" className="text-xs">
                Live
              </Badge>
            </div>

            <ScrollArea className="h-[600px]">
              {recentActivity.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <Activity className="h-12 w-12 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">No recent activity</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Events will appear here in real-time
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentActivity.map((activity, idx) => (
                    <Card
                      key={`${activity.data.txHash}-${idx}`}
                      className="p-3 border hover:border-purple-500/50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-xl">
                          {activity.type === 'deposit'
                            ? '💰'
                            : activity.type === 'withdrawal'
                            ? '💸'
                            : activity.type === 'yieldClaimed'
                            ? '📈'
                            : activity.type === 'autoCompound'
                            ? '🔄'
                            : '🎁'}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-semibold text-sm">
                                {activity.type === 'deposit'
                                  ? 'Deposit Made'
                                  : activity.type === 'withdrawal'
                                  ? 'Withdrawal Made'
                                  : activity.type === 'yieldClaimed'
                                  ? 'Yield Claimed'
                                  : activity.type === 'autoCompound'
                                  ? 'Auto-Compound'
                                  : 'Referral Reward'}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {activity.type === 'deposit' &&
                                  formatBTC(activity.data.amount)}
                                {activity.type === 'withdrawal' &&
                                  formatBTC(activity.data.amount)}
                                {activity.type === 'yieldClaimed' &&
                                  formatBTC(activity.data.netYield)}
                                {activity.type === 'autoCompound' &&
                                  formatBTC(activity.data.amount)}
                                {activity.type === 'referralReward' &&
                                  formatBTC(activity.data.reward)}
                              </p>
                            </div>
                            <span className="text-xs text-muted-foreground shrink-0">
                              {timeAgo(activity.data.timestamp)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </Card>
        </AnimateOnScroll>
      </div>

      {/* Quick Deposit Button */}
      <Button className="fixed bottom-6 right-6 h-16 w-16 rounded-full bg-secondary text-secondary-foreground shadow-lg animate-pulse-glow hover:scale-110 transition-transform duration-300 z-50 flex items-center justify-center gap-2 group">
        <span className="text-2xl" role="img" aria-label="money bag emoji">
          💰
        </span>
        <span className="sr-only group-hover:not-sr-only group-hover:w-auto w-0 transition-all duration-300">
          Depósitar Rápido
        </span>
      </Button>
    </div>
  )
}
