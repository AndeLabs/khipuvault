"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle2, Clock, ExternalLink, XCircle } from "lucide-react";
import Link from "next/link";
import {
  useUserTransactions,
  formatTransactionDate,
  shortenTxHash,
  getExplorerUrl,
} from "@/hooks/web3/use-user-transactions";
import { Skeleton } from "@/components/ui/skeleton";
import { useAccount } from "wagmi";

const statusConfig = {
  Confirmado: {
    icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
    color: "text-green-500",
  },
  Pendiente: {
    icon: <Clock className="h-4 w-4 text-yellow-500" />,
    color: "text-yellow-500",
  },
  Fallido: {
    icon: <XCircle className="h-4 w-4 text-red-500" />,
    color: "text-red-500",
  },
};

export function TransactionsTable() {
  const { isConnected } = useAccount();
  const { transactions, isLoading } = useUserTransactions();

  if (!isConnected) {
    return (
      <Card className="bg-card border-primary/20 shadow-custom">
        <CardHeader>
          <CardTitle>Transacciones Recientes</CardTitle>
          <CardDescription>
            Historial de tus movimientos en el pool.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>Conecta tu wallet para ver tus transacciones</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="bg-card border-primary/20 shadow-custom">
        <CardHeader>
          <CardTitle>Transacciones Recientes</CardTitle>
          <CardDescription>
            Historial de tus movimientos en el pool.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card className="bg-card border-primary/20 shadow-custom">
        <CardHeader>
          <CardTitle>Transacciones Recientes</CardTitle>
          <CardDescription>
            Historial de tus movimientos en el pool.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>No tienes transacciones aún</p>
            <p className="text-sm mt-2">
              Realiza tu primer depósito para comenzar
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-primary/20 shadow-custom">
      <CardHeader>
        <CardTitle>Transacciones Recientes</CardTitle>
        <CardDescription>
          Historial de tus movimientos en el pool (últimas ~33 horas).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-primary/20">
              <TableHead>Fecha</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">TX Hash</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx, index) => (
              <TableRow
                key={index}
                className="border-primary/10 hover:bg-primary/10"
              >
                <TableCell>{formatTransactionDate(tx.timestamp)}</TableCell>
                <TableCell>{tx.type}</TableCell>
                <TableCell className="font-code">{tx.amount}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`border-0 ${statusConfig[tx.status as keyof typeof statusConfig].color}`}
                  >
                    <div className="flex items-center gap-2">
                      {
                        statusConfig[tx.status as keyof typeof statusConfig]
                          .icon
                      }
                      {tx.status}
                    </div>
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Link
                    href={getExplorerUrl(tx.hash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-end gap-2 text-primary hover:underline"
                  >
                    {shortenTxHash(tx.hash)}{" "}
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
