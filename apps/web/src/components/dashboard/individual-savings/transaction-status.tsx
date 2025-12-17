"use client";

import { CheckCircle, Clock, Loader2, ExternalLink } from "lucide-react";
import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";

interface TransactionStatusProps {
  hash?: string;
  isConfirming: boolean;
  isSuccess: boolean;
  type: "deposit" | "withdraw" | "claim";
}

export function TransactionStatus({
  hash,
  isConfirming,
  isSuccess,
  type,
}: TransactionStatusProps) {
  if (!hash) {return null;}

  const explorerUrl = `https://explorer.test.mezo.org/tx/${hash}`;

  const typeLabels = {
    deposit: "Depósito",
    withdraw: "Retiro",
    claim: "Reclamo de Yield",
  };

  return (
    <Card className="border-2 border-blue-500/50 bg-blue-500/5">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            {isSuccess ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : isConfirming ? (
              <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
            ) : (
              <Clock className="h-5 w-5 text-yellow-500" />
            )}
          </div>

          <div className="flex-1 space-y-2">
            <div>
              <p className="text-sm font-semibold text-white">
                {isSuccess
                  ? `✅ ${typeLabels[type]} Confirmado`
                  : isConfirming
                    ? `⏳ Confirmando ${typeLabels[type]}...`
                    : `📤 ${typeLabels[type]} Enviado`}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {isSuccess
                  ? "La transacción se ha completado exitosamente. Los balances se actualizarán en breve."
                  : isConfirming
                    ? "Esperando confirmación del blockchain de Mezo..."
                    : "Transacción enviada al blockchain."}
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground font-mono">
                {hash.slice(0, 10)}...{hash.slice(-8)}
              </span>
              <Link
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-500 hover:text-blue-400 transition"
              >
                Ver en Explorer <ExternalLink className="h-3 w-3" />
              </Link>
            </div>

            {isConfirming && (
              <div className="mt-2 space-y-1">
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 animate-pulse"
                    style={{ width: "70%" }}
                  />
                </div>
                <p className="text-xs text-blue-400">
                  Tiempo estimado: ~10-30 segundos
                </p>
              </div>
            )}

            {isSuccess && (
              <div className="mt-2 p-2 rounded bg-green-500/10 border border-green-500/30">
                <p className="text-xs text-green-400">
                  🎉 Actualizando balances automáticamente...
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
