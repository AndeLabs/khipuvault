import { useState, useEffect } from "react";
import { formatBTC } from "@/lib/utils";

interface PoolStats {
  totalBtc: bigint;
  totalMusd: bigint;
  totalYields: bigint;
  avgApr: number;
  poolAPR: number;
  memberCount: number;
  isRecoveryMode: boolean;
}

/**
 * Hook para obtener datos del Individual Savings Pool
 * Retorna datos mock mientras se implementa la integración real
 */
export function useIndividualPoolData() {
  const [isLoading, setIsLoading] = useState(false);
  const [poolStats, setPoolStats] = useState<PoolStats>({
    totalBtc: BigInt(0),
    totalMusd: BigInt(0),
    totalYields: BigInt(0),
    avgApr: 6.2,
    poolAPR: 6.2,
    memberCount: 0,
    isRecoveryMode: false,
  });

  useEffect(() => {
    // Simulamos carga de datos
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return {
    poolStats,
    isLoading,
    formatBTC,
  };
}
