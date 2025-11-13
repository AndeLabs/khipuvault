/**
 * @fileoverview Real-Time Connection Status Badge
 * @module components/dashboard/cooperative-savings/realtime-status-badge
 *
 * Premium UI component showing real-time connection status with:
 * - Animated pulse effect when live
 * - Connection statistics tooltip
 * - Color-coded status indicators
 * - Smooth animations
 */

'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Radio, Activity, RefreshCw, Zap } from 'lucide-react'
import { useRealtimePoolEvents, requestNotificationPermission } from '@/hooks/web3/use-realtime-pool-events'
import { cn } from '@/lib/utils'

/**
 * Props for RealtimeStatusBadge
 */
export interface RealtimeStatusBadgeProps {
  /** Optional className */
  className?: string
  /** Show detailed stats */
  showStats?: boolean
  /** Show notification button */
  showNotificationButton?: boolean
  /** Compact mode */
  compact?: boolean
}

/**
 * RealtimeStatusBadge - Premium status indicator
 *
 * Features:
 * ✅ Live pulse animation
 * ✅ Connection statistics
 * ✅ Notification permissions
 * ✅ Manual refresh button
 * ✅ Responsive design
 *
 * @example
 * ```tsx
 * <RealtimeStatusBadge showStats showNotificationButton />
 * ```
 */
export function RealtimeStatusBadge({
  className,
  showStats = true,
  showNotificationButton = true,
  compact = false,
}: RealtimeStatusBadgeProps) {
  const { isLive, stats, latestEvent, refresh } = useRealtimePoolEvents({
    verbose: false,
  })

  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Check notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted')
    }
  }, [])

  /**
   * Handle notification permission request
   */
  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission()
    setNotificationsEnabled(granted)

    if (granted) {
      new Notification('🔔 Notifications Enabled!', {
        body: "You'll receive alerts for new cooperative pools",
        icon: '/logo.png',
      })
    }
  }

  /**
   * Handle manual refresh
   */
  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refresh()
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  /**
   * Format uptime
   */
  const formatUptime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) return `${hours}h ${minutes % 60}m`
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`
    return `${seconds}s`
  }

  /**
   * Format time ago
   */
  const formatTimeAgo = (timestamp: number | null): string => {
    if (!timestamp) return 'Never'

    const seconds = Math.floor((Date.now() - timestamp) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ago`
  }

  // Compact version
  if (compact) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className="relative">
          <Radio
            className={cn(
              'h-4 w-4 transition-colors',
              isLive ? 'text-green-500' : 'text-gray-500'
            )}
          />
          {isLive && (
            <span className="absolute inset-0 animate-ping">
              <Radio className="h-4 w-4 text-green-500 opacity-75" />
            </span>
          )}
        </div>
        <span className={cn('text-sm font-medium', isLive ? 'text-green-500' : 'text-gray-500')}>
          {isLive ? 'LIVE' : 'OFFLINE'}
        </span>
      </div>
    )
  }

  // Full version with tooltip
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant={isLive ? 'default' : 'secondary'}
              className={cn(
                'relative cursor-pointer transition-all hover:scale-105',
                isLive
                  ? 'bg-green-500/20 text-green-500 border-green-500/50 hover:bg-green-500/30'
                  : 'bg-gray-500/20 text-gray-500 border-gray-500/50'
              )}
            >
              <div className="relative flex items-center gap-2">
                <div className="relative">
                  <Radio className="h-3 w-3" />
                  {isLive && (
                    <span className="absolute inset-0 animate-ping">
                      <Radio className="h-3 w-3 opacity-75" />
                    </span>
                  )}
                </div>
                <span className="font-semibold">{isLive ? 'LIVE' : 'OFFLINE'}</span>
                {isLive && <Zap className="h-3 w-3 animate-pulse" />}
              </div>
            </Badge>
          </TooltipTrigger>
          {showStats && (
            <TooltipContent side="bottom" className="w-64 p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <span className="text-sm font-semibold flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Real-Time Connection
                  </span>
                  <Badge variant={isLive ? 'default' : 'secondary'} className="text-xs">
                    {isLive ? '🟢 Live' : '🔴 Offline'}
                  </Badge>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Events Today:</span>
                    <span className="font-semibold">{stats.eventsToday}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Events This Hour:</span>
                    <span className="font-semibold">{stats.eventsThisHour}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Received:</span>
                    <span className="font-semibold">{stats.totalEventsReceived}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Event:</span>
                    <span className="font-semibold">{formatTimeAgo(stats.lastEventAt)}</span>
                  </div>
                  {isLive && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Uptime:</span>
                      <span className="font-semibold text-green-500">
                        {formatUptime(stats.connectionUptime)}
                      </span>
                    </div>
                  )}
                </div>

                {latestEvent && (
                  <div className="border-t border-border pt-2">
                    <p className="text-xs text-muted-foreground mb-1">Latest Pool:</p>
                    <p className="text-xs font-semibold truncate">{latestEvent.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Pool #{Number(latestEvent.poolId)}
                    </p>
                  </div>
                )}
              </div>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>

      {/* Action buttons */}
      <div className="flex items-center gap-1">
        {/* Refresh button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="h-7 w-7 p-0"
        >
          <RefreshCw className={cn('h-3 w-3', isRefreshing && 'animate-spin')} />
        </Button>

        {/* Notification button */}
        {showNotificationButton && 'Notification' in window && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleEnableNotifications}
                  disabled={notificationsEnabled}
                  className={cn(
                    'h-7 w-7 p-0',
                    notificationsEnabled && 'text-green-500'
                  )}
                >
                  🔔
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">
                  {notificationsEnabled
                    ? 'Notifications enabled'
                    : 'Click to enable notifications'}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  )
}

/**
 * Minimal live indicator dot
 */
export function LiveIndicatorDot({ className }: { className?: string }) {
  const { isLive } = useRealtimePoolEvents({ verbose: false })

  return (
    <div className={cn('relative', className)}>
      <div
        className={cn(
          'h-2 w-2 rounded-full transition-colors',
          isLive ? 'bg-green-500' : 'bg-gray-500'
        )}
      />
      {isLive && (
        <div className="absolute inset-0 animate-ping">
          <div className="h-2 w-2 rounded-full bg-green-500 opacity-75" />
        </div>
      )}
    </div>
  )
}
