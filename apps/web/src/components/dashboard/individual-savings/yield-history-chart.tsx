'use client'

/**
 * @fileoverview Simplified Yield History Component - REMOVED
 * @module components/dashboard/individual-savings/yield-history-chart
 * 
 * This component has been simplified to remove all charts and graphs
 * Only displays a simple message instead of complex visualizations
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function YieldHistoryChart() {
  return (
    <Card className="bg-card border-primary/20">
      <CardHeader>
        <CardTitle className="text-lg">📊 Historial de Rendimientos</CardTitle>
      </CardHeader>
      <CardContent className="text-center py-12">
        <div className="space-y-4">
          <div className="text-6xl">📈</div>
          <p className="text-muted-foreground">
            Los gráficos de rendimiento han sido temporalmente deshabilitados
          </p>
          <p className="text-sm text-muted-foreground">
            Puedes ver tus rendimientos en la tabla de transacciones
          </p>
        </div>
      </CardContent>
    </Card>
  )
}