"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { formatEther } from "viem";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  useCreateRotatingPool,
  parseContribution,
  daysToSeconds,
  weeksToSeconds,
  monthsToSeconds,
  useRotatingPoolConstants,
} from "@/hooks/web3/rotating";

const formSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(50),
  memberCount: z.string().min(1, "Required"),
  contributionAmount: z.string().min(1, "Required"),
  periodDuration: z.string().min(1, "Required"),
  periodUnit: z.enum(["days", "weeks", "months"]),
  autoAdvance: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateRoscaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateRoscaModal({ open, onOpenChange }: CreateRoscaModalProps) {
  const { createPool, isPending, isSuccess, error } = useCreateRotatingPool();
  const { minMembers, maxMembers, minContribution, maxContribution } = useRotatingPoolConstants();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      memberCount: "12",
      contributionAmount: "0.01",
      periodDuration: "30",
      periodUnit: "days",
      autoAdvance: true,
    },
  });

  const onSubmit = (values: FormValues) => {
    try {
      const contributionWei = parseContribution(values.contributionAmount);
      let periodSeconds: bigint;

      switch (values.periodUnit) {
        case "days":
          periodSeconds = daysToSeconds(parseInt(values.periodDuration));
          break;
        case "weeks":
          periodSeconds = weeksToSeconds(parseInt(values.periodDuration));
          break;
        case "months":
          periodSeconds = monthsToSeconds(parseInt(values.periodDuration));
          break;
      }

      createPool({
        name: values.name,
        memberCount: BigInt(values.memberCount),
        contributionAmount: contributionWei,
        periodDuration: periodSeconds,
        autoAdvance: values.autoAdvance,
      });
    } catch (err) {
      console.error("Error creating pool:", err);
    }
  };

  // Close modal on success
  if (isSuccess) {
    setTimeout(() => {
      onOpenChange(false);
      form.reset();
    }, 2000);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New ROSCA</DialogTitle>
          <DialogDescription>
            Set up a new Rotating Savings and Credit Association with DeFi yields.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pool Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Friends Savings Circle" {...field} />
                  </FormControl>
                  <FormDescription>A descriptive name for your ROSCA</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Member Count */}
            <FormField
              control={form.control}
              name="memberCount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Members</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={
                        minMembers !== undefined && minMembers !== null
                          ? minMembers.toString()
                          : "3"
                      }
                      max={
                        maxMembers !== undefined && maxMembers !== null
                          ? maxMembers.toString()
                          : "50"
                      }
                      placeholder="12"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Total members (min:{" "}
                    {minMembers !== undefined && minMembers !== null ? minMembers.toString() : "3"},
                    max:{" "}
                    {maxMembers !== undefined && maxMembers !== null ? maxMembers.toString() : "50"}
                    )
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Contribution Amount */}
            <FormField
              control={form.control}
              name="contributionAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contribution Amount (BTC)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.001"
                      min={
                        minContribution !== undefined &&
                        minContribution !== null &&
                        typeof minContribution === "bigint"
                          ? formatEther(minContribution)
                          : "0.001"
                      }
                      max={
                        maxContribution !== undefined &&
                        maxContribution !== null &&
                        typeof maxContribution === "bigint"
                          ? formatEther(maxContribution)
                          : "10"
                      }
                      placeholder="0.01"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Amount each member contributes per period</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Period Duration */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="periodDuration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Period Duration</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" placeholder="30" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="periodUnit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="days">Days</SelectItem>
                        <SelectItem value="weeks">Weeks</SelectItem>
                        <SelectItem value="months">Months</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Auto Advance */}
            <FormField
              control={form.control}
              name="autoAdvance"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Auto-advance Periods</FormLabel>
                    <FormDescription>
                      Automatically move to the next period when time expires
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Error Message */}
            {error && (
              <div className="rounded-lg border border-error/50 bg-error/10 p-3 text-sm text-error">
                {error.message}
              </div>
            )}

            {/* Success Message */}
            {isSuccess && (
              <div className="rounded-lg border border-success/50 bg-success/10 p-3 text-sm text-success">
                ✅ Pool created successfully!
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending || isSuccess}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : isSuccess ? (
                  "Created!"
                ) : (
                  "Create ROSCA"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
