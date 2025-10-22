import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";

const popularPools = [
  { name: "Crypto Gatos", members: "50/50", apr: "7.1%" },
  { name: "Ahorro Familiar Pérez", members: "12/20", apr: "6.5%" },
  { name: "Inversión a Futuro", members: "28/30", apr: "6.8%" },
];

const newPools = [
  { name: "Para la U", members: "8/15", apr: "6.2%" },
  { name: "EURO 2024", members: "2/10", apr: "5.5%" },
  { name: "Mi Primer BTC", members: "1/5", apr: "5.8%" },
];

export function RecommendedPools() {
  return (
    <div className="sticky top-24 space-y-6">
      <Card className="bg-card border-primary/20 shadow-custom">
        <CardHeader>
          <CardTitle>🔥 Pools Populares</CardTitle>
          <CardDescription>Los pools con más actividad.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {popularPools.map((pool, index) => (
            <div key={index} className="flex items-center justify-between text-sm p-3 bg-background/50 rounded-lg">
              <div>
                <p className="font-semibold">{pool.name}</p>
                <p className="text-xs text-muted-foreground">Miembros: {pool.members}</p>
              </div>
              <p className="font-bold text-secondary">{pool.apr}</p>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card className="bg-card border-primary/20 shadow-custom">
        <CardHeader>
          <CardTitle>✨ Nuevos Pools</CardTitle>
          <CardDescription>Únete antes que nadie.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {newPools.map((pool, index) => (
            <div key={index} className="flex items-center justify-between text-sm p-3 bg-background/50 rounded-lg">
              <div>
                <p className="font-semibold flex items-center gap-2">{pool.name} <Badge variant="outline" className="text-xs border-blue-400 text-blue-400">NUEVO</Badge></p>
                <p className="text-xs text-muted-foreground">Miembros: {pool.members}</p>
              </div>
              <p className="font-bold text-secondary">{pool.apr}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
