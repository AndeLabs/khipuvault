
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Progress } from "../components/ui/progress";
import { Textarea } from "../components/ui/textarea";
import { Copy } from "lucide-react";

export default function ProfilePage() {
  return (
    <div className="space-y-8">
      <Card className="bg-card border-primary/20 shadow-custom">
        <CardHeader>
          <CardTitle>Perfil Público</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src="https://picsum.photos/seed/user-profile/96/96" />
              <AvatarFallback>KV</AvatarFallback>
            </Avatar>
            <div className="space-y-2">
                <Button>Cambiar Avatar</Button>
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-background p-2 rounded-md">
                    <span>0x1234567890abcdef1234567890abcdef12345678</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6"><Copy className="h-4 w-4"/></Button>
                </div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-background/50 p-4">
                <p className="text-sm text-muted-foreground">Miembro desde</p>
                <p className="font-bold">15 Ene 2025</p>
            </Card>
            <Card className="bg-background/50 p-4">
                <p className="text-sm text-muted-foreground">Pools activos</p>
                <p className="font-bold">4</p>
            </Card>
            <Card className="bg-background/50 p-4">
                <p className="text-sm text-muted-foreground">Total invertido</p>
                <p className="font-bold font-code">0.05 BTC</p>
            </Card>
            <Card className="bg-background/50 p-4">
                <p className="text-sm text-muted-foreground">Nivel Ahorrador</p>
                <p className="font-bold">Experto</p>
                <Progress value={80} className="h-1 mt-1" />
            </Card>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-primary/20 shadow-custom">
        <CardHeader>
          <CardTitle>Información Personal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                    <Label htmlFor="name">Nombre / Alias</Label>
                    <Input id="name" placeholder="Tu nombre o alias" />
                </div>
                <div className="space-y-1">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="para@notificaciones.com" />
                </div>
            </div>
            <div className="space-y-1">
                <Label htmlFor="bio">Bio</Label>
                <Textarea id="bio" placeholder="Cuéntanos sobre tus metas de ahorro..." />
            </div>
            <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline">Descartar</Button>
                <Button variant="secondary">Guardar Cambios</Button>
            </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-primary/20 shadow-custom">
        <CardHeader>
          <CardTitle>Programa de Referidos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-1">
                <Label>Tu código de referido</Label>
                <div className="flex items-center gap-2 text-lg font-code text-primary bg-background p-2 rounded-md justify-between">
                    <span>KHIPU-ABC123</span>
                    <Button variant="ghost" size="icon"><Copy className="h-5 w-5"/></Button>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="bg-background p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground">Referidos activos</p>
                    <p className="font-bold text-xl">12</p>
                </div>
                <div className="bg-background p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground">Bono ganado</p>
                    <p className="font-bold text-xl font-code text-secondary">0.0025 BTC</p>
                </div>
                <div className="bg-background p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground">Próximo Milestone</p>
                    <p className="font-bold text-xl">25 Referidos</p>
                </div>
            </div>
        </CardContent>
      </Card>

    </div>
  );
}
