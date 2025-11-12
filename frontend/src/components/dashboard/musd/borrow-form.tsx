/**
 * @fileoverview Borrow Form Component - Deposit BTC and mint MUSD
 * Production-ready, user-friendly interface
 */

'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'
import { useMezoBorrow, formatBTC } from '@/hooks/web3/use-mezo-borrow'
import { TransactionLink } from '@/components/ui/transaction-link'
import { parseEther, formatEther } from 'viem'
import { useAccount, useBalance } from 'wagmi'

export function BorrowForm() {
  const [btcAmount, setBtcAmount] = useState('')
  const { address } = useAccount()

  const {
    deposit,
    isDepositing,
    isDepositConfirming,
    isDepositConfirmed,
    depositTxHash,
    error,
    targetLtv,
  } = useMezoBorrow()

  // Get BTC balance
  const { data: btcBalance } = useBalance({
    address: address,
    query: {
      enabled: !!address,
    },
  })

  const handleDeposit = async () => {
    if (!btcAmount || parseFloat(btcAmount) < 0.001) return

    try {
      await deposit(parseEther(btcAmount))
    } catch (err) {
      console.error('Deposit error:', err)
    }
  }

  const handleReset = () => {
    setBtcAmount('')
  }

  // Calculate expected MUSD to receive
  const calculateExpectedMusd = (btc: string): string => {
    if (!btc || !targetLtv) return '0.00'

    const btcValue = parseFloat(btc)
    const btcPriceUsd = 100000 // Simplified: $100k BTC price
    const ltvPercent = Number(targetLtv) / 10000
    const musdAmount = btcValue * btcPriceUsd * ltvPercent

    return musdAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

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
                Tu BTC ha sido depositado y has recibido MUSD
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
  if (isDepositing || isDepositConfirming) {
    return (
      <Card className="bg-card border border-primary/20 shadow-custom">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
            <div>
              <h3 className="text-xl font-bold mb-2">
                {isDepositing ? 'Confirma en tu billetera...' : 'Procesando depósito...'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isDepositing
                  ? 'Por favor confirma la transacción en tu billetera'
                  : 'Esperando confirmación en la blockchain'
                }
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
          <h2 className="text-2xl font-bold mb-2">🏦 Pedir Prestado MUSD</h2>
          <p className="text-sm text-muted-foreground">
            Deposita BTC como colateral y recibe MUSD para usar en DeFi
          </p>
        </div>

        {/* BTC Balance */}
        <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
          <p className="text-sm text-muted-foreground mb-1">Tu saldo de BTC:</p>
          <p className="text-2xl font-bold text-primary">
            {btcBalance ? formatEther(btcBalance.value) : '0.00000'} BTC
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            ≈ ${btcBalance ? (Number(formatEther(btcBalance.value)) * 100000).toLocaleString('en-US', { maximumFractionDigits: 2 }) : '0.00'} USD
          </p>
        </div>

        {/* BTC Input */}
        <div className="space-y-2">
          <Label htmlFor="btc-amount" className="text-white">
            Cantidad de BTC a depositar
          </Label>
          <div className="relative">
            <Input
              id="btc-amount"
              type="number"
              placeholder="0.01"
              value={btcAmount}
              onChange={(e) => setBtcAmount(e.target.value)}
              className="font-mono text-lg pr-14"
              min="0.001"
              step="0.001"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono font-bold">
              BTC
            </span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Mínimo: 0.001 BTC</span>
            <span>Disponible: {btcBalance ? formatEther(btcBalance.value) : '0.00000'} BTC</span>
          </div>
        </div>

        {/* Expected MUSD */}
        {btcAmount && parseFloat(btcAmount) >= 0.001 && (
          <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Recibirás aproximadamente:</p>
                <p className="text-2xl font-bold text-green-500">
                  {calculateExpectedMusd(btcAmount)} MUSD
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">LTV:</p>
                <p className="text-lg font-bold">{targetLtv ? Number(targetLtv) / 100 : 50}%</p>
              </div>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-500 mb-1">Información importante</p>
              <ul className="text-xs text-blue-400 space-y-1">
                <li>• Tu BTC se usa como colateral para pedir prestado MUSD</li>
                <li>• Mantén un ratio de colateralización arriba del 110%</li>
                <li>• Si el precio del BTC baja mucho, tu posición puede ser liquidada</li>
                <li>• Puedes agregar más colateral o pagar deuda en cualquier momento</li>
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
          disabled={!btcAmount || parseFloat(btcAmount) < 0.001 || isDepositing}
          className="w-full h-12 text-lg font-semibold"
          size="lg"
        >
          {isDepositing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Depositando...
            </>
          ) : (
            'Depositar BTC y Recibir MUSD'
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
