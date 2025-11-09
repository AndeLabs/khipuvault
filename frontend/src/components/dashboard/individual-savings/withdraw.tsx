/**
 * @fileoverview Withdraw Component with Partial/Full Options - Production Ready
 */

'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, CheckCircle2, XCircle, ArrowLeft, AlertTriangle } from 'lucide-react'
import { useSimpleWithdraw } from '@/hooks/web3/use-simple-withdraw'
import { useIndividualPoolSimple, formatMUSD } from '@/hooks/web3/use-individual-pool-simple'
import { TransactionLink } from '@/components/ui/transaction-link'

export function Withdraw() {
  const [partialAmount, setPartialAmount] = useState('')
  const [withdrawType, setWithdrawType] = useState<'full' | 'partial'>('full')
  const minWithdraw = Number(process.env.NEXT_PUBLIC_MIN_TRANSACTION_AMOUNT || '10000000000000000') / 1e18;

  const {
    withdraw,
    reset,
    state,
    error,
    withdrawTxHash,
    isProcessing
  } = useSimpleWithdraw()

  const { userInfo, hasActiveDeposit } = useIndividualPoolSimple()

  const totalAmount = (userInfo?.deposit || BigInt(0)) + (userInfo?.netYields || BigInt(0))
  const principalFormatted = formatMUSD(userInfo?.deposit)
  const maxPartial = Number(principalFormatted)

  // No deposit state
  if (!hasActiveDeposit && state === 'idle') {
    return (
      <Card className="bg-card border border-orange-500/20 shadow-custom">
        <CardContent className="p-6 text-center space-y-4">
          <div>
            <h2 className="text-2xl font-bold mb-2 text-orange-400 flex items-center justify-center gap-2">
              <ArrowLeft className="h-6 w-6" />
              Retirar Fondos
            </h2>
            <p className="text-sm text-muted-foreground">
              Retira tu capital y rendimientos cuando quieras
            </p>
          </div>
          
          <div className="text-4xl mb-3">💰</div>
          <p className="text-muted-foreground">No tienes depósitos activos</p>
          <p className="text-sm text-muted-foreground">
            Haz un depósito primero para poder retirar fondos
          </p>
        </CardContent>
      </Card>
    )
  }

  // Idle/Error state - show withdrawal form
  if (state === 'idle' || state === 'error') {
    return (
      <Card className="bg-card border border-orange-500/20 shadow-custom">
        <CardContent className="p-6 space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-2 text-orange-400 flex items-center gap-2">
              <ArrowLeft className="h-6 w-6" />
              Retirar Fondos
            </h2>
            <p className="text-sm text-muted-foreground">
              Elige cuánto quieres retirar
            </p>
          </div>

          {/* Tabs: Full vs Partial */}
          <Tabs value={withdrawType} onValueChange={(v) => setWithdrawType(v as 'full' | 'partial')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="full">Retiro Total</TabsTrigger>
              <TabsTrigger value="partial">Retiro Parcial</TabsTrigger>
            </TabsList>

            {/* Full Withdrawal */}
            <TabsContent value="full" className="space-y-4 mt-4">
              <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/30">
                <p className="text-sm text-muted-foreground mb-2">Recibirás:</p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Principal:</span>
                    <span className="text-lg font-bold text-white">
                      {principalFormatted} MUSD
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Rendimientos (neto):</span>
                    <span className="text-lg font-bold text-green-500">
                      +{formatMUSD(userInfo?.netYields)} MUSD
                    </span>
                  </div>
                  <div className="pt-2 border-t border-orange-500/30">
                    <div className="flex justify-between items-center">
                      <span className="text-base font-semibold text-orange-400">Total:</span>
                      <span className="text-2xl font-bold text-orange-400">
                        {formatMUSD(totalAmount)} MUSD
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-yellow-300">
                      <strong className="text-yellow-400">⚠️ Retiro Total:</strong>
                    </p>
                    <ul className="text-xs text-yellow-300 mt-2 space-y-1 ml-4 list-disc">
                      <li>Retira todo tu capital + rendimientos</li>
                      <li>Tu posición se cierra completamente</li>
                      <li>Comisión del 1% solo sobre rendimientos</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => withdraw()}
                disabled={isProcessing}
                variant="destructive"
                className="w-full bg-orange-500 hover:bg-orange-600"
                size="lg"
              >
                Retirar Todo ({formatMUSD(totalAmount)} MUSD)
                <ArrowLeft className="ml-2 h-5 w-5 rotate-180" />
              </Button>
            </TabsContent>

            {/* Partial Withdrawal */}
            <TabsContent value="partial" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="partial-amount" className="text-white">
                  Cantidad a retirar
                </Label>
                <div className="relative">
                  <Input
                    id="partial-amount"
                    type="number"
                    placeholder="50"
                    value={partialAmount}
                    onChange={(e) => setPartialAmount(e.target.value)}
                    className="font-mono text-lg pr-16"
                    min={minWithdraw}
                    max={maxPartial}
                    step="1"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono">
                    MUSD
                  </span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Mínimo: {minWithdraw} MUSD</span>
                  <span>Máximo: {principalFormatted} MUSD</span>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-blue-300">
                      <strong className="text-blue-400">ℹ️ Retiro Parcial:</strong>
                    </p>
                    <ul className="text-xs text-blue-300 mt-2 space-y-1 ml-4 list-disc">
                      <li>Retira solo una parte de tu principal</li>
                      <li>Tu posición sigue activa</li>
                      <li>Sigue generando rendimientos</li>
                      <li>Sin comisión en retiros parciales</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => withdraw(partialAmount)}
                disabled={isProcessing || !partialAmount || parseFloat(partialAmount) < minWithdraw || parseFloat(partialAmount) > maxPartial}
                className="w-full"
                size="lg"
              >
                Retirar {partialAmount || '0'} MUSD
                <ArrowLeft className="ml-2 h-5 w-5 rotate-180" />
              </Button>
            </TabsContent>
          </Tabs>

          {/* Error Display */}
          {state === 'error' && (
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
        </CardContent>
      </Card>
    )
  }

  // Processing state
  if (state === 'confirming' || state === 'processing') {
    return (
      <Card className="bg-card border border-orange-500/20 shadow-custom">
        <CardContent className="p-6">
          <div className="text-center space-y-6 py-8">
            <Loader2 className="h-16 w-16 animate-spin mx-auto text-orange-500" />
            
            <div>
              <p className="text-2xl font-bold mb-2">
                {state === 'confirming' ? '🔐 Confirma en tu wallet...' : '⏳ Procesando retiro...'}
              </p>
              <p className="text-muted-foreground">
                {state === 'confirming' 
                  ? 'Confirma la transacción en tu wallet' 
                  : 'Esperando confirmación en blockchain...'}
              </p>
            </div>

            {withdrawTxHash && state === 'processing' && (
              <TransactionLink 
                txHash={withdrawTxHash}
                label="Ver transacción en explorer"
              />
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Success state
  if (state === 'success') {
    const wasPartial = withdrawType === 'partial'
    return (
      <Card className="bg-card border border-green-500/20 shadow-custom shadow-green-500/20">
        <CardContent className="p-6">
          <div className="text-center space-y-6 py-8">
            <div className="mx-auto w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            </div>
            
            <div>
              <p className="text-2xl font-bold mb-2 text-green-500">
                ¡Retiro exitoso!
              </p>
              <p className="text-muted-foreground">
                {wasPartial 
                  ? `Retiraste ${partialAmount} MUSD. Tu posición sigue activa.`
                  : `Recibiste ${formatMUSD(totalAmount)} MUSD. Posición cerrada.`
                }
              </p>
            </div>

            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30 space-y-3">
              <p className="text-sm text-green-300">
                ✅ Tus fondos están disponibles en tu wallet.
              </p>
              
              {withdrawTxHash && (
                <TransactionLink 
                  txHash={withdrawTxHash}
                  label="Ver transacción en Mezo Explorer"
                  className="mt-4"
                />
              )}
            </div>

            <Button
              onClick={() => {
                reset()
                setPartialAmount('')
              }}
              variant="outline"
              className="w-full"
              size="lg"
            >
              Entendido
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return null
}
