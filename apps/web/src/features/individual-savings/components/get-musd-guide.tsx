"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Coins,
  ExternalLink,
  ChevronDown,
  Wallet,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const MEZO_FAUCET_URL = "https://faucet.mezo.org";

interface GetMusdGuideProps {
  walletBalance?: string;
  className?: string;
}

export function GetMusdGuide({
  walletBalance = "0",
  className,
}: GetMusdGuideProps) {
  const [isOpen, setIsOpen] = React.useState(true);
  const hasBalance = Number(walletBalance) > 0;

  // Don't show if user already has balance
  if (hasBalance) return null;

  return (
    <Card
      variant="surface"
      className={cn("border-accent/30 bg-accent/5", className)}
    >
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-accent/10 transition-colors rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center">
                  <Coins className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <CardTitle className="text-base">
                    Need testnet mUSD tokens?
                  </CardTitle>
                  <CardDescription>
                    Follow these steps to get started
                  </CardDescription>
                </div>
              </div>
              <ChevronDown
                className={cn(
                  "h-5 w-5 text-muted-foreground transition-transform",
                  isOpen && "rotate-180",
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
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-lavanda/20 flex items-center justify-center text-sm font-semibold text-lavanda">
                  1
                </div>
                <div className="flex-1">
                  <div className="font-medium mb-1">
                    Visit the Mezo Testnet Faucet
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Get free testnet BTC and mUSD tokens to start testing.
                  </p>
                  <a
                    href={MEZO_FAUCET_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
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
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-lavanda/20 flex items-center justify-center text-sm font-semibold text-lavanda">
                  2
                </div>
                <div className="flex-1">
                  <div className="font-medium mb-1">Connect your wallet</div>
                  <p className="text-sm text-muted-foreground">
                    Make sure you're on Mezo Testnet (Chain ID: 31611) and
                    request tokens.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-lavanda/20 flex items-center justify-center text-sm font-semibold text-lavanda">
                  3
                </div>
                <div className="flex-1">
                  <div className="font-medium mb-1">Come back and deposit</div>
                  <p className="text-sm text-muted-foreground">
                    Once you have mUSD, enter an amount above and start earning
                    yields!
                  </p>
                </div>
              </div>

              {/* Info box */}
              <div className="p-3 rounded-lg bg-muted/50 border border-border mt-4">
                <p className="text-xs text-muted-foreground">
                  <strong>Note:</strong> This is a testnet application. The mUSD
                  tokens have no real value and are for testing purposes only.
                  Never send real funds to testnet addresses.
                </p>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
