/**
 * @fileoverview Simple Position Display - Production Ready
 * Shows user's actual deposit from blockchain
 */

'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useIndividualPoolSimple, formatMUSD, formatAPR } from '@/hooks/web3/use-individual-pool-simple'
import { TrendingUp, Wallet, Clock, Zap } from 'lucide-react'

export function PositionSimple() {
  const { 
    userInfo, 
    hasActiveDeposit, 
    poolTVL,
    isLoading,
    error 
  } = useIndividualPoolSimple()

  if (isLoading) {
    return (
      <Card className="bg-card border-2 border-primary">
        <CardContent className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-6 w-48" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="bg-card border-2 border-red-500/50">
        <CardContent className="p-6">
          <div className="text-center space-y-2">
            <p className="text-red-500 font-semibold">Error al cargar datos</p>
            <p className="text-sm text-muted-foreground">
              {error instanceof Error ? error.message : 'Error desconocido'}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!hasActiveDeposit) {
    return (
      <Card className="bg-card border-2 border-primary/50">
        <CardContent className="p-6 text-center">
          <div className="text-4xl mb-3">📊</div>
          <p className="text-muted-foreground mb-2">No tienes depósitos activos</p>
          <p className="text-sm text-muted-foreground">
            Haz tu primer depósito para comenzar a generar rendimientos
          </p>
        </CardContent>
      </Card>
    )
  }

  // User has deposits!
  return (
    <Card className="bg-gradient-to-br from-primary/10 via-card to-card border-2 border-primary shadow-lg shadow-primary/20">
      <CardContent className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-primary" />
              Tu Posición
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Pool TVL: {formatMUSD(poolTVL)} MUSD
            </p>
          </div>
          <div className="px-4 py-2 rounded-full bg-green-500/20 border border-green-500/50">
            <span className="text-green-500 font-semibold text-sm">● Activo</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Principal */}
          <div className="p-4 rounded-lg bg-card/50 border border-primary/30">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Wallet className="h-4 w-4" />
              <span>Principal</span>
            </div>
            <p className="text-2xl font-bold text-primary">
              {formatMUSD(userInfo?.deposit)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">MUSD</p>
          </div>

          {/* Net Yields */}
          <div className="p-4 rounded-lg bg-card/50 border border-green-500/30">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <TrendingUp className="h-4 w-4" />
              <span>Rendimientos</span>
            </div>
            <p className="text-2xl font-bold text-green-500">
              +{formatMUSD(userInfo?.netYields)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">MUSD (neto)</p>
          </div>

          {/* Total Balance */}
          <div className="p-4 rounded-lg bg-card/50 border border-blue-500/30">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Zap className="h-4 w-4" />
              <span>Balance Total</span>
            </div>
            <p className="text-2xl font-bold text-blue-500">
              {formatMUSD((userInfo?.deposit || BigInt(0)) + (userInfo?.netYields || BigInt(0)))}
            </p>
            <p className="text-xs text-muted-foreground mt-1">MUSD</p>
          </div>

          {/* APR */}
          <div className="p-4 rounded-lg bg-card/50 border border-yellow-500/30">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Clock className="h-4 w-4" />
              <span>APR Estimado</span>
            </div>
            <p className="text-2xl font-bold text-yellow-500">
              {formatAPR(userInfo?.estimatedAPR || BigInt(0))}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {userInfo?.daysActive.toString()} días activo
            </p>
          </div>
        </div>

        {/* Auto-compound badge */}
        {userInfo?.autoCompoundEnabled && (
          <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
            <Zap className="h-4 w-4 text-purple-500" />
            <span className="text-sm text-purple-400 font-medium">
              Auto-compound activado
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
