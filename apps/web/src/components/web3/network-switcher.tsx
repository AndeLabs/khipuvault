"use client";

import { useEffect, useState, useCallback } from "react";
import { useAccount, useSwitchChain, useWalletClient } from "wagmi";
import { mezoTestnet } from "@/lib/web3/chains";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * NetworkSwitcher Component
 *
 * Shows a prominent warning banner when user is on wrong network
 * Provides easy one-click switch to Mezo Testnet
 * Automatically attempts to add network if not configured
 */
export function NetworkSwitcher() {
  const { chain, isConnected } = useAccount();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const { data: walletClient } = useWalletClient();
  const { toast } = useToast();
  const [isDismissed, setIsDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset dismiss state when network changes to correct one
  useEffect(() => {
    if (chain?.id === mezoTestnet.id) {
      setIsDismissed(false);
    }
  }, [chain?.id]);

  // Reset when disconnected
  useEffect(() => {
    if (!isConnected) {
      setIsDismissed(false);
    }
  }, [isConnected]);

  const handleSwitchNetwork = useCallback(async () => {
    if (!switchChain) return;

    switchChain(
      { chainId: mezoTestnet.id },
      {
        onError: async (error) => {
          console.log("Switch failed, trying to add network:", error);

          // If switch fails, try to add the network
          try {
            if (walletClient) {
              await walletClient.request({
                method: "wallet_addEthereumChain",
                params: [
                  {
                    chainId: `0x${mezoTestnet.id.toString(16)}`,
                    chainName: mezoTestnet.name,
                    nativeCurrency: {
                      name: mezoTestnet.nativeCurrency.name,
                      symbol: mezoTestnet.nativeCurrency.symbol,
                      decimals: mezoTestnet.nativeCurrency.decimals,
                    },
                    rpcUrls: mezoTestnet.rpcUrls.default.http,
                    blockExplorerUrls: [mezoTestnet.blockExplorers.default.url],
                  },
                ],
              });

              toast({
                title: "Network Added",
                description:
                  "Mezo Testnet added to your wallet. Please try switching again.",
              });
            }
          } catch (addError) {
            console.error("Failed to add network:", addError);

            toast({
              title: "Action Required",
              description:
                "Please add Mezo Testnet manually to your wallet (Chain ID: 31611)",
              variant: "destructive",
            });
          }
        },
        onSuccess: () => {
          toast({
            title: "Network Switched",
            description: "Connected to Mezo Testnet",
          });
        },
      },
    );
  }, [switchChain, walletClient, toast]);

  // Don't render during SSR or before mount
  if (!mounted) {
    return null;
  }

  // Only show when connected and on wrong network
  if (!isConnected || !chain) {
    return null;
  }

  const isCorrectNetwork = chain.id === mezoTestnet.id;

  if (isCorrectNetwork || isDismissed) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-50",
        "bg-warning/95 backdrop-blur-sm",
        "border-b border-warning-foreground/20",
        "px-4 py-3",
        "animate-in slide-in-from-top duration-300",
      )}
      role="alert"
      aria-live="assertive"
    >
      <div className="container mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-warning-foreground shrink-0" />
          <div className="text-sm font-medium text-warning-foreground">
            <span className="hidden sm:inline">
              You're connected to <strong>{chain.name}</strong>. KhipuVault only
              works on <strong>Mezo Testnet</strong>.
            </span>
            <span className="sm:hidden">
              Wrong network. Switch to Mezo Testnet.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleSwitchNetwork}
            disabled={isSwitching}
            className="bg-warning-foreground/10 hover:bg-warning-foreground/20 text-warning-foreground border-warning-foreground/30"
          >
            {isSwitching ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Switching...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Switch to Mezo
              </>
            )}
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsDismissed(true)}
            className="text-warning-foreground hover:bg-warning-foreground/10 p-2"
            aria-label="Close network warning"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook to check if user is on the correct network
 * @returns Object with isWrongNetwork boolean and current chain info
 */
export function useNetworkStatus() {
  const { chain, isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return {
      isWrongNetwork: false,
      isConnected: false,
      currentChain: null,
      expectedChain: mezoTestnet,
    };
  }

  return {
    isWrongNetwork: isConnected && chain?.id !== mezoTestnet.id,
    isConnected,
    currentChain: chain,
    expectedChain: mezoTestnet,
  };
}
