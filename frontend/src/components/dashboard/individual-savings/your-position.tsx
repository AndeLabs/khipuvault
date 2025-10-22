"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { useEffect, useState } from "react";

const positionData = [
    { label: "Depositado", value: "0.01 BTC", subValue: "($600 USD)", valueColor: "text-primary" },
    { label: "MUSD Generado", value: "600 MUSD" },
    { label: "Rendimientos", value: "+15 MUSD", valueColor: "text-secondary" },
    { label: "APR Actual", value: "6.2%", valueColor: "text-2xl font-bold" },
    { label: "Tiempo Activo", value: "45 días", icon: <Clock className="h-4 w-4 mr-1" /> },
    { label: "Próximo Yield", value: "0.00041 BTC" },
];

export function YourPosition() {
    const [timeLeft, setTimeLeft] = useState('23:59:59');

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            const midnight = new Date();
            midnight.setHours(24, 0, 0, 0);
            const diff = midnight.getTime() - now.getTime();

            const hours = String(Math.floor((diff / (1000 * 60 * 60)) % 24)).padStart(2, '0');
            const minutes = String(Math.floor((diff / 1000 / 60) % 60)).padStart(2, '0');
            const seconds = String(Math.floor((diff / 1000) % 60)).padStart(2, '0');
            
            setTimeLeft(`${hours}:${minutes}:${seconds}`);
        }, 1000);

        return () => clearInterval(timer);
    }, []);
    
    return (
        <Card className="bg-card border-2 border-primary shadow-custom shadow-primary/20 animate-pulse-glow">
            <CardContent className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    {positionData.map((item, index) => (
                        <div key={index} className="flex flex-col gap-1">
                            <p className="text-sm text-muted-foreground flex items-center">
                                {item.icon}
                                {item.label}
                            </p>
                            <p className={`font-code ${item.valueColor || 'text-white'} ${item.label === 'APR Actual' ? 'text-2xl font-bold' : 'text-lg font-semibold'}`}>
                                {item.label === 'Próximo Yield' ? timeLeft : item.value}
                            </p>
                            {item.subValue && <p className="text-xs text-muted-foreground">{item.subValue}</p>}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
