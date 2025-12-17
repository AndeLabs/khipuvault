"use client";

import {
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Code,
  Shield,
  Users,
  TrendingUp,
  Zap,
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
}

const contractsInfo: ContractInfo[] = [
  {
    name: "Individual Pool",
    description:
      "Personal BTC savings with auto-compounding yields and referral system. mUSD deposits with automatic returns. Flexible withdrawals without restrictions.",
    address: CONTRACT_ADDRESSES.INDIVIDUAL_POOL,
    icon: <TrendingUp className="h-6 w-6" />,
    status: "deployed",
    features: [
      "Auto-compounding yields",
      "0.5% per referral",
      "No withdrawal penalties",
      "Gas optimized",
    ],
    explorerUrl: `https://explorer.test.mezo.org/address/${CONTRACT_ADDRESSES.INDIVIDUAL_POOL}`,
    docsUrl:
      "https://github.com/AndeLabs/khipuvault/blob/main/contracts/src/pools/IndividualPoolV3.sol",
  },
  {
    name: "Cooperative Pool",
    description:
      "Cooperative pools where multiple users pool native BTC to achieve common goals. Fair yield distribution based on participation.",
    address: CONTRACT_ADDRESSES.COOPERATIVE_POOL,
    icon: <Users className="h-6 w-6" />,
    status: "deployed",
    features: [
      "Native BTC",
      "Share-based distribution",
      "Simple governance",
      "Multi-level security",
    ],
    explorerUrl: `https://explorer.test.mezo.org/address/${CONTRACT_ADDRESSES.COOPERATIVE_POOL}`,
    docsUrl:
      "https://github.com/AndeLabs/khipuvault/blob/main/contracts/src/pools/CooperativePoolV3.sol",
  },
  {
    name: "Mezo Integration",
    description:
      "Bridge between native Bitcoin and mUSD. Manages BTC deposits, mUSD minting, and fund withdrawals. Secure integration with Mezo.",
    address: CONTRACT_ADDRESSES.MEZO_INTEGRATION,
    icon: <Shield className="h-6 w-6" />,
    status: "deployed",
    features: [
      "BTC → mUSD conversion",
      "Flash loan protection",
      "Reentrancy guard",
      "Upgradeable",
    ],
    explorerUrl: `https://explorer.test.mezo.org/address/${CONTRACT_ADDRESSES.MEZO_INTEGRATION}`,
    docsUrl:
      "https://github.com/AndeLabs/khipuvault/blob/main/contracts/src/integrations/MezoIntegrationV3.sol",
  },
  {
    name: "Yield Aggregator",
    description:
      "Distributes funds across multiple yield strategies. Smart rebalancing and yield claiming. Maximizes APR for everyone.",
    address: CONTRACT_ADDRESSES.YIELD_AGGREGATOR,
    icon: <Zap className="h-6 w-6" />,
    status: "deployed",
    features: [
      "Multi-strategy",
      "Auto rebalancing",
      "Flexible claiming",
      "Optimized APR",
    ],
    explorerUrl: `https://explorer.test.mezo.org/address/${CONTRACT_ADDRESSES.YIELD_AGGREGATOR}`,
    docsUrl:
      "https://github.com/AndeLabs/khipuvault/blob/main/contracts/src/integrations/YieldAggregatorV3.sol",
  },
  {
    name: "Stability Pool Strategy",
    description:
      "Investment strategy in Mezo's Stability Pool. Generates yields through mUSD lending. Core component for returns.",
    address: CONTRACT_ADDRESSES.STABILITY_POOL_STRATEGY,
    icon: <TrendingUp className="h-6 w-6" />,
    status: "deployed",
    features: [
      "6% APR target",
      "Mezo integration",
      "Safe withdrawals",
      "Full transparency",
    ],
    explorerUrl: `https://explorer.test.mezo.org/address/${CONTRACT_ADDRESSES.STABILITY_POOL_STRATEGY}`,
    docsUrl:
      "https://github.com/AndeLabs/khipuvault/blob/main/contracts/src/strategies/StabilityPoolStrategy.sol",
  },
];

function getStatusBadge(status: ContractInfo["status"]) {
  switch (status) {
    case "deployed":
      return (
        <Badge variant="default" className="bg-green-500">
          Deployed
        </Badge>
      );
    case "pending":
      return <Badge variant="secondary">Pending</Badge>;
    case "testnet":
      return <Badge variant="outline">Testnet</Badge>;
  }
}

export function ContractsSection() {
  const [expandedContract, setExpandedContract] = useState<string | null>(null);

  const toggleContract = (contractName: string) => {
    setExpandedContract(
      expandedContract === contractName ? null : contractName,
    );
  };

  return (
    <section id="contracts" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold tracking-tight mb-4">
            Our Smart Contracts
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Audited and optimized infrastructure. Bitcoin savings with 5-8% APR
            yields through Mezo Integration.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {contractsInfo.map((contract) => (
            <Card
              key={contract.name}
              className="relative overflow-hidden border-primary/20 hover:border-primary/40 transition-all duration-300"
            >
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
                    <p className="text-xs text-muted-foreground mb-1">
                      Contract Address
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                        {formatAddress(contract.address)}
                      </code>
                      {contract.explorerUrl && (
                        <a
                          href={contract.explorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="View in explorer"
                          className={cn(
                            buttonVariants({ variant: "ghost", size: "sm" }),
                            "h-6 w-6 p-0",
                          )}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
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
                      <span className="text-sm font-medium">Features</span>
                      {expandedContract === contract.name ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>

                    {expandedContract === contract.name && (
                      <div className="mt-3 space-y-2">
                        {contract.features.map((feature) => (
                          <div
                            key={feature}
                            className="flex items-center gap-2"
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                            <span className="text-sm text-muted-foreground">
                              {feature}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
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
                        Code
                      </a>
                    )}
                    {contract.explorerUrl && contract.status === "deployed" && (
                      <a
                        href={contract.explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          buttonVariants({ variant: "outline", size: "sm" }),
                          "flex-1",
                        )}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Explorer
                      </a>
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
            <h3 className="text-2xl font-bold mb-4">Security & Transparency</h3>
            <div className="grid md:grid-cols-3 gap-6 text-left">
              <div>
                <h4 className="font-semibold mb-2 text-primary">Audited</h4>
                <p className="text-sm text-muted-foreground">
                  All our contracts are audited to ensure maximum protection of
                  our users&apos; funds.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-primary">
                  Verified Code
                </h4>
                <p className="text-sm text-muted-foreground">
                  Source code is verified on the block explorer for maximum
                  transparency and public audit.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-primary">Optimized</h4>
                <p className="text-sm text-muted-foreground">
                  Contracts optimized to reduce gas costs and improve the end
                  user experience.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
