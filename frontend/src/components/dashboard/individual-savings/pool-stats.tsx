'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useIndividualPool, formatMUSD } from "@/hooks/web3/use-individual-pool";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Simplified PoolStats component without charts and progress bars
 * Focus on essential text-based information only
 */
export function PoolStats() {
  const { poolStats, isLoading } = useIndividualPool();
  
  if (isLoading) {
    return (
      <Card className="sticky top-24 bg-card border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg">📊 Estadísticas del Pool</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="sticky top-24 bg-card border-primary/20">
      <CardHeader>
        <CardTitle className="text-lg">📊 Estadísticas del Pool</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total MUSD Deposited */}
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">
            Total MUSD Depositado
          </span>
          <div className="text-right">
            <p className="font-bold font-code">
              {formatMUSD(poolStats?.totalMusdDeposited)} MUSD
            </p>
            <p className="text-xs text-muted-foreground">
              = ${(Number(poolStats?.totalMusdDeposited || BigInt(0)) / 1e18).toLocaleString('en-US', { maximumFractionDigits: 2 })} USD
            </p>
          </div>
        </div>

        {/* Total Yields Generated */}
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Yields Total Generados</span>
          <div className="text-right">
            <p className="font-bold font-code text-green-500">
              {formatMUSD(poolStats?.totalYields)} MUSD
            </p>
            <p className="text-xs text-muted-foreground">
              = ${(Number(poolStats?.totalYields || BigInt(0)) / 1e18).toFixed(2)} USD
            </p>
          </div>
        </div>

        {/* APR */}
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">
            APR del Pool
          </span>
          <span className="font-bold font-code text-primary">
            {poolStats?.poolAPR.toFixed(2)}%
          </span>
        </div>

        {/* Member Count */}
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Miembros Activos</span>
          <span className="font-bold font-code">{poolStats?.memberCount || 0}</span>
        </div>

        {/* Status Message */}
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-center text-muted-foreground">
            El pool está operando normalmente. Deposita MUSD para generar rendimientos.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}