/**
 * @fileoverview My Pools V3 - Manage Pool Memberships
 * View and manage all pools where user is a member
 */

'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useCooperativePool, usePoolInfo, useMemberInfo, PoolStatus } from '@/hooks/web3/use-cooperative-pool'
import { Users, TrendingUp, LogOut, DollarSign, Info, Loader2, AlertTriangle, CheckCircle2, Clock } from 'lucide-react'
import { formatEther } from 'viem'
import { useAccount } from 'wagmi'

export function MyPoolsV3() {
  const { address } = useAccount()
  const { poolCounter, claimYield, leavePool, state, error, txHash, isProcessing, reset } = useCooperativePool()

  const [selectedAction, setSelectedAction] = useState<{ poolId: number; type: 'claim' | 'leave' } | null>(null)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)

  const poolIds = useMemo(() => {
    const ids: number[] = []
    for (let i = 1; i <= poolCounter; i++) {
      ids.push(i)
    }
    return ids
  }, [poolCounter])

  const handleClaimYield = async (poolId: number) => {
    setSelectedAction({ poolId, type: 'claim' })
    await claimYield(poolId)
  }

  const handleLeavePool = async (poolId: number) => {
    setSelectedAction({ poolId, type: 'leave' })
  }

  const confirmLeavePool = async () => {
    if (selectedAction?.type === 'leave') {
      await leavePool(selectedAction.poolId)
    }
  }

  const handleCloseDialog = () => {
    setSelectedAction(null)
    reset()
  }

  if (state === 'success' && !showSuccessDialog) {
    setShowSuccessDialog(true)
  }

  const myPools = poolIds.filter((poolId) => {
    return true
  })

  if (poolCounter === 0) {
    return (
      <Card className="bg-card border-2 border-muted">
        <CardContent className="p-12 text-center">
          <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-bold text-foreground mb-2">No hay pools disponibles</h3>
          <p className="text-muted-foreground mb-4">
            Crea o únete a un pool cooperativo para empezar
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {myPools.map((poolId) => (
          <MyPoolCard
            key={poolId}
            poolId={poolId}
            onClaimYield={handleClaimYield}
            onLeavePool={handleLeavePool}
            isProcessing={isProcessing && selectedAction?.poolId === poolId}
          />
        ))}
      </div>

      <Dialog open={selectedAction?.type === 'leave'} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Salir del Pool?</DialogTitle>
            <DialogDescription>
              Recibirás tu contribución de BTC más los yields generados. Esta acción es irreversible.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isProcessing && (
            <Alert className="bg-yellow-500/10 border-yellow-500/30">
              <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />
              <AlertDescription className="text-yellow-200">
                {state === 'executing' && 'Confirma la transacción en tu wallet...'}
                {state === 'processing' && 'Procesando salida del pool...'}
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog} disabled={isProcessing}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmLeavePool} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                'Confirmar Salida'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-2" />
            <DialogTitle className="text-center text-green-500">
              {selectedAction?.type === 'claim' ? '¡Yields Reclamados!' : '¡Saliste del Pool!'}
            </DialogTitle>
            <DialogDescription className="text-center">
              {selectedAction?.type === 'claim'
                ? 'Tus yields han sido transferidos a tu wallet'
                : 'Tu contribución y yields han sido transferidos a tu wallet'}
            </DialogDescription>
          </DialogHeader>

          {txHash && (
            <div className="text-center">
              <a
                href={`https://explorer.test.mezo.org/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline text-sm"
              >
                Ver transacción →
              </a>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => {
              setShowSuccessDialog(false)
              handleCloseDialog()
            }}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

interface MyPoolCardProps {
  poolId: number
  onClaimYield: (poolId: number) => void
  onLeavePool: (poolId: number) => void
  isProcessing: boolean
}

function MyPoolCard({ poolId, onClaimYield, onLeavePool, isProcessing }: MyPoolCardProps) {
  const { address } = useAccount()
  const { poolInfo, isLoading: isLoadingPool } = usePoolInfo(poolId)
  const { memberInfo, isLoading: isLoadingMember } = useMemberInfo(poolId, address)

  if (isLoadingPool || isLoadingMember) {
    return (
      <Card className="bg-card border border-muted">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!poolInfo || !memberInfo || !memberInfo.active) {
    return null
  }

  const statusConfig = getStatusConfig(poolInfo.status)
  const totalShares = poolInfo.totalBtcDeposited
  const memberSharePercentage = totalShares > 0n 
    ? (Number(memberInfo.shares) / Number(totalShares)) * 100 
    : 0

  const estimatedYield = totalShares > 0n && poolInfo.totalYieldGenerated > 0n
    ? (poolInfo.totalYieldGenerated * memberInfo.shares) / totalShares
    : 0n

  const hasYieldToClaim = estimatedYield > 0n
  const daysSinceMembership = Math.floor((Date.now() / 1000 - memberInfo.joinedAt) / 86400)

  return (
    <Card className={`bg-card border-2 ${statusConfig.borderColor} hover:shadow-lg transition-shadow`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-lg">{poolInfo?.name || `Pool #${poolId}`}</CardTitle>
              <Badge className={`${statusConfig.bgColor} ${statusConfig.textColor} border-0`}>
                {statusConfig.label}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Pool #{poolId} · Miembro desde hace {daysSinceMembership} días
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium text-primary">Mi Contribución</span>
            </div>
            <p className="text-sm font-bold text-foreground">
              {parseFloat(formatEther(memberInfo.btcContributed)).toFixed(4)} BTC
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {memberSharePercentage.toFixed(2)}% del pool
            </p>
          </div>

          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-3.5 w-3.5 text-green-500" />
              <span className="text-xs font-medium text-green-500">Yields Estimados</span>
            </div>
            <p className="text-sm font-bold text-foreground">
              {parseFloat(formatEther(estimatedYield)).toFixed(4)} MUSD
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {parseFloat(formatEther(memberInfo.yieldClaimed)).toFixed(4)} reclamado
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total del Pool</span>
            <span className="font-medium">{parseFloat(formatEther(poolInfo.totalBtcDeposited)).toFixed(4)} BTC</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Miembros Activos</span>
            <span className="font-medium">{poolInfo.currentMembers} / {poolInfo.maxMembers}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Mis Shares</span>
            <span className="font-medium">{formatEther(memberInfo.shares)}</span>
          </div>
        </div>

        {hasYieldToClaim && (
          <Alert className="bg-green-500/10 border-green-500/30 p-3">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-200 text-xs">
              <strong className="text-green-400">Yields disponibles!</strong> Puedes reclamarlos sin retirar tu principal.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <Button
            onClick={() => onClaimYield(poolId)}
            disabled={!hasYieldToClaim || isProcessing}
            className="flex-1"
            variant={hasYieldToClaim ? 'default' : 'outline'}
            size="sm"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <DollarSign className="h-3 w-3 mr-2" />
                Reclamar Yields
              </>
            )}
          </Button>

          <Button
            onClick={() => onLeavePool(poolId)}
            disabled={isProcessing}
            variant="destructive"
            size="sm"
          >
            <LogOut className="h-3 w-3 mr-2" />
            Salir
          </Button>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-muted">
          <Info className="h-3 w-3" />
          <span>
            Al salir recibirás tu BTC + yields. Puedes reclamar yields sin salir del pool.
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

function getStatusConfig(status: PoolStatus) {
  switch (status) {
    case PoolStatus.ACCEPTING:
      return {
        label: 'Aceptando',
        bgColor: 'bg-blue-500/20',
        textColor: 'text-blue-400',
        borderColor: 'border-blue-500/50'
      }
    case PoolStatus.ACTIVE:
      return {
        label: 'Activo',
        bgColor: 'bg-green-500/20',
        textColor: 'text-green-400',
        borderColor: 'border-green-500/50'
      }
    case PoolStatus.CLOSED:
      return {
        label: 'Cerrado',
        bgColor: 'bg-gray-500/20',
        textColor: 'text-gray-400',
        borderColor: 'border-gray-500/50'
      }
    default:
      return {
        label: 'Desconocido',
        bgColor: 'bg-gray-500/20',
        textColor: 'text-gray-400',
        borderColor: 'border-gray-500/50'
      }
  }
}
