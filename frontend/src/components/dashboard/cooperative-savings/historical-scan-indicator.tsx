/**
 * @fileoverview Historical scan progress indicator
 * @module components/dashboard/cooperative-savings/historical-scan-indicator
 *
 * Displays real-time progress for historical event scanning
 * Shows when the system is indexing past blockchain events
 */

'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Database, Loader2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react'
import { useHistoricalPoolEvents } from '@/hooks/web3/use-historical-pool-events'
import { cn } from '@/lib/utils'

/**
 * Props for HistoricalScanIndicator
 */
export interface HistoricalScanIndicatorProps {
  /** Optional className for styling */
  className?: string
  /** Show compact version (default: false) */
  compact?: boolean
  /** Enable manual rescan button (default: true) */
  showRescanButton?: boolean
}

/**
 * HistoricalScanIndicator - Visual feedback for historical event scanning
 *
 * Features:
 * - Real-time progress bar
 * - Status messages
 * - Event count display
 * - Manual rescan button
 * - Error handling UI
 * - Success confirmation
 *
 * @example
 * ```tsx
 * <HistoricalScanIndicator />
 * ```
 */
export function HistoricalScanIndicator({
  className,
  compact = false,
  showRescanButton = true,
}: HistoricalScanIndicatorProps = {}) {
  const {
    isScanning,
    progress,
    statusMessage,
    error,
    eventsFound,
    isInitialized,
    rescan,
  } = useHistoricalPoolEvents({
    verbose: true,
  })

  // Don't show anything if initialized successfully and not scanning
  if (isInitialized && !isScanning && !error) {
    return null
  }

  // Compact version - just a small status badge
  if (compact) {
    return (
      <div className={cn('flex items-center gap-2 text-sm', className)}>
        {isScanning && (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
            <span className="text-muted-foreground">Indexing blockchain events...</span>
          </>
        )}
        {error && (
          <>
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="text-red-400">Indexing error</span>
            {showRescanButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={rescan}
                className="h-6 px-2"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            )}
          </>
        )}
      </div>
    )
  }

  // Full version - detailed card
  return (
    <Card className={cn('border-primary/20 bg-card/50 backdrop-blur-sm', className)}>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {isScanning && (
                <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
              )}
              {error && (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              {!isScanning && !error && (
                <Database className="h-5 w-5 text-primary" />
              )}

              <div>
                <h3 className="font-semibold text-sm">
                  {isScanning && 'Indexing Historical Events'}
                  {error && 'Indexing Failed'}
                  {!isScanning && !error && 'Blockchain Indexing'}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isScanning && 'Scanning past blockchain events for complete pool data'}
                  {error && 'Failed to scan historical events'}
                  {!isScanning && !error && 'Preparing to scan blockchain history'}
                </p>
              </div>
            </div>

            {showRescanButton && !isScanning && (
              <Button
                variant="outline"
                size="sm"
                onClick={rescan}
                className="h-8"
              >
                <RefreshCw className="h-3 w-3 mr-2" />
                Rescan
              </Button>
            )}
          </div>

          {/* Progress Bar */}
          {isScanning && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{statusMessage}</span>
                <span className="font-medium text-primary">{progress}%</span>
              </div>
            </div>
          )}

          {/* Success State */}
          {!isScanning && !error && eventsFound > 0 && (
            <Alert className="bg-green-500/10 border-green-500/30">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-200 text-sm">
                <strong>Indexing Complete</strong>
                <br />
                Found {eventsFound} historical events
              </AlertDescription>
            </Alert>
          )}

          {/* Error State */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>Indexing Error</strong>
                <br />
                {error}
                <br />
                <button
                  onClick={rescan}
                  className="mt-2 text-xs underline hover:no-underline"
                >
                  Try again
                </button>
              </AlertDescription>
            </Alert>
          )}

          {/* Info Banner */}
          {isScanning && (
            <Alert className="bg-blue-500/10 border-blue-500/30">
              <Database className="h-4 w-4 text-blue-500" />
              <AlertDescription className="text-blue-200 text-xs">
                <strong>Why indexing?</strong> We scan past blockchain events to show you ALL pools,
                not just new ones. This happens once and is cached for better performance.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Export compact version as separate component for convenience
 */
export function HistoricalScanBadge(props: Omit<HistoricalScanIndicatorProps, 'compact'>) {
  return <HistoricalScanIndicator {...props} compact={true} />
}
