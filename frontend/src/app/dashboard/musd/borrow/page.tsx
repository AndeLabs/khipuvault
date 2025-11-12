/**
 * @fileoverview Borrow Page - Main page for borrowing MUSD against BTC
 */

'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BorrowForm } from '@/components/dashboard/musd/borrow-form'
import { RepayForm } from '@/components/dashboard/musd/repay-form'
import { PositionCard } from '@/components/dashboard/musd/position-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DollarSign, TrendingUp, Users, AlertCircle } from 'lucide-react'
import { useMezoBorrow } from '@/hooks/web3/use-mezo-borrow'
import { formatEther } from 'viem'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function BorrowPage() {
  const { totalBtcDeposited, totalMusdMinted, targetLtv } = useMezoBorrow()

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
          <h1 className="text-4xl font-bold">Pedir Prestado MUSD</h1>
          <p className="text-muted-foreground mt-2">
            Deposita BTC como colateral y recibe MUSD para usar en DeFi
          </p>
        </div>
        <Badge className="bg-blue-500 text-white px-4 py-2 text-lg">
          Borrowing
        </Badge>
      </div>

      {/* Protocol Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" />
              Total BTC Depositado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {totalBtcDeposited ? Number(formatEther(totalBtcDeposited)).toFixed(3) : '0.000'} BTC
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              ≈ ${totalBtcDeposited ? (Number(formatEther(totalBtcDeposited)) * 100000).toLocaleString('en-US', { maximumFractionDigits: 0 }) : '0'} USD
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              Total MUSD Prestado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-500">
              {totalMusdMinted ? Number(formatEther(totalMusdMinted)).toLocaleString('en-US', { maximumFractionDigits: 0 }) : '0'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">MUSD</p>
          </CardContent>
        </Card>

        <Card className="bg-card border border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" />
              LTV Objetivo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-500">
              {targetLtv ? Number(targetLtv) / 100 : 50}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">Loan-to-Value</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Forms */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="borrow" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="borrow">Depositar BTC</TabsTrigger>
              <TabsTrigger value="repay">Pagar Deuda</TabsTrigger>
            </TabsList>

            <TabsContent value="borrow" className="mt-6">
              <BorrowForm />
            </TabsContent>

            <TabsContent value="repay" className="mt-6">
              <RepayForm />
            </TabsContent>
          </Tabs>

          {/* Info Card */}
          <Card className="mt-6 bg-blue-500/10 border border-blue-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-500">
                <AlertCircle className="w-5 h-5" />
                Información Importante
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="font-semibold mb-1">¿Qué es el ratio de colateralización?</p>
                <p className="text-muted-foreground">
                  Es el porcentaje entre el valor de tu colateral (BTC) y tu deuda (MUSD).
                  Debes mantenerlo arriba del 110% para evitar liquidación.
                </p>
              </div>

              <div>
                <p className="font-semibold mb-1">¿Qué pasa si el precio del BTC baja?</p>
                <p className="text-muted-foreground">
                  Tu ratio de colateralización baja. Si cae por debajo del 110%, tu posición
                  puede ser liquidada. Puedes agregar más BTC o pagar parte de la deuda para mejorar tu ratio.
                </p>
              </div>

              <div>
                <p className="font-semibold mb-1">¿Puedo pagar parcialmente?</p>
                <p className="text-muted-foreground">
                  Sí, puedes pagar cualquier cantidad de MUSD. Al hacerlo, recibirás BTC proporcional
                  al monto pagado. No hay penalidades por pago anticipado.
                </p>
              </div>

              <div>
                <p className="font-semibold mb-1">¿Cuánto interés pago?</p>
                <p className="text-muted-foreground">
                  Las tasas son fijas entre 1-5% anual, dependiendo de las condiciones del protocolo.
                  No hay fechas de vencimiento.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Position */}
        <div className="lg:col-span-1">
          <PositionCard />
        </div>
      </div>
    </div>
  )
}
