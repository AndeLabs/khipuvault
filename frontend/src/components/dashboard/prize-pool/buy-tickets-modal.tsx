"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Checkbox } from "../components/ui/checkbox";
import { Label } from "../components/ui/label";
import { Minus, Plus } from "lucide-react";
import { Separator } from "../components/ui/separator";

const ticketPrice = 0.0005;
const discounts = {
  "0": 0,
  "5": 0.05,
  "10": 0.1,
  "20": 0.15,
};

export function BuyTicketsModal({ children }: { children: React.ReactNode }) {
  const [ticketCount, setTicketCount] = useState(1);
  const [confirmations, setConfirmations] = useState({
    noRisk: false,
    yieldDistributed: false,
    canWithdraw: false,
    chainlink: false,
  });

  const allConfirmed = Object.values(confirmations).every(Boolean);

  const subtotal = ticketCount * ticketPrice;
  const discountTier = ticketCount >= 20 ? "20" : ticketCount >= 10 ? "10" : ticketCount >= 5 ? "5" : "0";
  const discountRate = discounts[discountTier as keyof typeof discounts];
  const discountAmount = subtotal * discountRate;
  const total = subtotal - discountAmount;
  const btcPrice = 60000;

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px] bg-card border-primary/30">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">🎟️ Comprar Tickets - Ronda #123</DialogTitle>
          <DialogDescription className="text-center">Aumenta tus chances de ganar el gran premio.</DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            <div className="space-y-4">
                <div className="p-4 rounded-lg bg-background border border-primary/20">
                    <p className="font-bold">Precio por Ticket:</p>
                    <p className="font-code text-primary">{ticketPrice} BTC (≈ ${(ticketPrice * btcPrice).toFixed(2)} USD)</p>
                    <Separator className="my-2 bg-primary/20"/>
                    <p className="font-bold text-sm">Descuentos por volumen:</p>
                    <ul className="text-xs text-muted-foreground list-disc list-inside">
                        <li>5-9 tickets: 5% OFF</li>
                        <li>10-19 tickets: 10% OFF</li>
                        <li>20+ tickets: 15% OFF</li>
                    </ul>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="ticket-count">Cantidad de tickets</Label>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={() => setTicketCount(p => Math.max(1, p - 1))}><Minus/></Button>
                        <Input id="ticket-count" type="number" value={ticketCount} onChange={e => setTicketCount(Math.max(1, parseInt(e.target.value) || 1))} className="text-center font-bold text-lg"/>
                        <Button variant="outline" size="icon" onClick={() => setTicketCount(p => Math.min(50, p + 1))}><Plus/></Button>
                    </div>
                     <div className="flex justify-center gap-2 pt-2">
                        {[1, 5, 10, 25].map(q => <Button key={q} size="sm" variant="ghost" onClick={() => setTicketCount(q)}>{q}</Button>)}
                    </div>
                </div>
            </div>

            <div className="p-4 rounded-lg bg-background space-y-3">
                <h4 className="font-bold text-center">Resumen de Compra</h4>
                <div className="flex justify-between text-sm"><span>Cantidad:</span> <span>{ticketCount} tickets</span></div>
                <div className="flex justify-between text-sm"><span>Subtotal:</span> <span className="font-code">{subtotal.toFixed(4)} BTC</span></div>
                {discountRate > 0 && <div className="flex justify-between text-sm text-green-400"><span>Descuento ({discountRate*100}%):</span> <span className="font-code">-{discountAmount.toFixed(4)} BTC</span></div>}
                <Separator className="bg-primary/20"/>
                <div className="flex justify-between text-lg font-bold"><span>Total:</span> <span className="font-code text-primary">{total.toFixed(4)} BTC</span></div>
                <p className="text-sm text-muted-foreground text-center">≈ ${(total * btcPrice).toFixed(2)} USD</p>
            </div>
        </div>

        <div className="space-y-3">
            <Label className="font-bold">Confirmo que entiendo:</Label>
            {Object.entries({
                noRisk: "Mi capital no está en riesgo.",
                yieldDistributed: "Los rendimientos se distribuyen al ganador.",
                canWithdraw: "Puedo retirar mi capital cuando quiera.",
                chainlink: "El sorteo es verificable con Chainlink VRF.",
            }).map(([key, label]) => (
                <div key={key} className="flex items-center space-x-2">
                    <Checkbox id={key} checked={confirmations[key as keyof typeof confirmations]} onCheckedChange={(checked) => setConfirmations(prev => ({...prev, [key]: !!checked}))}/>
                    <label htmlFor={key} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{label}</label>
                </div>
            ))}
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => { /* close dialog */ }}>Cancelar</Button>
          <Button variant="secondary" disabled={!allConfirmed}>🎟️ Comprar Tickets</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
