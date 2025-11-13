/**
 * @fileoverview Rewards Card Component - Display and claim Stability Pool rewards
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Gift, TrendingUp, Calendar, Percent } from 'lucide-react'
import { useStabilityPool, formatSharePercentage } from '@/hooks/web3/use-stability-pool'
import { formatEther } from 'viem'
import { TransactionLink } from '@/components/ui/transaction-link'

export function RewardsCard() {
  const {
    position,
    hasPosition,
    stats,
    claimRewards,
    isClaiming,
    isClaimConfirmed,
    claimTxHash,
    isConnected,
  } = useStabilityPool()

  if (!isConnected) {
    return (
      <Card className="bg-card border border-primary/20 shadow-custom">
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            Conecta tu billetera para ver tus recompensas
          </p>
        </CardContent>
      </Card>
    )
  }

  if (!hasPosition) {
    return (
      <Card className="bg-card border border-primary/20 shadow-custom">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <Gift className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold mb-2">No tienes recompensas aún</h3>
              <p className="text-sm text-muted-foreground">
                Deposita MUSD en el Stability Pool para empezar a ganar BTC
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card border border-primary/20 shadow-custom">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Tu Posición en Stability Pool</span>
          <Badge className="bg-green-500">
            Activo
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Deposited Amount */}
        <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            <p className="text-sm text-muted-foreground">MUSD Depositado</p>
          </div>
          <p className="text-3xl font-bold text-blue-500">
            {Number(formatEther(position.musdValue)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            ≈ ${Number(formatEther(position.musdValue)).toLocaleString('en-US', { maximumFractionDigits: 2 })} USD
          </p>
        </div>

        {/* Pending Rewards */}
        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-green-500" />
              <p className="text-sm text-muted-foreground">Recompensas Pendientes (BTC)</p>
            </div>
          </div>
          <p className="text-3xl font-bold text-green-500">
            {Number(formatEther(position.pendingCollateralGains)).toFixed(5)} BTC
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            ≈ ${(Number(formatEther(position.pendingCollateralGains)) * 100000).toLocaleString('en-US', { maximumFractionDigits: 2 })} USD
          </p>
        </div>

        {/* Claim Button */}
        {position.pendingCollateralGains > 0n && !isClaimConfirmed && (
          <Button
            onClick={claimRewards}
            disabled={isClaiming}
            className="w-full h-12 text-lg font-semibold bg-green-500 hover:bg-green-600"
            size="lg"
          >
            {isClaiming ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Reclamando...
              </>
            ) : (
              'Reclamar Recompensas'
            )}
          </Button>
        )}

        {/* Claim Success */}
        {isClaimConfirmed && claimTxHash && (
          <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
            <p className="text-sm font-semibold text-green-500 mb-2">¡Recompensas Reclamadas!</p>
            <TransactionLink txHash={claimTxHash} label="Ver transacción" />
          </div>
        )}

        {/* Position Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
            <div className="flex items-center gap-2 mb-1">
              <Percent className="w-4 h-4 text-primary" />
              <p className="text-xs text-muted-foreground">Tu Participación</p>
            </div>
            <p className="text-lg font-bold">
              {formatSharePercentage(position.sharePercentage)}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-primary" />
              <p className="text-xs text-muted-foreground">Días Activo</p>
            </div>
            <p className="text-lg font-bold">
              {position.daysActive}
            </p>
          </div>
        </div>

        {/* Pool Info */}
        <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
          <p className="text-sm font-semibold mb-3">Información del Pool</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">TVL Total:</span>
              <span className="font-bold">
                {Number(formatEther(stats.tvl)).toLocaleString('en-US', { maximumFractionDigits: 0 })} MUSD
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">APY Estimado:</span>
              <span className="font-bold text-green-500">
                {stats.estimatedAPY.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tus Shares:</span>
              <span className="font-bold">
                {Number(formatEther(position.shares)).toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="text-xs text-muted-foreground text-center">
          Las recompensas se generan cuando posiciones de préstamo son liquidadas.
          Puedes reclamarlas en cualquier momento.
        </div>
      </CardContent>
    </Card>
  )
}
