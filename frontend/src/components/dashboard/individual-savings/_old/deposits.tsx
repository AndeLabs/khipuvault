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
import { useDepositV3, useFullWithdrawV3, useClaimYieldV3 } from '@/hooks/web3/use-pool-transactions'
import { useMusdApprovalV2, formatMUSD, formatMUSDShort } from '@/hooks/web3/use-musd-approval'
import { usePoolRealTimeSync } from '@/hooks/web3/use-pool-real-time-sync'
import { useIndividualPool } from '@/hooks/web3/use-individual-pool'
import { parseEther } from 'viem'
import { useToast } from '@/hooks/use-toast'
import { TransactionStatus } from './transaction-status'
import Link from 'next/link'

export function Deposits() {
  const [amount, setAmount] = useState('100')
  const [withdrawAmount, setWithdrawAmount] = useState('50')
  const musdPrice = 1 // MUSD is stablecoin, always $1

  const { address, isConnected, chainId } = useAccount()
  const { userInfo, isLoading: isPoolLoading } = useIndividualPool()
  const { toast } = useToast()
  
  // Enable real-time sync for entire page
  usePoolRealTimeSync()
  
  // MUSD approval and balance (V2 - Production Ready)
  const {
    musdBalance,
    balanceFormatted,
    allowance,
    isApprovalNeeded,
    approveUnlimited,
    approveAmount,
    isApproving,
    isApproveConfirming,
    isApprovalConfirmed,
    error: musdError,
  } = useMusdApprovalV2()
  
  // Real blockchain transactions (V3 - Production Ready with UUPS)
  const {
    deposit: depositV3,
    hash: depositHash,
    isDepositing,
    isConfirming: depositConfirming,
    isSuccess: depositSuccess,
    error: depositError,
  } = useDepositV3()
  
  const {
    fullWithdraw,
    hash: withdrawHash,
    isWithdrawing,
    isConfirming: withdrawConfirming,
    isSuccess: withdrawSuccess,
    error: withdrawError,
  } = useFullWithdrawV3()
  
  const {
    claimYield,
    hash: claimHash,
    isClaiming: isClaimingYield,
    isConfirming: claimConfirming,
    isSuccess: claimSuccess,
    error: claimError,
  } = useClaimYieldV3()

  // Calculate max amounts (MUSD-based)
  const maxDeposit = musdBalance ? Number(musdBalance) / 1e18 : 0
  const maxWithdraw = userInfo ? Number(userInfo.deposit) / 1e18 : 0
  
  // Check if approval is needed for current amount
  const depositNeedsApproval = isApprovalNeeded(
    amount ? BigInt(Math.floor(parseFloat(amount) * 1e18)) : BigInt(0)
  )

  const handleApprove = async () => {
    try {
      console.log('🔑 Starting approval process...')
      
      // Use unlimited approval for better UX (one approval per session)
      approveUnlimited() // Note: this is not async, it triggers writeContract
      
      toast({
        title: "📝 Aprobación iniciada",
        description: `Confirma la transacción en tu wallet`,
      })
    } catch (error) {
      console.error('❌ Approval error:', error)
      toast({
        title: "❌ Error en aprobación",
        description: error instanceof Error ? error.message : "La transacción fue rechazada",
        variant: "destructive",
      })
    }
  }

  const handleDeposit = async () => {
    try {
      console.log('💰 Iniciando depósito V3...', { 
        amount, 
        needsApproval: depositNeedsApproval,
        allowance: allowance?.toString(),
        musdBalance: musdBalance?.toString()
      })
      
      // Check if approval is needed
      if (depositNeedsApproval) {
        console.log('🔑 Approval still needed, cannot deposit yet')
        toast({
          title: "⚠️ Aprobación requerida",
          description: "Primero debes aprobar MUSD. Haz clic en 'Aprobar MUSD'.",
          variant: "destructive"
        })
        return // Don't proceed with deposit, user must approve first
      }
      
      // Proceed with deposit
      console.log('✅ Approval OK, calling depositV3...')
      const amountWei = parseEther(amount)
      console.log('Amount in wei:', amountWei.toString())
      
      depositV3(amountWei) // Note: not async, triggers writeContract
      
      toast({
        title: "📤 Depósito iniciado",
        description: `Confirma la transacción en tu wallet para depositar ${amount} MUSD`,
      })
    } catch (error) {
      console.error('❌ Error en depósito:', error)
      toast({
        title: "❌ Error en depósito",
        description: error instanceof Error ? error.message : "La transacción fue rechazada",
        variant: "destructive",
      })
    }
  }

  // Log approval state changes
  useEffect(() => {
    console.log('📊 Approval state:', {
      isApproving,
      isApproveConfirming,
      isApprovalConfirmed,
      depositNeedsApproval,
      allowance: allowance?.toString()
    })
  }, [isApproving, isApproveConfirming, isApprovalConfirmed, depositNeedsApproval, allowance])

  // Log deposit state changes
  useEffect(() => {
    console.log('📊 Deposit state:', {
      isDepositing,
      depositConfirming,
      depositSuccess,
      depositHash,
      depositError: depositError?.message
    })
  }, [isDepositing, depositConfirming, depositSuccess, depositHash, depositError])

  // Auto-proceed with deposit after approval is confirmed
  useEffect(() => {
    if (isApprovalConfirmed && !depositNeedsApproval && !depositHash && !isDepositing) {
      console.log('✅ Approval confirmed, auto-proceeding with deposit in 2 seconds...')
      // Delay to ensure allowance is updated
      const timer = setTimeout(() => {
        console.log('🚀 Auto-calling handleDeposit...')
        handleDeposit()
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [isApprovalConfirmed, depositNeedsApproval, depositHash, isDepositing])

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
      // fullWithdraw() withdraws entire position (V3)
      await fullWithdraw()
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
      <CardContent className="p-6 space-y-6">
        {/* Transaction Status Cards */}
        {depositHash && (
          <TransactionStatus
            hash={depositHash}
            isConfirming={depositConfirming}
            isSuccess={depositSuccess}
            type="deposit"
          />
        )}
        {withdrawHash && (
          <TransactionStatus
            hash={withdrawHash}
            isConfirming={withdrawConfirming}
            isSuccess={withdrawSuccess}
            type="withdraw"
          />
        )}
        {claimHash && (
          <TransactionStatus
            hash={claimHash}
            isConfirming={claimConfirming}
            isSuccess={claimSuccess}
            type="claim"
          />
        )}

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
            <AlertDialog open={undefined}>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="secondary" 
                  size="lg" 
                  className="w-full" 
                  disabled={isDepositing || isApproving || !musdBalance || isApproveConfirming}
                >
                  {isDepositing || isApproving || isApproveConfirming ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                      {isApproving || isApproveConfirming ? 'Aprobando...' : 'Depositando...'}
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" /> Añadir Fondos
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Depositar MUSD</AlertDialogTitle>
                  <AlertDialogDescription>Deposita MUSD para generar yields automáticamente</AlertDialogDescription>
                </AlertDialogHeader>
                <div className="text-sm space-y-3">
                  <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
                    <p className="font-semibold text-white mb-1">
                      Monto: {amount} MUSD
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ≈ ${(parseFloat(amount) * musdPrice).toLocaleString('en-US', { maximumFractionDigits: 2 })} USD
                    </p>
                  </div>

                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Tu saldo MUSD:</span>
                    <span className="font-mono font-semibold">{balanceFormatted} MUSD</span>
                  </div>

                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Gas estimado:</span>
                    <span className="text-green-500">~0.01 USD</span>
                  </div>
                  
                  {/* Transaction Status - Approval Stage */}
                  {depositNeedsApproval && !isApproving && !isApproveConfirming && (
                    <div className="p-4 rounded-lg bg-yellow-500/10 border-2 border-yellow-500/30 animate-pulse">
                      <div className="flex items-start gap-3">
                        <Lock className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-yellow-600 mb-1">Paso 1: Aprobar MUSD</p>
                          <p className="text-xs text-yellow-600/80">
                            Debes aprobar que el contrato use tu MUSD. Solo se hace una vez.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {isApproving && (
                    <div className="p-4 rounded-lg bg-blue-500/10 border-2 border-blue-500/30">
                      <div className="flex items-start gap-3">
                        <Loader2 className="w-5 h-5 text-blue-500 animate-spin flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-blue-500 mb-1">Esperando confirmación en wallet...</p>
                          <p className="text-xs text-blue-500/80">
                            Confirma la transacción de aprobación en tu wallet
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {isApproveConfirming && (
                    <div className="p-4 rounded-lg bg-blue-500/10 border-2 border-blue-500/30">
                      <div className="flex items-start gap-3">
                        <Loader2 className="w-5 h-5 text-blue-500 animate-spin flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-blue-500 mb-1">Confirmando aprobación...</p>
                          <p className="text-xs text-blue-500/80">
                            Esperando confirmación en blockchain (1-2 bloques)
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {isApprovalConfirmed && !depositNeedsApproval && (
                    <div className="p-4 rounded-lg bg-green-500/10 border-2 border-green-500/30">
                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-white text-xs">✓</span>
                        </div>
                        <div>
                          <p className="font-semibold text-green-500 mb-1">¡Aprobación completada!</p>
                          <p className="text-xs text-green-500/80">
                            Ahora puedes hacer el depósito
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Transaction Status - Deposit Stage */}
                  {isDepositing && (
                    <div className="p-4 rounded-lg bg-blue-500/10 border-2 border-blue-500/30">
                      <div className="flex items-start gap-3">
                        <Loader2 className="w-5 h-5 text-blue-500 animate-spin flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-blue-500 mb-1">Esperando confirmación en wallet...</p>
                          <p className="text-xs text-blue-500/80">
                            Confirma la transacción de depósito en tu wallet
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {depositConfirming && (
                    <div className="p-4 rounded-lg bg-blue-500/10 border-2 border-blue-500/30">
                      <div className="flex items-start gap-3">
                        <Loader2 className="w-5 h-5 text-blue-500 animate-spin flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-blue-500 mb-1">Procesando depósito...</p>
                          <p className="text-xs text-blue-500/80">
                            Esperando confirmación en blockchain (1-2 bloques)
                          </p>
                          {depositHash && (
                            <a 
                              href={`https://explorer.mezo.org/tx/${depositHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-500 hover:underline mt-1 inline-block"
                            >
                              Ver en explorer →
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {depositError && (
                    <div className="p-4 rounded-lg bg-red-500/10 border-2 border-red-500/30">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-red-500 mb-1">Error en transacción</p>
                          <p className="text-xs text-red-500/80">
                            {depositError.message || 'La transacción fue rechazada'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {depositSuccess && (
                    <div className="p-4 rounded-lg bg-green-500/10 border-2 border-green-500/30">
                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-white text-xs">✓</span>
                        </div>
                        <div>
                          <p className="font-semibold text-green-500 mb-1">¡Depósito exitoso!</p>
                          <p className="text-xs text-green-500/80">
                            Has depositado {amount} MUSD en el pool
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
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
                <Button variant="outline" size="lg" className="w-full border-primary text-primary hover:bg-primary/10 hover:text-primary" disabled={isWithdrawing || !userInfo || userInfo.deposit === BigInt(0)}>
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
                    Retiro total: {maxWithdraw.toFixed(2)} MUSD (= ${(maxWithdraw * musdPrice).toLocaleString('en-US', { maximumFractionDigits: 2 })}) USD)
                  </p>
                  <p className="text-muted-foreground">Gas estimado: ~0.01 USD</p>
                  <p className="text-xs text-muted-foreground">Saldo depositado: {formatMUSD(userInfo?.deposit)} MUSD</p>
                  <p className="text-xs text-green-500">Yields acumulados: {formatMUSD(userInfo?.yields)} MUSD</p>
                  {isWithdrawing && <p className="text-blue-500 animate-pulse">⏳ Enviando retiro...</p>}
                  {withdrawConfirming && <p className="text-blue-500 animate-pulse">⏳ Confirmando en blockchain...</p>}
                  {withdrawError && <p className="text-red-500">❌ Error: {withdrawError.message || 'Error en retiro'}</p>}
                  {withdrawSuccess && <p className="text-green-500">✅ ¡Retiro completado!</p>}
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isWithdrawing || withdrawConfirming}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleWithdraw} 
                    disabled={isWithdrawing || withdrawConfirming || maxWithdraw <= 0}
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
              disabled={isClaimingYield || claimConfirming || !userInfo || userInfo.yields === BigInt(0)}
            >
              <Gift className="mr-2 h-4 w-4" /> 
              {isClaimingYield ? 'Enviando...' : claimConfirming ? 'Confirmando...' : `Reclamar ${formatMUSD(userInfo?.yields)} MUSD`}
            </Button>

            {/* Help: Transaction Troubleshooting */}
            {(depositError || isDepositing || isApproving) && (
              <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
                <p className="text-sm font-semibold text-purple-400 mb-2">
                  🔍 ¿Problemas con la transacción?
                </p>
                <div className="space-y-2 text-xs text-purple-300">
                  <p className="font-medium">Abre la Consola del Navegador (F12) y busca:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Mensajes que empiecen con 🔑 📊 ✅ ❌</li>
                    <li>Errores en rojo</li>
                    <li>El estado de "Approval" y "Deposit"</li>
                  </ul>
                  <div className="mt-2 pt-2 border-t border-purple-500/30">
                    <p className="font-medium mb-1">Errores comunes:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Usuario rechazó la transacción en wallet</li>
                      <li>Gas insuficiente (necesitas ~0.001 BTC)</li>
                      <li>Red incorrecta (debe ser Mezo Testnet 31611)</li>
                    </ul>
                  </div>
                  <Link
                    href="/DIAGNOSTICO_DEPOSITO.md"
                    className="inline-flex items-center gap-1 text-purple-400 hover:text-purple-300 transition font-medium mt-2"
                  >
                    Ver guía completa de diagnóstico <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            )}

            {/* Info: Get MUSD */}
            {(!musdBalance || Number(musdBalance) === 0) && (
              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <p className="text-sm font-semibold text-blue-400 mb-2">
                  ⚠️ No tienes MUSD en tu wallet
                </p>
                <p className="text-xs text-blue-300 mb-3">
                  Si tienes MUSD en el Stability Pool de Mezo, necesitas retirarlo a tu wallet primero:
                </p>
                <div className="space-y-2">
                  <Link
                    href="https://app.mezo.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-xs text-blue-500 hover:text-blue-400 transition font-medium"
                  >
                    1. Ir a Mezo App <ExternalLink className="w-3 h-3" />
                  </Link>
                  <p className="text-xs text-blue-300">
                    2. Retira tu MUSD del Stability Pool a tu wallet
                  </p>
                  <p className="text-xs text-blue-300">
                    3. Vuelve aquí y podrás depositar en KhipuVault
                  </p>
                </div>
                <div className="mt-3 pt-3 border-t border-blue-500/30">
                  <p className="text-xs text-muted-foreground">
                    💡 Si no tienes MUSD, puedes obtenerlo depositando BTC en Mezo Protocol
                  </p>
                </div>
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
                ❌ Error: {claimError.message || 'Error al reclamar'}
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
                  disabled={isWithdrawing || !userInfo || userInfo.deposit === BigInt(0)}
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
