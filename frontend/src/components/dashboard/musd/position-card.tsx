/**
 * @fileoverview Position Card Component - Display user's borrowing position
 * Shows collateral, debt, health factor, and liquidation price
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { AlertTriangle, TrendingUp, Shield, DollarSign } from 'lucide-react'
import { useMezoBorrow, formatBTC, formatCollateralRatio, getHealthStatus } from '@/hooks/web3/use-mezo-borrow'
import { formatEther } from 'viem'

export function PositionCard() {
  const { position, hasPosition, isConnected } = useMezoBorrow()

  if (!isConnected) {
    return (
      <Card className="bg-card border border-primary/20 shadow-custom">
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            Conecta tu billetera para ver tu posición
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
              <DollarSign className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold mb-2">No tienes una posición activa</h3>
              <p className="text-sm text-muted-foreground">
                Deposita BTC para pedir prestado MUSD y empezar
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const healthStatus = getHealthStatus(position.healthFactor)
  const healthPercentage = Math.min((position.healthFactor / 200) * 100, 100)

  return (
    <Card className="bg-card border border-primary/20 shadow-custom">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Tu Posición de Préstamo</span>
          <Badge
            variant={healthStatus.status === 'safe' ? 'default' : 'destructive'}
            className={healthStatus.status === 'safe' ? 'bg-green-500' : healthStatus.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'}
          >
            {healthStatus.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Collateral & Debt Overview */}
        <div className="grid grid-cols-2 gap-4">
          {/* Collateral */}
          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-blue-500" />
              <p className="text-sm text-muted-foreground">Colateral (BTC)</p>
            </div>
            <p className="text-2xl font-bold text-blue-500">
              {formatBTC(position.btcCollateral)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              ≈ ${(Number(formatEther(position.btcCollateral)) * 100000).toLocaleString('en-US', { maximumFractionDigits: 2 })} USD
            </p>
          </div>

          {/* Debt */}
          <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/30">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-orange-500" />
              <p className="text-sm text-muted-foreground">Deuda (MUSD)</p>
            </div>
            <p className="text-2xl font-bold text-orange-500">
              {Number(formatEther(position.musdDebt)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              ≈ ${Number(formatEther(position.musdDebt)).toLocaleString('en-US', { maximumFractionDigits: 2 })} USD
            </p>
          </div>
        </div>

        {/* Health Factor */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className={`w-5 h-5 ${healthStatus.color}`} />
              <span className="font-semibold">Factor de Salud</span>
            </div>
            <span className={`text-xl font-bold ${healthStatus.color}`}>
              {position.healthFactor.toFixed(2)}%
            </span>
          </div>
          <Progress value={healthPercentage} className="h-3" />
          <p className="text-xs text-muted-foreground">
            {position.healthFactor >= 150 ? (
              'Tu posición es segura. Tienes suficiente colateral.'
            ) : position.healthFactor >= 120 ? (
              '⚠️ Advertencia: Considera agregar más colateral o reducir tu deuda.'
            ) : (
              '🚨 Peligro: Tu posición está en riesgo de liquidación. Actúa ahora.'
            )}
          </p>
        </div>

        {/* Collateral Ratio */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-primary/10 border border-primary/30">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Ratio de Colateralización</p>
            <p className="text-2xl font-bold">
              {formatCollateralRatio(position.collateralRatio)}
            </p>
          </div>
          <TrendingUp className="w-8 h-8 text-primary" />
        </div>

        {/* Liquidation Price */}
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
          <p className="text-sm text-muted-foreground mb-2">Precio de Liquidación</p>
          <p className="text-xl font-bold text-red-500">
            ${position.liquidationPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Tu posición será liquidada si el precio del BTC cae por debajo de este nivel
          </p>
        </div>

        {/* Additional Info */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground">Max. Préstamo Adicional</p>
            <p className="font-bold text-green-500">
              {Number(formatEther(position.maxBorrowable)).toLocaleString('en-US', { maximumFractionDigits: 2 })} MUSD
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Utilización</p>
            <p className="font-bold">
              {position.collateralRatio > 0 ? ((10000 / position.collateralRatio) * 100).toFixed(2) : 0}%
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
