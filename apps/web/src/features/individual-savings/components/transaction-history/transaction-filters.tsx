"use client";

import { Filter } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { TransactionType } from "./types";

interface TransactionFiltersProps {
  value: TransactionType | "all";
  onChange: (value: TransactionType | "all") => void;
}

export function TransactionFilters({ value, onChange }: TransactionFiltersProps) {
  return (
    <div className="flex items-center gap-3">
      <Filter className="h-4 w-4 text-muted-foreground" />
      <Select value={value} onValueChange={(v) => onChange(v as TransactionType | "all")}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filter by type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Transactions</SelectItem>
          <SelectItem value="deposit">Deposits</SelectItem>
          <SelectItem value="withdraw">Withdrawals</SelectItem>
          <SelectItem value="claim_yield">Yield Claims</SelectItem>
          <SelectItem value="claim_referral">Referral Claims</SelectItem>
          <SelectItem value="auto_compound">Auto-Compounds</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
