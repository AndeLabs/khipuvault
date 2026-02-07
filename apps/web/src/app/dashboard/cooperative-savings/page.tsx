"use client";

/**
 * Cooperative Savings Page - V3 Production Ready
 *
 * Features:
 * ✅ Browse all pools with filters and search
 * ✅ My Pools dashboard with memberships
 * ✅ Create new pools
 * ✅ Join existing pools
 * ✅ Leave pools with yield distribution
 * ✅ Claim yields
 * ✅ View pool details with members list
 * ✅ Real-time data from blockchain
 * ✅ Responsive tabbed layout
 *
 * Optimizations:
 * ✅ Dynamic imports for modals (loaded on demand)
 * ✅ Reduced initial bundle size
 */

import { Info, Wallet } from "lucide-react";
import nextDynamic from "next/dynamic";
import * as React from "react";
import { useAccount } from "wagmi";

import { PageHeader } from "@/components/layout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Web3ErrorBoundary } from "@/components/web3-error-boundary";
import { PoolsBrowseV3, MyPoolsDashboard } from "@/features/cooperative-savings";
import { useToast } from "@/hooks/use-toast";
import { useAllCooperativePools } from "@/hooks/web3/use-all-cooperative-pools";
import { useCooperativePool } from "@/hooks/web3/use-cooperative-pool";

// Dynamic imports for modals - only loaded when needed
const PoolDetailsModal = nextDynamic(
  () => import("@/features/cooperative-savings").then((mod) => ({ default: mod.PoolDetailsModal })),
  { ssr: false }
);

const CreatePoolModalV3 = nextDynamic(
  () =>
    import("@/features/cooperative-savings").then((mod) => ({ default: mod.CreatePoolModalV3 })),
  { ssr: false }
);

const JoinPoolModalV3 = nextDynamic(
  () => import("@/features/cooperative-savings").then((mod) => ({ default: mod.JoinPoolModalV3 })),
  { ssr: false }
);

const LeavePoolDialog = nextDynamic(
  () => import("@/features/cooperative-savings").then((mod) => ({ default: mod.LeavePoolDialog })),
  { ssr: false }
);

export default function CooperativeSavingsPage() {
  const { isConnected } = useAccount();
  const { toast } = useToast();
  const { statistics, refetch } = useAllCooperativePools();
  const { claimYield, state: claimState } = useCooperativePool();

  // Modal states
  const [createModalOpen, setCreateModalOpen] = React.useState(false);
  const [joinModalOpen, setJoinModalOpen] = React.useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = React.useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = React.useState(false);

  // Selected pool for modals
  const [selectedPoolId, setSelectedPoolId] = React.useState<number | null>(null);

  // Active tab
  const [activeTab, setActiveTab] = React.useState("browse");

  // Handle create pool
  const handleCreatePool = () => {
    setCreateModalOpen(true);
  };

  // Handle join pool
  const handleJoinPool = (poolId: number) => {
    setSelectedPoolId(poolId);
    setJoinModalOpen(true);
  };

  // Handle leave pool
  const handleLeavePool = (poolId: number) => {
    setSelectedPoolId(poolId);
    setLeaveDialogOpen(true);
  };

  // Handle claim yield
  const handleClaimYield = async (poolId: number) => {
    try {
      await claimYield(poolId);
      // Success handled by hook
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Claim yield error:", err);
    }
  };

  // Handle view details
  const handleViewDetails = (poolId: number) => {
    setSelectedPoolId(poolId);
    setDetailsModalOpen(true);
  };

  // Handle manage pool (same as view details for now)
  const handleManagePool = (poolId: number) => {
    setSelectedPoolId(poolId);
    setDetailsModalOpen(true);
  };

  // Handle modal success callbacks
  // Note: Refetch is handled immediately - event listeners in hooks provide additional reliability
  const handleCreateSuccess = () => {
    toast({
      title: "Pool Created!",
      description: "Your cooperative pool has been created successfully.",
    });
    void refetch();
  };

  const handleJoinSuccess = () => {
    toast({
      title: "Joined Pool!",
      description: "You have successfully joined the cooperative pool.",
    });
    void refetch();
    setActiveTab("my-pools");
  };

  const handleLeaveSuccess = () => {
    toast({
      title: "Left Pool",
      description: "You have successfully left the pool and withdrawn your funds.",
    });
    void refetch();
  };

  // Handle claim success
  React.useEffect(() => {
    if (claimState === "success") {
      toast({
        title: "Yield Claimed!",
        description: "Your yields have been successfully claimed.",
      });
      void refetch();
    }
  }, [claimState, refetch, toast]);

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Cooperative Pools"
          description="Connect your wallet to explore and join cooperative savings pools"
        />
        <div className="py-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Wallet className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mb-2 font-heading text-xl font-semibold">Wallet Not Connected</h3>
          <p className="mx-auto max-w-md text-muted-foreground">
            Please connect your wallet to access Cooperative Pools and start saving together.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Web3ErrorBoundary
      onError={(error, errorInfo) => {
        // eslint-disable-next-line no-console
        console.error("Cooperative Savings Error:", error, errorInfo);
      }}
    >
      <div className="animate-slide-up space-y-6">
        {/* Page Header */}
        <PageHeader
          title="Cooperative Pools"
          description="Save together with friends and earn rotating payouts plus yields"
        />

        {/* Info Alert */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>How it works:</strong> Create or join a pool with friends. Each member
            contributes BTC which is deposited into Mezo to generate yields. Yields are distributed
            proportionally based on each member&apos;s contribution.
          </AlertDescription>
        </Alert>

        {/* Tabbed Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:inline-grid lg:w-auto">
            <TabsTrigger value="browse" className="gap-2">
              Browse Pools
              {statistics.totalPools > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {statistics.totalPools}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="my-pools" className="gap-2">
              My Pools
              {statistics.userMemberships > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {statistics.userMemberships}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Browse Pools Tab */}
          <TabsContent value="browse" className="mt-6">
            <PoolsBrowseV3
              onJoinPool={handleJoinPool}
              onViewDetails={handleViewDetails}
              onManagePool={handleManagePool}
              onCreatePool={handleCreatePool}
            />
          </TabsContent>

          {/* My Pools Tab */}
          <TabsContent value="my-pools" className="mt-6">
            <MyPoolsDashboard
              onViewDetails={handleViewDetails}
              onClaimYield={handleClaimYield}
              onLeavePool={handleLeavePool}
              onManagePool={handleManagePool}
            />
          </TabsContent>
        </Tabs>

        {/* Modals and Dialogs */}
        <CreatePoolModalV3
          open={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onSuccess={handleCreateSuccess}
        />

        <JoinPoolModalV3
          poolId={selectedPoolId}
          open={joinModalOpen}
          onClose={() => {
            setJoinModalOpen(false);
            setSelectedPoolId(null);
          }}
          onSuccess={handleJoinSuccess}
        />

        <LeavePoolDialog
          poolId={selectedPoolId}
          open={leaveDialogOpen}
          onClose={() => {
            setLeaveDialogOpen(false);
            setSelectedPoolId(null);
          }}
          onSuccess={handleLeaveSuccess}
        />

        <PoolDetailsModal
          poolId={selectedPoolId}
          open={detailsModalOpen}
          onClose={() => {
            setDetailsModalOpen(false);
            setSelectedPoolId(null);
          }}
          onJoin={handleJoinPool}
          onLeave={handleLeavePool}
          onClaim={handleClaimYield}
        />
      </div>
    </Web3ErrorBoundary>
  );
}
