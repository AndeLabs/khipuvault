'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAccount, useChainId, useBalance } from 'wagmi'
import { useIndividualPoolV3 } from '@/hooks/web3/use-individual-pool-v3'
import { useMusdApproval } from '@/hooks/web3/use-musd-approval'
import { MEZO_TESTNET_ADDRESSES } from '@/lib/web3/contracts'
import { RefreshCw } from 'lucide-react'

export function DebugPanel() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { data: nativeBalance } = useBalance({ address })
  
  const {
    userInfo,
    poolTVL,
    isLoading: poolLoading,
  } = useIndividualPoolV3()
  
  const {
    musdBalance,
    balanceFormatted,
    allowance,
  } = useMusdApproval()

  const handleRefresh = () => {
    window.location.reload()
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
          <p className="text-muted-foreground mb-1">MUSD Balance (from useMusdApproval):</p>
          <p className="text-white">Raw Wei: {musdBalance?.toString() || '0'}</p>
          <p className="text-white">Formatted: {balanceFormatted} MUSD</p>
          <p className="text-white">Allowance: {allowance?.toString() || '0'} wei</p>
        </div>

        <div>
          <p className="text-muted-foreground mb-1">User Deposit (V3):</p>
          <p className="text-white">Active: {userInfo && userInfo.deposit > BigInt(0) ? '✅ Yes' : '❌ No'}</p>
          <p className="text-white">MUSD Amount: {userInfo?.deposit.toString() || '0'} wei</p>
          <p className="text-white">Yield Accrued: {userInfo?.yields.toString() || '0'} wei</p>
          <p className="text-white">Days Active: {userInfo?.daysActive.toString() || '0'}</p>
          <p className="text-white">Auto-Compound: {userInfo?.autoCompoundEnabled ? '✅ On' : '❌ Off'}</p>
        </div>

        <div>
          <p className="text-muted-foreground mb-1">Pool Stats (V3):</p>
          <p className="text-white">Pool TVL: {poolTVL?.toString() || '0'} wei</p>
          <p className="text-white">TVL (formatted): {(Number(poolTVL || 0) / 1e18).toFixed(2)} MUSD</p>
        </div>

        <div>
          <p className="text-muted-foreground mb-1">Loading States:</p>
          <p className="text-white">Pool Loading: {poolLoading ? '⏳ Yes' : '✅ No'}</p>
        </div>

        <div className="pt-2 border-t border-yellow-500/30">
          <p className="text-yellow-500 text-xs font-semibold mb-2">
            💡 Diagnóstico del Balance MUSD:
          </p>
          {musdBalance && Number(musdBalance) > 0 ? (
            <p className="text-green-500 text-xs">✅ Tienes MUSD en tu wallet. Puedes depositar!</p>
          ) : (
            <div className="space-y-2">
              <p className="text-red-400 text-xs">❌ No tienes MUSD en tu wallet</p>
              <div className="bg-blue-500/10 border border-blue-500/30 rounded p-2">
                <p className="text-blue-400 text-xs font-semibold mb-1">Si tienes MUSD en Stability Pool de Mezo:</p>
                <ol className="text-muted-foreground text-xs space-y-1 ml-3">
                  <li>1. Ve a <a href="https://app.mezo.org" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">app.mezo.org</a></li>
                  <li>2. Retira tu MUSD del Stability Pool</li>
                  <li>3. El MUSD aparecerá en tu wallet</li>
                  <li>4. Recarga esta página y podrás depositar</li>
                </ol>
              </div>
              <div className="bg-green-500/10 border border-green-500/30 rounded p-2">
                <p className="text-green-400 text-xs font-semibold mb-1">Si quieres obtener MUSD con tu BTC ({nativeBalance ? Number(nativeBalance.formatted).toFixed(6) : '0'} BTC):</p>
                <ol className="text-muted-foreground text-xs space-y-1 ml-3">
                  <li>1. Ve a <a href="https://app.mezo.org" target="_blank" rel="noopener noreferrer" className="text-green-500 hover:underline">app.mezo.org</a></li>
                  <li>2. Deposita BTC para abrir un Trove</li>
                  <li>3. Mintea MUSD contra tu BTC</li>
                  <li>4. Usa ese MUSD en KhipuVault</li>
                </ol>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
