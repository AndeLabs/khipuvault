/**
 * @fileoverview Withdraw Form Component - Withdraw MUSD from Stability Pool
 */

'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'
import { useStabilityPool } from '@/hooks/web3/use-stability-pool'
import { TransactionLink } from '@/components/ui/transaction-link'
import { parseEther, formatEther } from 'viem'

export function WithdrawForm() {
  const [amount, setAmount] = useState('')

  const {
    position,
    withdraw,
    isWithdrawing,
    isWithdrawConfirming,
    isWithdrawConfirmed,
    withdrawTxHash,
    error,
  } = useStabilityPool()

  const handleWithdraw = async () => {
    if (!amount || parseFloat(amount) <= 0) return

    try {
      await withdraw(parseEther(amount))
    } catch (err) {
      console.error('Withdraw error:', err)
    }
  }

  const handleReset = () => {
    setAmount('')
  }

  const setMaxAmount = () => {
    if (!position) return
    setAmount(formatEther(position.musdValue))
  }

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
              <h3 className="text-2xl font-bold text-green-500 mb-2">¡Retiro Exitoso!</h3>
              <p className="text-muted-foreground">
                Tu MUSD ha sido retirado del Stability Pool
              </p>
            </div>

            {withdrawTxHash && (
              <TransactionLink txHash={withdrawTxHash} label="Ver transacción" />
            )}

            <Button onClick={handleReset} variant="outline" className="w-full">
              Hacer otro retiro
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Loading state
  if (isWithdrawing || isWithdrawConfirming) {
    return (
      <Card className="bg-card border border-primary/20 shadow-custom">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
            <div>
              <h3 className="text-xl font-bold mb-2">
                {isWithdrawing ? 'Confirma en tu billetera...' : 'Procesando retiro...'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isWithdrawing
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
          <h2 className="text-2xl font-bold mb-2">💸 Retirar MUSD</h2>
          <p className="text-sm text-muted-foreground">
            Retira tu MUSD del Stability Pool
          </p>
        </div>

        {/* Deposited Amount */}
        {position && (
          <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
            <p className="text-sm text-muted-foreground mb-1">Tu MUSD en el pool:</p>
            <p className="text-2xl font-bold text-primary">
              {Number(formatEther(position.musdValue)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MUSD
            </p>
          </div>
        )}

        {/* Amount Input */}
        <div className="space-y-2">
          <Label htmlFor="withdraw-amount" className="text-white">
            Cantidad de MUSD a retirar
          </Label>
          <div className="relative">
            <Input
              id="withdraw-amount"
              type="number"
              placeholder="100"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
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
          {position && (
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Disponible: {Number(formatEther(position.musdValue)).toFixed(2)} MUSD</span>
            </div>
          )}
        </div>

        {/* Pending Rewards Warning */}
        {position && position.pendingCollateralGains > 0n && (
          <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-yellow-500 mb-1">Recompensas Pendientes</p>
                <p className="text-xs text-yellow-400">
                  Tienes {Number(formatEther(position.pendingCollateralGains)).toFixed(5)} BTC en recompensas pendientes.
                  Se reclamarán automáticamente al retirar.
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
              <p className="text-sm font-semibold text-blue-500 mb-1">Información</p>
              <ul className="text-xs text-blue-400 space-y-1">
                <li>• Puedes retirar cualquier cantidad de tu MUSD depositado</li>
                <li>• Tus recompensas pendientes se reclamarán automáticamente</li>
                <li>• No hay penalidades por retiro anticipado</li>
                <li>• Después del retiro, dejarás de ganar recompensas sobre ese monto</li>
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
          onClick={handleWithdraw}
          disabled={!amount || parseFloat(amount) <= 0 || isWithdrawing || !position}
          className="w-full h-12 text-lg font-semibold"
          size="lg"
        >
          {isWithdrawing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Retirando...
            </>
          ) : (
            'Retirar MUSD'
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
