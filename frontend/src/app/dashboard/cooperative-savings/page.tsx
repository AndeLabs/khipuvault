/**
 * Cooperative Savings Pool Page V3 - ENTERPRISE EDITION
 * All component exports have been fixed to support both V3 and non-V3 naming
 *
 * 🚀 ENTERPRISE FEATURES:
 * - Historical scanning: Complete event history from deployment
 * - Real-time WebSocket: Instant updates, zero polling
 * - Push notifications: Desktop alerts for new pools
 * - Analytics dashboard: Live statistics and trends
 * - Optimistic updates: Instant UI feedback
 * - Premium UI/UX: Animations, gradients, smooth transitions
 *
 * ARCHITECTURE:
 * ┌─────────────────────────────────────────┐
 * │ Historical Scan (Past Events)           │
 * │ + Real-Time Stream (New Events)         │
 * │ = COMPLETE EVENT COVERAGE               │
 * └─────────────────────────────────────────┘
 */
'use client'

export const dynamic = 'force-dynamic'

import { useState } from "react"
import Link from "next/link"
import { ChevronLeft, BarChart3 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AnimateOnScroll } from "@/components/animate-on-scroll"
import { CreatePool } from "@/components/dashboard/cooperative-savings/create-pool"
import { PoolsList } from "@/components/dashboard/cooperative-savings/pools-list"
import { JoinPool } from "@/components/dashboard/cooperative-savings/join-pool"
import { MyPools } from "@/components/dashboard/cooperative-savings/my-pools"
import { FloatingSyncIndicator } from "@/components/dashboard/cooperative-savings/sync-indicator"
import { HistoricalScanIndicator } from "@/components/dashboard/cooperative-savings/historical-scan-indicator"
import { RealtimeStatusBadge } from "@/components/dashboard/cooperative-savings/realtime-status-badge"
import { RealtimeAnalyticsDashboard } from "@/components/dashboard/cooperative-savings/realtime-analytics-dashboard"
import { useCooperativePoolEvents } from "@/hooks/web3/use-cooperative-pool-events"
import { useHistoricalPoolEvents } from "@/hooks/web3/use-historical-pool-events"
import { useRealtimePoolEvents } from "@/hooks/web3/use-realtime-pool-events"
import { PoolDebug } from "@/components/debug/pool-debug"

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
      <FloatingSyncIndicator />

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
            <RealtimeStatusBadge showStats showNotificationButton />
          </div>
        </div>
      </AnimateOnScroll>

      {/* 🔍 DEBUG COMPONENT - Remove after fixing */}
      <AnimateOnScroll delay="50ms">
        <PoolDebug />
      </AnimateOnScroll>

      {/* 🔥 Historical scan indicator - Shows when indexing past events */}
      {(historicalScan.isScanning || historicalScan.error) && (
        <AnimateOnScroll delay="75ms">
          <HistoricalScanIndicator />
        </AnimateOnScroll>
      )}

      {/* 📊 Real-Time Analytics Dashboard */}
      <AnimateOnScroll delay="100ms">
        <RealtimeAnalyticsDashboard mini />
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

          {/* 📊 Analytics Tab - Full Dashboard */}
          <TabsContent value="analytics" className="mt-6">
            <RealtimeAnalyticsDashboard />
          </TabsContent>
        </AnimateOnScroll>
      </Tabs>
    </div>
  )
}
