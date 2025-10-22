"use client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui/accordion";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Button } from "../components/ui/button";

const userTandas = [
  {
    name: "Tanda #1 - Ahorro Mensual Emprendedores",
    status: "ACTIVA",
    userTurn: 5,
    totalTurns: 10,
    nextContributionDate: "2024-08-01",
    contributionAmount: "0.01 BTC",
    hasReceived: false,
    totalContributed: "0.03 BTC",
    receiveAmount: "0.1 BTC",
    payments: [
      {
        date: "2024-07-01",
        amount: "0.01 BTC",
        txHash: "0x123...",
        status: "Confirmado",
      },
      {
        date: "2024-06-01",
        amount: "0.01 BTC",
        txHash: "0x456...",
        status: "Confirmado",
      },
      {
        date: "2024-05-01",
        amount: "0.01 BTC",
        txHash: "0x789...",
        status: "Confirmado",
      },
    ],
    members: [
      {
        position: 1,
        address: "0x111...aaa",
        turn: 1,
        paymentStatus: "Al día",
        hasReceived: true,
        isUser: false,
      },
      {
        position: 2,
        address: "0x222...bbb",
        turn: 2,
        paymentStatus: "Al día",
        hasReceived: true,
        isUser: false,
      },
      {
        position: 5,
        address: "0x555...eee",
        turn: 5,
        paymentStatus: "Al día",
        hasReceived: false,
        isUser: true,
      },
    ],
  },
];

export function MyTandas() {
  if (userTandas.length === 0) {
    return (
      <div className="text-center py-12 bg-card rounded-lg border border-primary/20">
        <h3 className="text-xl font-semibold">
          No participas en ninguna Tanda.
        </h3>
        <p className="text-muted-foreground mt-2">
          ¡Explora las tandas activas o crea la tuya!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {userTandas.map((tanda, index) => (
        <Card key={index} className="bg-card border-primary/20 shadow-custom">
          <CardHeader>
            <Accordion type="single" collapsible>
              <AccordionItem value="item-1" className="border-b-0">
                <AccordionTrigger className="w-full">
                  <div className="flex justify-between items-center w-full">
                    <CardTitle className="text-lg">{tanda.name}</CardTitle>
                    <div className="flex items-center gap-4">
                      <Badge className="bg-green-600/20 text-green-400 border-green-600/30">
                        {tanda.status}
                      </Badge>
                      <Badge variant="secondary">
                        Tu Turno: #{tanda.userTurn}/{tanda.totalTurns}
                      </Badge>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4">
                  <Tabs defaultValue="summary" className="w-full">
                    <TabsList className="grid w-full grid-cols-4 bg-background">
                      <TabsTrigger value="summary">Resumen</TabsTrigger>
                      <TabsTrigger value="payments">Pagos</TabsTrigger>
                      <TabsTrigger value="members">Miembros</TabsTrigger>
                      <TabsTrigger value="settings">Config</TabsTrigger>
                    </TabsList>
                    <TabsContent value="summary" className="mt-4 space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-background/50 p-4 rounded-lg">
                                <p className="text-sm text-muted-foreground">Próx. Contribución</p>
                                <p className="text-lg font-bold">{new Date(tanda.nextContributionDate).toLocaleDateString()}</p>
                                <p className="text-sm font-code text-primary">{tanda.contributionAmount}</p>
                            </div>
                            <div className="bg-background/50 p-4 rounded-lg">
                                <p className="text-sm text-muted-foreground">Total Contribuido</p>
                                <p className="text-lg font-bold font-code">{tanda.totalContributed}</p>
                            </div>
                             <div className="bg-background/50 p-4 rounded-lg">
                                <p className="text-sm text-muted-foreground">Ya Recibiste</p>
                                <p className="text-lg font-bold">{tanda.hasReceived ? 'Sí' : 'No'}</p>
                            </div>
                            <div className="bg-background/50 p-4 rounded-lg">
                                <p className="text-sm text-muted-foreground">Recibirás</p>
                                <p className="text-lg font-bold font-code text-secondary">{tanda.receiveAmount}</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button className="w-full" variant="secondary">Pagar Contribución</Button>
                            <Button className="w-full" variant="outline" disabled>Salir de la Tanda</Button>
                        </div>
                    </TabsContent>
                    <TabsContent value="payments" className="mt-4">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Monto</TableHead>
                            <TableHead>TX Hash</TableHead>
                            <TableHead>Estado</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tanda.payments.map((p, i) => (
                            <TableRow key={i}>
                              <TableCell>{p.date}</TableCell>
                              <TableCell className="font-code text-primary">{p.amount}</TableCell>
                              <TableCell className="font-code">{p.txHash}</TableCell>
                              <TableCell><Badge variant="default">{p.status}</Badge></TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TabsContent>
                    <TabsContent value="members" className="mt-4">
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Pos.</TableHead>
                                    <TableHead>Miembro</TableHead>
                                    <TableHead>Turno</TableHead>
                                    <TableHead>Estado Pago</TableHead>
                                    <TableHead>Ya Recibió</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {tanda.members.map((m, i) => (
                                    <TableRow key={i} className={m.isUser ? "bg-primary/10" : ""}>
                                        <TableCell>{m.position}</TableCell>
                                        <TableCell className="flex items-center gap-2">
                                            <Avatar className="h-6 w-6"><AvatarImage src={`https://picsum.photos/seed/${m.address}/24/24`}/><AvatarFallback>{m.address.slice(2,4)}</AvatarFallback></Avatar>
                                            <span className="font-code">{m.address} {m.isUser && "(Tú)"}</span>
                                        </TableCell>
                                        <TableCell>#{m.turn}</TableCell>
                                        <TableCell><Badge variant={m.paymentStatus === "Al día" ? "default" : "destructive"}>{m.paymentStatus}</Badge></TableCell>
                                        <TableCell>{m.hasReceived ? "Sí" : "No"}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                         </Table>
                    </TabsContent>
                  </Tabs>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}

    