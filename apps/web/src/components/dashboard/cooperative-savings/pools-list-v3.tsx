/**
 * @fileoverview Pools List V3 - Explore Available Cooperative Pools
 * Displays all pools with filters and search functionality
 */

"use client";

import {
  Users,
  Search,
  TrendingUp,
  Loader2,
  ArrowRight,
  Clock,
} from "lucide-react";
import { useState, useMemo } from "react";
import { formatEther } from "viem";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  useCooperativePool,
  usePoolInfo,
  PoolStatus,
} from "@/hooks/web3/use-cooperative-pool";

interface PoolsListV3Props {
  onJoinPool?: (poolId: number) => void;
}

type FilterType = "all" | "accepting" | "active" | "closed";

export function PoolsListV3({ onJoinPool }: PoolsListV3Props) {
  const { poolCounter } = useCooperativePool();
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");

  const poolIds = useMemo(() => {
    const ids: number[] = [];
    for (let i = 1; i <= poolCounter; i++) {
      ids.push(i);
    }
    return ids;
  }, [poolCounter]);

  if (poolCounter === 0) {
    return (
      <Card className="bg-card border-2 border-muted">
        <CardContent className="p-12 text-center">
          <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-bold text-foreground mb-2">
            No hay pools disponibles
          </h3>
          <p className="text-muted-foreground mb-4">
            Sé el primero en crear un pool cooperativo de ahorro
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre del pool..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto">
          {[
            { value: "all", label: "Todos" },
            { value: "accepting", label: "Aceptando" },
            { value: "active", label: "Activos" },
            { value: "closed", label: "Cerrados" },
          ].map(({ value, label }) => (
            <Button
              key={`filter-${value}`}
              variant={filter === value ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(value as FilterType)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {poolIds.map((poolId) => (
          <PoolCard
            key={poolId}
            poolId={poolId}
            searchQuery={searchQuery}
            filter={filter}
            onJoinPool={onJoinPool}
          />
        ))}
      </div>
    </div>
  );
}

interface PoolCardProps {
  poolId: number;
  searchQuery: string;
  filter: FilterType;
  onJoinPool?: (poolId: number) => void;
}

function PoolCard({ poolId, searchQuery, filter, onJoinPool }: PoolCardProps) {
  const { poolInfo, isLoading } = usePoolInfo(poolId);

  const matchesSearch = useMemo(() => {
    if (!searchQuery) {
      return true;
    }
    if (!poolInfo) {
      return false;
    }
    return poolInfo.name.toLowerCase().includes(searchQuery.toLowerCase());
  }, [poolInfo, searchQuery]);

  const matchesFilter = useMemo(() => {
    if (filter === "all") {
      return true;
    }
    if (!poolInfo) {
      return false;
    }

    switch (filter) {
      case "accepting":
        return poolInfo.status === PoolStatus.ACCEPTING;
      case "active":
        return poolInfo.status === PoolStatus.ACTIVE;
      case "closed":
        return poolInfo.status === PoolStatus.CLOSED;
      default:
        return true;
    }
  }, [poolInfo, filter]);

  if (isLoading) {
    return (
      <Card className="bg-card border border-muted">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!poolInfo || !matchesSearch || !matchesFilter) {
    return null;
  }

  const statusConfig = getStatusConfig(poolInfo.status);
  const canJoin =
    poolInfo.allowNewMembers &&
    poolInfo.currentMembers < poolInfo.maxMembers &&
    poolInfo.status === PoolStatus.ACCEPTING;

  const occupancyPercentage =
    (poolInfo.currentMembers / poolInfo.maxMembers) * 100;

  return (
    <Card
      className={`bg-card border-2 ${statusConfig.borderColor} hover:shadow-lg transition-shadow`}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-lg">{poolInfo.name}</CardTitle>
              <Badge
                className={`${statusConfig.bgColor} ${statusConfig.textColor} border-0`}
              >
                {statusConfig.label}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Pool #{poolId} · Creado por{" "}
              {poolInfo?.creator && typeof poolInfo.creator === "string"
                ? `${poolInfo.creator.slice(0, 6)}...${poolInfo.creator.slice(-4)}`
                : "Desconocido"}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium text-primary">Miembros</span>
            </div>
            <p className="text-sm font-bold text-foreground">
              {poolInfo.currentMembers} / {poolInfo.maxMembers}
            </p>
            <div className="mt-2 h-1.5 bg-primary/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${occupancyPercentage}%` }}
              />
            </div>
          </div>

          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-3.5 w-3.5 text-green-500" />
              <span className="text-xs font-medium text-green-500">
                Total BTC
              </span>
            </div>
            <p className="text-sm font-bold text-foreground">
              {parseFloat(formatEther(poolInfo.totalBtcDeposited)).toFixed(4)}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Contribución mínima</span>
            <span className="font-medium">
              {formatEther(poolInfo.minContribution)} BTC
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Contribución máxima</span>
            <span className="font-medium">
              {formatEther(poolInfo.maxContribution)} BTC
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">MUSD generado</span>
            <span className="font-medium">
              {parseFloat(formatEther(poolInfo.totalMusdMinted)).toFixed(2)}
            </span>
          </div>
        </div>

        {poolInfo.totalYieldGenerated > 0n && (
          <Alert className="bg-green-500/10 border-green-500/30 p-3">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-200 text-xs">
              <strong className="text-green-400">Yields generados:</strong>{" "}
              {parseFloat(formatEther(poolInfo.totalYieldGenerated)).toFixed(4)}{" "}
              MUSD
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          Creado hace {getTimeAgo(poolInfo.createdAt)}
        </div>

        <Button
          onClick={() => onJoinPool?.(poolId)}
          disabled={!canJoin}
          className="w-full"
          variant={canJoin ? "default" : "outline"}
        >
          {(() => {
            if (canJoin) {
              return (
                <>
                  Unirse al Pool
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              );
            }
            if (poolInfo.status === PoolStatus.CLOSED) {
              return "Pool Cerrado";
            }
            if (poolInfo.currentMembers >= poolInfo.maxMembers) {
              return "Pool Lleno";
            }
            return "No Acepta Miembros";
          })()}
        </Button>
      </CardContent>
    </Card>
  );
}

function getStatusConfig(status: PoolStatus) {
  switch (status) {
    case PoolStatus.ACCEPTING:
      return {
        label: "Aceptando",
        bgColor: "bg-blue-500/20",
        textColor: "text-blue-400",
        borderColor: "border-blue-500/50",
      };
    case PoolStatus.ACTIVE:
      return {
        label: "Activo",
        bgColor: "bg-green-500/20",
        textColor: "text-green-400",
        borderColor: "border-green-500/50",
      };
    case PoolStatus.CLOSED:
      return {
        label: "Cerrado",
        bgColor: "bg-gray-500/20",
        textColor: "text-gray-400",
        borderColor: "border-gray-500/50",
      };
    default:
      return {
        label: "Desconocido",
        bgColor: "bg-gray-500/20",
        textColor: "text-gray-400",
        borderColor: "border-gray-500/50",
      };
  }
}

function getTimeAgo(timestamp: number): string {
  const now = Date.now() / 1000;
  const diff = now - timestamp;

  if (diff < 60) {
    return "menos de 1 min";
  }
  if (diff < 3600) {
    return `${Math.floor(diff / 60)} min`;
  }
  if (diff < 86400) {
    return `${Math.floor(diff / 3600)} h`;
  }
  if (diff < 2592000) {
    return `${Math.floor(diff / 86400)} días`;
  }
  return `${Math.floor(diff / 2592000)} meses`;
}
