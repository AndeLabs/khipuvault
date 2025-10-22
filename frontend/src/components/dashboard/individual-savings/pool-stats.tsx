import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const poolStats = {
    totalDeposited: "10.5 BTC",
    totalUsers: "125",
    avgApr: "6.2%",
};

const recentActivities = [
    { user: "0x12...34", action: "depositó 0.1 BTC", time: "hace 5 minutos" },
    { user: "0xab...ef", action: "retiró 0.5 BTC", time: "hace 12 minutos" },
    { user: "0x56...78", action: "reclamó 0.01 BTC", time: "hace 28 minutos" },
    { user: "0xcd...gh", action: "depositó 0.25 BTC", time: "hace 1 hora" },
    { user: "0x89...ab", action: "depositó 0.05 BTC", time: "hace 2 horas" },
];

export function PoolStats() {
    return (
        <Card className="sticky top-24 bg-card border-primary/20 shadow-custom">
            <CardHeader>
                <CardTitle>📊 Estadísticas del Pool</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Total depositado</span>
                        <span className="font-bold font-code">{poolStats.totalDeposited}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Total usuarios</span>
                        <span className="font-bold font-code">{poolStats.totalUsers}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">APR promedio</span>
                        <span className="font-bold font-code text-secondary">{poolStats.avgApr}</span>
                    </div>
                </div>

                <Separator className="bg-primary/20" />
                
                <div>
                    <h4 className="font-semibold mb-3">⚡ Últimas actividades</h4>
                    <div className="space-y-3 text-xs">
                        {recentActivities.map((activity, index) => (
                            <div key={index}>
                                <p><span className="font-bold text-primary">{activity.user}</span> {activity.action}</p>
                                <p className="text-muted-foreground">{activity.time}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
