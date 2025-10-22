"use client";

import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { BookOpen } from "lucide-react";

export function TandaExplanation() {
  return (
    <Card className="bg-card border-primary/20 shadow-custom">
      <CardContent className="p-6 flex flex-col md:flex-row items-center gap-6">
        <div className="text-4xl">🔄</div>
        <div className="flex-grow text-center md:text-left">
          <h3 className="text-xl font-bold">¿Qué es un Pasanaku/Tanda?</h3>
          <p className="text-muted-foreground mt-1">
            Es un sistema de ahorro rotativo. Cada miembro contribuye
            periódicamente y, en cada turno, uno recibe el total acumulado. ¡Ahora en
            blockchain!
          </p>
        </div>
        <Button variant="outline" className="border-primary text-primary hover:bg-primary/10 hover:text-primary">
          <BookOpen className="mr-2 h-4 w-4" />
          Aprender Más
        </Button>
      </CardContent>
    </Card>
  );
}
