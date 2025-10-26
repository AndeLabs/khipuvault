'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAccount } from "wagmi";
import { useIndividualPool, formatMUSD } from "@/hooks/web3/use-individual-pool";
import { useMUSDApproval, formatMUSDShort } from "@/hooks/web3/use-musd-approval";

/**
 * Simple SummaryCards component without charts
 * Focus on essential text-based information only
 */
export function SummaryCards() {
  const { isConnected } = useAccount();
  const { userDeposit, isLoading: isPoolLoading } = useIndividualPool();
  const { musdBalance } = useMUSDApproval();

  if (!isConnected) {
    return (
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-muted animate-pulse" />
            Resumen de Cuenta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Estado</span>
              <span className="text-muted-foreground">Desconectado</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Balance</span>
              <span>--</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Depósitos</span>
              <span>--</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rendimientos</span>
              <span>--</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Resumen de Cuenta
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Estado</span>
            <span className="text-green-500 font-medium">Conectado</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Balance MUSD</span>
            <span className="font-mono">
              {formatMUSDShort(musdBalance)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Depósitos Activos</span>
            {isPoolLoading ? (
              <Skeleton className="h-5 w-24" />
            ) : (
              <span className="font-mono">
                {userDeposit?.musdAmount ? formatMUSD(userDeposit.musdAmount) : '0.00'} MUSD
              </span>
            )}
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Rendimientos Acumulados</span>
            {isPoolLoading ? (
              <Skeleton className="h-5 w-24" />
            ) : (
              <span className="font-mono text-green-500">
                {userDeposit?.yieldAccrued ? formatMUSD(userDeposit.yieldAccrued) : '0.00'} MUSD
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
