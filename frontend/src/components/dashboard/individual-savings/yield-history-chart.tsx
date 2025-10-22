"use client"

import { Area, AreaChart, CartesianGrid, Legend, Tooltip, ResponsiveContainer, XAxis, YAxis, Line, ComposedChart } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"

const chartData = Array.from({ length: 90 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - 90 + i);
    const capital = 1000 + i * 10 + Math.sin(i / 10) * 50;
    const yieldValue = capital * (0.0005 * i) * (Math.random() * 0.4 + 0.8);
    return {
      date: date.toISOString().split('T')[0],
      capital: capital,
      yield: yieldValue,
    };
});

export function YieldHistoryChart() {
  return (
    <Card className="bg-card border-primary/20 shadow-custom">
      <CardHeader>
        <CardTitle>Histórico de Rendimientos</CardTitle>
        <CardDescription>Últimos 90 días</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="colorCapital" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorYield" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString('es-ES', { month: 'short', day: 'numeric'})}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--muted-foreground))', opacity: 0.2 }}
                    tickLine={{ stroke: 'hsl(var(--muted-foreground))', opacity: 0.2 }}
                    interval={14}
                />
                <YAxis 
                    yAxisId="left"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--muted-foreground))', opacity: 0.2 }}
                    tickLine={{ stroke: 'hsl(var(--muted-foreground))', opacity: 0.2 }}
                />
                <YAxis 
                    yAxisId="right"
                    orientation="right"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--muted-foreground))', opacity: 0.2 }}
                    tickLine={{ stroke: 'hsl(var(--muted-foreground))', opacity: 0.2 }}
                />
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" opacity={0.1} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                        const capital = Number(payload.find(p => p.dataKey === 'capital')?.value) || 0;
                        const yieldVal = Number(payload.find(p => p.dataKey === 'yield')?.value) || 0;
                        const roi = capital > 0 ? ((yieldVal / capital) * 100).toFixed(2) : '0';
                      return (
                        <div className="p-4 bg-card border border-primary/20 rounded-lg shadow-lg">
                          <p className="text-sm font-bold text-white">{new Date(label).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric'})}</p>
                          <p className="text-xs text-primary">Capital: {capital.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</p>
                          <p className="text-xs text-secondary">Yield: {yieldVal.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</p>
                          <p className="text-xs text-muted-foreground">ROI: {roi}%</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend verticalAlign="top" wrapperStyle={{paddingBottom: '20px'}}/>
                <Area yAxisId="left" type="monotone" dataKey="capital" name="Capital depositado" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#colorCapital)" />
                <Line yAxisId="right" type="monotone" dataKey="yield" name="Rendimientos acumulados" stroke="hsl(var(--secondary))" strokeWidth={2} strokeDasharray="5 5" />
              </ComposedChart>
            </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
