import { ArrowDownCircle, ArrowUpCircle, Award, RefreshCw } from "lucide-react";
import * as React from "react";

import type { TransactionType, TransactionInfo } from "./types";

export const TRANSACTION_LABELS: Record<TransactionType, TransactionInfo> = {
  deposit: {
    label: "Deposit",
    icon: <ArrowDownCircle className="h-4 w-4" />,
    color: "text-success",
  },
  withdraw: {
    label: "Withdraw",
    icon: <ArrowUpCircle className="h-4 w-4" />,
    color: "text-error",
  },
  claim: {
    label: "Claim Yield",
    icon: <Award className="h-4 w-4" />,
    color: "text-lavanda",
  },
  claim_yield: {
    label: "Claim Yield",
    icon: <Award className="h-4 w-4" />,
    color: "text-lavanda",
  },
  claim_referral: {
    label: "Claim Referral",
    icon: <Award className="h-4 w-4" />,
    color: "text-accent",
  },
  compound: {
    label: "Compound",
    icon: <RefreshCw className="h-4 w-4" />,
    color: "text-lavanda",
  },
  auto_compound: {
    label: "Auto-Compound",
    icon: <RefreshCw className="h-4 w-4" />,
    color: "text-lavanda",
  },
  toggle_auto_compound: {
    label: "Toggle Auto-Compound",
    icon: <RefreshCw className="h-4 w-4" />,
    color: "text-muted-foreground",
  },
};

export const ITEMS_PER_PAGE = 10;
