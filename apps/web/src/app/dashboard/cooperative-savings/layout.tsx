import type { Metadata } from "next";
import type { ReactNode } from "react";

import { SavingsProductJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Cooperative Pools | KhipuVault",
  description:
    "Join or create cooperative savings pools with friends and earn yields together. Traditional ROSCA model enhanced with DeFi yields on Mezo blockchain.",
  openGraph: {
    title: "Cooperative Pools | KhipuVault",
    description:
      "Join or create cooperative savings pools with friends and earn yields together on Mezo blockchain.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cooperative Pools | KhipuVault",
    description:
      "Join or create cooperative savings pools with friends and earn yields together on Mezo blockchain.",
  },
};

export default function CooperativeSavingsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SavingsProductJsonLd
        name="Cooperative Savings Pools"
        description="Join or create cooperative savings pools with friends and earn yields together. Traditional ROSCA model enhanced with DeFi on Mezo blockchain."
        url="/dashboard/cooperative-savings"
      />
      {children}
    </>
  );
}
