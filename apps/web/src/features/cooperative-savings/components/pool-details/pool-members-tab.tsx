/**
 * @fileoverview Pool Members Tab Component
 *
 * Displays a table of all pool members with:
 * - Member address
 * - BTC contribution
 * - Shares owned
 * - Share percentage
 * - Join date
 */

"use client";

import { Crown, Copy } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { formatBTCCompact, formatDate, formatPercentage } from "@/hooks/web3/use-cooperative-pool";

interface Member {
  address: string;
  btcContributed: bigint;
  shares: bigint;
  joinedAt: number;
}

interface PoolMembersTabProps {
  members: Member[];
  totalShares: bigint;
  creatorAddress: string;
}

export function PoolMembersTab({ members, totalShares, creatorAddress }: PoolMembersTabProps) {
  const { toast } = useToast();

  const copyAddress = (address: string) => {
    void navigator.clipboard.writeText(address);
    toast({
      title: "Copied!",
      description: "Address copied to clipboard",
    });
  };

  return (
    <div className="mt-4">
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Contribution</TableHead>
                <TableHead>Shares</TableHead>
                <TableHead>Share %</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No members yet
                  </TableCell>
                </TableRow>
              ) : (
                members.map((member) => (
                  <TableRow key={member.address}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="rounded bg-muted px-2 py-0.5 text-xs">
                          {member.address.slice(0, 6)}...
                          {member.address.slice(-4)}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => copyAddress(member.address)}
                          aria-label="Copy member address"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        {member.address === creatorAddress && (
                          <Crown className="h-3.5 w-3.5 text-accent" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">
                      {formatBTCCompact(member.btcContributed)} BTC
                    </TableCell>
                    <TableCell className="font-mono">{member.shares.toString()}</TableCell>
                    <TableCell className="font-semibold">
                      {formatPercentage(member.shares, totalShares)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(member.joinedAt)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
