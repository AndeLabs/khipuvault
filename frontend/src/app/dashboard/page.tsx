'use client'

export const dynamic = 'force-dynamic'

import { useAccount } from 'wagmi'
import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SummaryCards } from '@/components/dashboard/summary-cards'
import { ContractsInfo } from '@/components/dashboard/contracts-info'
import { AnimateOnScroll } from '@/components/animate-on-scroll'
import { CrossFeatureDashboard } from '@/components/analytics/cross-feature-dashboard'

export default function DashboardPage() {
  const { isConnected } = useAccount()

  return (
    <div className="flex flex-col gap-8">
      <AnimateOnScroll>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-white flex items-center gap-3">
              Dashboard
              <Badge variant="outline" className="text-xs animate-pulse">
                <Sparkles className="h-3 w-3 mr-1" />
                Enterprise
              </Badge>
            </h1>
            <p className="text-muted-foreground mt-2">
              Bienvenido a KhipuVault - Tu plataforma de ahorros BTC con sistema en tiempo real
            </p>
          </div>
        </div>
      </AnimateOnScroll>

      <AnimateOnScroll delay="50ms">
        <SummaryCards />
      </AnimateOnScroll>

      {/* Cross-Feature Analytics Dashboard */}
      {isConnected && (
        <AnimateOnScroll delay="100ms">
          <CrossFeatureDashboard enableRealtime />
        </AnimateOnScroll>
      )}

      {/* Quick Access Cards */}
      {isConnected && (
        <AnimateOnScroll delay="200ms">
          <div>
            <h2 className="text-2xl font-bold mb-4">Acceso Rápido a Funciones</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Individual Savings Pool */}
              <Link href="/dashboard/individual-savings">
                <div className="group relative overflow-hidden rounded-lg border border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-6 hover:border-purple-500/50 transition-all duration-300 cursor-pointer h-full">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-4xl">💡</div>
                      <Badge variant="outline" className="text-xs bg-purple-500/20">
                        Real-time
                      </Badge>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Individual Savings</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Ahorra en BTC de forma individual y gana rendimientos
                    </p>
                    <div className="flex items-center text-purple-400 text-sm font-medium group-hover:gap-3 gap-2 transition-all duration-300">
                      Explorar <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </Link>

              {/* Cooperative Savings Pool */}
              <Link href="/dashboard/cooperative-savings">
                <div className="group relative overflow-hidden rounded-lg border border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 p-6 hover:border-blue-500/50 transition-all duration-300 cursor-pointer h-full">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-4xl">🤝</div>
                      <Badge variant="outline" className="text-xs bg-blue-500/20">
                        Real-time
                      </Badge>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Cooperative Pool</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Crea o únete a pools cooperativos con otros usuarios
                    </p>
                    <div className="flex items-center text-blue-400 text-sm font-medium group-hover:gap-3 gap-2 transition-all duration-300">
                      Explorar <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </Link>

              {/* Prize Pool */}
              <Link href="/dashboard/prize-pool">
                <div className="group relative overflow-hidden rounded-lg border border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-red-500/10 p-6 hover:border-orange-500/50 transition-all duration-300 cursor-pointer h-full">
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-4xl">🎁</div>
                      <Badge variant="outline" className="text-xs bg-orange-500/20">
                        Coming Soon
                      </Badge>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Prize Pool</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Participa en pools con premios y gana dinero extra
                    </p>
                    <div className="flex items-center text-orange-400 text-sm font-medium group-hover:gap-3 gap-2 transition-all duration-300">
                      Explorar <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </Link>

              {/* Contracts Info */}
              <div className="group relative overflow-hidden rounded-lg border border-gray-500/20 bg-gradient-to-br from-gray-500/10 to-gray-600/10 p-6 hover:border-gray-500/50 transition-all duration-300 cursor-pointer h-full">
                <div className="absolute inset-0 bg-gradient-to-r from-gray-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-4xl">📜</div>
                    <Badge variant="outline" className="text-xs bg-gray-500/20">
                      Info
                    </Badge>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Smart Contracts</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Explora nuestra infraestructura de contratos
                  </p>
                  <div className="flex items-center text-gray-400 text-sm font-medium">
                    Ver detalles abajo ↓
                  </div>
                </div>
              </div>

              {/* Settings */}
              <Link href="/dashboard/settings">
                <div className="group relative overflow-hidden rounded-lg border border-green-500/20 bg-gradient-to-br from-green-500/10 to-emerald-500/10 p-6 hover:border-green-500/50 transition-all duration-300 cursor-pointer h-full">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-4xl">⚙️</div>
                      <Badge variant="outline" className="text-xs bg-green-500/20">
                        Settings
                      </Badge>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Configuración</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Personaliza tu experiencia en KhipuVault
                    </p>
                    <div className="flex items-center text-green-400 text-sm font-medium group-hover:gap-3 gap-2 transition-all duration-300">
                      Ir <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </AnimateOnScroll>
      )}

      {/* Contracts Information Section */}
      <AnimateOnScroll delay="300ms">
        <ContractsInfo />
      </AnimateOnScroll>

      {!isConnected && (
        <AnimateOnScroll delay="200ms">
          <div className="rounded-lg border border-primary/20 bg-card p-8 text-center">
            <div className="text-5xl mb-4">🔐</div>
            <h2 className="text-2xl font-bold text-white mb-2">Conecta tu Wallet</h2>
            <p className="text-muted-foreground mb-6">Para acceder a KhipuVault, necesitas conectar tu wallet de Bitcoin</p>
            <p className="text-sm text-muted-foreground">Usa el botón de arriba para conectar tu wallet y comenzar a ahorrar</p>
          </div>
        </AnimateOnScroll>
      )}
    </div>
  );
}
