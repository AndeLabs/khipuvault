/**
 * @fileoverview Real-Time Analytics Dashboard
 * @module components/dashboard/cooperative-savings/realtime-analytics-dashboard
 *
 * Premium analytics dashboard with:
 * - Live event statistics
 * - Trend indicators
 * - Activity feed
 * - Performance metrics
 * - Beautiful data visualizations
 */

'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  TrendingUp,
  TrendingDown,
  Users,
  Activity,
  Zap,
  Clock,
  BarChart3,
  Circle,
} from 'lucide-react'
import { useRealtimePoolEvents } from '@/hooks/web3/use-realtime-pool-events'
import { useCooperativePools } from '@/hooks/web3/use-cooperative-pools'
import { cn } from '@/lib/utils'

/**
 * Props for RealtimeAnalyticsDashboard
 */
export interface RealtimeAnalyticsDashboardProps {
  /** Optional className */
  className?: string
  /** Show mini version */
  mini?: boolean
}

/**
 * RealtimeAnalyticsDashboard - Enterprise analytics display
 *
 * Features:
 * ✅ Live event statistics
 * ✅ Trend analysis
 * ✅ Activity feed with animations
 * ✅ Performance metrics
 * ✅ Beautiful gradient cards
 *
 * @example
 * ```tsx
 * <RealtimeAnalyticsDashboard />
 * ```
 */
export function RealtimeAnalyticsDashboard({
  className,
  mini = false,
}: RealtimeAnalyticsDashboardProps) {
  const { stats, recentEvents, isLive } = useRealtimePoolEvents({ verbose: false })
  const { pools, poolCounter, isLoading } = useCooperativePools()

  /**
   * Calculate trends
   */
  const trends = useMemo(() => {
    const now = Date.now()
    const hourAgo = now - 60 * 60 * 1000
    const lastHourEvents = recentEvents.filter((e) => Number(e.timestamp) * 1000 > hourAgo).length
    const previousHourEvents = recentEvents.filter(
      (e) =>
        Number(e.timestamp) * 1000 > hourAgo - 60 * 60 * 1000 &&
        Number(e.timestamp) * 1000 <= hourAgo
    ).length

    const hourlyTrend =
      previousHourEvents > 0
        ? ((lastHourEvents - previousHourEvents) / previousHourEvents) * 100
        : lastHourEvents > 0
        ? 100
        : 0

    return {
      hourly: hourlyTrend,
      isUp: hourlyTrend > 0,
      isFlat: hourlyTrend === 0,
    }
  }, [recentEvents])

  /**
   * Format time ago
   */
  const formatTimeAgo = (timestamp: bigint): string => {
    const seconds = Math.floor((Date.now() - Number(timestamp) * 1000) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  // Mini version
  if (mini) {
    return (
      <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-3', className)}>
        {/* Total Pools */}
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Pools</p>
                <p className="text-2xl font-bold text-blue-500">{poolCounter}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500/30" />
            </div>
          </CardContent>
        </Card>

        {/* Events Today */}
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Today</p>
                <p className="text-2xl font-bold text-green-500">{stats.eventsToday}</p>
              </div>
              <Activity className="h-8 w-8 text-green-500/30" />
            </div>
          </CardContent>
        </Card>

        {/* This Hour */}
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">This Hour</p>
                <p className="text-2xl font-bold text-purple-500">{stats.eventsThisHour}</p>
              </div>
              <Clock className="h-8 w-8 text-purple-500/30" />
            </div>
          </CardContent>
        </Card>

        {/* Status */}
        <Card
          className={cn(
            'bg-gradient-to-br border transition-colors',
            isLive
              ? 'from-green-500/10 to-green-600/5 border-green-500/20'
              : 'from-gray-500/10 to-gray-600/5 border-gray-500/20'
          )}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <p className={cn('text-2xl font-bold', isLive ? 'text-green-500' : 'text-gray-500')}>
                  {isLive ? 'LIVE' : 'OFF'}
                </p>
              </div>
              <div className="relative">
                <Zap className={cn('h-8 w-8', isLive ? 'text-green-500/30' : 'text-gray-500/30')} />
                {isLive && (
                  <div className="absolute inset-0 animate-ping">
                    <Zap className="h-8 w-8 text-green-500/50" />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Full version
  return (
    <div className={cn('space-y-4', className)}>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Pools */}
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20 hover:border-blue-500/40 transition-all">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span>Total Pools</span>
              <Users className="h-4 w-4 text-blue-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-blue-500">{poolCounter}</p>
              <p className="text-xs text-muted-foreground">
                {isLoading ? 'Loading...' : 'Active cooperative pools'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Events Today */}
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20 hover:border-green-500/40 transition-all">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span>Events Today</span>
              <Activity className="h-4 w-4 text-green-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-green-500">{stats.eventsToday}</p>
                {trends.isUp && (
                  <Badge variant="default" className="bg-green-500/20 text-green-500 text-xs">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +{Math.abs(Math.round(trends.hourly))}%
                  </Badge>
                )}
                {!trends.isUp && !trends.isFlat && (
                  <Badge variant="secondary" className="text-xs">
                    <TrendingDown className="h-3 w-3 mr-1" />
                    {Math.abs(Math.round(trends.hourly))}%
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Pool creation events</p>
            </div>
          </CardContent>
        </Card>

        {/* Events This Hour */}
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20 hover:border-purple-500/40 transition-all">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span>This Hour</span>
              <Clock className="h-4 w-4 text-purple-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-purple-500">{stats.eventsThisHour}</p>
              <p className="text-xs text-muted-foreground">
                {stats.eventsThisHour > 0 ? 'Active creation period' : 'Waiting for activity'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Live Status */}
        <Card
          className={cn(
            'bg-gradient-to-br border transition-all',
            isLive
              ? 'from-green-500/10 to-green-600/5 border-green-500/20 hover:border-green-500/40'
              : 'from-gray-500/10 to-gray-600/5 border-gray-500/20'
          )}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span>Connection</span>
              <div className="relative">
                <Circle
                  className={cn('h-4 w-4', isLive ? 'text-green-500 fill-green-500' : 'text-gray-500')}
                />
                {isLive && (
                  <div className="absolute inset-0 animate-ping">
                    <Circle className="h-4 w-4 text-green-500 fill-green-500 opacity-50" />
                  </div>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className={cn('text-3xl font-bold', isLive ? 'text-green-500' : 'text-gray-500')}>
                {isLive ? 'LIVE' : 'OFFLINE'}
              </p>
              <p className="text-xs text-muted-foreground">
                {isLive ? 'Real-time updates active' : 'Reconnecting...'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Feed */}
      <Card className="bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Recent Activity
          </CardTitle>
          <CardDescription>Live feed of pool creation events</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            {recentEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <Activity className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No recent events</p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Waiting for new pool creations...
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentEvents.map((event, index) => (
                  <div
                    key={`${event.transactionHash}-${index}`}
                    className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-colors animate-in fade-in slide-in-from-left-5"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="relative mt-1">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <div className="absolute inset-0 animate-ping">
                        <div className="h-2 w-2 rounded-full bg-green-500 opacity-75" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm truncate">{event.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Pool #{Number(event.poolId)} • Created by{' '}
                            {event.creator.slice(0, 6)}...{event.creator.slice(-4)}
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {formatTimeAgo(event.timestamp)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
