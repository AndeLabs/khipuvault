import type { Metadata } from "next";
import type { ReactNode } from "react";

import { SavingsProductJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Mezo Protocol | KhipuVault",
  description:
    "Access Mezo Protocol's decentralized borrowing and stability pool. Open Troves, borrow MUSD against BTC collateral, or earn rewards by providing stability.",
  openGraph: {
    title: "Mezo Protocol | KhipuVault",
    description:
      "Access Mezo Protocol's decentralized borrowing and stability pool. Open Troves, borrow MUSD against BTC collateral, or earn rewards by providing stability.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mezo Protocol | KhipuVault",
    description:
      "Access Mezo Protocol's decentralized borrowing and stability pool. Open Troves, borrow MUSD against BTC collateral, or earn rewards by providing stability.",
  },
};

export default function MezoLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SavingsProductJsonLd
        name="Mezo Protocol"
        description="Access Mezo Protocol's decentralized borrowing and stability pool. Open Troves, borrow MUSD against BTC collateral, or earn rewards by providing stability."
        url="/dashboard/mezo"
      />
      {children}
    </>
  );
}
