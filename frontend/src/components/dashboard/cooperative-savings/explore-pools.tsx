"use client"

import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Search, ChevronDown } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const pools = [
  {
    name: "Ahorro Familiar Pérez",
    creator: "0x1234...5678",
    members: 12,
    maxMembers: 20,
    total: "0.5 BTC",
    totalUsd: 30000,
    minContribution: "0.001 BTC",
    apr: "6.5%",
    status: "Abierto",
  },
  {
    name: "Crypto Gatos",
    creator: "0xabcd...effa",
    members: 50,
    maxMembers: 50,
    total: "1.2 BTC",
    totalUsd: 72000,
    minContribution: "0.005 BTC",
    apr: "7.1%",
    status: "Lleno",
  },
  {
    name: "Vacaciones 2025",
    creator: "0x5678...9012",
    members: 5,
    maxMembers: 10,
    total: "0.1 BTC",
    totalUsd: 6000,
    minContribution: "0.002 BTC",
    apr: "5.9%",
    status: "Abierto",
  },
    {
    name: "Para la U",
    creator: "0x4567...8901",
    members: 8,
    maxMembers: 15,
    total: "0.3 BTC",
    totalUsd: 18000,
    minContribution: "0.0015 BTC",
    apr: "6.2%",
    status: "Abierto",
  },
];

export function ExplorePools() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input placeholder="Buscar pools..." className="pl-10 bg-card" />
        </div>
        <div className="flex gap-2">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full md:w-auto">Filtros <ChevronDown className="ml-2 h-4 w-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem>Por mínimo de entrada</DropdownMenuItem>
                    <DropdownMenuItem>Por número de miembros</DropdownMenuItem>
                    <DropdownMenuItem>Por APR</DropdownMenuItem>
                    <DropdownMenuItem>Por estado (Abierto/Lleno)</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full md:w-auto">Ordenar por <ChevronDown className="ml-2 h-4 w-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem>Más recientes</DropdownMenuItem>
                    <DropdownMenuItem>Mayor APR</DropdownMenuItem>
                    <DropdownMenuItem>Más miembros</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {pools.map((pool, index) => (
          <Card key={index} className="bg-card border-primary/20 shadow-custom hover:border-primary/50 transition-all duration-300 hover:shadow-primary/10 hover:-translate-y-1">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{pool.name}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    por <span className="text-primary font-medium">{pool.creator}</span> <Badge variant="outline" className="text-xs ml-1 border-yellow-500 text-yellow-500">👑 Creator</Badge>
                  </p>
                </div>
                <Badge variant={pool.status === 'Abierto' ? "default" : "destructive"} className={`text-xs ${pool.status === 'Abierto' ? 'bg-green-600/20 text-green-400 border-green-600/30' : 'bg-red-600/20 text-red-400 border-red-600/30'}`}>
                  {pool.status === 'Abierto' ? '🟢' : '🔴'} {pool.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Miembros</p>
                  <p className="font-bold">{pool.members}/{pool.maxMembers}</p>
                  <Progress value={(pool.members / pool.maxMembers) * 100} className="h-2 mt-1" />
                </div>
                <div>
                  <p className="text-muted-foreground">Total</p>
                  <p className="font-bold font-code">{pool.total}</p>
                  <p className="text-xs text-muted-foreground">(${pool.totalUsd.toLocaleString()})</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Min contribución</p>
                  <p className="font-bold font-code">{pool.minContribution}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">APR</p>
                  <p className="font-bold text-secondary">{pool.apr}</p>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="secondary" className="w-full">🚪 Unirme al Pool</Button>
                <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary/10 hover:text-primary">👥 Ver Miembros</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
