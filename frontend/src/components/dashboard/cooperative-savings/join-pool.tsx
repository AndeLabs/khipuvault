/**
 * @fileoverview Join Pool V3 - Join Cooperative Pools with Native BTC
 * Form for contributing to existing pools
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { useCooperativePool, usePoolInfo, PoolStatus } from '@/hooks/web3/use-cooperative-pool'
import { Users, TrendingUp, AlertTriangle, Info, Loader2, CheckCircle2, ArrowLeft } from 'lucide-react'
import { formatEther, parseEther } from 'viem'
import { useAccount, useBalance } from 'wagmi'

interface JoinPoolV3Props {
  poolId: number
  onBack?: () => void
  onSuccess?: () => void
}

export function JoinPoolV3({ poolId, onBack, onSuccess }: JoinPoolV3Props) {
  const { address } = useAccount()
  const { joinPool, state, error, txHash, isProcessing, reset } = useCooperativePool()
  const { poolInfo, isLoading: isLoadingPool } = usePoolInfo(poolId)

  const { data: btcBalance } = useBalance({
    address,
  })

  const [btcAmount, setBtcAmount] = useState('')
  const [validationError, setValidationError] = useState('')

  useEffect(() => {
    if (state === 'success') {
      const timer = setTimeout(() => {
        onSuccess?.()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [state, onSuccess])

  const validateAmount = (): boolean => {
    if (!poolInfo) {
      setValidationError('Pool no encontrado')
      return false
    }

    if (!btcAmount || parseFloat(btcAmount) <= 0) {
      setValidationError('Ingresa un monto válido')
      return false
    }

    const amount = parseEther(btcAmount)
    const min = poolInfo.minContribution
    const max = poolInfo.maxContribution

    if (amount < min) {
      setValidationError(`Mínimo ${formatEther(min)} BTC`)
      return false
    }

    if (amount > max) {
      setValidationError(`Máximo ${formatEther(max)} BTC`)
      return false
    }

    if (btcBalance && amount > btcBalance.value) {
      setValidationError('Balance insuficiente')
      return false
    }

    setValidationError('')
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateAmount()) return

    await joinPool(poolId, btcAmount)
  }

  const handleSetMax = () => {
    if (!btcBalance || !poolInfo) return
    
    const maxAllowed = poolInfo.maxContribution
    const userBalance = btcBalance.value
    const gasReserve = parseEther('0.0001')
    
    const availableBalance = userBalance > gasReserve ? userBalance - gasReserve : 0n
    const amount = availableBalance < maxAllowed ? availableBalance : maxAllowed
    
    setBtcAmount(formatEther(amount))
  }

  const handleReset = () => {
    reset()
    setBtcAmount('')
    setValidationError('')
  }

  if (isLoadingPool) {
    return (
      <Card className="bg-card border-2 border-muted">
        <CardContent className="p-12 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando información del pool...</p>
        </CardContent>
      </Card>
    )
  }

  if (!poolInfo) {
    return (
      <Card className="bg-card border-2 border-red-500/50">
        <CardContent className="p-12 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-foreground mb-2">Pool no encontrado</h3>
          <p className="text-muted-foreground mb-4">
            El pool #{poolId} no existe o ha sido eliminado
          </p>
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </CardContent>
      </Card>
    )
  }

  const canJoin = poolInfo.allowNewMembers && 
                  poolInfo.currentMembers < poolInfo.maxMembers &&
                  poolInfo.status === PoolStatus.ACCEPTING

  if (!canJoin) {
    return (
      <Card className="bg-card border-2 border-yellow-500/50">
        <CardContent className="p-12 text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-foreground mb-2">Pool no disponible</h3>
          <p className="text-muted-foreground mb-4">
            {poolInfo.status === PoolStatus.CLOSED
              ? 'Este pool está cerrado y no acepta nuevos miembros'
              : poolInfo.currentMembers >= poolInfo.maxMembers
              ? 'Este pool está lleno'
              : 'Este pool no está aceptando nuevos miembros'}
          </p>
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a la lista
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (state === 'success') {
    return (
      <Card className="bg-gradient-to-br from-green-500/10 via-card to-card border-2 border-green-500/50">
        <CardContent className="p-12 text-center">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-green-500 mb-2">¡Te uniste exitosamente!</h2>
          <p className="text-muted-foreground mb-4">
            Ahora eres miembro del pool <strong>{poolInfo.name}</strong>
          </p>
          {txHash && (
            <a
              href={`https://explorer.test.mezo.org/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline text-sm block mb-4"
            >
              Ver transacción →
            </a>
          )}
          <div className="flex gap-3 justify-center">
            <Button onClick={handleReset} variant="outline">
              Unirse a Otro Pool
            </Button>
            <Button onClick={onSuccess}>
              Ver Mis Pools
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const statusBadge = getStatusBadge(poolInfo.status)
  const occupancyPercentage = (poolInfo.currentMembers / poolInfo.maxMembers) * 100

  return (
    <Card className="bg-card border-2 border-primary/50">
      <CardHeader>
        <div className="flex items-start justify-between mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <Badge className={`${statusBadge.bgColor} ${statusBadge.textColor} border-0`}>
            {statusBadge.label}
          </Badge>
        </div>

        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Unirse a {poolInfo.name}
        </CardTitle>
        <CardDescription>
          Pool #{poolId} · Contribuye con BTC para empezar a generar yields
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">Miembros</span>
              </div>
              <p className="text-xl font-bold text-foreground mb-2">
                {poolInfo.currentMembers} / {poolInfo.maxMembers}
              </p>
              <div className="h-2 bg-primary/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${occupancyPercentage}%` }}
                />
              </div>
            </div>

            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium text-green-500">Total Depositado</span>
              </div>
              <p className="text-xl font-bold text-foreground">
                {parseFloat(formatEther(poolInfo.totalBtcDeposited)).toFixed(4)} BTC
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {parseFloat(formatEther(poolInfo.totalMusdMinted)).toFixed(2)} MUSD generado
              </p>
            </div>
          </div>

          <Alert className="bg-blue-500/10 border-blue-500/30">
            <Info className="h-4 w-4 text-blue-500" />
            <AlertDescription className="text-blue-200 text-sm">
              <div className="space-y-1">
                <p><strong className="text-blue-400">Rango de contribución:</strong> {formatEther(poolInfo.minContribution)} - {formatEther(poolInfo.maxContribution)} BTC</p>
                <p><strong className="text-blue-400">Yields:</strong> ~6% APR compartido entre todos los miembros</p>
                <p><strong className="text-blue-400">Flexibilidad:</strong> Puedes salir cuando quieras y reclamar tus yields</p>
              </div>
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="btcAmount">
                Monto a Contribuir (BTC) <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="btcAmount"
                  type="number"
                  step="0.0001"
                  min="0"
                  placeholder={`Min: ${formatEther(poolInfo.minContribution)} BTC`}
                  value={btcAmount}
                  onChange={(e) => setBtcAmount(e.target.value)}
                  disabled={isProcessing}
                  className={validationError ? 'border-red-500' : ''}
                />
                <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">BTC</span>
              </div>

              {validationError && (
                <p className="text-sm text-red-500">{validationError}</p>
              )}

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Balance: {btcBalance ? parseFloat(formatEther(btcBalance.value)).toFixed(4) : '0'} BTC</span>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  onClick={handleSetMax}
                  disabled={isProcessing || !btcBalance}
                  className="h-auto p-0 text-primary"
                >
                  Usar máximo
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { label: '25%', factor: 0.25 },
                { label: '50%', factor: 0.5 },
                { label: '75%', factor: 0.75 }
              ].map(({ label, factor }) => (
                <Button
                  key={label}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (!btcBalance || !poolInfo) return
                    const maxAllowed = poolInfo.maxContribution
                    const userBalance = btcBalance.value
                    const gasReserve = parseEther('0.0001')
                    const availableBalance = userBalance > gasReserve ? userBalance - gasReserve : 0n
                    const amount = (availableBalance < maxAllowed ? availableBalance : maxAllowed) * BigInt(Math.floor(factor * 100)) / 100n
                    setBtcAmount(formatEther(amount))
                  }}
                  disabled={isProcessing || !btcBalance}
                >
                  {label}
                </Button>
              ))}
            </div>

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
                  {state === 'processing' && 'Procesando tu contribución al pool...'}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={isProcessing || !address}
                className="flex-1 bg-primary hover:bg-primary/90"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Procesando...
                  </>
                ) : !address ? (
                  'Conecta tu Wallet'
                ) : (
                  <>
                    <Users className="h-4 w-4 mr-2" />
                    Unirse al Pool
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                disabled={isProcessing}
                size="lg"
              >
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      </CardContent>
    </Card>
  )
}

function getStatusBadge(status: PoolStatus) {
  switch (status) {
    case PoolStatus.ACCEPTING:
      return {
        label: 'Aceptando Miembros',
        bgColor: 'bg-blue-500/20',
        textColor: 'text-blue-400'
      }
    case PoolStatus.ACTIVE:
      return {
        label: 'Activo',
        bgColor: 'bg-green-500/20',
        textColor: 'text-green-400'
      }
    case PoolStatus.CLOSED:
      return {
        label: 'Cerrado',
        bgColor: 'bg-gray-500/20',
        textColor: 'text-gray-400'
      }
  }
}

// Export alias for backward compatibility
export { JoinPoolV3 as JoinPool }
