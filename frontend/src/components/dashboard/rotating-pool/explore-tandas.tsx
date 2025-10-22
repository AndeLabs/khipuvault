"use client";

import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { CalendarDays, Check, Dot } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";
import { TandaCalendarCard } from "./tanda-calendar-card";

const tandas = [
  {
    name: "Ahorro Mensual Emprendedores",
    status: "ACTIVA",
    members: 8,
    maxMembers: 10,
    contribution: "0.01 BTC/mes",
    turn: 3,
    userTurn: 5,
    totalAccumulated: "0.08 BTC",
    yield: "2.3%",
    nextPayment: "En 15 días",
    avatars: [1, 2, 3, 4, 5, 6, 7, 8],
    isUserMember: true,
  },
  {
    name: "Tanda Semanal #5",
    status: "ESPERANDO",
    members: 4,
    maxMembers: 12,
    contribution: "0.005 BTC/semana",
    turn: 1,
    userTurn: null,
    totalAccumulated: "0.02 BTC",
    yield: "1.8%",
    nextPayment: "Inicia en 3 días",
    avatars: [9, 10, 11, 12],
    isUserMember: false,
  },
];

export function ExploreTandas() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {tandas.map((tanda, index) => (
          <Card
            key={index}
            className="bg-card border-primary/20 shadow-custom hover:border-primary/50 transition-all duration-300 hover:shadow-primary/10 hover:-translate-y-1"
          >
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle>{tanda.name}</CardTitle>
                <Badge
                  className={
                    tanda.status === "ACTIVA"
                      ? "bg-green-600/20 text-green-400 border-green-600/30"
                      : "bg-yellow-600/20 text-yellow-400 border-yellow-600/30"
                  }
                >
                  {tanda.status === "ACTIVA" ? "🟢" : "⏸️"} {tanda.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Miembros</p>
                  <div className="flex items-center gap-2">
                    <p className="font-bold">
                      {tanda.members}/{tanda.maxMembers}
                    </p>
                    <div className="flex -space-x-2">
                      {tanda.avatars.map((avatar) => (
                        <Avatar key={avatar} className="h-6 w-6 border-2 border-card">
                          <AvatarImage
                            src={`https://picsum.photos/seed/${avatar}/24/24`}
                          />
                          <AvatarFallback>U</AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground">Contribución</p>
                  <p className="font-bold font-code">{tanda.contribution}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Turno Actual</p>
                  <p className="font-bold">Miembro #{tanda.turn} 🎯</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Próximo Turno</p>
                  <p className="font-bold text-secondary">
                    {tanda.isUserMember
                      ? `Tú en ${tanda.nextPayment}`
                      : `En ${tanda.nextPayment}`}
                  </p>
                </div>
              </div>

              <TandaCalendarCard turn={tanda.turn} totalTurns={tanda.maxMembers} userTurn={tanda.userTurn} />
              
              <div className="flex gap-2 pt-2">
                <Button variant="secondary" className="w-full" disabled={tanda.isUserMember}>
                  {tanda.isUserMember ? "Ya eres miembro" : "🚪 Unirme"}
                </Button>
                <Button variant="outline" className="w-full">
                  <CalendarDays className="mr-2 h-4 w-4" /> Ver Calendario
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
