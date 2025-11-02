/**
 * @fileoverview Simple Withdraw Component - Production Ready
 * Full withdrawal (principal + yields)
 */

'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle2, XCircle, ExternalLink, ArrowLeft, AlertTriangle } from 'lucide-react'
import { useSimpleWithdraw } from '@/hooks/web3/use-simple-withdraw'
import { useIndividualPoolSimple, formatMUSD } from '@/hooks/web3/use-individual-pool-simple'

export function Withdraw() {
  const {
    withdraw,
    reset,
    state,
    error,
    withdrawTxHash,
    isProcessing
  } = useSimpleWithdraw()

  const { userInfo, hasActiveDeposit } = useIndividualPoolSimple()

  // Don't show if no active deposit
  if (!hasActiveDeposit) {
    return null
  }

  const totalAmount = (userInfo?.deposit || BigInt(0)) + (userInfo?.netYields || BigInt(0))

  // Idle state - ready to withdraw
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
              Retira todo tu capital más los rendimientos generados
            </p>
          </div>

          {/* Amount to withdraw */}
          <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/30">
            <p className="text-sm text-muted-foreground mb-2">Recibirás:</p>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Principal:</span>
                <span className="text-lg font-bold text-white">
                  {formatMUSD(userInfo?.deposit)} MUSD
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

          {/* Error */}
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

          {/* Warning */}
          <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-yellow-300">
                  <strong className="text-yellow-400">⚠️ Importante:</strong>
                </p>
                <ul className="text-xs text-yellow-300 mt-2 space-y-1 ml-4 list-disc">
                  <li>Esto retirará todo tu capital y rendimientos</li>
                  <li>Tu posición en el pool se cerrará completamente</li>
                  <li>Los fondos llegarán a tu wallet en segundos</li>
                  <li>Se aplicará una comisión del 1% sobre los rendimientos</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Button */}
          <Button
            onClick={withdraw}
            disabled={isProcessing}
            variant="destructive"
            className="w-full bg-orange-500 hover:bg-orange-600"
            size="lg"
          >
            Retirar {formatMUSD(totalAmount)} MUSD
            <ArrowLeft className="ml-2 h-5 w-5 rotate-180" />
          </Button>
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
              <a
                href={`https://explorer.mezo.org/tx/${withdrawTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-orange-400 hover:underline text-sm"
              >
                Ver transacción en explorer
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Success state
  if (state === 'success') {
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
                Recibiste {formatMUSD(totalAmount)} MUSD en tu wallet
              </p>
            </div>

            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30 space-y-3">
              <p className="text-sm text-green-300">
                ✅ Tus fondos están disponibles en tu wallet.
                Tu posición en el pool ha sido cerrada.
              </p>
              
              {withdrawTxHash && (
                <a
                  href={`https://explorer.mezo.org/tx/${withdrawTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-primary/20 hover:bg-primary/30 border border-primary/50 rounded-lg transition-all hover:scale-105"
                >
                  <ExternalLink className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-primary">
                    Ver transacción en Mezo Explorer
                  </span>
                </a>
              )}
            </div>

            <Button
              onClick={reset}
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
