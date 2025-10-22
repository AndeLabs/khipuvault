"use client"

import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { BuyTicketsModal } from "./buy-tickets-modal";

export function YourTickets() {
  const userTickets = 5;
  const totalTickets = 847;
  const probability = userTickets / totalTickets * 100;

  return (
    <div className="bg-background/50 p-6 rounded-lg border border-primary/20 space-y-4">
        <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">🎟️ Tienes {userTickets} Tickets</h3>
            <Badge className="text-base">Tu Probabilidad: {probability.toFixed(2)}%</Badge>
        </div>
        <Progress value={probability} className="h-2"/>
        <div className="flex flex-col md:flex-row gap-4 pt-2">
            <BuyTicketsModal>
                <Button variant="secondary" className="w-full">🎟️ COMPRAR MÁS TICKETS</Button>
            </BuyTicketsModal>
            <Button variant="outline" className="w-full">🎁 VER MIS PREMIOS</Button>
        </div>
    </div>
  )
}
