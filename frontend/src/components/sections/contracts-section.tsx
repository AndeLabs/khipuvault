'use client'

import { useState } from 'react'
import { ExternalLink, ChevronDown, ChevronUp, Code, Shield, Users, Gift, RotateCw, TrendingUp, Zap } from 'lucide-react'
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
    name: 'Individual Pool',
    description: 'Ahorro personal de BTC con auto-reinversión de yields y sistema de referidos. Depósitos MUSD con rendimientos automáticos. Retiros flexibles sin restricciones.',
    address: CONTRACT_ADDRESSES.INDIVIDUAL_POOL,
    icon: <TrendingUp className="h-6 w-6" />,
    status: 'deployed',
    features: ['Auto-reinversión de yields', '0.5% por cada referido', 'Retiros sin penalización', 'Optimizado en gas'],
    explorerUrl: `https://explorer.test.mezo.org/address/${CONTRACT_ADDRESSES.INDIVIDUAL_POOL}`,
    docsUrl: 'https://github.com/AndeLabs/khipuvault/blob/main/contracts/src/pools/IndividualPoolV3.sol'
  },
  {
    name: 'Cooperative Pool',
    description: 'Pools cooperativos donde múltiples usuarios juntan BTC nativo para alcanzar metas comunes. Distribución justa de yields basada en participación.',
    address: CONTRACT_ADDRESSES.COOPERATIVE_POOL,
    icon: <Users className="h-6 w-6" />,
    status: 'deployed',
    features: ['BTC nativo', 'Distribución por shares', 'Gobernanza simple', 'Seguridad multinivel'],
    explorerUrl: `https://explorer.test.mezo.org/address/${CONTRACT_ADDRESSES.COOPERATIVE_POOL}`,
    docsUrl: 'https://github.com/AndeLabs/khipuvault/blob/main/contracts/src/pools/CooperativePoolV3.sol'
  },
  {
    name: 'Mezo Integration',
    description: 'Puente entre Bitcoin nativo y MUSD. Gestiona depósitos BTC, acuñación de MUSD y retiro de fondos. Integración segura con Mezo.',
    address: CONTRACT_ADDRESSES.MEZO_INTEGRATION,
    icon: <Shield className="h-6 w-6" />,
    status: 'deployed',
    features: ['BTC → MUSD conversión', 'Flash loan protection', 'Reentrancy guard', 'Upgradeable'],
    explorerUrl: `https://explorer.test.mezo.org/address/${CONTRACT_ADDRESSES.MEZO_INTEGRATION}`,
    docsUrl: 'https://github.com/AndeLabs/khipuvault/blob/main/contracts/src/integrations/MezoIntegrationV3.sol'
  },
  {
    name: 'Yield Aggregator',
    description: 'Distribuye fondos entre múltiples estrategias de yield. Rebalanceo inteligente y reclamación de rendimientos. Maximiza APR para todos.',
    address: CONTRACT_ADDRESSES.YIELD_AGGREGATOR,
    icon: <Zap className="h-6 w-6" />,
    status: 'deployed',
    features: ['Multi-estrategia', 'Rebalanceo automático', 'Claim flexible', 'APR optimizado'],
    explorerUrl: `https://explorer.test.mezo.org/address/${CONTRACT_ADDRESSES.YIELD_AGGREGATOR}`,
    docsUrl: 'https://github.com/AndeLabs/khipuvault/blob/main/contracts/src/integrations/YieldAggregatorV3.sol'
  },
  {
    name: 'Stability Pool Strategy',
    description: 'Estrategia de inversión en Stability Pool de Mezo. Genera yields mediante lending de MUSD. Componente central de rendimientos.',
    address: CONTRACT_ADDRESSES.STABILITY_POOL_STRATEGY,
    icon: <TrendingUp className="h-6 w-6" />,
    status: 'deployed',
    features: ['6% APR target', 'Mezo integration', 'Retiros seguros', 'Transparencia total'],
    explorerUrl: `https://explorer.test.mezo.org/address/${CONTRACT_ADDRESSES.STABILITY_POOL_STRATEGY}`,
    docsUrl: 'https://github.com/AndeLabs/khipuvault/blob/main/contracts/src/strategies/StabilityPoolStrategy.sol'
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
            Infraestructura auditada y optimizada. Ahorros en Bitcoin con yields del 5-8% APR 
            a través de Mezo Integration.
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
                  Todos nuestros contratos están auditados para garantizar la máxima protección de los fondos de nuestros usuarios.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-primary">📊 Código Verificado</h4>
                <p className="text-sm text-muted-foreground">
                  El código fuente está verificado en el explorador de bloques para máxima transparencia y auditoría pública.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-primary">⚡ Optimizado</h4>
                <p className="text-sm text-muted-foreground">
                  Contratos optimizados para reducir costos de gas y mejorar la experiencia del usuario final.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}