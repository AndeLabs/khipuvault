/**
 * @fileoverview Simple Deposit Component - Redesigned from scratch
 * Clean, clear, user-friendly
 */

'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, CheckCircle2, XCircle, ArrowRight } from 'lucide-react'
import { useSimpleDeposit } from '@/hooks/web3/useSimpleDeposit'
import { TransactionLink } from '@/components/ui/transaction-link'

export function Deposits() {
  const [amount, setAmount] = useState('')
  
  const {
    deposit,
    reset,
    state,
    progress,
    error,
    approveTxHash,
    depositTxHash,
    musdBalance,
    balanceFormatted,
    canDeposit
  } = useSimpleDeposit()
  
  const handleDeposit = () => {
    if (!amount || parseFloat(amount) < 10) return
    deposit(amount)
  }
  
  const handleReset = () => {
    reset()
    setAmount('')
  }
  
  // Render different views based on state
  if (state === 'idle' || state === 'error') {
    return (
      <Card className="bg-card border border-primary/20 shadow-custom">
        <CardContent className="p-6 space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">💰 Depositar MUSD</h2>
            <p className="text-sm text-muted-foreground">
              Deposita MUSD para generar rendimientos automáticos
            </p>
          </div>
          
          {/* Balance */}
          <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
            <p className="text-sm text-muted-foreground mb-1">Tu saldo disponible:</p>
            <p className="text-2xl font-bold text-primary">{balanceFormatted} MUSD</p>
            <p className="text-xs text-muted-foreground mt-1">
              ≈ ${balanceFormatted} USD
            </p>
          </div>
          
          {/* Input */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-white">
              Cantidad a depositar
            </Label>
            <div className="relative">
              <Input
                id="amount"
                type="number"
                placeholder="100"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="font-mono text-lg pr-16"
                min="10"
                step="1"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono">
                MUSD
              </span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Mínimo: 10 MUSD</span>
              <span>Máximo: {balanceFormatted} MUSD</span>
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
          
          {/* Info */}
          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
            <p className="text-sm text-blue-300">
              <strong className="text-blue-400">ℹ️ Información:</strong>
            </p>
            <ul className="text-xs text-blue-300 mt-2 space-y-1 ml-4 list-disc">
              <li>El depósito mínimo es 10 MUSD</li>
              <li>Tu MUSD generará rendimientos automáticamente</li>
              <li>Puedes retirar en cualquier momento</li>
              <li>Gas estimado: ~0.0001 BTC</li>
            </ul>
          </div>
          
          {/* Button */}
          <Button
            onClick={handleDeposit}
            disabled={!amount || parseFloat(amount) < 10 || parseFloat(amount) > parseFloat(balanceFormatted)}
            className="w-full"
            size="lg"
          >
            Depositar {amount || '0'} MUSD
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </CardContent>
      </Card>
    )
  }
  
  // Approving state
  if (state === 'approving' || state === 'waitingApproval') {
    return (
      <Card className="bg-card border border-primary/20 shadow-custom">
        <CardContent className="p-6">
          <div className="text-center space-y-6 py-8">
            <Loader2 className="h-16 w-16 animate-spin mx-auto text-primary" />
            
            <div>
              <p className="text-2xl font-bold mb-2">
                {state === 'approving' ? '🔑 Aprobando MUSD...' : '⏳ Confirmando aprobación...'}
              </p>
              <p className="text-muted-foreground">
                {progress.message}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Paso {progress.current} de {progress.total}
              </p>
            </div>
            
            {approveTxHash && (
              <a
                href={`https://explorer.mezo.org/tx/${approveTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary hover:underline text-sm"
              >
                Ver transacción en explorer
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
            
            <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
              <p className="text-sm text-yellow-300">
                <strong className="text-yellow-400">💡 Nota:</strong> Después de aprobar, 
                el depósito se procesará automáticamente. Solo necesitas confirmar una vez más en tu wallet.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  // Depositing state
  if (state === 'depositing' || state === 'waitingDeposit') {
    return (
      <Card className="bg-card border border-primary/20 shadow-custom">
        <CardContent className="p-6">
          <div className="text-center space-y-6 py-8">
            <Loader2 className="h-16 w-16 animate-spin mx-auto text-primary" />
            
            <div>
              <p className="text-2xl font-bold mb-2">
                {state === 'depositing' ? '💸 Depositando...' : '⏳ Confirmando depósito...'}
              </p>
              <p className="text-muted-foreground">
                {progress.message}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Paso {progress.current} de {progress.total}
              </p>
            </div>
            
            {depositTxHash && (
              <TransactionLink 
                txHash={depositTxHash}
                label="Ver transacción en explorer"
              />
            )}
            
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <p className="text-sm text-blue-300">
                Esperando confirmación en blockchain... Esto puede tomar 10-30 segundos.
              </p>
            </div>
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
                ¡Depósito exitoso!
              </p>
              <p className="text-muted-foreground">
                Has depositado {amount} MUSD en el pool
              </p>
            </div>
            
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30 space-y-3">
              <p className="text-sm text-green-300">
                ✅ Tu MUSD ya está generando rendimientos automáticamente. 
                Puedes ver tu posición actualizada arriba.
              </p>
              
              {depositTxHash && (
                <TransactionLink 
                  txHash={depositTxHash}
                  label="Ver transacción en Mezo Explorer"
                  className="mt-4"
                />
              )}
            </div>
            
            <Button
              onClick={handleReset}
              variant="outline"
              className="w-full"
              size="lg"
            >
              Hacer otro depósito
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  return null
}
