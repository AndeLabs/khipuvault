/**
 * Cooperative Savings Pool Page V3 - Production Ready
 * All component exports have been fixed to support both V3 and non-V3 naming
 *
 * MAJOR UPDATE: Hybrid Event Indexing System
 * - Historical scanning: Detects pools created before page load
 * - Real-time events: Watches for new pools while page is open
 * - Complete coverage: Never miss a pool again!
 */
'use client'

export const dynamic = 'force-dynamic'

import { useState } from "react"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AnimateOnScroll } from "@/components/animate-on-scroll"
import { CreatePool } from "@/components/dashboard/cooperative-savings/create-pool"
import { PoolsList } from "@/components/dashboard/cooperative-savings/pools-list"
import { JoinPool } from "@/components/dashboard/cooperative-savings/join-pool"
import { MyPools } from "@/components/dashboard/cooperative-savings/my-pools"
import { FloatingSyncIndicator } from "@/components/dashboard/cooperative-savings/sync-indicator"
import { HistoricalScanIndicator } from "@/components/dashboard/cooperative-savings/historical-scan-indicator"
import { useCooperativePoolEvents } from "@/hooks/web3/use-cooperative-pool-events"
import { useHistoricalPoolEvents } from "@/hooks/web3/use-historical-pool-events"

export default function CooperativeSavingsPage() {
  // 🔥 NEW: Scan historical events (pools created before page load)
  const historicalScan = useHistoricalPoolEvents({
    enabled: true,
    scanOnMount: true,
    verbose: true,
  })

  // ✅ EXISTING: Listen for real-time events (pools created while page is open)
  useCooperativePoolEvents()

  const [activeTab, setActiveTab] = useState('explore')
  const [selectedPoolId, setSelectedPoolId] = useState<number | null>(null)

  const handleJoinPool = (poolId: number) => {
    setSelectedPoolId(poolId)
    setActiveTab('join')
  }

  const handleBackToExplore = () => {
    setSelectedPoolId(null)
    setActiveTab('explore')
  }

  const handleJoinSuccess = () => {
    setSelectedPoolId(null)
    setActiveTab('my-pools')
  }

  const handleCreateSuccess = () => {
    setActiveTab('my-pools')
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Floating sync indicator */}
      <FloatingSyncIndicator />

      <AnimateOnScroll>
        <Link href="/dashboard" className="flex items-center gap-2 text-primary hover:underline">
          <ChevronLeft className="h-4 w-4" />
          Volver al Dashboard
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-white mt-4 flex items-center gap-3">
          <span role="img" aria-label="handshake emoji" className="text-2xl">🤝</span>
          Cooperative Savings Pool V3
        </h1>
        <p className="text-muted-foreground mt-2">
          Ahorra en grupo con BTC nativo · Yields compartidos · Sin fees de entrada
        </p>
      </AnimateOnScroll>

      {/* 🔥 NEW: Historical scan indicator - Shows when indexing past events */}
      {(historicalScan.isScanning || historicalScan.error) && (
        <AnimateOnScroll delay="50ms">
          <HistoricalScanIndicator />
        </AnimateOnScroll>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <AnimateOnScroll delay="100ms">
          <TabsList className="grid w-full grid-cols-3 bg-card border-primary/20">
            <TabsTrigger value="explore">Explorar Pools</TabsTrigger>
            <TabsTrigger value="my-pools">Mis Pools</TabsTrigger>
            <TabsTrigger value="create">Crear Pool</TabsTrigger>
          </TabsList>
        </AnimateOnScroll>

        <AnimateOnScroll delay="200ms">
          <TabsContent value="explore" className="mt-6">
            <PoolsList onJoinPool={handleJoinPool} />
          </TabsContent>

          <TabsContent value="my-pools" className="mt-6">
            <MyPools />
          </TabsContent>

          <TabsContent value="create" className="mt-6">
            <CreatePool onSuccess={handleCreateSuccess} />
          </TabsContent>

          <TabsContent value="join" className="mt-6">
            {selectedPoolId && (
              <JoinPool
                poolId={selectedPoolId}
                onBack={handleBackToExplore}
                onSuccess={handleJoinSuccess}
              />
            )}
          </TabsContent>
        </AnimateOnScroll>
      </Tabs>
    </div>
  )
}
