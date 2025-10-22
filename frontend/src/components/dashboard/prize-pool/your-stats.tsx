import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const stats = [
    { label: "Total Invertido", value: "0.025 BTC" },
    { label: "Rondas Jugadas", value: "5" },
    { label: "Mejor Posición", value: "#102" },
    { label: "Premios Ganados", value: "0 BTC" },
]

export function YourStats() {
  return (
    <Card className="bg-card border-primary/20 shadow-custom">
      <CardHeader>
        <CardTitle>Tus Estadísticas Históricas</CardTitle>
        <CardDescription>Tu rendimiento en el Prize Pool a lo largo del tiempo.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map(stat => (
                <div key={stat.label} className="p-4 bg-background/50 rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-xl font-bold font-code text-primary">{stat.value}</p>
                </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
