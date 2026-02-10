"use client";

export const dynamic = "force-dynamic";

import { Clock, Plus, TrendingUp, Users } from "lucide-react";
import nextDynamic from "next/dynamic";
import { useState } from "react";
import { useAccount } from "wagmi";

import { PageHeader } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RoscaCard } from "@/features/rotating-pool/components/rosca-card";
import { usePoolCounter } from "@/hooks/web3/rotating";

// Lazy load modal to reduce initial bundle size
const CreateRoscaModal = nextDynamic(
  () =>
    import("@/features/rotating-pool/components/create-rosca-modal").then(
      (mod) => mod.CreateRoscaModal
    ),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[600px] w-full" />,
  }
);

export default function RotatingPoolPage() {
  const { isConnected } = useAccount();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const { data: poolCounter, isPending: isCounterPending } = usePoolCounter();

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="ROSCA Pools"
          description="No wallet connected. Please connect your wallet to participate in ROSCA pools."
        />
        <Card className="shadow-custom border-primary/20 bg-card">
          <CardContent className="py-12 text-center">
            <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">
              Connect your wallet to create or join ROSCA pools.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="ROSCA Pools"
        description="Rotating Savings and Credit Association with DeFi yields"
        actions={
          <Button onClick={() => setCreateModalOpen(true)} size="lg">
            <Plus className="mr-2 h-4 w-4" />
            Create ROSCA
          </Button>
        }
      />

      {/* Stats Overview */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="shadow-custom border-primary/20 bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total ROSCAs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isCounterPending ? "..." : (poolCounter?.toString() ?? "0")}
            </div>
            <p className="text-xs text-muted-foreground">Active savings circles</p>
          </CardContent>
        </Card>

        <Card className="shadow-custom border-primary/20 bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My ROSCAs</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Pools you&apos;re participating in</p>
          </CardContent>
        </Card>

        <Card className="shadow-custom border-primary/20 bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Yields</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0.000 MUSD</div>
            <p className="text-xs text-muted-foreground">Earned from DeFi integration</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All ROSCAs</TabsTrigger>
          <TabsTrigger value="my-pools">My Pools</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          <Card className="shadow-custom border-primary/20 bg-card">
            <CardHeader>
              <CardTitle>Available ROSCAs</CardTitle>
              <CardDescription>
                Join an existing ROSCA or create your own savings circle
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isCounterPending ? (
                <div className="py-12 text-center">
                  <p className="text-muted-foreground">Loading pools...</p>
                </div>
              ) : poolCounter && typeof poolCounter === "bigint" && poolCounter > 0n ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {/* Render pool cards */}
                  {Array.from({ length: Number(poolCounter) }, (_, i) => (
                    <RoscaCard key={i} poolId={BigInt(i + 1)} />
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="mb-4 text-muted-foreground">
                    No ROSCAs created yet. Be the first to start a savings circle!
                  </p>
                  <Button onClick={() => setCreateModalOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create First ROSCA
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="my-pools" className="space-y-6">
          <Card className="shadow-custom border-primary/20 bg-card">
            <CardHeader>
              <CardTitle>My ROSCAs</CardTitle>
              <CardDescription>Pools you&apos;re currently participating in</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="py-12 text-center">
                <Clock className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <p className="mb-4 text-muted-foreground">
                  You&apos;re not participating in any ROSCAs yet.
                </p>
                <Button onClick={() => setCreateModalOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Join or Create ROSCA
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed" className="space-y-6">
          <Card className="shadow-custom border-primary/20 bg-card">
            <CardHeader>
              <CardTitle>Completed ROSCAs</CardTitle>
              <CardDescription>ROSCAs that have finished all payouts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="py-12 text-center">
                <p className="text-muted-foreground">No completed pools yet.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create ROSCA Modal */}
      <CreateRoscaModal open={createModalOpen} onOpenChange={setCreateModalOpen} />
    </div>
  );
}
