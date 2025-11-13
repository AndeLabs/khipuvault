/**
 * @fileoverview Lend Page - Main page for lending MUSD to Stability Pool
 */

'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LendForm } from '@/components/dashboard/musd/lend-form'
import { WithdrawForm } from '@/components/dashboard/musd/withdraw-form'
import { RewardsCard } from '@/components/dashboard/musd/rewards-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DollarSign, TrendingUp, Users, AlertCircle, Gift } from 'lucide-react'
import { useStabilityPool } from '@/hooks/web3/use-stability-pool'
import { formatEther } from 'viem'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function LendPage() {
  const { stats, position } = useStabilityPool()

  return (
    <div className="container mx-auto py-8 space-y-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard/musd">
            <Button variant="ghost" size="sm" className="mb-2">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a MUSD
            </Button>
          </Link>
          <h1 className="text-4xl font-bold">Prestar MUSD</h1>
          <p className="text-muted-foreground mt-2">
            Deposita MUSD en el Stability Pool y gana BTC de liquidaciones
          </p>
        </div>
        <Badge className="bg-green-500 text-white px-4 py-2 text-lg">
          Lending
        </Badge>
      </div>

      {/* Pool Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" />
              TVL Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {Number(formatEther(stats.tvl)).toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-muted-foreground mt-1">MUSD en el pool</p>
          </CardContent>
        </Card>

        <Card className="bg-card border border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              APY Estimado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-500">
              {stats.estimatedAPY.toFixed(2)}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">Rendimiento anual</p>
          </CardContent>
        </Card>

        <Card className="bg-card border border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Gift className="w-4 h-4 text-blue-500" />
              Tus Recompensas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-500">
              {position ? Number(formatEther(position.pendingCollateralGains)).toFixed(5) : '0.00000'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">BTC pendientes</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Forms */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="deposit" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="deposit">Depositar MUSD</TabsTrigger>
              <TabsTrigger value="withdraw">Retirar MUSD</TabsTrigger>
            </TabsList>

            <TabsContent value="deposit" className="mt-6">
              <LendForm />
            </TabsContent>

            <TabsContent value="withdraw" className="mt-6">
              <WithdrawForm />
            </TabsContent>
          </Tabs>

          {/* Info Card */}
          <Card className="bg-green-500/10 border border-green-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-500">
                <AlertCircle className="w-5 h-5" />
                ¿Cómo funcionan las recompensas?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="font-semibold mb-1">Mecanismo de Liquidación</p>
                <p className="text-muted-foreground">
                  Cuando una posición de préstamo cae por debajo del ratio mínimo de colateralización (110%),
                  el protocolo la liquida automáticamente. El MUSD del Stability Pool se usa para cubrir la deuda,
                  y a cambio, los depositantes reciben el colateral (BTC) de la posición liquidada.
                </p>
              </div>

              <div>
                <p className="font-semibold mb-1">Distribución Proporcional</p>
                <p className="text-muted-foreground">
                  Las recompensas se distribuyen proporcionalmente según tu participación en el pool.
                  Si tienes el 10% del pool, recibirás el 10% de cada liquidación.
                </p>
              </div>

              <div>
                <p className="font-semibold mb-1">Sin Riesgo de Liquidación</p>
                <p className="text-muted-foreground">
                  Como proveedor de liquidez, NO tienes riesgo de ser liquidado. Tu MUSD está siempre seguro
                  y puedes retirarlo en cualquier momento. Solo puede disminuir si se usa para cubrir liquidaciones
                  (en cuyo caso recibes BTC equivalente o mayor valor).
                </p>
              </div>

              <div>
                <p className="font-semibold mb-1">Fee de Performance</p>
                <p className="text-muted-foreground">
                  El protocolo cobra un {(stats.performanceFee / 100).toFixed(2)}% de las recompensas en BTC.
                  Este fee ayuda a mantener el protocolo y desarrollo continuo.
                </p>
              </div>

              <div>
                <p className="font-semibold mb-1">Reclamo de Recompensas</p>
                <p className="text-muted-foreground">
                  Puedes reclamar tus recompensas en BTC en cualquier momento. Las recompensas se acumulan
                  automáticamente y no expiran. No hay límite mínimo para reclamar.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Benefits Card */}
          <Card className="bg-card border border-primary/20">
            <CardHeader>
              <CardTitle>Ventajas del Stability Pool</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <p className="font-semibold text-green-500">✅ Rendimiento Pasivo</p>
                  <p className="text-muted-foreground">
                    Gana BTC automáticamente sin gestión activa
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="font-semibold text-green-500">✅ Sin Impermanent Loss</p>
                  <p className="text-muted-foreground">
                    No hay pérdida impermanente como en AMMs
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="font-semibold text-green-500">✅ Liquidez Total</p>
                  <p className="text-muted-foreground">
                    Retira tu MUSD en cualquier momento sin penalidades
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="font-semibold text-green-500">✅ Diversificación</p>
                  <p className="text-muted-foreground">
                    Gana exposición a BTC mientras mantienes MUSD
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Rewards */}
        <div className="lg:col-span-1">
          <RewardsCard />
        </div>
      </div>
    </div>
  )
}
