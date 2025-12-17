"use client";

import {
  ExternalLink,
  Code,
  Shield,
  Users,
  Gift,
  RotateCw,
  TrendingUp,
  Copy,
  Check,
} from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CONTRACT_ADDRESSES, formatAddress } from "@/contracts/addresses";
import { cn } from "@/lib/utils";

interface ContractInfo {
  name: string;
  description: string;
  address: string;
  icon: React.ReactNode;
  status: "deployed" | "pending" | "testnet";
  features: string[];
  explorerUrl?: string;
  docsUrl?: string;
  category: "pools" | "integrations" | "tokens";
}

const contractsInfo: ContractInfo[] = [
  {
    name: "IndividualPool V3",
    description: "Ahorros personales con auto-compound y referidos",
    address: CONTRACT_ADDRESSES.INDIVIDUAL_POOL,
    icon: <TrendingUp className="h-5 w-5" />,
    status: "deployed",
    features: ["Auto-compound", "Referidos", "Depósitos incrementales"],
    explorerUrl: `https://explorer.mezo.org/address/${CONTRACT_ADDRESSES.INDIVIDUAL_POOL}`,
    docsUrl:
      "https://github.com/KhipuVault/contracts/blob/main/src/pools/IndividualPoolV3.sol",
    category: "pools",
  },
  {
    name: "CooperativePool V3",
    description: "Ahorros cooperativos para metas grupales",
    address: CONTRACT_ADDRESSES.COOPERATIVE_POOL,
    icon: <Users className="h-5 w-5" />,
    status: "deployed",
    features: ["Ahorros grupales", "Metas comunes", "Gobernanza"],
    explorerUrl: `https://explorer.mezo.org/address/${CONTRACT_ADDRESSES.COOPERATIVE_POOL}`,
    docsUrl:
      "https://github.com/KhipuVault/contracts/blob/main/src/pools/CooperativePoolV3.sol",
    category: "pools",
  },
  {
    name: "LotteryPool",
    description: "Lotería sin pérdida con premios",
    address: CONTRACT_ADDRESSES.LOTTERY_POOL,
    icon: <Gift className="h-5 w-5" />,
    status: "pending",
    features: ["Lotería sin pérdida", "Premios", "Chainlink VRF"],
    explorerUrl:
      CONTRACT_ADDRESSES.LOTTERY_POOL !==
      "0x0000000000000000000000000000000000000000"
        ? `https://explorer.mezo.org/address/${CONTRACT_ADDRESSES.LOTTERY_POOL}`
        : undefined,
    docsUrl:
      "https://github.com/KhipuVault/contracts/blob/main/src/pools/LotteryPool.sol",
    category: "pools",
  },
  {
    name: "RotatingPool",
    description: "Sistema ROSCA/Pasanaku",
    address: CONTRACT_ADDRESSES.ROTATING_POOL,
    icon: <RotateCw className="h-5 w-5" />,
    status: "pending",
    features: ["Turnos rotativos", "Metas corto plazo"],
    explorerUrl:
      CONTRACT_ADDRESSES.ROTATING_POOL !==
      "0x0000000000000000000000000000000000000000"
        ? `https://explorer.mezo.org/address/${CONTRACT_ADDRESSES.ROTATING_POOL}`
        : undefined,
    docsUrl:
      "https://github.com/KhipuVault/contracts/blob/main/src/pools/RotatingPool.sol",
    category: "pools",
  },
  {
    name: "MezoIntegration V3",
    description: "Puente BTC-MUSD con seguridad",
    address: CONTRACT_ADDRESSES.MEZO_INTEGRATION,
    icon: <Shield className="h-5 w-5" />,
    status: "deployed",
    features: ["Puente BTC-MUSD", "Seguridad", "Optimización"],
    explorerUrl: `https://explorer.mezo.org/address/${CONTRACT_ADDRESSES.MEZO_INTEGRATION}`,
    docsUrl:
      "https://github.com/KhipuVault/contracts/blob/main/src/integrations/MezoIntegrationV3.sol",
    category: "integrations",
  },
  {
    name: "YieldAggregator V3",
    description: "Distribución inteligente de rendimientos",
    address: CONTRACT_ADDRESSES.YIELD_AGGREGATOR,
    icon: <Code className="h-5 w-5" />,
    status: "deployed",
    features: ["Diversificación", "Rebalanceo", "Múltiples estrategias"],
    explorerUrl: `https://explorer.mezo.org/address/${CONTRACT_ADDRESSES.YIELD_AGGREGATOR}`,
    docsUrl:
      "https://github.com/KhipuVault/contracts/blob/main/src/integrations/YieldAggregatorV3.sol",
    category: "integrations",
  },
];

function getStatusBadge(status: ContractInfo["status"]) {
  switch (status) {
    case "deployed":
      return (
        <Badge variant="default" className="bg-green-500 text-xs">
          Activo
        </Badge>
      );
    case "pending":
      return (
        <Badge variant="secondary" className="text-xs">
          Pendiente
        </Badge>
      );
    case "testnet":
      return (
        <Badge variant="outline" className="text-xs">
          Testnet
        </Badge>
      );
  }
}

function CopyAddress({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy address:", err);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-6 w-6 p-0"
      onClick={copyToClipboard}
      title={copied ? "¡Copiado!" : "Copiar dirección"}
    >
      {copied ? (
        <Check className="h-3 w-3 text-green-500" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
    </Button>
  );
}

export function ContractsInfo() {
  const poolsContracts = contractsInfo.filter((c) => c.category === "pools");
  const integrationsContracts = contractsInfo.filter(
    (c) => c.category === "integrations",
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white mb-2">
          Contratos Inteligentes
        </h2>
        <p className="text-muted-foreground">
          Explora la infraestructura que impulsa KhipuVault
        </p>
      </div>

      <Tabs defaultValue="pools" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pools">Pools de Ahorro</TabsTrigger>
          <TabsTrigger value="integrations">Integraciones</TabsTrigger>
        </TabsList>

        <TabsContent value="pools" className="space-y-4">
          <div className="grid gap-4">
            {poolsContracts.map((contract) => (
              <Card key={contract.name} className="border-primary/20">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        {contract.icon}
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {contract.name}
                        </CardTitle>
                        <CardDescription>
                          {contract.description}
                        </CardDescription>
                      </div>
                    </div>
                    {getStatusBadge(contract.status)}
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {/* Address */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Dirección
                      </p>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                          {formatAddress(contract.address)}
                        </code>
                        <CopyAddress address={contract.address} />
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

                    {/* Features */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">
                        Características
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {contract.features.map((feature, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs"
                          >
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      {contract.docsUrl && (
                        <a
                          href={contract.docsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            buttonVariants({ variant: "outline", size: "sm" }),
                            "flex-1",
                          )}
                        >
                          <Code className="h-4 w-4 mr-2" />
                          Código
                        </a>
                      )}
                      {contract.explorerUrl &&
                        contract.status === "deployed" && (
                          <a
                            href={contract.explorerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn(
                              buttonVariants({
                                variant: "outline",
                                size: "sm",
                              }),
                              "flex-1",
                            )}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Explorador
                          </a>
                        )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <div className="grid gap-4">
            {integrationsContracts.map((contract) => (
              <Card key={contract.name} className="border-primary/20">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        {contract.icon}
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {contract.name}
                        </CardTitle>
                        <CardDescription>
                          {contract.description}
                        </CardDescription>
                      </div>
                    </div>
                    {getStatusBadge(contract.status)}
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {/* Address */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Dirección
                      </p>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                          {formatAddress(contract.address)}
                        </code>
                        <CopyAddress address={contract.address} />
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

                    {/* Features */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">
                        Características
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {contract.features.map((feature, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs"
                          >
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      {contract.docsUrl && (
                        <a
                          href={contract.docsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            buttonVariants({ variant: "outline", size: "sm" }),
                            "flex-1",
                          )}
                        >
                          <Code className="h-4 w-4 mr-2" />
                          Código
                        </a>
                      )}
                      {contract.explorerUrl &&
                        contract.status === "deployed" && (
                          <a
                            href={contract.explorerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn(
                              buttonVariants({
                                variant: "outline",
                                size: "sm",
                              }),
                              "flex-1",
                            )}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Explorador
                          </a>
                        )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Security Info */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Seguridad y Transparencia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-1 text-primary">🔐 Auditorías</h4>
              <p className="text-muted-foreground">
                Contratos auditados por terceros para máxima seguridad
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-1 text-primary">📊 Verificado</h4>
              <p className="text-muted-foreground">
                Código fuente verificado en el explorador de bloques
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-1 text-primary">⚡ Optimizado</h4>
              <p className="text-muted-foreground">
                Diseñado para reducir costos y mejorar experiencia
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
