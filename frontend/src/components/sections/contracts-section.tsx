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
    name: 'IndividualPool V3',
    description: 'Ahorro personal de BTC con auto-reinversión de yields y sistema de referidos. Depósitos MUSD con rendimientos automáticos optimizados. Retiros flexibles sin restricciones.',
    address: CONTRACT_ADDRESSES.INDIVIDUAL_POOL,
    icon: <TrendingUp className="h-6 w-6" />,
    status: 'deployed',
    features: ['Auto-reinversión de yields', '0.5% por cada referido', 'Retiros sin penalización', '40k gas ahorrado'],
    explorerUrl: `https://explorer.test.mezo.org/address/${CONTRACT_ADDRESSES.INDIVIDUAL_POOL}`,
    docsUrl: 'https://github.com/AndeLabs/khipuvault/blob/main/contracts/src/pools/IndividualPoolV3.sol'
  },
  {
    name: 'CooperativePool V3',
    description: 'Pools cooperativos donde múltiples usuarios juntan BTC nativo para alcanzar metas comunes. Distribución justa de yields basada en participación. Entrada y salida flexible.',
    address: CONTRACT_ADDRESSES.COOPERATIVE_POOL,
    icon: <Users className="h-6 w-6" />,
    status: 'deployed',
    features: ['BTC nativo (payable)', 'Distribución por shares', 'Gobernanza simple', '60k gas optimizado'],
    explorerUrl: `https://explorer.test.mezo.org/address/${CONTRACT_ADDRESSES.COOPERATIVE_POOL}`,
    docsUrl: 'https://github.com/AndeLabs/khipuvault/blob/main/contracts/src/pools/CooperativePoolV3.sol'
  },
  {
    name: 'MezoIntegration V3',
    description: 'Puente entre Bitcoin nativo y MUSD. Gestiona depósitos BTC, acuñación de MUSD y retiro de fondos. Integración segura con Mezo Borrower Operations.',
    address: CONTRACT_ADDRESSES.MEZO_INTEGRATION,
    icon: <Shield className="h-6 w-6" />,
    status: 'deployed',
    features: ['BTC → MUSD conversión', 'UUPS upgradeable', 'Flash loan protection', 'Reentrancy guard'],
    explorerUrl: `https://explorer.test.mezo.org/address/${CONTRACT_ADDRESSES.MEZO_INTEGRATION}`,
    docsUrl: 'https://github.com/AndeLabs/khipuvault/blob/main/contracts/src/integrations/MezoIntegrationV3.sol'
  },
  {
    name: 'YieldAggregator V3',
    description: 'Distribuye MUSD entre múltiples estrategias de yield. Rebalanceo inteligente y reclamación de yields. Maximiza APR para todos los usuarios.',
    address: CONTRACT_ADDRESSES.YIELD_AGGREGATOR,
    icon: <Zap className="h-6 w-6" />,
    status: 'deployed',
    features: ['Multi-vault strategy', 'Rebalanceo automático', 'Claim sin withdraw', 'APR 6% promedio'],
    explorerUrl: `https://explorer.test.mezo.org/address/${CONTRACT_ADDRESSES.YIELD_AGGREGATOR}`,
    docsUrl: 'https://github.com/AndeLabs/khipuvault/blob/main/contracts/src/integrations/YieldAggregatorV3.sol'
  },
  {
    name: 'StabilityPoolStrategy',
    description: 'Estrategia de inversión en Stability Pool de Mezo. Genera yields del 6% APR mediante lending de MUSD. Parte central de la generación de rendimientos.',
    address: CONTRACT_ADDRESSES.STABILITY_POOL_STRATEGY,
    icon: <TrendingUp className="h-6 w-6" />,
    status: 'deployed',
    features: ['6% APR target', 'Mezo integration', 'Safe withdrawals', '1% performance fee'],
    explorerUrl: `https://explorer.test.mezo.org/address/${CONTRACT_ADDRESSES.STABILITY_POOL_STRATEGY}`,
    docsUrl: 'https://github.com/AndeLabs/khipuvault/blob/main/contracts/src/strategies/StabilityPoolStrategy.sol'
  },
  {
    name: 'LotteryPool',
    description: 'Pool de ahorros con lotería sin pérdida. Los usuarios pueden ganar premios semanales mientras sus fondos generan rendimientos constantes.',
    address: CONTRACT_ADDRESSES.LOTTERY_POOL,
    icon: <Gift className="h-6 w-6" />,
    status: 'pending',
    features: ['Lotería sin pérdida', 'Premios semanales', 'Fondos siempre seguros', 'Chainlink VRF'],
    explorerUrl: CONTRACT_ADDRESSES.LOTTERY_POOL !== '0x0000000000000000000000000000000000000000' 
      ? `https://explorer.test.mezo.org/address/${CONTRACT_ADDRESSES.LOTTERY_POOL}` 
      : undefined,
    docsUrl: 'https://github.com/AndeLabs/khipuvault/blob/main/contracts/src/pools/LotteryPool.sol'
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
            Infraestructura V3 Production-Ready
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            5 contratos inteligentes auditados y optimizados. Ahorros individuales y cooperativos en Bitcoin nativo 
            con yields del 5-8% APR a través de Mezo Integration y Stability Pool Strategy.
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
            <h3 className="text-2xl font-bold mb-4">Tecnología V3 - Optimizada para Producción</h3>
            <div className="grid md:grid-cols-3 gap-6 text-left">
              <div>
                <h4 className="font-semibold mb-2 text-primary">🔐 Seguridad Multinivel</h4>
                <p className="text-sm text-muted-foreground">
                  UUPS upgradeable, reentrancy guards, flash loan protection y pausable en emergencias. Protección máxima de fondos.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-primary">⚡ 60k Gas Optimizado</h4>
                <p className="text-sm text-muted-foreground">
                  Storage packing, función call optimizada. Máxima eficiencia en costos de transacción para usuarios finales.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-primary">📊 Yields Reales 5-8% APR</h4>
                <p className="text-sm text-muted-foreground">
                  Integración con Mezo Stability Pool. Yields generados por lending real de BTC, no inflacionarios.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}