"use client";

import { Coins, ExternalLink, ChevronDown } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

const MEZO_FAUCET_URL = "https://faucet.mezo.org";

interface GetMusdGuideProps {
  walletBalance?: string;
  className?: string;
}

export function GetMusdGuide({ walletBalance = "0", className }: GetMusdGuideProps) {
  const [isOpen, setIsOpen] = React.useState(true);
  const hasBalance = Number(walletBalance) > 0;

  // Don't show if user already has balance
  if (hasBalance) {
    return null;
  }

  return (
    <Card variant="surface" className={cn("border-accent/30 bg-accent/5", className)}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer rounded-t-lg transition-colors hover:bg-accent/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/20">
                  <Coins className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <CardTitle className="text-base">Need testnet mUSD tokens?</CardTitle>
                  <CardDescription>Follow these steps to get started</CardDescription>
                </div>
              </div>
              <ChevronDown
                className={cn(
                  "h-5 w-5 text-muted-foreground transition-transform",
                  isOpen && "rotate-180"
                )}
              />
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="space-y-4">
              {/* Step 1 */}
              <div className="flex gap-4">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-lavanda/20 text-sm font-semibold text-lavanda">
                  1
                </div>
                <div className="flex-1">
                  <div className="mb-1 font-medium">Visit the Mezo Testnet Faucet</div>
                  <p className="mb-2 text-sm text-muted-foreground">
                    Get free testnet BTC and mUSD tokens to start testing.
                  </p>
                  <a href={MEZO_FAUCET_URL} target="_blank" rel="noopener noreferrer">
                    <Button variant="secondary" size="sm" className="gap-2">
                      <Coins className="h-4 w-4" />
                      Open Mezo Faucet
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </a>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-lavanda/20 text-sm font-semibold text-lavanda">
                  2
                </div>
                <div className="flex-1">
                  <div className="mb-1 font-medium">Connect your wallet</div>
                  <p className="text-sm text-muted-foreground">
                    Make sure you're on Mezo Testnet (Chain ID: 31611) and request tokens.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-lavanda/20 text-sm font-semibold text-lavanda">
                  3
                </div>
                <div className="flex-1">
                  <div className="mb-1 font-medium">Come back and deposit</div>
                  <p className="text-sm text-muted-foreground">
                    Once you have mUSD, enter an amount above and start earning yields!
                  </p>
                </div>
              </div>

              {/* Info box */}
              <div className="mt-4 rounded-lg border border-border bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">
                  <strong>Note:</strong> This is a testnet application. The mUSD tokens have no real
                  value and are for testing purposes only. Never send real funds to testnet
                  addresses.
                </p>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
