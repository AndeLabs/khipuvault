"use client";

import { ExternalLink, Shield, Code2, FileCode, Clock } from "lucide-react";

import { getAddressOrUndefined, type ContractName } from "@khipu/shared";

import { AnimateOnScroll } from "@/components/animate-on-scroll";
import { Button } from "@/components/ui/button";
import { getExplorerUrl, SOCIAL_URLS } from "@/lib/config/urls";

const EXPLORER_BASE_URL = `${getExplorerUrl()}/address`;

interface ContractInfo {
  name: string;
  description: string;
  contractKey: ContractName;
  icon: typeof Shield;
}

const contractDefinitions: ContractInfo[] = [
  {
    name: "Individual Pool",
    description: "Personal savings vault with automated yield generation",
    contractKey: "INDIVIDUAL_POOL",
    icon: Shield,
  },
  {
    name: "Cooperative Pool",
    description: "Community pools for collective Bitcoin savings",
    contractKey: "COOPERATIVE_POOL",
    icon: Code2,
  },
  {
    name: "Rotating Pool (ROSCA)",
    description: "Turn-based savings circles with Native BTC & WBTC support",
    contractKey: "ROTATING_POOL",
    icon: Code2,
  },
  {
    name: "Prize Pool (Lottery)",
    description: "No-loss lottery with 99% gas optimization and secure randomness",
    contractKey: "LOTTERY_POOL",
    icon: Code2,
  },
  {
    name: "Yield Aggregator",
    description: "Optimizes yield across multiple strategies",
    contractKey: "YIELD_AGGREGATOR",
    icon: FileCode,
  },
  {
    name: "mUSD Token",
    description: "Mezo USD stablecoin used for deposits",
    contractKey: "MUSD",
    icon: Shield,
  },
];

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function Contracts() {
  // Get contracts with valid addresses (filters out unconfigured ones)
  const contracts = contractDefinitions
    .map((def) => ({
      ...def,
      address: getAddressOrUndefined(def.contractKey),
    }))
    .filter((c) => c.address !== undefined);

  const hasContracts = contracts.length > 0;

  return (
    <section id="contracts" className="bg-surface-elevated/50 py-20">
      <div className="container mx-auto max-w-7xl px-4">
        <AnimateOnScroll className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2">
            <FileCode className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Open Source</span>
          </div>
          <h2 className="text-3xl font-bold text-white md:text-4xl">Smart Contracts</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            {hasContracts
              ? "All our contracts are deployed on Mezo Testnet and open for verification. Transparency and security are our priorities."
              : "Our contracts are currently deployed on Mezo Testnet. Mainnet deployment coming soon."}
          </p>
        </AnimateOnScroll>

        {hasContracts ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {contracts.map((contract, index) => (
              <AnimateOnScroll key={contract.address} delay={`${index * 100}ms`}>
                <div className="group relative rounded-xl border border-border bg-surface p-6 transition-all duration-300 hover:border-primary/30">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <contract.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-white transition-colors group-hover:text-primary">
                        {contract.name}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">{contract.description}</p>
                      <div className="mt-3 flex items-center gap-2">
                        <code className="rounded bg-surface-elevated px-2 py-1 font-mono text-xs text-muted-foreground">
                          {truncateAddress(contract.address!)}
                        </code>
                        <a
                          href={`${EXPLORER_BASE_URL}/${contract.address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary transition-colors hover:text-accent"
                          title="View on Explorer"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        ) : (
          <AnimateOnScroll className="mx-auto max-w-md">
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-8 text-center">
              <Clock className="mx-auto mb-4 h-12 w-12 text-primary" />
              <h3 className="mb-2 text-xl font-semibold text-white">Coming Soon to Mainnet</h3>
              <p className="text-muted-foreground">
                Our smart contracts are live on testnet. Try them now at{" "}
                <a
                  href="https://testnet.khipuvault.com"
                  className="text-primary hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  testnet.khipuvault.com
                </a>
              </p>
            </div>
          </AnimateOnScroll>
        )}

        <AnimateOnScroll delay="500ms" className="mt-10 text-center">
          {hasContracts && (
            <p className="mb-4 text-sm text-muted-foreground">
              Network: Mezo Testnet (Chain ID: 31611)
            </p>
          )}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a href={SOCIAL_URLS.GITHUB} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="gap-2">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                  />
                </svg>
                View Source Code
              </Button>
            </a>
            <a href={getExplorerUrl()} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="gap-2">
                <ExternalLink className="h-4 w-4" />
                Mezo Explorer
              </Button>
            </a>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
