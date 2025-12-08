"use client";

export const dynamic = "force-dynamic";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";

export default function NotificationsPage() {
  const notificationCategories = [
    {
      title: "Rendimientos y Ganancias",
      items: [
        "Rendimientos generados",
        "Metas alcanzadas",
        "Nuevos yields disponibles",
      ],
    },
    {
      title: "Loterías",
      items: [
        "Resultados de sorteos",
        "Nuevas rondas disponibles",
        "Recordatorio antes de cierre",
      ],
    },
    {
      title: "Tandas Rotativas",
      items: [
        "Tu turno de pagar",
        "Tu turno de recibir",
        "Cambios en la tanda",
        "Miembros sin pagar",
      ],
    },
    {
      title: "Pools Cooperativos",
      items: [
        "Nuevos miembros",
        "Cambios en el pool",
        "Solicitudes de ingreso (admin)",
      ],
    },
  ];

  return (
    <div className="space-y-8">
      <Card className="bg-card border-primary/20 shadow-custom">
        <CardHeader>
          <CardTitle>Notificaciones</CardTitle>
          <CardDescription>
            Elige cómo y cuándo quieres recibir notificaciones.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="push-notifications" className="text-base">
                Activar Notificaciones Push
              </Label>
              <p className="text-sm text-muted-foreground">
                Recibe alertas en tiempo real en tu dispositivo.
              </p>
            </div>
            <Switch id="push-notifications" defaultChecked />
          </div>

          {notificationCategories.map((category) => (
            <div
              key={category.title}
              className="space-y-4 rounded-lg border p-4"
            >
              <h3 className="font-semibold">{category.title}</h3>
              {category.items.map((item) => (
                <div key={item} className="flex items-center justify-between">
                  <Label
                    htmlFor={item.replace(/\s+/g, "-").toLowerCase()}
                    className="font-normal"
                  >
                    {item}
                  </Label>
                  <Switch
                    id={item.replace(/\s+/g, "-").toLowerCase()}
                    defaultChecked
                  />
                </div>
              ))}
            </div>
          ))}

          <div className="space-y-4 rounded-lg border p-4">
            <h3 className="font-semibold">Frecuencia de Resúmenes por Email</h3>
            <RadioGroup
              defaultValue="daily"
              className="flex flex-col md:flex-row gap-4"
            >
              <div>
                <RadioGroupItem value="realtime" id="realtime" />
                <Label htmlFor="realtime" className="ml-2">
                  Tiempo Real
                </Label>
              </div>
              <div>
                <RadioGroupItem value="daily" id="daily" />
                <Label htmlFor="daily" className="ml-2">
                  Diario
                </Label>
              </div>
              <div>
                <RadioGroupItem value="weekly" id="weekly" />
                <Label htmlFor="weekly" className="ml-2">
                  Semanal
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="flex justify-between items-center pt-4">
            <Button variant="ghost">🔔 Enviar Notificación de Prueba</Button>
            <div className="flex gap-2">
              <Button variant="outline">Descartar</Button>
              <Button variant="secondary">Guardar Cambios</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
