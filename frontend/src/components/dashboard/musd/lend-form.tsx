/**
 * @fileoverview Lend Form Component - Deposit MUSD to Stability Pool
 * Earn BTC rewards from liquidations
 */

'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, CheckCircle2, XCircle, AlertTriangle, TrendingUp } from 'lucide-react'
import { useStabilityPool, formatAPY } from '@/hooks/web3/use-stability-pool'
import { useMusdApprovalV2 } from '@/hooks/web3/use-musd-approval'
import { TransactionLink } from '@/components/ui/transaction-link'
import { parseEther, formatEther } from 'viem'

export function LendForm() {
  const [amount, setAmount] = useState('')

  const {
    deposit,
    stats,
    isDepositing,
    isDepositConfirming,
    isDepositConfirmed,
    depositTxHash,
    error: depositError,
  } = useStabilityPool()

  const {
    musdBalance,
    balanceFormatted,
    isApprovalNeeded,
    approveUnlimited,
    isApproving,
    isApprovalConfirmed,
    error: approvalError,
  } = useMusdApprovalV2()

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) < 10) return

    const depositAmount = parseEther(amount)

    // Check if approval is needed
    if (isApprovalNeeded(depositAmount)) {
      await approveUnlimited()
      return
    }

    // Proceed with deposit
    try {
      await deposit(depositAmount)
    } catch (err) {
      console.error('Deposit error:', err)
    }
  }

  const handleReset = () => {
    setAmount('')
  }

  const setMaxAmount = () => {
    if (!musdBalance) return
    setAmount(formatEther(musdBalance))
  }

  const error = depositError || approvalError

  // Success state
  if (isDepositConfirmed) {
    return (
      <Card className="bg-card border-2 border-green-500/30 shadow-custom">
        <CardContent className="p-6 space-y-6">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <CheckCircle2 className="w-16 h-16 text-green-500" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-green-500 mb-2">¡Depósito Exitoso!</h3>
              <p className="text-muted-foreground">
                Tu MUSD está generando recompensas en BTC
              </p>
            </div>

            {depositTxHash && (
              <TransactionLink txHash={depositTxHash} label="Ver transacción" />
            )}

            <Button onClick={handleReset} variant="outline" className="w-full">
              Hacer otro depósito
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Loading state
  if (isDepositing || isDepositConfirming || isApproving) {
    return (
      <Card className="bg-card border border-primary/20 shadow-custom">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
            <div>
              <h3 className="text-xl font-bold mb-2">
                {isApproving
                  ? 'Aprobando MUSD...'
                  : isDepositing
                  ? 'Confirma en tu billetera...'
                  : 'Procesando depósito...'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isApproving
                  ? 'Aprobando el uso de MUSD para el contrato'
                  : isDepositing
                  ? 'Por favor confirma la transacción en tu billetera'
                  : 'Esperando confirmación en la blockchain'}
              </p>
            </div>
            {depositTxHash && (
              <TransactionLink txHash={depositTxHash} label="Ver transacción" />
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Main form
  return (
    <Card className="bg-card border border-primary/20 shadow-custom">
      <CardContent className="p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">📈 Prestar MUSD</h2>
          <p className="text-sm text-muted-foreground">
            Deposita MUSD en el Stability Pool y gana BTC de liquidaciones
          </p>
        </div>

        {/* MUSD Balance */}
        <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
          <p className="text-sm text-muted-foreground mb-1">Tu saldo de MUSD:</p>
          <p className="text-2xl font-bold text-primary">{balanceFormatted} MUSD</p>
        </div>

        {/* Pool Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <p className="text-sm text-muted-foreground">APY Estimado</p>
            </div>
            <p className="text-2xl font-bold text-green-500">
              {formatAPY(stats.estimatedAPY)}
            </p>
          </div>

          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
            <p className="text-sm text-muted-foreground mb-2">TVL Total</p>
            <p className="text-2xl font-bold text-blue-500">
              {Number(formatEther(stats.tvl)).toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-muted-foreground mt-1">MUSD</p>
          </div>
        </div>

        {/* Amount Input */}
        <div className="space-y-2">
          <Label htmlFor="amount" className="text-white">
            Cantidad de MUSD a depositar
          </Label>
          <div className="relative">
            <Input
              id="amount"
              type="number"
              placeholder="100"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="font-mono text-lg pr-20"
              min="10"
              step="1"
            />
            <Button
              onClick={setMaxAmount}
              variant="ghost"
              size="sm"
              className="absolute right-12 top-1/2 -translate-y-1/2 h-8 text-xs"
            >
              MAX
            </Button>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono font-bold">
              MUSD
            </span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Mínimo: 10 MUSD</span>
            <span>Disponible: {balanceFormatted} MUSD</span>
          </div>
        </div>

        {/* Expected Returns */}
        {amount && parseFloat(amount) >= 10 && (
          <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
            <p className="text-sm text-muted-foreground mb-2">Ganancias Estimadas (Anual)</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">En MUSD:</p>
                <p className="text-lg font-bold text-green-500">
                  {(parseFloat(amount) * (stats.estimatedAPY / 100)).toFixed(2)} MUSD
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">En BTC:</p>
                <p className="text-lg font-bold text-green-500">
                  {((parseFloat(amount) * (stats.estimatedAPY / 100)) / 100000).toFixed(5)} BTC
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-500 mb-1">¿Cómo funciona?</p>
              <ul className="text-xs text-blue-400 space-y-1">
                <li>• Tu MUSD se deposita en el Stability Pool de Mezo</li>
                <li>• Cuando posiciones son liquidadas, recibes BTC como recompensa</li>
                <li>• No hay riesgo de liquidación para ti como prestamista</li>
                <li>• Puedes retirar tu MUSD en cualquier momento</li>
                <li>• Fee de performance: {(stats.performanceFee / 100).toFixed(2)}%</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 rounded-lg bg-red-500/10 border-2 border-red-500/30">
            <div className="flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-red-500 mb-1">Error</p>
                <p className="text-sm text-red-400">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <Button
          onClick={handleDeposit}
          disabled={!amount || parseFloat(amount) < 10 || isDepositing || isApproving}
          className="w-full h-12 text-lg font-semibold"
          size="lg"
        >
          {isApproving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Aprobando...
            </>
          ) : isDepositing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Depositando...
            </>
          ) : amount && parseEther(amount) > 0n && isApprovalNeeded(parseEther(amount)) ? (
            'Aprobar MUSD'
          ) : (
            'Depositar y Empezar a Ganar'
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
