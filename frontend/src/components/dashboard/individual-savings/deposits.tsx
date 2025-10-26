'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Gift, LogOut, Plus, ExternalLink, Lock, AlertCircle, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useDepositV2, useWithdrawV2, useClaimYieldV2 } from '@/hooks/web3/use-pool-transactions-v2'
import { useMusdApprovalV2, formatMUSD, formatMUSDShort } from '@/hooks/web3/use-musd-approval-v2'
import { usePoolRealTimeSync } from '@/hooks/web3/use-pool-real-time-sync'
import { useIndividualPool, formatBTC } from '@/hooks/web3/use-individual-pool'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

export function Deposits() {
  const [amount, setAmount] = useState('100')
  const [withdrawAmount, setWithdrawAmount] = useState('50')
  const musdPrice = 1 // MUSD is stablecoin, always $1

  const { address, isConnected, chainId } = useAccount()
  const { walletBalances, userDeposit, isLoading: isPoolLoading } = useIndividualPool()
  const { toast } = useToast()
  
  // Enable real-time sync for entire page
  usePoolRealTimeSync()
  
  // MUSD approval and balance (V2 - Production Ready)
  const {
    musdBalance,
    balanceFormatted,
    isApprovalNeeded,
    approveUnlimited,
    approveAmount,
    isApproving,
    isApproveConfirming,
    isApprovalConfirmed,
    error: musdError,
  } = useMusdApprovalV2()
  
  // Real blockchain transactions (V2 - Production Ready)
  const {
    deposit,
    isDepositing,
    isConfirming: depositConfirming,
    isSuccess: depositSuccess,
    error: depositError,
  } = useDepositV2()
  
  const {
    withdraw,
    isWithdrawing,
    isConfirming: withdrawConfirming,
    isSuccess: withdrawSuccess,
    error: withdrawError,
  } = useWithdrawV2()
  
  const {
    claimYield,
    isClaimingYield,
    isConfirming: claimConfirming,
    isSuccess: claimSuccess,
    error: claimError,
  } = useClaimYieldV2()

  // Calculate max amounts (MUSD-based)
  const maxDeposit = musdBalance ? Number(musdBalance) / 1e18 : 0
  const maxWithdraw = userDeposit ? Number(userDeposit.musdAmount) / 1e18 : 0
  
  // Check if approval is needed for current amount
  const depositNeedsApproval = isApprovalNeeded(
    amount ? BigInt(Math.floor(parseFloat(amount) * 1e18)) : BigInt(0)
  )

  const handleApprove = async () => {
    try {
      // Use unlimited approval for better UX (one approval per session)
      await approveUnlimited()
      toast({
        title: "Aprobando MUSD...",
        description: `Aprobando MUSD ilimitado para usar en el pool`,
      })
    } catch (error) {
      toast({
        title: "Error en aprobación",
        description: error instanceof Error ? error.message : "Ocurrió un error",
        variant: "destructive",
      })
    }
  }

  const handleDeposit = async () => {
    try {
      await deposit(amount)
      toast({
        title: "Depósito enviado",
        description: `Transacción enviada. Esperando confirmación...`,
      })
    } catch (error) {
      toast({
        title: "Error en depósito",
        description: error instanceof Error ? error.message : "Ocurrió un error",
        variant: "destructive",
      })
    }
  }

  // Auto-refetch and show success when deposit is confirmed
  useEffect(() => {
    if (depositSuccess) {
      const depositedAmount = amount
      toast({
        title: "✅ Depósito confirmado!",
        description: `Has depositado ${depositedAmount} MUSD exitosamente`,
      })
      setAmount('100')
    }
  }, [depositSuccess, amount, toast])

  const handleClaim = async () => {
    try {
      await claimYield()
      toast({
        title: "Reclamando yield",
        description: "Transacción enviada. Esperando confirmación...",
      })
    } catch (error) {
      toast({
        title: "Error al reclamar yield",
        description: error instanceof Error ? error.message : "Ocurrió un error",
        variant: "destructive",
      })
    }
  }

  // Auto-refetch when claim is confirmed
  useEffect(() => {
    if (claimSuccess) {
      toast({
        title: "✅ Yield reclamado!",
        description: "Has reclamado tus yields en MUSD exitosamente",
      })
    }
  }, [claimSuccess, toast])

  const handleWithdraw = async () => {
    try {
      // withdraw() takes NO parameters - withdraws entire position
      await withdraw()
      toast({
        title: "Retiro enviado",
        description: "Transacción enviada. Esperando confirmación...",
      })
    } catch (error) {
      toast({
        title: "Error en retiro",
        description: error instanceof Error ? error.message : "Ocurrió un error",
        variant: "destructive",
      })
    }
  }

  // Auto-refetch when withdrawal is confirmed
  useEffect(() => {
    if (withdrawSuccess) {
      const totalAmount = maxWithdraw.toFixed(2)
      toast({
        title: "✅ Retiro confirmado!",
        description: `Has retirado todo tu depósito: ${totalAmount} MUSD + yields`,
      })
      setWithdrawAmount('50')
    }
  }, [withdrawSuccess, maxWithdraw, toast])

  // Handle wallet disconnection
  if (!isConnected) {
    return (
      <Card className="bg-card border border-primary/20 shadow-custom">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center gap-4 py-8">
            <AlertCircle className="h-12 w-12 text-yellow-500" />
            <div className="text-center">
              <h3 className="text-lg font-semibold text-white mb-2">Wallet no conectada</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Conecta tu wallet para ver tu saldo MUSD y depositar
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                Red requerida: <span className="text-primary font-medium">Mezo Testnet (31611)</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card border border-primary/20 shadow-custom">
      <CardContent className="p-6">
        {/* Wallet Status Header */}
        <div className="mb-6 p-4 rounded-lg bg-primary/10 border border-primary/30">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Dirección:</p>
            <p className="text-xs font-mono text-primary font-semibold">{address?.slice(0, 6)}...{address?.slice(-4)}</p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Saldo MUSD:</p>
            {isPoolLoading ? (
              <Loader2 className="h-4 w-4 text-primary animate-spin" />
            ) : (
              <p className="text-sm font-bold text-primary">{balanceFormatted} MUSD</p>
            )}
          </div>
          {musdError && (
            <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {musdError}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column - Action Buttons */}
          <div className="flex flex-col gap-4">
            {/* Deposit Dialog */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="secondary" size="lg" className="w-full" disabled={isDepositing || isApproving || !musdBalance}>
                  <Plus className="mr-2 h-4 w-4" /> Añadir Fondos
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Depositar MUSD</AlertDialogTitle>
                  <AlertDialogDescription>Deposita MUSD para generar yields automáticamente</AlertDialogDescription>
                </AlertDialogHeader>
                <div className="text-sm space-y-3">
                  <p>
                    Monto: {amount} MUSD (= ${(parseFloat(amount) * musdPrice).toLocaleString('en-US', { maximumFractionDigits: 2 })}) USD)
                  </p>
                  <p className="text-muted-foreground">Gas estimado: ~0.01 USD</p>
                  <p className="text-xs text-muted-foreground">Tu saldo MUSD: {balanceFormatted} MUSD</p>
                  
                  {/* Approval Status */}
                  {depositNeedsApproval && (
                    <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                      <p className="text-xs text-yellow-600 flex items-center gap-2">
                        <Lock className="w-3 h-3" />
                        Necesitas aprobar MUSD primero
                      </p>
                    </div>
                  )}

                  {isDepositing && <p className="text-blue-500 animate-pulse">⏳ Enviando depósito...</p>}
                  {depositConfirming && <p className="text-blue-500 animate-pulse">⏳ Confirmando en blockchain...</p>}
                  {isApproving && <p className="text-blue-500 animate-pulse">⏳ Aprobando MUSD...</p>}
                  {isApproveConfirming && <p className="text-blue-500 animate-pulse">⏳ Confirmando aprobación en blockchain...</p>}
                  {isApprovalConfirmed && !depositNeedsApproval && <p className="text-green-500">✅ ¡MUSD aprobado! Puedes depositar ahora</p>}
                  {depositError && <p className="text-red-500">❌ Error: {depositError}</p>}
                  {depositSuccess && <p className="text-green-500">✅ ¡Depósito completado!</p>}
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isDepositing || isApproving || isApproveConfirming}>Cancelar</AlertDialogCancel>
                  
                  {depositNeedsApproval ? (
                    <AlertDialogAction 
                      onClick={handleApprove}
                      disabled={isApproving || isApproveConfirming || isApprovalConfirmed}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isApproving ? 'Aprobando...' : isApproveConfirming ? 'Confirmando...' : isApprovalConfirmed ? '✅ Aprobado' : 'Aprobar MUSD'}
                    </AlertDialogAction>
                  ) : (
                    <AlertDialogAction 
                      onClick={handleDeposit}
                      disabled={isDepositing || depositConfirming || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > maxDeposit}
                    >
                      {isDepositing ? 'Enviando...' : depositConfirming ? 'Confirmando...' : 'Confirmar Depósito'}
                    </AlertDialogAction>
                  )}
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Withdraw Dialog */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="lg" className="w-full border-primary text-primary hover:bg-primary/10 hover:text-primary" disabled={isWithdrawing || !userDeposit?.active}>
                  <LogOut className="mr-2 h-4 w-4" /> Retirar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Retirar MUSD + Yields</AlertDialogTitle>
                  <AlertDialogDescription>Retira tu MUSD principal + yields generados</AlertDialogDescription>
                </AlertDialogHeader>
                <div className="text-sm space-y-2">
                  <p>
                    Monto MUSD: {withdrawAmount} MUSD (= ${(parseFloat(withdrawAmount) * musdPrice).toLocaleString('en-US', { maximumFractionDigits: 2 })}) USD)
                  </p>
                  <p className="text-muted-foreground">Gas estimado: ~0.01 USD</p>
                  <p className="text-xs text-muted-foreground">Saldo depositado: {formatMUSD(userDeposit?.musdAmount)} MUSD</p>
                  <p className="text-xs text-green-500">Yields acumulados: {formatMUSD(userDeposit?.yieldAccrued)} MUSD</p>
                  {isWithdrawing && <p className="text-blue-500 animate-pulse">⏳ Enviando retiro...</p>}
                  {withdrawConfirming && <p className="text-blue-500 animate-pulse">⏳ Confirmando en blockchain...</p>}
                  {withdrawError && <p className="text-red-500">❌ Error: {withdrawError}</p>}
                  {withdrawSuccess && <p className="text-green-500">✅ ¡Retiro completado!</p>}
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isWithdrawing || withdrawConfirming}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleWithdraw} 
                    disabled={isWithdrawing || withdrawConfirming || !withdrawAmount || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > maxWithdraw}
                  >
                    {isWithdrawing ? 'Enviando...' : withdrawConfirming ? 'Confirmando...' : 'Confirmar Retiro'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Claim Yields Button */}
            <Button 
              variant="default" 
              size="lg" 
              className="w-full bg-primary text-primary-foreground" 
              onClick={handleClaim} 
              disabled={isClaimingYield || claimConfirming || !userDeposit?.yieldAccrued || userDeposit.yieldAccrued === BigInt(0) || !userDeposit?.active}
            >
              <Gift className="mr-2 h-4 w-4" /> 
              {isClaimingYield ? 'Enviando...' : claimConfirming ? 'Confirmando...' : `Reclamar ${formatMUSD(userDeposit?.yieldAccrued)} MUSD`}
            </Button>

            {/* Info: Get MUSD */}
            {(!musdBalance || Number(musdBalance) === 0) && (
              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <p className="text-xs text-blue-600 mb-3">
                  No tienes MUSD. Obtén MUSD en Mezo primero:
                </p>
                <Link
                  href="https://mezo.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs text-blue-500 hover:text-blue-400 transition"
                >
                  Ir a mezo.org <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            )}

            {/* Claim Status */}
            {claimSuccess && (
              <div className="p-3 rounded-lg bg-green-500/20 text-green-500 text-sm">
                ✅ Yields reclamados exitosamente
              </div>
            )}
            {claimError && (
              <div className="p-3 rounded-lg bg-red-500/20 text-red-500 text-sm">
                ❌ Error: {claimError}
              </div>
            )}
          </div>

          {/* Right Column - Input Controls */}
          <div className="space-y-6">
            {/* Deposit Amount Input */}
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-white">
                Cantidad MUSD a depositar
              </Label>
              <div className="relative">
                <Input
                  id="amount"
                  type="number"
                  placeholder="100"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="font-code bg-card border-2 border-muted-foreground/50 focus:border-primary pr-12"
                  min="10"
                  max={maxDeposit}
                  step="1"
                  disabled={isDepositing || isApproving || !musdBalance}
                />
                <span className="absolute inset-y-0 right-0 flex items-center pr-3 font-code text-muted-foreground">MUSD</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>mín: 10</span>
                <span>= ${(parseFloat(amount || '0') * musdPrice).toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
                <span>máx: {maxDeposit.toFixed(2)}</span>
              </div>
            </div>
            
            {/* Deposit Slider */}
            <Slider
              value={[parseFloat(amount || '0')]}
              min={10}
              max={Math.max(maxDeposit, 10)}
              step={1}
              onValueChange={(value) => setAmount(value[0].toString())}
              className="[&>span:first-child]:bg-gradient-to-r from-primary to-secondary"
              disabled={isDepositing || isApproving || !musdBalance}
            />

            {/* Withdraw Amount Input */}
            <div className="space-y-2">
              <Label htmlFor="withdraw" className="text-white">
                Cantidad MUSD a retirar
              </Label>
              <div className="relative">
                <Input
                  id="withdraw"
                  type="number"
                  placeholder="50"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="font-code bg-card border-2 border-muted-foreground/50 focus:border-primary pr-12"
                  min="1"
                  max={maxWithdraw}
                  step="1"
                  disabled={isWithdrawing || !userDeposit?.active}
                />
                <span className="absolute inset-y-0 right-0 flex items-center pr-3 font-code text-muted-foreground">MUSD</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>mín: 1</span>
                <span>= ${(parseFloat(withdrawAmount || '0') * musdPrice).toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
                <span>máx: {maxWithdraw.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
