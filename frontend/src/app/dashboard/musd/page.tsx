/**
 * @fileoverview mUSD Overview Page - Educational landing page
 * Explains borrowing/lending, benefits, risks, and how it works
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowRight,
  DollarSign,
  TrendingUp,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BookOpen,
  Coins,
  Lock,
  Zap,
} from 'lucide-react'
import Link from 'next/link'

export default function MusdOverviewPage() {
  return (
    <div className="container mx-auto py-8 space-y-8 max-w-6xl">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <Badge className="bg-primary text-white px-6 py-2 text-lg">
          Powered by Mezo Protocol
        </Badge>
        <h1 className="text-5xl font-bold">MUSD: Bitcoin-Backed Stablecoin</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Pide prestado MUSD contra tu BTC o gana recompensas prestando MUSD.
          Todo respaldado por el protocolo de Mezo en la blockchain de Bitcoin.
        </p>
      </div>

      {/* CTA Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        <Link href="/dashboard/musd/borrow">
          <Card className="bg-card border-2 border-blue-500/30 hover:border-blue-500/60 transition-all cursor-pointer group">
            <CardHeader>
              <div className="flex items-center justify-between">
                <DollarSign className="w-12 h-12 text-blue-500" />
                <ArrowRight className="w-6 h-6 text-blue-500 group-hover:translate-x-2 transition-transform" />
              </div>
              <CardTitle className="text-2xl">Pedir Prestado MUSD</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Usa tu BTC como colateral para pedir prestado MUSD y acceder a liquidez sin vender tu Bitcoin.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>LTV hasta 50%</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Tasas de interés 1-5%</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Mantén exposición a BTC</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/musd/lend">
          <Card className="bg-card border-2 border-green-500/30 hover:border-green-500/60 transition-all cursor-pointer group">
            <CardHeader>
              <div className="flex items-center justify-between">
                <TrendingUp className="w-12 h-12 text-green-500" />
                <ArrowRight className="w-6 h-6 text-green-500 group-hover:translate-x-2 transition-transform" />
              </div>
              <CardTitle className="text-2xl">Prestar MUSD</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Deposita MUSD en el Stability Pool y gana BTC de las liquidaciones. Sin riesgo de liquidación.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Gana recompensas en BTC</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Sin riesgo de liquidación</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Retira en cualquier momento</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* How It Works - Borrowing */}
      <Card className="bg-card border border-primary/20">
        <CardHeader>
          <CardTitle className="text-3xl flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-blue-500" />
            ¿Cómo funciona pedir prestado?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                <span className="text-2xl font-bold text-blue-500">1</span>
              </div>
              <h3 className="text-xl font-bold">Deposita BTC</h3>
              <p className="text-muted-foreground">
                Envía tu BTC al contrato inteligente. Tu BTC se usa como colateral y permanece bajo tu control.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                <span className="text-2xl font-bold text-blue-500">2</span>
              </div>
              <h3 className="text-xl font-bold">Recibe MUSD</h3>
              <p className="text-muted-foreground">
                Recibes MUSD instantáneamente (hasta 50% del valor de tu BTC). Usa MUSD en cualquier DeFi.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                <span className="text-2xl font-bold text-blue-500">3</span>
              </div>
              <h3 className="text-xl font-bold">Repaga y Retira</h3>
              <p className="text-muted-foreground">
                Cuando quieras, repaga tu MUSD y recupera tu BTC. Puedes pagar parcialmente o completamente.
              </p>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-4 gap-4 mt-8">
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/30 text-center">
              <p className="text-sm text-muted-foreground mb-1">LTV Objetivo</p>
              <p className="text-3xl font-bold">50%</p>
            </div>
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/30 text-center">
              <p className="text-sm text-muted-foreground mb-1">Interés Anual</p>
              <p className="text-3xl font-bold">1-5%</p>
            </div>
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/30 text-center">
              <p className="text-sm text-muted-foreground mb-1">Liquidación</p>
              <p className="text-3xl font-bold">110%</p>
            </div>
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/30 text-center">
              <p className="text-sm text-muted-foreground mb-1">Mínimo</p>
              <p className="text-3xl font-bold">0.001</p>
              <p className="text-xs text-muted-foreground">BTC</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* How It Works - Lending */}
      <Card className="bg-card border border-primary/20">
        <CardHeader>
          <CardTitle className="text-3xl flex items-center gap-3">
            <Coins className="w-8 h-8 text-green-500" />
            ¿Cómo funciona prestar?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <span className="text-2xl font-bold text-green-500">1</span>
              </div>
              <h3 className="text-xl font-bold">Deposita MUSD</h3>
              <p className="text-muted-foreground">
                Deposita tu MUSD en el Stability Pool. Tu MUSD ayuda a mantener la estabilidad del protocolo.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <span className="text-2xl font-bold text-green-500">2</span>
              </div>
              <h3 className="text-xl font-bold">Gana Recompensas</h3>
              <p className="text-muted-foreground">
                Cuando posiciones son liquidadas, recibes BTC proporcionalmente. Sin trabajo activo de tu parte.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <span className="text-2xl font-bold text-green-500">3</span>
              </div>
              <h3 className="text-xl font-bold">Reclama y Retira</h3>
              <p className="text-muted-foreground">
                Reclama tus recompensas en BTC en cualquier momento. Retira tu MUSD cuando quieras.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Benefits */}
      <Card className="bg-card border border-primary/20">
        <CardHeader>
          <CardTitle className="text-3xl flex items-center gap-3">
            <Shield className="w-8 h-8 text-green-500" />
            Beneficios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-xl font-bold text-green-500">Para Prestamistas (Borrowers)</h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Mantén exposición a BTC</p>
                    <p className="text-sm text-muted-foreground">Tu BTC sigue siendo tuyo y se valoriza</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Liquidez instantánea</p>
                    <p className="text-sm text-muted-foreground">Accede a capital sin vender tu Bitcoin</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Tasas competitivas</p>
                    <p className="text-sm text-muted-foreground">Intereses fijos entre 1-5% anual</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Flexibilidad total</p>
                    <p className="text-sm text-muted-foreground">Repaga cuando quieras, sin fecha límite</p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="text-xl font-bold text-green-500">Para Proveedores (Lenders)</h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Recompensas en BTC</p>
                    <p className="text-sm text-muted-foreground">Gana Bitcoin real de liquidaciones</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Sin riesgo de liquidación</p>
                    <p className="text-sm text-muted-foreground">Tu MUSD está siempre seguro</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Retiros flexibles</p>
                    <p className="text-sm text-muted-foreground">Retira tu capital en cualquier momento</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Rendimiento pasivo</p>
                    <p className="text-sm text-muted-foreground">Gana automáticamente sin gestión activa</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risks */}
      <Card className="bg-card border-2 border-yellow-500/30">
        <CardHeader>
          <CardTitle className="text-3xl flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-yellow-500" />
            Riesgos Importantes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-xl font-bold text-yellow-500">Riesgos para Prestamistas</h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Riesgo de Liquidación</p>
                    <p className="text-sm text-muted-foreground">
                      Si el precio del BTC cae significativamente y tu ratio de colateralización baja del 110%,
                      tu posición puede ser liquidada y perderías parte de tu colateral.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Volatilidad del BTC</p>
                    <p className="text-sm text-muted-foreground">
                      El Bitcoin es volátil. Monitorea tu posición y mantén un margen de seguridad.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Riesgo de Contratos Inteligentes</p>
                    <p className="text-sm text-muted-foreground">
                      Aunque los contratos están auditados, siempre existe riesgo inherente en DeFi.
                    </p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="text-xl font-bold text-yellow-500">Riesgos para Proveedores</h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Pérdida Temporal de MUSD</p>
                    <p className="text-sm text-muted-foreground">
                      Cuando ocurre una liquidación, parte de tu MUSD se usa para absorber la deuda.
                      Recibes BTC a cambio, pero el valor puede variar.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Rendimiento Variable</p>
                    <p className="text-sm text-muted-foreground">
                      Las recompensas dependen de las liquidaciones. No hay garantía de rendimiento fijo.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Riesgo de Contratos Inteligentes</p>
                    <p className="text-sm text-muted-foreground">
                      Riesgo inherente en protocolos DeFi, aunque Mezo está auditado.
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card className="bg-card border border-primary/20">
        <CardHeader>
          <CardTitle className="text-3xl flex items-center gap-3">
            <Lock className="w-8 h-8 text-primary" />
            Seguridad y Auditorías
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            La seguridad es nuestra prioridad. Todos los contratos inteligentes están auditados y utilizan
            las mejores prácticas de la industria.
          </p>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
              <Zap className="w-8 h-8 text-primary mb-3" />
              <h4 className="font-bold mb-2">Contratos Upgradeable</h4>
              <p className="text-sm text-muted-foreground">
                Patrón UUPS para actualizaciones seguras sin cambiar direcciones
              </p>
            </div>

            <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
              <Shield className="w-8 h-8 text-primary mb-3" />
              <h4 className="font-bold mb-2">Auditorías Profesionales</h4>
              <p className="text-sm text-muted-foreground">
                Auditado por expertos en seguridad blockchain
              </p>
            </div>

            <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
              <Lock className="w-8 h-8 text-primary mb-3" />
              <h4 className="font-bold mb-2">Non-Custodial</h4>
              <p className="text-sm text-muted-foreground">
                Tú siempre mantienes control de tus fondos
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Final CTA */}
      <Card className="bg-gradient-to-r from-blue-500/20 to-green-500/20 border-2 border-primary/30">
        <CardContent className="p-8 text-center space-y-6">
          <h2 className="text-4xl font-bold">¿Listo para empezar?</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Elige si quieres pedir prestado MUSD o ganar recompensas prestándolo
          </p>

          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Link href="/dashboard/musd/borrow">
              <Button size="lg" className="text-lg px-8 py-6 bg-blue-500 hover:bg-blue-600">
                <DollarSign className="w-6 h-6 mr-2" />
                Pedir Prestado MUSD
              </Button>
            </Link>

            <Link href="/dashboard/musd/lend">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-2 border-green-500 hover:bg-green-500/10">
                <TrendingUp className="w-6 h-6 mr-2" />
                Prestar MUSD
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
