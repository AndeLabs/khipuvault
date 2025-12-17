"use client";

import { RefreshCw, CheckCircle, XCircle } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useAccount } from "wagmi";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPublicClient } from "@/lib/web3/config";
import { MEZO_TESTNET_ADDRESSES, MUSD_ABI } from "@/lib/web3/contracts";

export function MusdBalanceTester() {
  const { address, isConnected } = useAccount();
  const [directBalance, setDirectBalance] = useState<bigint | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get public client lazily on client side
  const publicClient = useMemo(() => getPublicClient(), []);

  const fetchDirectBalance = async () => {
    if (!address || !publicClient) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const balance = (await publicClient.readContract({
        address: MEZO_TESTNET_ADDRESSES.musd as `0x${string}`,
        abi: MUSD_ABI,
        functionName: "balanceOf",
        args: [address],
      })) as bigint;

      setDirectBalance(balance);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      // eslint-disable-next-line no-console
      console.error("❌ Error fetching direct balance:", errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected && address) {
      void fetchDirectBalance();
    }
  }, [address, isConnected]);

  if (!isConnected) {
    return null;
  }

  return (
    <Card className="bg-card border border-green-500/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-green-500">
            🧪 Test Directo con Viem
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchDirectBalance}
            disabled={loading}
            className="text-green-500 hover:text-green-400"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refrescar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-xs font-mono space-y-2">
          <p className="text-muted-foreground">
            Lectura directa con viem publicClient:
          </p>

          {loading && (
            <div className="flex items-center gap-2 text-blue-400">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Consultando RPC...</span>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
              <div className="flex items-start gap-2">
                <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                <div>
                  <p className="text-red-500 font-semibold text-xs">
                    Error al consultar balance:
                  </p>
                  <p className="text-red-400 text-xs mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {directBalance !== null && !loading && (
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                <div className="flex-1 space-y-1">
                  <p className="text-green-500 font-semibold">
                    ✅ Balance obtenido exitosamente
                  </p>
                  <div className="space-y-1">
                    <p className="text-white">
                      <span className="text-muted-foreground">Raw Wei:</span>{" "}
                      {directBalance.toString()}
                    </p>
                    <p className="text-white text-lg font-bold">
                      {(Number(directBalance) / 1e18).toFixed(2)} MUSD
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-green-500/30">
            <p className="text-green-400 text-xs font-semibold mb-1">
              Comparación con Wagmi:
            </p>
            <p className="text-muted-foreground text-xs">
              Si este test muestra el balance correcto pero Wagmi muestra 0, el
              problema está en la configuración de Wagmi o en el cache de React
              Query.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
