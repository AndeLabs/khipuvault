/**
 * @fileoverview How It Works Component
 * @module features/prize-pool/components/how-it-works
 *
 * Educational section explaining the lottery mechanism
 */

"use client";

import { ShieldCheck, Ticket, Trophy, Wallet, Zap, HelpCircle } from "lucide-react";
import * as React from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function HowItWorks() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-lavanda" />
          How It Works
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Step-by-Step Guide */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">How to Participate</h3>

          <div className="space-y-3">
            {/* Step 1 */}
            <div className="flex gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-lavanda/20">
                <Ticket className="h-5 w-5 text-lavanda" />
              </div>
              <div>
                <div className="mb-1 font-medium">1. Buy Tickets with mUSD</div>
                <p className="text-sm text-muted-foreground">
                  Purchase lottery tickets using native mUSD. Each ticket is your entry into the
                  prize pool.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-lavanda/20">
                <Zap className="h-5 w-5 text-lavanda" />
              </div>
              <div>
                <div className="mb-1 font-medium">2. Your mUSD Generates Yields</div>
                <p className="text-sm text-muted-foreground">
                  Your mUSD is deposited into Mezo protocol and mints MUSD, which generates yields
                  in DeFi.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-lavanda/20">
                <Trophy className="h-5 w-5 text-lavanda" />
              </div>
              <div>
                <div className="mb-1 font-medium">3. Draw Takes Place</div>
                <p className="text-sm text-muted-foreground">
                  At the end of the period, a provably fair random draw selects the winner.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-success/20">
                <Wallet className="h-5 w-5 text-success" />
              </div>
              <div>
                <div className="mb-1 font-medium">4. Claim Your Rewards</div>
                <p className="text-sm text-muted-foreground">
                  Winner gets their principal + most yields. Non-winners get their full mUSD back.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Key Features */}
        <div className="rounded-lg border border-success/20 bg-gradient-to-br from-success/10 to-success/5 p-4">
          <div className="mb-3 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-success" />
            <div className="text-success-foreground font-medium">No-Loss Guarantee</div>
          </div>
          <p className="text-success-foreground/80 text-sm">
            You NEVER lose your capital! If you don't win, you get 100% of your mUSD back. Only the
            yields go to the winner.
          </p>
        </div>

        {/* FAQ */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Frequently Asked Questions</h3>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-sm">What happens if I don't win?</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                You get 100% of your mUSD back! This is a no-loss lottery - only the yields
                generated during the period go to the winner. Your principal is always safe.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger className="text-sm">How is the winner selected?</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                The winner is selected using a pseudo-random number generator in the smart contract.
                Each ticket you own increases your chances proportionally.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger className="text-sm">How are yields generated?</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                Your mUSD is deposited into Mezo protocol to mint MUSD. The MUSD is then deposited
                into Mezo's Stability Pool, which generates yields through liquidation rewards.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger className="text-sm">
                What's the maximum tickets I can buy?
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                You can purchase up to 10 tickets per round. This ensures fair participation and
                prevents whale dominance.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5">
              <AccordionTrigger className="text-sm">
                When can I claim my prize/capital?
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                Once the draw is completed and a winner is announced, both winners and non-winners
                can claim their rewards. Winners get principal + yields, non-winners get their full
                capital back.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6">
              <AccordionTrigger className="text-sm">Are there any fees?</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                The protocol takes a 10% fee from the generated yields (not from your principal).
                This fee goes to the treasury to maintain and improve the platform.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Terms */}
        <div className="rounded-lg border border-border bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground">
            <strong>Important:</strong> This is a testnet deployment. Do not use real funds. The
            lottery uses native mUSD on Mezo Testnet. Smart contracts are not audited and provided
            as-is for testing purposes.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
