import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Prize Pool | KhipuVault",
  description:
    "Participate in no-loss lottery where you never lose your capital. Buy tickets with mUSD, win prizes generated from DeFi yields. Your principal is always safe.",
  openGraph: {
    title: "Prize Pool - No Loss Lottery | KhipuVault",
    description:
      "Participate in no-loss lottery where you never lose your capital. Win prizes generated from DeFi yields.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Prize Pool - No Loss Lottery | KhipuVault",
    description:
      "Participate in no-loss lottery where you never lose your capital. Win prizes generated from DeFi yields.",
  },
};

export default function PrizePoolLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
