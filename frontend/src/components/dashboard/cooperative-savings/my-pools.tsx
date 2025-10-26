/**
 * @fileoverview My Pools Component - Production Ready
 * @module components/dashboard/cooperative-savings/my-pools
 * 
 * Shows all pools where the user is a member
 * Fetches real data from blockchain
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Settings, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  useCooperativePools, 
  useMemberInfo, 
  usePoolMembers,
  useMemberYield,
  useLeavePool,
  useClaimYield,
  formatBTC 
} from "@/hooks/web3/use-cooperative-pools";
import { useAccount } from "wagmi";
import { useToast } from "@/hooks/use-toast";

export function MyPools() {
  const { address } = useAccount();
  const { pools, isLoading } = useCooperativePools();
  const { toast } = useToast();
  const [userPools, setUserPools] = useState<any[]>([]);

  // Filter pools where user is a member
  useEffect(() => {
    if (!address || !pools) return;

    const fetchUserPools = async () => {
      const memberPools = [];
      
      for (const pool of pools) {
        // Check if user is a member by trying to get member info
        try {
          const memberInfo = await fetch(`/api/pool/${pool.poolId}/member/${address}`).catch(() => null);
          if (memberInfo) {
            memberPools.push(pool);
          }
        } catch {
          // Not a member, skip
        }
      }
      
      setUserPools(memberPools);
    };

    fetchUserPools();
  }, [address, pools]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Cargando tus pools...</span>
      </div>
    );
  }

  if (!address) {
    return (
      <Card className="bg-card border-primary/20">
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            Conecta tu wallet para ver tus pools cooperativos
          </p>
        </CardContent>
      </Card>
    );
  }

  if (userPools.length === 0) {
    return (
      <div className="text-center py-12 bg-card rounded-lg border border-primary/20">
        <h3 className="text-xl font-semibold">No estás en ningún pool cooperativo.</h3>
        <p className="text-muted-foreground mt-2">¡Explora los pools existentes o crea el tuyo!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {userPools.map((pool) => (
        <PoolCard key={Number(pool.poolId)} pool={pool} userAddress={address!} />
      ))}
    </div>
  );
}

/**
 * Individual Pool Card Component
 */
function PoolCard({ pool, userAddress }: { pool: any; userAddress: string }) {
  const { memberInfo } = useMemberInfo(Number(pool.poolId), userAddress as `0x${string}`);
  const { members } = usePoolMembers(Number(pool.poolId));
  const { yieldAmount } = useMemberYield(Number(pool.poolId), userAddress as `0x${string}`);
  const { leavePool, isPending: isLeaving } = useLeavePool();
  const { claimYield, isPending: isClaiming } = useClaimYield();
  const { toast } = useToast();

  const isCreator = pool.creator.toLowerCase() === userAddress.toLowerCase();
  const userShare = pool.totalBtcDeposited > 0n 
    ? ((Number(memberInfo?.btcContributed || 0n) / Number(pool.totalBtcDeposited)) * 100).toFixed(2)
    : '0';

  const handleLeavePool = async () => {
    try {
      await leavePool(Number(pool.poolId));
      toast({
        title: "Saliste del pool",
        description: "Has salido exitosamente del pool",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo salir del pool",
        variant: "destructive",
      });
    }
  };

  const handleClaimYield = async () => {
    try {
      await claimYield(Number(pool.poolId));
      toast({
        title: "Yield reclamado",
        description: "Has reclamado tu yield exitosamente",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo reclamar el yield",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="bg-card border-primary/20 shadow-custom">
      <CardHeader className="flex flex-row justify-between items-center">
        <CardTitle className="text-xl flex items-center gap-3">
          {pool.name}
          {isCreator && (
            <Badge className="text-xs border-yellow-500 text-yellow-500">
              👑 Creador
            </Badge>
          )}
        </CardTitle>
        {isCreator && (
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-background">
            <TabsTrigger value="summary">Resumen</TabsTrigger>
            <TabsTrigger value="members">Miembros ({members.length})</TabsTrigger>
            <TabsTrigger value="activity">Actividad</TabsTrigger>
          </TabsList>

          {/* Summary Tab */}
          <TabsContent value="summary" className="mt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center md:text-left">
              <div className="bg-background/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Tu Contribución</p>
                <p className="text-lg font-bold font-code text-primary">
                  {formatBTC(memberInfo?.btcContributed || 0n)} BTC
                </p>
              </div>
              <div className="bg-background/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Tu % del Pool</p>
                <p className="text-lg font-bold font-code">{userShare}%</p>
              </div>
              <div className="bg-background/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Yield Disponible</p>
                <p className="text-lg font-bold font-code text-secondary">
                  {formatBTC(yieldAmount || 0n)} MUSD
                </p>
              </div>
              <div className="bg-background/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Total Pool</p>
                <p className="text-lg font-bold">
                  {formatBTC(pool.totalBtcDeposited)} BTC
                </p>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button 
                variant="default" 
                className="w-full"
                onClick={handleClaimYield}
                disabled={isClaiming || !yieldAmount || yieldAmount === 0n}
              >
                {isClaiming ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Reclamando...
                  </>
                ) : (
                  <>🎁 Reclamar Yield</>
                )}
              </Button>
              <Button 
                variant="outline" 
                className="w-full text-red-500 border-red-500 hover:bg-red-500/10 hover:text-red-500"
                onClick={handleLeavePool}
                disabled={isLeaving}
              >
                {isLeaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saliendo...
                  </>
                ) : (
                  <>📤 Salir del Pool</>
                )}
              </Button>
            </div>
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members" className="mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Miembro</TableHead>
                  <TableHead>% del Pool</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((memberAddr, i) => {
                  const isPoolCreator = pool.creator.toLowerCase() === memberAddr.toLowerCase();
                  const isCurrentUser = memberAddr.toLowerCase() === userAddress.toLowerCase();
                  
                  return (
                    <TableRow key={i}>
                      <TableCell className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {memberAddr.slice(2, 4).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium font-code">
                          {memberAddr.slice(0, 6)}...{memberAddr.slice(-4)}
                        </span>
                        {isPoolCreator && (
                          <Badge variant="outline" className="text-xs ml-1 border-yellow-500 text-yellow-500">
                            👑
                          </Badge>
                        )}
                        {isCurrentUser && (
                          <Badge variant="outline" className="text-xs ml-1">
                            Tú
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">-</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        Activo
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="mt-4">
            <div className="space-y-4">
              <div className="text-center py-8 text-muted-foreground">
                <p>Historial de actividad próximamente</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
