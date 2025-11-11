'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useIndividualPool } from "@/hooks/web3/use-individual-pool";
import { formatMUSD } from "@/hooks/web3/use-musd-approval";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Simplified PoolStats component without charts and progress bars
 * Focus on essential text-based information only
 */
export function PoolStats() {
  const { poolTVL, isLoading } = useIndividualPool();
  
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
        {/* Total Value Locked */}
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">
            Total Value Locked (TVL)
          </span>
          <div className="text-right">
            <p className="font-bold font-code">
              {formatMUSD(poolTVL)} MUSD
            </p>
            <p className="text-xs text-muted-foreground">
              = ${(Number(poolTVL || BigInt(0)) / 1e18).toLocaleString('en-US', { maximumFractionDigits: 2 })} USD
            </p>
          </div>
        </div>

        {/* V3 Features */}
        <div className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary/30">
          <p className="text-xs font-semibold text-primary mb-2">✨ V3 Features Activas:</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>✅ Auto-Compound disponible</li>
            <li>✅ Retiros parciales</li>
            <li>✅ Sistema de referidos</li>
            <li>✅ 60% menos gas</li>
          </ul>
        </div>

        {/* Status Message */}
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-center text-muted-foreground">
            Pool V3 (UUPS) operando normalmente. Deposita MUSD para generar rendimientos.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}