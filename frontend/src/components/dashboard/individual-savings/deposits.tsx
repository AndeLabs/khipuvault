"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Gift, LogOut, Plus } from "lucide-react";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";


export function Deposits() {
    const [amount, setAmount] = useState(0.005);
    const btcPrice = 60000;

    return (
        <Card className="bg-card border border-primary/20 shadow-custom">
            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="flex flex-col gap-4">
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="secondary" size="lg" className="w-full">
                                <Plus className="mr-2 h-4 w-4" /> Añadir Fondos
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar Depósito</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Estás a punto de depositar {amount} BTC.
                                    Revisa los detalles y confirma la transacción.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="text-sm">
                                <p>Monto: {amount} BTC (≈ ${(amount * btcPrice).toFixed(2)} USD)</p>
                                <p className="text-muted-foreground">Gas estimado: ~0.00002 ETH</p>
                            </div>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction>Confirmar</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                    <Button variant="outline" size="lg" className="w-full border-primary text-primary hover:bg-primary/10 hover:text-primary">
                        <LogOut className="mr-2 h-4 w-4" /> Retirar Todo
                    </Button>
                    <Button variant="default" size="lg" className="w-full bg-primary text-primary-foreground">
                        <Gift className="mr-2 h-4 w-4" /> Reclamar Yield
                    </Button>
                </div>
                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="amount" className="text-white">Cantidad a depositar</Label>
                        <div className="relative">
                            <Input
                                id="amount"
                                type="number"
                                placeholder="0.005"
                                value={amount}
                                onChange={(e) => setAmount(parseFloat(e.target.value))}
                                className="font-code bg-card border-2 border-muted-foreground/50 focus:border-primary pr-12"
                            />
                            <span className="absolute inset-y-0 right-0 flex items-center pr-3 font-code text-muted-foreground">BTC</span>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>mín: 0.001</span>
                            <span>≈ ${(amount * btcPrice).toFixed(2)} USD</span>
                            <span>máx: 10</span>
                        </div>
                    </div>
                    <Slider
                        value={[amount]}
                        min={0.001}
                        max={10}
                        step={0.001}
                        onValueChange={(value) => setAmount(value[0])}
                        className="[&>span:first-child]:bg-gradient-to-r from-primary to-secondary"
                    />
                </div>
            </CardContent>
        </Card>
    )
}
