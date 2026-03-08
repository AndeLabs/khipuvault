import type { Metadata } from "next";
import type { ReactNode } from "react";

import { SavingsProductJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Individual Savings | KhipuVault",
  description:
    "Deposit your BTC into personal savings pools and earn yield through Mezo's decentralized infrastructure. Secure, self-custodial savings with competitive APY.",
  openGraph: {
    title: "Individual Savings | KhipuVault",
    description:
      "Deposit your BTC into personal savings pools and earn yield through Mezo's decentralized infrastructure.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Individual Savings | KhipuVault",
    description:
      "Deposit your BTC into personal savings pools and earn yield through Mezo's decentralized infrastructure.",
  },
};

export default function IndividualSavingsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SavingsProductJsonLd
        name="Individual Bitcoin Savings"
        description="Deposit your BTC into personal savings pools and earn yield through Mezo's decentralized infrastructure. Secure, self-custodial savings."
        url="/dashboard/individual-savings"
      />
      {children}
    </>
  );
}
