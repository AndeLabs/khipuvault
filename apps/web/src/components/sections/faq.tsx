"use client";

import { AnimateOnScroll } from "@/components/animate-on-scroll";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  // General Questions
  {
    category: "General",
    question: "What is KhipuVault?",
    answer:
      "KhipuVault is a decentralized savings platform built on Mezo Protocol. It offers 4 products: Individual Savings (solo), Community Pools (group savings), Rotating Pools (ROSCA/Pasanaku), and Prize Pool (no-loss lottery). All products earn real yields on Bitcoin-backed mUSD through Mezo's stability pool.",
  },
  {
    category: "General",
    question: "What is mUSD and how do I get it?",
    answer:
      "mUSD is Mezo Protocol's stablecoin, 100% backed by Bitcoin. It maintains a 1:1 peg to USD. You can mint mUSD by depositing BTC as collateral on Mezo Protocol. Once you have mUSD, you can use it across all KhipuVault products.",
  },
  {
    category: "General",
    question: "How do I earn yields on KhipuVault?",
    answer:
      "When you deposit mUSD into any KhipuVault product, your funds are automatically deployed to Mezo's stability pool. The pool earns yields from liquidation rewards and protocol fees, distributed proportionally to depositors. Individual Savings and Community Pools auto-compound; Prize Pool yields become prizes.",
  },
  {
    category: "General",
    question: "Are there any lockup periods or withdrawal fees?",
    answer:
      "No lockup periods on Individual Savings and Community Pools - withdraw anytime. Rotating Pools have cycle commitments. Prize Pool tickets are locked until round ends, but you always get your principal back (it's a no-loss lottery). No withdrawal fees, only network gas fees.",
  },
  {
    category: "General",
    question: "Is my capital at risk?",
    answer:
      "KhipuVault is non-custodial - you always control your funds through smart contracts. Prize Pool is NO-LOSS: even if you don't win, you get 100% of your mUSD back. However, all DeFi has smart contract risks. Our contracts are audited, open source, and follow security best practices (99% gas optimized, flash loan protected, reentrancy guards).",
  },

  // Individual Savings
  {
    category: "Individual Savings",
    question: "How does Individual Savings work?",
    answer:
      "Deposit mUSD into your personal vault. It automatically generates yields via Mezo's stability pool. Yields auto-compound for exponential growth. Withdraw anytime with no penalties. Perfect for solo savers who want passive, hands-off returns.",
  },
  {
    category: "Individual Savings",
    question: "What's the minimum deposit for Individual Savings?",
    answer:
      "No minimum deposit required! Deposit any amount of mUSD. However, consider gas fees - very small deposits might not be cost-effective due to transaction costs on the Mezo Network.",
  },
  {
    category: "Individual Savings",
    question: "What are referral rewards?",
    answer:
      "Earn bonus yields when you refer friends to KhipuVault. When they deposit and earn yields, you receive a percentage as referral rewards. It's our way of thanking you for growing the community!",
  },

  // Community Pools
  {
    category: "Community Pools",
    question: "What are Community Pools and who should use them?",
    answer:
      "Community Pools let groups save together - perfect for families, friends, or communities. Each member contributes mUSD, the pool generates yields via Mezo, and yields are distributed proportionally. Great for group goals, teaching kids about saving, or building community wealth.",
  },
  {
    category: "Community Pools",
    question: "How are yields distributed in Community Pools?",
    answer:
      "Yields are distributed based on your contribution percentage. If you contributed 30% of the pool's total mUSD, you receive 30% of the yields. Completely fair and transparent - all tracked on-chain.",
  },
  {
    category: "Community Pools",
    question: "Can I create my own Community Pool?",
    answer:
      "Yes! Anyone can create a Community Pool. Set your own rules, invite members, and manage contributions. You can also join existing pools created by others. Pools can be public (anyone can join) or private (invite-only).",
  },

  // Rotating Pool (ROSCA)
  {
    category: "Rotating Pool",
    question: "What is a Rotating Pool (ROSCA) and how does it work?",
    answer:
      "Rotating Pools are traditional savings circles (Pasanaku, Tandas, Roscas) on blockchain. Members contribute a fixed amount each cycle, and one member receives the full pot each turn. It rotates until everyone has received their turn. Supports Native BTC & WBTC with flash loan protection.",
  },
  {
    category: "Rotating Pool",
    question: "What's the difference between ROSCA and Community Pools?",
    answer:
      "Community Pools: everyone keeps their own contributions + proportional yields. Rotating Pools: members contribute to a pot, one person receives the full pot each turn (rotating). ROSCA is for structured savings circles; Community Pools are for shared yield generation.",
  },
  {
    category: "Rotating Pool",
    question: "What happens if someone doesn't contribute in a Rotating Pool?",
    answer:
      "Rotating Pools require trust among members. If someone doesn't contribute, the cycle can't complete. That's why we recommend only forming ROSCAs with people you trust. Smart contracts enforce transparency, but can't force contributions. Choose members wisely!",
  },
  {
    category: "Rotating Pool",
    question: "Why use Native BTC instead of mUSD for Rotating Pools?",
    answer:
      "Rotating Pools support both Native BTC and WBTC because many traditional ROSCA participants prefer using Bitcoin directly. You can still use mUSD in Community Pools if you prefer stablecoin savings.",
  },

  // Prize Pool (Lottery)
  {
    category: "Prize Pool",
    question: "How does the Prize Pool (no-loss lottery) work?",
    answer:
      "Buy tickets with mUSD (10 mUSD per ticket). All tickets generate yields during the round. At round end, secure randomness picks a winner who receives the pooled yields as a prize. Non-winners get 100% of their mUSD back. You literally can't lose your capital!",
  },
  {
    category: "Prize Pool",
    question: "What is commit-reveal randomness?",
    answer:
      "A secure method to generate random numbers without external oracles. The operator commits a hash, players see it (can't be changed), then the operator reveals the secret after round ends. Combined with block hashes, this creates verifiable randomness that can't be manipulated.",
  },
  {
    category: "Prize Pool",
    question: "Why is there a minimum 2 participants requirement?",
    answer:
      "To ensure fairness. A single-player lottery isn't a lottery - it's just earning yields. Minimum 2 players ensures there's actual competition and fair odds. If a round doesn't meet the minimum, it's cancelled and all deposits are returned.",
  },
  {
    category: "Prize Pool",
    question: "What's the 99% gas optimization about?",
    answer:
      "We use range-based ticket storage instead of storing each ticket individually. This reduces gas costs by ~99% compared to naive implementations. Buying 100 tickets costs ~25,000 gas instead of ~2,000,000 gas - saving you money!",
  },
  {
    category: "Prize Pool",
    question: "How often are Prize Pool rounds?",
    answer:
      "Currently weekly rounds (7 days). Rounds open for ticket purchases, generate yields during the period, then use commit-reveal to select the winner. New rounds start automatically after the previous one ends.",
  },

  // Technical
  {
    category: "Technical",
    question: "What network does KhipuVault run on?",
    answer:
      "KhipuVault is deployed on Mezo Testnet (Chain ID: 31611). Mezo is a Bitcoin-native blockchain that enables DeFi on Bitcoin. We'll launch on Mezo Mainnet when available. You'll need BTC for gas fees on Mezo Network.",
  },
  {
    category: "Technical",
    question: "Are the smart contracts audited and open source?",
    answer:
      "Yes! All contracts are open source and published on GitHub. We've implemented security best practices: reentrancy guards, flash loan protection, pausable emergency mode, UUPS upgradeable pattern, and comprehensive test coverage (28/28 tests passing). Code is transparent and verifiable.",
  },
  {
    category: "Technical",
    question: "What wallets are supported?",
    answer:
      "Any Ethereum-compatible wallet works: MetaMask, WalletConnect, Coinbase Wallet, Rainbow, etc. Just configure your wallet to connect to Mezo Network (RPC: https://rpc.test.mezo.org, Chain ID: 31611).",
  },
];

// Group FAQs by category
const faqsByCategory = faqs.reduce(
  (acc, faq) => {
    if (!acc[faq.category]) {
      acc[faq.category] = [];
    }
    acc[faq.category].push(faq);
    return acc;
  },
  {} as Record<string, typeof faqs>
);

export function FAQ() {
  return (
    <section className="bg-surface/30 py-20 md:py-28">
      <div className="container mx-auto max-w-5xl px-4">
        <AnimateOnScroll className="mb-12 text-center">
          <span className="mb-4 inline-block rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            FAQ
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Frequently Asked Questions
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Everything you need to know about KhipuVault and all our products
          </p>
        </AnimateOnScroll>

        <div className="space-y-12">
          {Object.entries(faqsByCategory).map(([category, categoryFaqs], categoryIndex) => (
            <AnimateOnScroll key={category} delay={`${categoryIndex * 100}ms`}>
              <div>
                <h3 className="mb-6 text-xl font-semibold text-white">{category}</h3>
                <Accordion type="single" collapsible className="w-full space-y-4">
                  {categoryFaqs.map((faq, index) => (
                    <AccordionItem
                      key={`${category}-${index}`}
                      value={`${category}-${index}`}
                      className="rounded-xl border border-border bg-surface-elevated/50 px-6 data-[state=open]:border-primary/30"
                    >
                      <AccordionTrigger className="py-5 text-left font-medium text-white hover:no-underline">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="pb-5 leading-relaxed text-muted-foreground">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
