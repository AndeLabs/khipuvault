"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AmountDisplay } from "@/components/common";
import { useTransactionExecute } from "@/features/transactions";
import { Info, Users, Calendar, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

const createPoolSchema = z.object({
  poolName: z
    .string()
    .min(3, "Pool name must be at least 3 characters")
    .max(50, "Pool name too long"),
  maxMembers: z
    .string()
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) >= 2 && Number(val) <= 50,
      "Must be between 2 and 50 members",
    ),
  depositAmount: z
    .string()
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) > 0,
      "Amount must be greater than 0",
    ),
  cycleLength: z
    .string()
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) >= 7 && Number(val) <= 365,
      "Must be between 7 and 365 days",
    ),
});

type CreatePoolFormData = z.infer<typeof createPoolSchema>;

interface CreatePoolModalProps {
  open: boolean;
  onClose: () => void;
  onCreatePool: (data: {
    poolName: string;
    maxMembers: number;
    depositAmount: string;
    cycleLength: number;
  }) => Promise<any>;
}

export function CreatePoolModal({
  open,
  onClose,
  onCreatePool,
}: CreatePoolModalProps) {
  const { execute } = useTransactionExecute({
    type: "Create Cooperative Pool",
  });

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreatePoolFormData>({
    resolver: zodResolver(createPoolSchema),
    defaultValues: {
      poolName: "",
      maxMembers: "10",
      depositAmount: "",
      cycleLength: "30",
    },
  });

  const formData = watch();

  const onSubmit = async (data: CreatePoolFormData) => {
    await execute(async () => {
      return await onCreatePool({
        poolName: data.poolName,
        maxMembers: Number(data.maxMembers),
        depositAmount: data.depositAmount,
        cycleLength: Number(data.cycleLength),
      });
    });
    reset();
    onClose();
  };

  const handleClose = () => {
    if (!isSubmitting) {
      reset();
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Cooperative Pool</DialogTitle>
          <DialogDescription>
            Create a new cooperative savings pool and invite others to join
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
          {/* Pool Name */}
          <div className="space-y-2">
            <Label htmlFor="poolName">Pool Name</Label>
            <Input
              id="poolName"
              placeholder="My Savings Group"
              {...register("poolName")}
              className={cn(errors.poolName && "border-error")}
            />
            {errors.poolName && (
              <p className="text-sm text-error">{errors.poolName.message}</p>
            )}
          </div>

          {/* Max Members */}
          <div className="space-y-2">
            <Label htmlFor="maxMembers" className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              Maximum Members
            </Label>
            <Input
              id="maxMembers"
              type="number"
              min="2"
              max="50"
              {...register("maxMembers")}
              className={cn(errors.maxMembers && "border-error")}
            />
            {errors.maxMembers && (
              <p className="text-sm text-error">{errors.maxMembers.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Number of people who can join this pool (2-50)
            </p>
          </div>

          {/* Deposit Amount */}
          <div className="space-y-2">
            <Label htmlFor="depositAmount" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              Deposit Amount per Member
            </Label>
            <div className="relative">
              <Input
                id="depositAmount"
                type="number"
                step="0.01"
                placeholder="100.00"
                {...register("depositAmount")}
                className={cn("pr-16", errors.depositAmount && "border-error")}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                mUSD
              </div>
            </div>
            {errors.depositAmount && (
              <p className="text-sm text-error">
                {errors.depositAmount.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Each member will deposit this amount
            </p>
          </div>

          {/* Cycle Length */}
          <div className="space-y-2">
            <Label htmlFor="cycleLength" className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Cycle Length (Days)
            </Label>
            <Input
              id="cycleLength"
              type="number"
              min="7"
              max="365"
              {...register("cycleLength")}
              className={cn(errors.cycleLength && "border-error")}
            />
            {errors.cycleLength && (
              <p className="text-sm text-error">{errors.cycleLength.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              How often the pool rotates (7-365 days)
            </p>
          </div>

          {/* Preview */}
          {formData.depositAmount && formData.maxMembers && (
            <div className="p-4 rounded-lg bg-gradient-orange border border-accent/20 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Info className="h-4 w-4" />
                Pool Summary
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Total Pool Value
                  </span>
                  <AmountDisplay
                    amount={(
                      Number(formData.depositAmount) *
                      Number(formData.maxMembers)
                    ).toFixed(2)}
                    symbol="mUSD"
                    size="sm"
                    className="text-accent"
                  />
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Your Deposit</span>
                  <AmountDisplay
                    amount={formData.depositAmount}
                    symbol="mUSD"
                    size="sm"
                  />
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Rotation Frequency
                  </span>
                  <span>Every {formData.cycleLength} days</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="accent" loading={isSubmitting}>
              Create Pool
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
