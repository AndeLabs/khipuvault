/**
 * Cooperative Savings Pool Page
 * Optimized with code splitting and lazy loading for better performance
 */
'use client'

export const dynamic = 'force-dynamic'

import { useState, Suspense } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { ChevronLeft, BarChart3, Loader2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AnimateOnScroll } from "@/components/animate-on-scroll"
import { useCooperativePoolEvents } from "@/hooks/web3/use-cooperative-pool-events"
import { useHistoricalPoolEvents } from "@/hooks/web3/use-historical-pool-events"
import { useRealtimePoolEvents } from "@/hooks/web3/use-realtime-pool-events"

export default function CooperativeSavingsPage() {
  // 🔥 HISTORICAL: Scan past events (one-time on mount, cached)
  const historicalScan = useHistoricalPoolEvents({
    enabled: true,
    scanOnMount: true,
    verbose: true,
  })

  // ⚡ REAL-TIME: WebSocket stream for instant updates
  const realtimeStream = useRealtimePoolEvents({
    enabled: true,
    enableNotifications: true,
    enableOptimistic: true,
    enableAnalytics: true,
    onPoolCreated: (event) => {
      console.log('🎉 Real-time pool created:', event)
    },
  })

  // ✅ LEGACY: Fallback event listener (for compatibility)
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
      <Suspense fallback={null}>
        <FloatingSyncIndicator />
      </Suspense>

      {/* Header Section */}
      <AnimateOnScroll>
        <Link href="/dashboard" className="flex items-center gap-2 text-primary hover:underline">
          <ChevronLeft className="h-4 w-4" />
          Volver al Dashboard
        </Link>
        <div className="mt-4 flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <span role="img" aria-label="handshake emoji" className="text-2xl">🤝</span>
              Cooperative Savings Pool
              <span className="text-sm font-normal px-2 py-1 rounded-full bg-primary/10 text-primary">
                ENTERPRISE
              </span>
            </h1>
            <p className="text-muted-foreground mt-2">
              Ahorra en grupo con BTC nativo · Yields compartidos · Sin fees de entrada
            </p>
          </div>
          {/* Real-time status badge */}
          <div className="flex items-center gap-2">
            <Suspense fallback={null}>
              <RealtimeStatusBadge showStats showNotificationButton />
            </Suspense>
          </div>
        </div>
      </AnimateOnScroll>

      {/* 🔥 Historical scan indicator - Shows when indexing past events */}
      {(historicalScan.isScanning || historicalScan.error) && (
        <AnimateOnScroll delay="50ms">
          <HistoricalScanIndicator />
        </AnimateOnScroll>
      )}

      {/* 📊 Real-Time Analytics Dashboard */}
      <AnimateOnScroll delay="100ms">
        <Suspense fallback={
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        }>
          <RealtimeAnalyticsDashboard mini />
        </Suspense>
      </AnimateOnScroll>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <AnimateOnScroll delay="150ms">
          <TabsList className="grid w-full grid-cols-4 bg-card border-primary/20">
            <TabsTrigger value="explore">Explorar Pools</TabsTrigger>
            <TabsTrigger value="my-pools">Mis Pools</TabsTrigger>
            <TabsTrigger value="create">Crear Pool</TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>
        </AnimateOnScroll>

        <AnimateOnScroll delay="200ms">
          <TabsContent value="explore" className="mt-6">
            <Suspense fallback={
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            }>
              <PoolsList onJoinPool={handleJoinPool} />
            </Suspense>
          </TabsContent>

          <TabsContent value="my-pools" className="mt-6">
            <Suspense fallback={
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            }>
              <MyPools />
            </Suspense>
          </TabsContent>

          <TabsContent value="create" className="mt-6">
            <Suspense fallback={
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            }>
              <CreatePool onSuccess={handleCreateSuccess} />
            </Suspense>
          </TabsContent>

          <TabsContent value="join" className="mt-6">
            {selectedPoolId && (
              <Suspense fallback={
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              }>
                <JoinPool
                  poolId={selectedPoolId}
                  onBack={handleBackToExplore}
                  onSuccess={handleJoinSuccess}
                />
              </Suspense>
            )}
          </TabsContent>

          {/* 📊 Analytics Tab - Full Dashboard */}
          <TabsContent value="analytics" className="mt-6">
            <Suspense fallback={
              <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            }>
              <RealtimeAnalyticsDashboard />
            </Suspense>
          </TabsContent>
        </AnimateOnScroll>
      </Tabs>
    </div>
  )
}
