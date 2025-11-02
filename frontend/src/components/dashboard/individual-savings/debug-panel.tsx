'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAccount, useChainId, useBalance } from 'wagmi'
import { useIndividualPool } from '@/hooks/web3/use-individual-pool'
import { useMusdApprovalV2 } from '@/hooks/web3/use-musd-approval-v2'
import { MEZO_TESTNET_ADDRESSES } from '@/lib/web3/contracts'
import { RefreshCw } from 'lucide-react'

export function DebugPanel() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { data: nativeBalance } = useBalance({ address })
  
  const {
    poolStats,
    userDeposit,
    walletBalances,
    isLoading: poolLoading,
    _debug,
  } = useIndividualPool()
  
  const {
    musdBalance,
    balanceFormatted,
    allowance,
  } = useMusdApprovalV2()

  const handleRefresh = () => {
    _debug?.manualRefetch()
    _debug?.logCurrentData()
  }

  if (!isConnected) return null

  return (
    <Card className="bg-card border border-yellow-500/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-yellow-500">🔧 Panel de Diagnóstico</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            className="text-yellow-500 hover:text-yellow-400"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refrescar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-xs font-mono">
        <div>
          <p className="text-muted-foreground mb-1">Wallet Info:</p>
          <p className="text-white">Address: {address?.slice(0, 10)}...{address?.slice(-8)}</p>
          <p className="text-white">Chain ID: {chainId} {chainId === 31611 ? '✅ Mezo Testnet' : '❌ Wrong Network'}</p>
          <p className="text-white">Native BTC: {nativeBalance ? Number(nativeBalance.formatted).toFixed(6) : '0'} BTC</p>
        </div>

        <div>
          <p className="text-muted-foreground mb-1">Contract Addresses:</p>
          <p className="text-white text-xs break-all">MUSD: {MEZO_TESTNET_ADDRESSES.musd}</p>
          <p className="text-white text-xs break-all">Pool: {MEZO_TESTNET_ADDRESSES.individualPool}</p>
        </div>

        <div>
          <p className="text-muted-foreground mb-1">MUSD Balance (from useMusdApprovalV2):</p>
          <p className="text-white">Raw Wei: {musdBalance?.toString() || '0'}</p>
          <p className="text-white">Formatted: {balanceFormatted} MUSD</p>
          <p className="text-white">Allowance: {allowance?.toString() || '0'} wei</p>
        </div>

        <div>
          <p className="text-muted-foreground mb-1">MUSD Balance (from useIndividualPool):</p>
          <p className="text-white">Raw Wei: {walletBalances.musdBalance.toString()}</p>
          <p className="text-white">As Number: {(Number(walletBalances.musdBalance) / 1e18).toFixed(2)} MUSD</p>
        </div>

        <div>
          <p className="text-muted-foreground mb-1">User Deposit:</p>
          <p className="text-white">Active: {userDeposit?.active ? '✅ Yes' : '❌ No'}</p>
          <p className="text-white">MUSD Amount: {userDeposit?.musdAmount.toString() || '0'} wei</p>
          <p className="text-white">Yield Accrued: {userDeposit?.yieldAccrued.toString() || '0'} wei</p>
        </div>

        <div>
          <p className="text-muted-foreground mb-1">Pool Stats:</p>
          <p className="text-white">Total Deposited: {poolStats.totalMusdDeposited.toString()} wei</p>
          <p className="text-white">Total Yields: {poolStats.totalYields.toString()} wei</p>
          <p className="text-white">Pool APR: {poolStats.poolAPR}%</p>
        </div>

        <div>
          <p className="text-muted-foreground mb-1">Loading States:</p>
          <p className="text-white">Pool Loading: {poolLoading ? '⏳ Yes' : '✅ No'}</p>
        </div>

        <div className="pt-2 border-t border-yellow-500/30">
          <p className="text-yellow-500 text-xs">
            💡 Si ves balance 0 pero tienes MUSD en Mezo, verifica:
          </p>
          <ul className="text-muted-foreground text-xs mt-1 space-y-1">
            <li>• Estás en la red correcta (Chain ID 31611)</li>
            <li>• La dirección del contrato MUSD es correcta</li>
            <li>• El RPC de Mezo está respondiendo</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
