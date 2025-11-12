/**
 * @fileoverview Repay Form Component - Repay MUSD debt and withdraw BTC
 * Production-ready, user-friendly interface
 */

'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'
import { useMezoBorrow } from '@/hooks/web3/use-mezo-borrow'
import { useMusdApprovalV2 } from '@/hooks/web3/use-musd-approval'
import { TransactionLink } from '@/components/ui/transaction-link'
import { parseEther, formatEther } from 'viem'

export function RepayForm() {
  const [musdAmount, setMusdAmount] = useState('')

  const {
    position,
    withdraw,
    isWithdrawing,
    isWithdrawConfirming,
    isWithdrawConfirmed,
    withdrawTxHash,
    error: withdrawError,
  } = useMezoBorrow()

  const {
    musdBalance,
    balanceFormatted,
    isApprovalNeeded,
    approveUnlimited,
    isApproving,
    isApprovalConfirmed,
    error: approvalError,
  } = useMusdApprovalV2()

  const handleRepay = async () => {
    if (!musdAmount || parseFloat(musdAmount) <= 0) return

    const amount = parseEther(musdAmount)

    // Check if approval is needed
    if (isApprovalNeeded(amount)) {
      await approveUnlimited()
      return
    }

    // Proceed with repayment
    try {
      await withdraw(amount)
    } catch (err) {
      console.error('Repay error:', err)
    }
  }

  const handleReset = () => {
    setMusdAmount('')
  }

  // Calculate BTC to receive back
  const calculateBtcToReceive = (musd: string): string => {
    if (!musd || !position) return '0.00000'

    const musdValue = parseFloat(musd)
    const debtRatio = musdValue / Number(formatEther(position.musdDebt))
    const btcAmount = Number(formatEther(position.btcCollateral)) * debtRatio

    return btcAmount.toFixed(5)
  }

  // Set max amount
  const setMaxAmount = () => {
    if (!position || !musdBalance) return

    const maxRepay = position.musdDebt < musdBalance ? position.musdDebt : musdBalance
    setMusdAmount(formatEther(maxRepay))
  }

  const error = withdrawError || approvalError

  // Success state
  if (isWithdrawConfirmed) {
    return (
      <Card className="bg-card border-2 border-green-500/30 shadow-custom">
        <CardContent className="p-6 space-y-6">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <CheckCircle2 className="w-16 h-16 text-green-500" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-green-500 mb-2">¡Pago Exitoso!</h3>
              <p className="text-muted-foreground">
                Tu deuda ha sido pagada y has recibido tu BTC
              </p>
            </div>

            {withdrawTxHash && (
              <TransactionLink txHash={withdrawTxHash} label="Ver transacción" />
            )}

            <Button onClick={handleReset} variant="outline" className="w-full">
              Hacer otro pago
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Loading state
  if (isWithdrawing || isWithdrawConfirming || isApproving) {
    return (
      <Card className="bg-card border border-primary/20 shadow-custom">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
            <div>
              <h3 className="text-xl font-bold mb-2">
                {isApproving
                  ? 'Aprobando MUSD...'
                  : isWithdrawing
                  ? 'Confirma en tu billetera...'
                  : 'Procesando pago...'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isApproving
                  ? 'Aprobando el uso de MUSD para el contrato'
                  : isWithdrawing
                  ? 'Por favor confirma la transacción en tu billetera'
                  : 'Esperando confirmación en la blockchain'}
              </p>
            </div>
            {withdrawTxHash && (
              <TransactionLink txHash={withdrawTxHash} label="Ver transacción" />
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
          <h2 className="text-2xl font-bold mb-2">💳 Pagar Deuda</h2>
          <p className="text-sm text-muted-foreground">
            Paga tu deuda de MUSD y recupera tu BTC colateral
          </p>
        </div>

        {/* MUSD Balance */}
        <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
          <p className="text-sm text-muted-foreground mb-1">Tu saldo de MUSD:</p>
          <p className="text-2xl font-bold text-primary">{balanceFormatted} MUSD</p>
        </div>

        {/* Current Debt */}
        {position && (
          <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/30">
            <p className="text-sm text-muted-foreground mb-1">Tu deuda actual:</p>
            <p className="text-2xl font-bold text-orange-500">
              {Number(formatEther(position.musdDebt)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MUSD
            </p>
          </div>
        )}

        {/* MUSD Input */}
        <div className="space-y-2">
          <Label htmlFor="musd-amount" className="text-white">
            Cantidad de MUSD a pagar
          </Label>
          <div className="relative">
            <Input
              id="musd-amount"
              type="number"
              placeholder="100"
              value={musdAmount}
              onChange={(e) => setMusdAmount(e.target.value)}
              className="font-mono text-lg pr-20"
              min="0"
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
            <span>Disponible: {balanceFormatted} MUSD</span>
            {position && (
              <span>Deuda: {Number(formatEther(position.musdDebt)).toFixed(2)} MUSD</span>
            )}
          </div>
        </div>

        {/* Expected BTC to receive */}
        {musdAmount && parseFloat(musdAmount) > 0 && (
          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
            <p className="text-sm text-muted-foreground mb-1">Recibirás aproximadamente:</p>
            <p className="text-2xl font-bold text-blue-500">
              {calculateBtcToReceive(musdAmount)} BTC
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {parseFloat(musdAmount) >= Number(formatEther(position?.musdDebt || 0n))
                ? '✅ Esto pagará toda tu deuda y cerrarás tu posición'
                : '⚠️ Esto pagará parcialmente tu deuda'}
            </p>
          </div>
        )}

        {/* Info Box */}
        <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-500 mb-1">Información importante</p>
              <ul className="text-xs text-blue-400 space-y-1">
                <li>• Al pagar tu deuda, recibirás BTC proporcional al monto pagado</li>
                <li>• Puedes pagar parcialmente o pagar toda la deuda</li>
                <li>• Si pagas toda la deuda, tu posición se cerrará automáticamente</li>
                <li>• Necesitas aprobar el uso de MUSD primero (solo una vez)</li>
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
          onClick={handleRepay}
          disabled={!musdAmount || parseFloat(musdAmount) <= 0 || isWithdrawing || isApproving}
          className="w-full h-12 text-lg font-semibold"
          size="lg"
        >
          {isApproving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Aprobando...
            </>
          ) : isWithdrawing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Pagando...
            </>
          ) : musdAmount && parseEther(musdAmount) > 0n && isApprovalNeeded(parseEther(musdAmount)) ? (
            'Aprobar MUSD'
          ) : (
            'Pagar Deuda y Retirar BTC'
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
