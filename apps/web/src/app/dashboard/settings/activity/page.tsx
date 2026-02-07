"use client";

export const dynamic = "force-dynamic";

import { ExternalLink, TrendingUp, TrendingDown, Coins } from "lucide-react";
import { useAccount } from "wagmi";

import { PageHeader } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useUserTransactionHistory,
  formatTransaction,
} from "@/hooks/web3/use-user-transaction-history";

export default function ActivityPage() {
  const { address, isConnected } = useAccount();
  const { data: transactions, isLoading } = useUserTransactionHistory();

  if (!isConnected || !address) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Activity"
          description="No wallet connected. Please connect your wallet to view your activity."
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return <TrendingUp className="h-4 w-4 text-success" />;
      case "withdraw":
        return <TrendingDown className="h-4 w-4 text-destructive" />;
      case "claim":
        return <Coins className="h-4 w-4 text-accent" />;
      default:
        return <Coins className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "deposit":
        return "bg-success/20 text-success";
      case "withdraw":
        return "bg-error/20 text-error";
      case "claim":
        return "bg-accent/20 text-accent";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Activity" description="View your transaction history on KhipuVault" />

      <Card className="shadow-custom border-primary/20 bg-card">
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            Your recent transactions from the Individual Savings Pool
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">Loading transactions...</p>
            </div>
          ) : transactions && transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Transaction</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => {
                    const formatted = formatTransaction(tx);
                    return (
                      <TableRow key={tx.hash}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getTypeIcon(tx.type)}
                            <Badge variant="secondary" className={getTypeColor(tx.type)}>
                              {formatted.typeLabel}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="font-code font-medium">
                          {parseFloat(formatted.amountFormatted).toFixed(6)} MUSD
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatted.dateFormatted}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={tx.status === "success" ? "default" : "error"}
                            className={tx.status === "success" ? "bg-success/80" : ""}
                          >
                            {tx.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <a
                            href={`https://explorer.test.mezo.org/tx/${tx.hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                          >
                            View
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">
                No transactions found. Start saving to see your activity here!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
