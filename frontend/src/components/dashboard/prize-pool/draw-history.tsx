import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";

const history = [
  { round: "#122", date: "2024-07-15", winner: "0x8765...43f2", prize: "0.08 BTC", participants: 956, yourPosition: "Puesto #234" },
  { round: "#121", date: "2024-07-08", winner: "0xabcd...effa", prize: "0.075 BTC", participants: 921, yourPosition: "No participaste" },
  { round: "#120", date: "2024-07-01", winner: "0x1234...5678", prize: "0.09 BTC", participants: 980, yourPosition: "Puesto #102" },
];

export function DrawHistory() {
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
              <TableHead>Tu Posición</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.map((item) => (
              <TableRow key={item.round} className="hover:bg-primary/10">
                <TableCell className="font-bold">{item.round}</TableCell>
                <TableCell>{item.date}</TableCell>
                <TableCell>
                    <Badge variant="outline" className="text-yellow-400 border-yellow-400/50">🏆 {item.winner}</Badge>
                </TableCell>
                <TableCell className="font-code text-secondary font-bold">{item.prize}</TableCell>
                <TableCell>{item.yourPosition}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">📊 Ver Detalles</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
