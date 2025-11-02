'use client'

import { useState } from 'react'
import { ExternalLink, ChevronDown, ChevronUp, Code, Shield, Users, Gift, RotateCw, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CONTRACT_ADDRESSES, formatAddress } from '@/contracts/addresses'

interface ContractInfo {
  name: string
  description: string
  address: string
  icon: React.ReactNode
  status: 'deployed' | 'pending' | 'testnet'
  features: string[]
  explorerUrl?: string
  docsUrl?: string
}

const contractsInfo: ContractInfo[] = [
  {
    name: 'IndividualPool V3',
    description: 'Pool de ahorros individual con auto-compound y sistema de referidos. Permite a los usuarios ahorrar BTC de forma personalizada con rendimientos optimizados automáticamente.',
    address: CONTRACT_ADDRESSES.INDIVIDUAL_POOL,
    icon: <TrendingUp className="h-6 w-6" />,
    status: 'deployed',
    features: ['Auto-compound', 'Sistema de referidos', 'Depósitos incrementales', 'Retiros flexibles'],
    explorerUrl: `https://explorer.mezo.org/address/${CONTRACT_ADDRESSES.INDIVIDUAL_POOL}`,
    docsUrl: 'https://github.com/KhipuVault/contracts/blob/main/src/pools/IndividualPoolV3.sol'
  },
  {
    name: 'CooperativePool V3',
    description: 'Pool de ahorros cooperativo donde múltiples usuarios pueden unir sus fondos para alcanzar metas comunes. Ideal para ahorros grupales y proyectos comunitarios.',
    address: CONTRACT_ADDRESSES.COOPERATIVE_POOL,
    icon: <Users className="h-6 w-6" />,
    status: 'deployed',
    features: ['Ahorros grupales', 'Metas comunes', 'Gobernanza democrática', 'Distribución justa'],
    explorerUrl: `https://explorer.mezo.org/address/${CONTRACT_ADDRESSES.COOPERATIVE_POOL}`,
    docsUrl: 'https://github.com/KhipuVault/contracts/blob/main/src/pools/CooperativePoolV3.sol'
  },
  {
    name: 'MezoIntegration V3',
    description: 'Contrato de integración con el ecosistema Mezo que gestiona los depósitos de BTC y la acuñación de MUSD. Actúa como puente entre Bitcoin y los rendimientos de DeFi.',
    address: CONTRACT_ADDRESSES.MEZO_INTEGRATION,
    icon: <Shield className="h-6 w-6" />,
    status: 'deployed',
    features: ['Puente BTC-MUSD', 'Seguridad multinivel', 'Optimización de gas', 'Validación on-chain'],
    explorerUrl: `https://explorer.mezo.org/address/${CONTRACT_ADDRESSES.MEZO_INTEGRATION}`,
    docsUrl: 'https://github.com/KhipuVault/contracts/blob/main/src/integrations/MezoIntegrationV3.sol'
  },
  {
    name: 'YieldAggregator V3',
    description: 'Agregador de rendimientos que distribuye los fondos de manera inteligente entre diferentes estrategias de yield para maximizar los retornos de los usuarios.',
    address: CONTRACT_ADDRESSES.YIELD_AGGREGATOR,
    icon: <Code className="h-6 w-6" />,
    status: 'deployed',
    features: ['Diversificación automática', 'Rebalanceo inteligente', 'Múltiples estrategias', 'Optimización de rendimientos'],
    explorerUrl: `https://explorer.mezo.org/address/${CONTRACT_ADDRESSES.YIELD_AGGREGATOR}`,
    docsUrl: 'https://github.com/KhipuVault/contracts/blob/main/src/integrations/YieldAggregatorV3.sol'
  },
  {
    name: 'LotteryPool',
    description: 'Pool de ahorros con sistema de lotería sin pérdida. Los usuarios pueden ganar premios mientras sus fondos permanecen seguros y generando rendimientos.',
    address: CONTRACT_ADDRESSES.LOTTERY_POOL,
    icon: <Gift className="h-6 w-6" />,
    status: 'pending',
    features: ['Lotería sin pérdida', 'Premios semanales', 'Fondos siempre seguros', 'Chainlink VRF'],
    explorerUrl: CONTRACT_ADDRESSES.LOTTERY_POOL !== '0x0000000000000000000000000000000000000000' 
      ? `https://explorer.mezo.org/address/${CONTRACT_ADDRESSES.LOTTERY_POOL}` 
      : undefined,
    docsUrl: 'https://github.com/KhipuVault/contracts/blob/main/src/pools/LotteryPool.sol'
  },
  {
    name: 'RotatingPool',
    description: 'Sistema de ahorro rotativo (ROSCA/Pasanaku) donde los participantes reciben turnos para acceder al fondo común. Ideal para metas de ahorro a corto plazo.',
    address: CONTRACT_ADDRESSES.ROTATING_POOL,
    icon: <RotateCw className="h-6 w-6" />,
    status: 'pending',
    features: ['Sistema ROSCA', 'Turnos rotativos', 'Metas a corto plazo', 'Compromiso comunitario'],
    explorerUrl: CONTRACT_ADDRESSES.ROTATING_POOL !== '0x0000000000000000000000000000000000000000' 
      ? `https://explorer.mezo.org/address/${CONTRACT_ADDRESSES.ROTATING_POOL}` 
      : undefined,
    docsUrl: 'https://github.com/KhipuVault/contracts/blob/main/src/pools/RotatingPool.sol'
  }
]

function getStatusBadge(status: ContractInfo['status']) {
  switch (status) {
    case 'deployed':
      return <Badge variant="default" className="bg-green-500">Desplegado</Badge>
    case 'pending':
      return <Badge variant="secondary">Pendiente</Badge>
    case 'testnet':
      return <Badge variant="outline">Testnet</Badge>
  }
}

export function ContractsSection() {
  const [expandedContract, setExpandedContract] = useState<string | null>(null)

  const toggleContract = (contractName: string) => {
    setExpandedContract(expandedContract === contractName ? null : contractName)
  }

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold tracking-tight mb-4">
            Nuestros Contratos Inteligentes
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Conoce la infraestructura que impulsa KhipuVault. Todos nuestros contratos están 
            auditados, verificados y optimizados para ofrecer la mejor experiencia de ahorros en Bitcoin.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {contractsInfo.map((contract) => (
            <Card key={contract.name} className="relative overflow-hidden border-primary/20 hover:border-primary/40 transition-all duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      {contract.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{contract.name}</CardTitle>
                      {getStatusBadge(contract.status)}
                    </div>
                  </div>
                </div>
                <CardDescription className="text-sm leading-relaxed">
                  {contract.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {/* Contract Address */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Dirección del Contrato</p>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                        {formatAddress(contract.address)}
                      </code>
                      {contract.explorerUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          asChild
                        >
                          <a
                            href={contract.explorerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Ver en explorador"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Features Toggle */}
                  <div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-between p-0 h-auto text-primary"
                      onClick={() => toggleContract(contract.name)}
                    >
                      <span className="text-sm font-medium">Características</span>
                      {expandedContract === contract.name ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                    
                    {expandedContract === contract.name && (
                      <div className="mt-3 space-y-2">
                        {contract.features.map((feature, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                            <span className="text-sm text-muted-foreground">{feature}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    {contract.docsUrl && (
                      <Button variant="outline" size="sm" className="flex-1" asChild>
                        <a
                          href={contract.docsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Code className="h-4 w-4 mr-2" />
                          Código
                        </a>
                      </Button>
                    )}
                    {contract.explorerUrl && contract.status === 'deployed' && (
                      <Button variant="outline" size="sm" className="flex-1" asChild>
                        <a
                          href={contract.explorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Explorador
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Info */}
        <div className="mt-16 text-center">
          <div className="rounded-lg border border-primary/20 bg-card p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold mb-4">Seguridad y Transparencia</h3>
            <div className="grid md:grid-cols-3 gap-6 text-left">
              <div>
                <h4 className="font-semibold mb-2 text-primary">🔐 Auditorías</h4>
                <p className="text-sm text-muted-foreground">
                  Todos nuestros contratos pasan por auditorías de seguridad第三方 para garantizar la protección de los fondos.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-primary">📊 Código Verificado</h4>
                <p className="text-sm text-muted-foreground">
                  El código fuente de todos los contratos está verificado en el explorador de bloques para máxima transparencia.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-primary">⚡ Optimizado</h4>
                <p className="text-sm text-muted-foreground">
                  Contratos optimizados para reducir costos de gas y mejorar la experiencia del usuario.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}