/**
 * @fileoverview V3 Position Display with Auto-Compound & Referrals
 * Production-ready component with all V3 features
 */

'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { useIndividualPoolSimple, formatMUSD, formatAPR } from '@/hooks/web3/use-individual-pool-simple'
import { useAutoCompound } from '@/hooks/web3/use-auto-compound'
import { useReferralSystem } from '@/hooks/web3/use-referral-system'
import { useClaimYields } from '@/hooks/web3/use-claim-yields'
import { TrendingUp, Wallet, Clock, Zap, Users, Gift, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { formatUnits } from 'viem'

export function PositionV3() {
  const { 
    userInfo, 
    hasActiveDeposit, 
    poolTVL,
    isLoading,
    error 
  } = useIndividualPoolSimple()

  const { 
    setAutoCompound, 
    isProcessing: isTogglingAutoCompound,
    txHash: autoCompoundTxHash 
  } = useAutoCompound()

  const {
    stats: referralStats,
    hasRewards: hasReferralRewards,
    claimRewards: claimReferralRewards,
    isProcessing: isClaimingReferral,
    txHash: referralTxHash
  } = useReferralSystem()

  const {
    claimYields,
    isProcessing: isClaimingYields,
    txHash: yieldsTxHash
  } = useClaimYields()

  const [showReferralLink, setShowReferralLink] = useState(false)

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

  const hasYields = userInfo && userInfo.netYields > 0n
  const autoCompoundEnabled = userInfo?.autoCompoundEnabled || false

  return (
    <div className="space-y-4">
      {/* Main Position Card */}
      <Card className="bg-gradient-to-br from-primary/10 via-card to-card border-2 border-primary shadow-lg shadow-primary/20">
        <CardContent className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-primary" />
                Tu Posición V3
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Pool TVL: {formatMUSD(poolTVL)} MUSD
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-500/20 border-green-500/50 text-green-500">
                ● Activo
              </Badge>
              {autoCompoundEnabled && (
                <Badge variant="outline" className="bg-blue-500/20 border-blue-500/50 text-blue-500">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Auto-Compound
                </Badge>
              )}
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

            {/* Yields */}
            <div className="p-4 rounded-lg bg-card/50 border border-green-500/30">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Zap className="h-4 w-4" />
                <span>Yields</span>
              </div>
              <p className="text-2xl font-bold text-green-500">
                {formatMUSD(userInfo?.netYields)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">MUSD neto (después de fees)</p>
            </div>

            {/* APR */}
            <div className="p-4 rounded-lg bg-card/50 border border-blue-500/30">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <TrendingUp className="h-4 w-4" />
                <span>APR</span>
              </div>
              <p className="text-2xl font-bold text-blue-500">
                {formatAPR(userInfo?.estimatedAPR || 0n)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Estimado</p>
            </div>

            {/* Days Active */}
            <div className="p-4 rounded-lg bg-card/50 border border-yellow-500/30">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Clock className="h-4 w-4" />
                <span>Tiempo</span>
              </div>
              <p className="text-2xl font-bold text-yellow-500">
                {userInfo?.daysActive.toString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Días activo</p>
            </div>
          </div>

          {/* Auto-Compound Toggle */}
          <div className="p-4 rounded-lg bg-card/30 border border-primary/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold text-white">Auto-Compounding</p>
                  <p className="text-xs text-muted-foreground">
                    Reinvierte tus yields automáticamente cuando superen 1 MUSD
                  </p>
                </div>
              </div>
              <Switch
                checked={autoCompoundEnabled}
                onCheckedChange={(checked) => setAutoCompound(checked)}
                disabled={isTogglingAutoCompound}
              />
            </div>
            {autoCompoundTxHash && (
              <p className="text-xs text-muted-foreground mt-2">
                <a 
                  href={`https://explorer.test.mezo.org/tx/${autoCompoundTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Ver transacción →
                </a>
              </p>
            )}
          </div>

          {/* Claim Yields Button */}
          {hasYields && (
            <Button
              onClick={() => claimYields()}
              disabled={isClaimingYields}
              className="w-full bg-green-500 hover:bg-green-600 text-white"
              size="lg"
            >
              <Zap className="h-4 w-4 mr-2" />
              {isClaimingYields ? 'Reclamando...' : `Reclamar ${formatMUSD(userInfo?.netYields)} MUSD`}
            </Button>
          )}
          {yieldsTxHash && (
            <p className="text-xs text-center text-muted-foreground">
              <a 
                href={`https://explorer.test.mezo.org/tx/${yieldsTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Ver transacción de yields →
              </a>
            </p>
          )}
        </CardContent>
      </Card>

      {/* Referral Card */}
      <Card className="bg-card border-2 border-purple-500/30">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-500" />
                Sistema de Referidos
              </h3>
              <p className="text-sm text-muted-foreground">
                Gana 0.5% de cada depósito de tus referidos
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowReferralLink(!showReferralLink)}
            >
              {showReferralLink ? 'Ocultar' : 'Ver Link'}
            </Button>
          </div>

          {showReferralLink && (
            <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
              <p className="text-xs text-muted-foreground mb-1">Tu link de referido:</p>
              <code className="text-xs text-purple-500 break-all">
                {typeof window !== 'undefined' ? `${window.location.origin}/?ref=${userInfo?.deposit}` : ''}
              </code>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-card/50 border border-purple-500/30">
              <p className="text-xs text-muted-foreground mb-1">Referidos</p>
              <p className="text-xl font-bold text-purple-500">
                {referralStats?.count.toString() || '0'}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-card/50 border border-purple-500/30">
              <p className="text-xs text-muted-foreground mb-1">Recompensas</p>
              <p className="text-xl font-bold text-purple-500">
                {referralStats ? formatUnits(referralStats.rewards, 18) : '0'} MUSD
              </p>
            </div>
          </div>

          {hasReferralRewards && (
            <Button
              onClick={() => claimReferralRewards()}
              disabled={isClaimingReferral}
              className="w-full bg-purple-500 hover:bg-purple-600 text-white"
            >
              <Gift className="h-4 w-4 mr-2" />
              {isClaimingReferral ? 'Reclamando...' : 'Reclamar Recompensas'}
            </Button>
          )}
          {referralTxHash && (
            <p className="text-xs text-center text-muted-foreground">
              <a 
                href={`https://explorer.test.mezo.org/tx/${referralTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Ver transacción de referidos →
              </a>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
