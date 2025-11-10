/**
 * @fileoverview SyncIndicator - Real-time synchronization status indicator
 * Shows users when data is being synced with blockchain
 */

'use client'

import { useIsFetching, useIsMutating } from '@tanstack/react-query'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SyncIndicatorProps {
  className?: string
  showText?: boolean
}

export function SyncIndicator({ className, showText = true }: SyncIndicatorProps) {
  const isFetching = useIsFetching({ queryKey: ['cooperative-pool'] })
  const isMutating = useIsMutating()

  const isLoading = isFetching > 0 || isMutating > 0

  if (!isLoading) {
    return (
      <div className={cn(
        "flex items-center gap-2 text-xs text-green-500",
        className
      )}>
        <CheckCircle2 className="h-3 w-3" />
        {showText && <span>Sincronizado</span>}
      </div>
    )
  }

  return (
    <div className={cn(
      "flex items-center gap-2 text-xs text-yellow-500",
      className
    )}>
      <Loader2 className="h-3 w-3 animate-spin" />
      {showText && <span>Sincronizando...</span>}
    </div>
  )
}

/**
 * Floating sync indicator for page-level status
 */
export function FloatingSyncIndicator() {
  const isFetching = useIsFetching({ queryKey: ['cooperative-pool'] })
  const isMutating = useIsMutating()

  const isLoading = isFetching > 0 || isMutating > 0

  if (!isLoading) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-card border border-primary/30 rounded-full px-4 py-2 shadow-lg animate-in fade-in slide-in-from-bottom-5">
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 text-primary animate-spin" />
        <span className="text-sm font-medium text-primary">
          Sincronizando con blockchain...
        </span>
      </div>
    </div>
  )
}

/**
 * Inline sync status with details
 */
interface DetailedSyncIndicatorProps {
  poolCounter?: number
  lastUpdate?: Date
}

export function DetailedSyncIndicator({
  poolCounter,
  lastUpdate
}: DetailedSyncIndicatorProps) {
  const isFetching = useIsFetching({ queryKey: ['cooperative-pool'] })
  const isLoading = isFetching > 0

  return (
    <div className="flex items-center gap-4 text-xs text-muted-foreground">
      {isLoading ? (
        <div className="flex items-center gap-2 text-yellow-500">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Actualizando datos...</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-green-500">
          <CheckCircle2 className="h-3 w-3" />
          <span>Datos actualizados</span>
        </div>
      )}

      {poolCounter !== undefined && (
        <span>
          {poolCounter} {poolCounter === 1 ? 'pool' : 'pools'} totales
        </span>
      )}

      {lastUpdate && (
        <span>
          Última actualización: {lastUpdate.toLocaleTimeString()}
        </span>
      )}
    </div>
  )
}
