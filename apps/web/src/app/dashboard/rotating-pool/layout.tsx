import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "ROSCA Pools | KhipuVault",
  description:
    "Traditional Rotating Savings and Credit Association (ROSCA) enhanced with DeFi. Create or join savings circles with rotating payouts and earn additional yields.",
  openGraph: {
    title: "ROSCA Pools | KhipuVault",
    description:
      "Traditional Rotating Savings enhanced with DeFi. Create or join savings circles with rotating payouts.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ROSCA Pools | KhipuVault",
    description:
      "Traditional Rotating Savings enhanced with DeFi. Create or join savings circles with rotating payouts.",
  },
};

export default function RotatingPoolLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
