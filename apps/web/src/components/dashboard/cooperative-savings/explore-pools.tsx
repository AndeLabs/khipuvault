/**
 * @fileoverview Explore Pools Component - Production Ready
 * @module components/dashboard/cooperative-savings/explore-pools
 * 
 * Shows all available cooperative pools from blockchain
 * Users can search, filter, and join pools
 */

"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Search, ChevronDown, Loader2 } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCooperativePools, formatBTC, getPoolStatusText, useJoinPool } from "@/hooks/web3/use-cooperative-pools"
import { useToast } from "@/hooks/use-toast"
import { useAccount } from "wagmi"

export function ExplorePools() {
  const { pools, isLoading } = useCooperativePools()
  const { address } = useAccount()
  const { joinPool, isPending } = useJoinPool()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPool, setSelectedPool] = useState<number | null>(null)

  const handleJoinPool = async (poolId: number, minContribution: bigint) => {
    if (!address) {
      toast({
        title: "Wallet no conectada",
        description: "Por favor conecta tu wallet para unirte a un pool",
        variant: "destructive",
      })
      return
    }

    setSelectedPool(poolId)
    try {
      await joinPool(poolId, formatBTC(minContribution))
      toast({
        title: "¡Éxito!",
        description: "Te has unido al pool exitosamente",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo unir al pool",
        variant: "destructive",
      })
    }
  }

  const filteredPools = pools.filter((pool) =>
    pool.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Cargando pools...</span>
      </div>
    )
  }

  if (pools.length === 0) {
    return (
      <Card className="bg-card border-primary/20">
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground mb-4">No hay pools cooperativos aún</p>
          <p className="text-sm text-muted-foreground">
            ¡Sé el primero en crear un pool cooperativo!
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Buscar pools..." 
            className="pl-10 bg-card" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full md:w-auto">
                Filtros <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Solo pools abiertos</DropdownMenuItem>
              <DropdownMenuItem>Por contribución mínima</DropdownMenuItem>
              <DropdownMenuItem>Por número de miembros</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Pools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredPools.map((pool) => {
          const poolStatus = getPoolStatusText(pool.status)
          const isOpen = pool.status === 0 && pool.allowNewMembers
          const isFull = Number(pool.currentMembers) >= Number(pool.maxMembers)
          const memberProgress = (Number(pool.currentMembers) / Number(pool.maxMembers)) * 100
          
          // Calculate days active
          const daysActive = Math.floor((Date.now() / 1000 - Number(pool.createdAt)) / 86400) || 1
          const apr = pool.totalBtcDeposited > 0n 
            ? ((Number(pool.totalYieldGenerated) / Number(pool.totalBtcDeposited)) / daysActive * 365 * 100).toFixed(2)
            : '0.00'

          return (
            <Card 
              key={Number(pool.poolId)} 
              className="bg-card border-primary/20 shadow-custom hover:border-primary/50 transition-all duration-300 hover:shadow-primary/10 hover:-translate-y-1"
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{pool.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-muted-foreground">
                        por <span className="text-primary font-medium">
                          {pool.creator.slice(0, 6)}...{pool.creator.slice(-4)}
                        </span>
                      </p>
                      <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-500">
                        👑 Creator
                      </Badge>
                    </div>
                  </div>
                  <Badge
                    variant={isOpen ? "default" : "error"} 
                    className={`text-xs ${
                      isOpen 
                        ? 'bg-green-600/20 text-green-400 border-green-600/30' 
                        : 'bg-red-600/20 text-red-400 border-red-600/30'
                    }`}
                  >
                    {isOpen ? '🟢' : '🔴'} {poolStatus}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Miembros</p>
                    <p className="font-bold">
                      {Number(pool.currentMembers)}/{Number(pool.maxMembers)}
                    </p>
                    <Progress value={memberProgress} className="h-2 mt-1" />
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total BTC</p>
                    <p className="font-bold font-code">{formatBTC(pool.totalBtcDeposited)}</p>
                    <p className="text-xs text-muted-foreground">
                      {Number(pool.totalMusdMinted) > 0 
                        ? `${(Number(pool.totalMusdMinted) / 1e18).toFixed(0)} MUSD` 
                        : '-'
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Min contribución</p>
                    <p className="font-bold font-code">{formatBTC(pool.minContribution)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">APR</p>
                    <p className="font-bold text-secondary">{apr}%</p>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="secondary" 
                    className="w-full"
                    onClick={() => handleJoinPool(Number(pool.poolId), pool.minContribution)}
                    disabled={!isOpen || isFull || isPending}
                  >
                    {isPending && selectedPool === Number(pool.poolId) ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uniéndose...
                      </>
                    ) : (
                      <>🚪 Unirme al Pool</>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full border-primary text-primary hover:bg-primary/10 hover:text-primary"
                  >
                    👥 Ver Detalles
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredPools.length === 0 && (
        <Card className="bg-card border-primary/20">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              No se encontraron pools con "{searchTerm}"
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
