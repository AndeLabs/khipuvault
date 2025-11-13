'use client'

import { Card } from '@/components/ui/card'
import { useCooperativePools } from '@/hooks/web3/use-cooperative-pools'
import { useCooperativePool } from '@/hooks/web3/use-cooperative-pool'
import { useAccount, usePublicClient } from 'wagmi'
import { MEZO_TESTNET_ADDRESSES } from '@/lib/web3/contracts'

export function PoolDebug() {
  const { isConnected, address } = useAccount()
  const publicClient = usePublicClient()
  const { pools, poolCounter, isLoading } = useCooperativePools()
  const cooperativePool = useCooperativePool()

  return (
    <Card className="p-6 bg-red-500/10 border-red-500/50">
      <h2 className="text-xl font-bold text-red-500 mb-4">🔍 DEBUG INFO</h2>

      <div className="space-y-2 text-sm font-mono">
        <div>
          <strong>Wallet Connected:</strong> {isConnected ? '✅ YES' : '❌ NO'}
        </div>
        <div>
          <strong>Wallet Address:</strong> {address || 'Not connected'}
        </div>
        <div>
          <strong>PublicClient:</strong> {publicClient ? '✅ Connected' : '❌ Not found'}
        </div>
        <div>
          <strong>Contract Address:</strong> {MEZO_TESTNET_ADDRESSES.cooperativePool}
        </div>

        <hr className="my-4 border-red-500/30" />

        <div>
          <strong>Pool Counter (useCooperativePools):</strong> {String(poolCounter)}
        </div>
        <div>
          <strong>Pool Counter (useCooperativePool):</strong> {cooperativePool.poolCounter}
        </div>
        <div>
          <strong>Is Loading:</strong> {isLoading ? 'YES' : 'NO'}
        </div>
        <div>
          <strong>Pools Array Length:</strong> {pools.length}
        </div>
        <div>
          <strong>Pools Data:</strong>
          <pre className="mt-2 p-2 bg-black/20 rounded text-xs overflow-auto max-h-40">
            {JSON.stringify(pools, (key, value) =>
              typeof value === 'bigint' ? value.toString() : value
            , 2)}
          </pre>
        </div>

        <hr className="my-4 border-red-500/30" />

        <div className="text-yellow-500">
          <strong>⚠️ Posibles Problemas:</strong>
          <ul className="list-disc list-inside mt-2 space-y-1">
            {!isConnected && <li>Wallet no conectada</li>}
            {!publicClient && <li>PublicClient no disponible</li>}
            {poolCounter === 0n && <li>Pool counter es 0 - No hay pools creados</li>}
            {isLoading && <li>Cargando datos...</li>}
            {pools.length === 0 && poolCounter > 0n && <li>Counter &gt; 0 pero pools array vacío - Error al cargar</li>}
          </ul>
        </div>
      </div>
    </Card>
  )
}
