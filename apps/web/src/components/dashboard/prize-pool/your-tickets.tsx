"use client";

import { useAccount } from "wagmi";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  useCurrentRound,
  useUserTickets,
  useClaimPrize,
  useWithdrawCapital,
} from "@/hooks/web3/use-lottery-pool";

import { BuyTicketsModal } from "./buy-tickets-modal";

export function YourTickets() {
  const { address } = useAccount();
  const { currentRoundId, roundInfo } = useCurrentRound();
  const { tickets, refetch } = useUserTickets(
    Number(currentRoundId),
    address as `0x${string}`,
  );
  const { claimPrize, isPending: isClaiming } = useClaimPrize();
  const { withdrawCapital, isPending: isWithdrawing } = useWithdrawCapital();
  const { toast } = useToast();

  if (!address) {
    return (
      <div className="bg-background/50 p-6 rounded-lg border border-primary/20 space-y-4 text-center">
        <p className="text-muted-foreground">
          Conecta tu wallet para participar en el sorteo
        </p>
      </div>
    );
  }

  if (!currentRoundId || !roundInfo) {
    return (
      <div className="bg-background/50 p-6 rounded-lg border border-primary/20 space-y-4 text-center">
        <p className="text-muted-foreground">
          No hay sorteos activos en este momento
        </p>
      </div>
    );
  }

  const userTickets = tickets?.length || 0;
  const totalTickets = Number(roundInfo.totalTicketsSold);
  const probability = totalTickets > 0 ? (userTickets / totalTickets) * 100 : 0;

  const handleClaimPrize = async () => {
    try {
      await claimPrize(Number(currentRoundId));
      toast({
        title: "¡Premio reclamado!",
        description: "El premio ha sido transferido a tu wallet",
      });
      void refetch();
    } catch (error: any) {
      toast({
        title: "Error al reclamar premio",
        description: error.message || "Intenta nuevamente",
        variant: "destructive",
      });
    }
  };

  const handleWithdrawCapital = async () => {
    try {
      await withdrawCapital(Number(currentRoundId));
      toast({
        title: "Capital retirado",
        description: "Tu capital ha sido devuelto",
      });
      void refetch();
    } catch (error: any) {
      toast({
        title: "Error al retirar capital",
        description: error.message || "Intenta nuevamente",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="bg-background/50 p-6 rounded-lg border border-primary/20 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">🎟️ Tienes {userTickets} Tickets</h3>
        <Badge className="text-base">
          Tu Probabilidad: {probability.toFixed(2)}%
        </Badge>
      </div>
      <Progress value={probability} className="h-2" />
      <div className="flex flex-col md:flex-row gap-4 pt-2">
        <BuyTicketsModal>
          <Button variant="secondary" className="w-full">
            🎟️ COMPRAR MÁS TICKETS
          </Button>
        </BuyTicketsModal>
        {userTickets > 0 && (
          <>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleClaimPrize}
              disabled={isClaiming}
            >
              {isClaiming ? "Reclamando..." : "🎁 RECLAMAR PREMIO"}
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={handleWithdrawCapital}
              disabled={isWithdrawing}
            >
              {isWithdrawing ? "Retirando..." : "💰 RETIRAR CAPITAL"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
