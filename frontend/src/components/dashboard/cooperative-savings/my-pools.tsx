"use client";

import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Button } from "../components/ui/button";
import { Settings } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";

const userPools = [
  {
    name: "Ahorro Familiar Pérez",
    isCreator: true,
    userContribution: "0.05 BTC",
    userShare: "10%",
    userEarnings: "+0.001 BTC",
    userPosition: 3,
    totalMembers: 12,
    members: [
        { address: "0x1234...5678", contribution: "0.05 BTC", share: "10%", joinDate: "hace 2 días", isCreator: true },
        { address: "0xabcd...effa", contribution: "0.1 BTC", share: "20%", joinDate: "hace 1 día" },
        { address: "0x5678...9012", contribution: "0.02 BTC", share: "4%", joinDate: "hace 5 horas" },
    ],
    activity: [
        { description: "0xabcd...effa se unió al pool", time: "hace 1 día" },
        { description: "Reclamaste 0.0001 BTC de yield", time: "hace 2 días" },
        { description: "Creaste el pool", time: "hace 2 días" },
    ]
  },
];

export function MyPools() {
  if (userPools.length === 0) {
    return (
      <div className="text-center py-12 bg-card rounded-lg border border-primary/20">
        <h3 className="text-xl font-semibold">No estás en ningún pool cooperativo.</h3>
        <p className="text-muted-foreground mt-2">¡Explora los pools existentes o crea el tuyo!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {userPools.map((pool, index) => (
        <Card key={index} className="bg-card border-primary/20 shadow-custom">
          <CardHeader className="flex flex-row justify-between items-center">
            <CardTitle className="text-xl flex items-center gap-3">
              {pool.name}
              {pool.isCreator && <Badge className="text-xs border-yellow-500 text-yellow-500">👑 Creador</Badge>}
            </CardTitle>
            {pool.isCreator && <Button variant="ghost" size="icon"><Settings className="h-5 w-5" /></Button>}
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="summary" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-background">
                <TabsTrigger value="summary">Resumen</TabsTrigger>
                <TabsTrigger value="members">Miembros</TabsTrigger>
                <TabsTrigger value="activity">Actividad</TabsTrigger>
              </TabsList>
              <TabsContent value="summary" className="mt-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center md:text-left">
                  <div className="bg-background/50 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">Tu Contribución</p>
                    <p className="text-lg font-bold font-code text-primary">{pool.userContribution}</p>
                  </div>
                  <div className="bg-background/50 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">Tu % del Pool</p>
                    <p className="text-lg font-bold font-code">{pool.userShare}</p>
                  </div>
                  <div className="bg-background/50 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">Tus Rendimientos</p>
                    <p className="text-lg font-bold font-code text-secondary">{pool.userEarnings}</p>
                  </div>
                  <div className="bg-background/50 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">Tu Ranking</p>
                    <p className="text-lg font-bold">#{pool.userPosition} / {pool.totalMembers}</p>
                  </div>
                </div>
                 <div className="flex gap-2 mt-6">
                    <Button variant="secondary" className="w-full">💰 Contribuir Más</Button>
                    <Button variant="default" className="w-full">🎁 Reclamar Yield</Button>
                    <Button variant="outline" className="w-full text-red-500 border-red-500 hover:bg-red-500/10 hover:text-red-500">📤 Salir del Pool</Button>
                </div>
              </TabsContent>
              <TabsContent value="members" className="mt-4">
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Miembro</TableHead>
                            <TableHead>Contribución</TableHead>
                            <TableHead>% del Pool</TableHead>
                            <TableHead>Fecha de Ingreso</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {pool.members.map((member, i) => (
                            <TableRow key={i}>
                                <TableCell className="flex items-center gap-2">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={`https://picsum.photos/seed/${member.address}/32/32`} />
                                        <AvatarFallback>{member.address.slice(2,4)}</AvatarFallback>
                                    </Avatar>
                                    <span className="font-medium">{member.address}</span>
                                    {member.isCreator && <Badge variant="outline" className="text-xs ml-1 border-yellow-500 text-yellow-500">👑</Badge>}
                                </TableCell>
                                <TableCell className="font-code text-primary">{member.contribution}</TableCell>
                                <TableCell><Badge variant="secondary">{member.share}</Badge></TableCell>
                                <TableCell className="text-muted-foreground">{member.joinDate}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                 </Table>
              </TabsContent>
              <TabsContent value="activity" className="mt-4">
                <div className="space-y-4">
                  {pool.activity.map((act, i) => (
                    <div key={i} className="flex items-center justify-between text-sm p-3 bg-background/50 rounded-lg">
                      <p>{act.description}</p>
                      <p className="text-muted-foreground">{act.time}</p>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
