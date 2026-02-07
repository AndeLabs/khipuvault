"use client";

export const dynamic = "force-dynamic";

import { RefreshCw, Unplug, Eye, Copy, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useAccount, useBalance, useDisconnect } from "wagmi";

import { PageHeader } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function WalletsPage() {
  const { address, connector, isConnected } = useAccount();
  const { data: balance, refetch } = useBalance({ address });
  const { disconnect } = useDisconnect();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (address) {
      void navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDisconnect = () => {
    disconnect();
  };

  const handleRefresh = () => {
    void refetch();
  };

  const explorerUrl = `https://explorer.test.mezo.org/address/${address}`;

  if (!isConnected || !address) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Wallets"
          description="No wallet connected. Please connect your wallet to continue."
        />
        <Card className="shadow-custom border-primary/20 bg-card">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Connect your wallet using the button in the navigation bar.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Wallets" description="Manage your connected wallet" />

      <Card className="shadow-custom border-primary/20 bg-card">
        <CardHeader>
          <CardTitle>Connected Wallet</CardTitle>
          <CardDescription>Your currently connected wallet to KhipuVault.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Card className="border-primary/50 bg-background">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3 text-lg">
                  {connector?.icon && (
                    <img src={connector.icon} alt={connector.name} className="h-6 w-6" />
                  )}
                  {connector?.name ?? "Wallet"}
                </CardTitle>
                <Badge variant="default" className="bg-primary/80">
                  ⭐ CONNECTED
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex-1 overflow-hidden text-ellipsis rounded bg-card p-2 font-code text-sm text-muted-foreground">
                  {address}
                </div>
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  {copied ? (
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Balance:</span>
                <span className="font-code font-bold">
                  {balance
                    ? `${parseFloat(balance.formatted).toFixed(6)} ${balance.symbol}`
                    : "Loading..."}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={handleRefresh}>
                  <RefreshCw className="mr-2 h-4 w-4" /> Refresh
                </Button>
                <Button variant="outline" size="sm" onClick={handleDisconnect}>
                  <Unplug className="mr-2 h-4 w-4" /> Disconnect
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href={explorerUrl} target="_blank" rel="noopener noreferrer">
                    <Eye className="mr-2 h-4 w-4" /> View Explorer
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
