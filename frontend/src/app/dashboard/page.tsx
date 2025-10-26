'use client'

export const dynamic = 'force-dynamic'

import { useAccount } from "wagmi";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { AnimateOnScroll } from "@/components/animate-on-scroll";

export default function DashboardPage() {
  const { isConnected } = useAccount();

  return (
    <div className="flex flex-col gap-8">
      <AnimateOnScroll>
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-white">Dashboard</h1>
          <p className="text-muted-foreground mt-2">Bienvenido a KhipuVault - Tu plataforma de ahorros BTC</p>
        </div>
      </AnimateOnScroll>

      <AnimateOnScroll delay="100ms">
        <SummaryCards />
      </AnimateOnScroll>

      {isConnected && (
        <AnimateOnScroll delay="200ms">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Individual Savings Pool */}
            <Link href="/dashboard/individual-savings">
              <div className="group relative overflow-hidden rounded-lg border border-primary/20 bg-card p-6 hover:border-primary/50 transition-all duration-300 cursor-pointer h-full">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10">
                  <div className="text-4xl mb-3">💡</div>
                  <h3 className="text-xl font-bold text-white mb-2">Individual Savings Pool</h3>
                  <p className="text-sm text-muted-foreground mb-4">Ahorra en BTC de forma individual y gana rendimientos</p>
                  <div className="flex items-center text-primary text-sm font-medium group-hover:gap-3 gap-2 transition-all duration-300">
                    Explorar <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </Link>

            {/* Cooperative Savings Pool */}
            <Link href="/dashboard/cooperative-savings">
              <div className="group relative overflow-hidden rounded-lg border border-primary/20 bg-card p-6 hover:border-primary/50 transition-all duration-300 cursor-pointer h-full">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10">
                  <div className="text-4xl mb-3">🤝</div>
                  <h3 className="text-xl font-bold text-white mb-2">Cooperative Savings Pool</h3>
                  <p className="text-sm text-muted-foreground mb-4">Crea o únete a pools cooperativos con otros usuarios</p>
                  <div className="flex items-center text-primary text-sm font-medium group-hover:gap-3 gap-2 transition-all duration-300">
                    Explorar <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </Link>

            {/* Prize Pool */}
            <Link href="/dashboard/prize-pool">
              <div className="group relative overflow-hidden rounded-lg border border-primary/20 bg-card p-6 hover:border-primary/50 transition-all duration-300 cursor-pointer h-full">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10">
                  <div className="text-4xl mb-3">🎁</div>
                  <h3 className="text-xl font-bold text-white mb-2">Prize Pool</h3>
                  <p className="text-sm text-muted-foreground mb-4">Participa en pools con premios y gana dinero extra</p>
                  <div className="flex items-center text-primary text-sm font-medium group-hover:gap-3 gap-2 transition-all duration-300">
                    Explorar <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </Link>

            {/* Settings */}
            <Link href="/dashboard/settings">
              <div className="group relative overflow-hidden rounded-lg border border-primary/20 bg-card p-6 hover:border-primary/50 transition-all duration-300 cursor-pointer h-full">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10">
                  <div className="text-4xl mb-3">⚙️</div>
                  <h3 className="text-xl font-bold text-white mb-2">Configuración</h3>
                  <p className="text-sm text-muted-foreground mb-4">Personaliza tu experiencia en KhipuVault</p>
                  <div className="flex items-center text-primary text-sm font-medium group-hover:gap-3 gap-2 transition-all duration-300">
                    Ir <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </AnimateOnScroll>
      )}

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
