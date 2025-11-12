/**
 * Cooperative Savings Pool Page
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
import { useCooperativePoolEvents } from "@/hooks/web3/use-cooperative-pool-events"

export default function CooperativeSavingsPage() {
  // Enable automatic refresh on blockchain events
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
          Cooperative Savings Pool
        </h1>
        <p className="text-muted-foreground mt-2">
          Ahorra en grupo con BTC nativo · Yields compartidos · Sin fees de entrada
        </p>
      </AnimateOnScroll>

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
