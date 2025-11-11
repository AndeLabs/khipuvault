'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useIndividualPool } from '@/hooks/web3/use-individual-pool'
import { formatMUSD } from '@/hooks/web3/use-musd-approval'
import { Clock } from 'lucide-react'
import { useEffect, useState } from 'react'

// Helper function to format time since timestamp
function formatTimeSince(timestamp: bigint | undefined): string {
  if (!timestamp) return 'N/A'
  const now = Date.now() / 1000
  const diff = now - Number(timestamp)
  const days = Math.floor(diff / 86400)
  if (days === 0) return 'Hoy'
  if (days === 1) return '1 día'
  return `${days} días`
}

export function YourPosition() {
  const { userInfo, poolTVL, isLoading, address } = useIndividualPool()
  const [timeLeft, setTimeLeft] = useState('23:59:59')
  const isConnected = !!address

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date()
      const midnight = new Date()
      midnight.setHours(24, 0, 0, 0)
      const diff = midnight.getTime() - now.getTime()

      const hours = String(Math.floor((diff / (1000 * 60 * 60)) % 24)).padStart(2, '0')
      const minutes = String(Math.floor((diff / 1000 / 60) % 60)).padStart(2, '0')
      const seconds = String(Math.floor((diff / 1000) % 60)).padStart(2, '0')

      setTimeLeft(`${hours}:${minutes}:${seconds}`)
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  if (isLoading) {
    return (
      <Card className="bg-card border-2 border-primary">
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-32" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!isConnected) {
    return (
      <Card className="bg-card border-2 border-primary/50">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Conecta tu wallet para ver tu posición</p>
        </CardContent>
      </Card>
    )
  }

  if (!userInfo || userInfo.deposit === BigInt(0)) {
    return (
      <Card className="bg-card border-2 border-primary/50">
        <CardContent className="p-6 text-center">
          <div className="text-4xl mb-3">📊</div>
          <p className="text-muted-foreground mb-2">No tienes depósitos activos en el pool</p>
          <p className="text-sm text-muted-foreground">Haz tu primer depósito para comenzar a generar rendimientos</p>
        </CardContent>
      </Card>
    )
  }

  const musdPrice = 1 // MUSD is stablecoin, always $1
  const timeActive = formatTimeSince(userInfo.daysActive)
  const aprValue = Number(userInfo.estimatedAPR) / 100 // APR is in basis points

  const positionData = [
    {
      label: 'Depositado',
      value: `${formatMUSD(userInfo.deposit)} MUSD`,
      subValue: `(= $${(Number(userInfo.deposit) / 1e18 * musdPrice).toLocaleString('en-US', { maximumFractionDigits: 2 })})`,
      valueColor: 'text-primary',
    },
    {
      label: 'Rendimientos Acumulados',
      value: `+${formatMUSD(userInfo.yields)} MUSD`,
      valueColor: 'text-secondary',
    },
    {
      label: 'Total Disponible',
      value: `${formatMUSD(BigInt(Number(userInfo.deposit) + Number(userInfo.yields)))} MUSD`,
      valueColor: 'text-green-500',
    },
    {
      label: 'APR Estimado',
      value: `${aprValue.toFixed(1)}%`,
      valueColor: 'text-2xl font-bold text-primary',
    },
    {
      label: 'Tiempo Activo',
      value: timeActive,
      icon: <Clock className="h-4 w-4 mr-1" />,
      valueColor: 'text-white',
    },
    {
      label: 'Próximo Yield',
      value: timeLeft,
      valueColor: 'text-yellow-500',
    },
  ]

  return (
    <Card className="bg-card border-2 border-primary shadow-custom shadow-primary/20 animate-pulse-glow">
      <CardContent className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {positionData.map((item, index) => (
            <div key={index} className="flex flex-col gap-1">
              <p className="text-sm text-muted-foreground flex items-center">{item.icon || ''}{item.label}</p>
              <p className={`font-code ${item.valueColor || 'text-white'}`}>{item.value}</p>
              {item.subValue && <p className="text-xs text-muted-foreground">{item.subValue}</p>}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
