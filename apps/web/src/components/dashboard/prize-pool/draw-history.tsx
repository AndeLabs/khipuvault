"use client";

import { useState } from "react";
import { useAccount } from "wagmi";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useAllRounds,
  useUserTickets,
  formatBTC,
  formatAddress,
  getRoundStatus,
} from "@/hooks/web3/use-lottery-pool";

export function DrawHistory() {
  const { address } = useAccount();
  const { rounds, isLoading } = useAllRounds();
  const [expandedRound, setExpandedRound] = useState<number | null>(null);

  if (isLoading) {
    return (
      <Card className="bg-card border-primary/20 shadow-custom">
        <CardHeader>
          <CardTitle>Historial de Sorteos</CardTitle>
          <CardDescription>
            Resultados de las rondas anteriores.
          </CardDescription>
        </CardHeader>
        <CardContent className="py-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
        </CardContent>
      </Card>
    );
  }

  // Filter for completed rounds only
  const completedRounds = rounds.filter(
    (round) => getRoundStatus(round.status) === "Completado",
  );

  if (completedRounds.length === 0) {
    return (
      <Card className="bg-card border-primary/20 shadow-custom">
        <CardHeader>
          <CardTitle>Historial de Sorteos</CardTitle>
          <CardDescription>
            Resultados de las rondas anteriores.
          </CardDescription>
        </CardHeader>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">
            No hay sorteos completados aún
          </p>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  return (
    <Card className="bg-card border-primary/20 shadow-custom">
      <CardHeader>
        <CardTitle>Historial de Sorteos</CardTitle>
        <CardDescription>Resultados de las rondas anteriores.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ronda</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Ganador</TableHead>
              <TableHead>Premio</TableHead>
              <TableHead>Participantes</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {completedRounds.map((round) => {
              const UserTicketsCell = () => {
                const { tickets } = useUserTickets(
                  Number(round.roundId),
                  address as `0x${string}`,
                );
                return (
                  <TableCell>
                    {tickets && tickets.length > 0 ? (
                      <span className="text-primary">
                        {tickets.length} tickets
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        No participaste
                      </span>
                    )}
                  </TableCell>
                );
              };

              return (
                <TableRow
                  key={round.roundId.toString()}
                  className="hover:bg-primary/10"
                >
                  <TableCell className="font-bold">
                    #{round.roundId.toString()}
                  </TableCell>
                  <TableCell>{formatDate(round.endTime)}</TableCell>
                  <TableCell>
                    {round.winner &&
                    round.winner !==
                      "0x0000000000000000000000000000000000000000" ? (
                      <Badge
                        variant="outline"
                        className="text-yellow-400 border-yellow-400/50"
                      >
                        🏆 {formatAddress(round.winner)}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">Sin ganador</span>
                    )}
                  </TableCell>
                  <TableCell className="font-code text-secondary font-bold">
                    {formatBTC(round.totalPrize)}
                  </TableCell>
                  {address ? (
                    <UserTicketsCell />
                  ) : (
                    <TableCell>
                      <span className="text-muted-foreground">-</span>
                    </TableCell>
                  )}
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setExpandedRound(
                          expandedRound === Number(round.roundId)
                            ? null
                            : Number(round.roundId),
                        )
                      }
                    >
                      📊{" "}
                      {expandedRound === Number(round.roundId)
                        ? "Ocultar"
                        : "Ver Detalles"}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
