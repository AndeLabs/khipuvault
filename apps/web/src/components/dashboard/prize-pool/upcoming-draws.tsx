import { Bell } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const upcoming = [
  {
    name: "Sorteo Mensual Especial",
    date: "Inicia en 5 días",
    prize: "Est. 0.5 BTC",
  },
  {
    name: "Ronda de Aniversario",
    date: "Inicia en 12 días",
    prize: "Est. 1 BTC",
  },
];

export function UpcomingDraws() {
  return (
    <div className="sticky top-24 space-y-6">
      <Card className="bg-card border-primary/20 shadow-custom">
        <CardHeader>
          <CardTitle>Próximos Sorteos</CardTitle>
          <CardDescription>
            ¡Prepárate para las siguientes rondas!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {upcoming.map((item) => (
            <div
              key={item.name}
              className="p-3 bg-background/50 rounded-lg space-y-2"
            >
              <div className="flex justify-between items-center">
                <p className="font-semibold">{item.name}</p>
                <Badge variant="outline">PRÓXIMAMENTE</Badge>
              </div>
              <div className="flex justify-between items-end text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">
                    Premio Estimado
                  </p>
                  <p className="font-bold text-secondary">{item.prize}</p>
                </div>
                <Button variant="default" size="sm">
                  <Bell className="mr-2 h-4 w-4" /> Notificarme
                </Button>
              </div>
              <p className="text-xs text-muted-foreground pt-1">{item.date}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
