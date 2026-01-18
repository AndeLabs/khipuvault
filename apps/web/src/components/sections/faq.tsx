"use client";

import { AnimateOnScroll } from "@/components/animate-on-scroll";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "What is KhipuVault?",
    answer:
      "KhipuVault is a decentralized savings platform built on Mezo Protocol. It allows you to earn real yields on your Bitcoin-backed mUSD deposits through Mezo's stability pool, without the complexity of traditional DeFi protocols.",
  },
  {
    question: "How do I earn yields?",
    answer:
      "When you deposit mUSD into KhipuVault, your funds are automatically deployed to Mezo's stability pool. The stability pool earns yields from liquidation rewards and protocol fees, which are distributed to depositors proportionally.",
  },
  {
    question: "What is mUSD?",
    answer:
      "mUSD is Mezo Protocol's stablecoin, 100% backed by Bitcoin. It maintains a 1:1 peg to USD and can be minted by depositing BTC as collateral on the Mezo network.",
  },
  {
    question: "Are there any lockup periods?",
    answer:
      "No! One of KhipuVault's key features is complete flexibility. You can deposit and withdraw your funds at any time without penalties or lockup periods.",
  },
  {
    question: "Is my capital at risk?",
    answer:
      "KhipuVault is non-custodial, meaning you always maintain control of your funds through smart contracts. However, as with any DeFi protocol, there are inherent smart contract risks. Our contracts have been audited and are open source for transparency.",
  },
  {
    question: "What are Community Pools?",
    answer:
      "Community Pools are inspired by traditional Latin American savings circles (Pasanaku, Tandas, Roscas). They allow groups to save together, with yields distributed proportionally among members. It's a modern, blockchain-powered version of community-based savings.",
  },
  {
    question: "How does the Prize Pool work?",
    answer:
      "The Prize Pool is a no-loss lottery. Your deposited capital generates yields, and those yields are pooled together as prizes. Winners are selected randomly, but even if you don't win, you never lose your original deposit.",
  },
  {
    question: "What networks does KhipuVault support?",
    answer:
      "KhipuVault is currently deployed on Mezo Testnet. We plan to launch on Mezo Mainnet once it becomes available. Stay tuned for updates!",
  },
];

export function FAQ() {
  return (
    <section className="bg-surface/30 py-20 md:py-28">
      <div className="container mx-auto max-w-4xl px-4">
        <AnimateOnScroll className="mb-12 text-center">
          <span className="mb-4 inline-block rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            FAQ
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Frequently Asked Questions
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Everything you need to know about KhipuVault
          </p>
        </AnimateOnScroll>

        <AnimateOnScroll delay="150ms">
          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
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
        </AnimateOnScroll>
      </div>
    </section>
  );
}
