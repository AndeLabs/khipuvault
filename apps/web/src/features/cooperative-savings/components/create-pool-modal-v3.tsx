/**
 * @fileoverview Create Pool Modal - V3
 *
 * Features:
 * - Pool name input
 * - Min/max contribution inputs (BTC)
 * - Max members slider
 * - Preview of pool parameters
 * - Validation
 * - Transaction execution
 */

"use client";

import { Loader2, Users, Bitcoin, Shield, AlertTriangle } from "lucide-react";
import * as React from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { useCooperativePool } from "@/hooks/web3/use-cooperative-pool";

interface CreatePoolModalV3Props {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreatePoolModalV3({
  open,
  onClose,
  onSuccess,
}: CreatePoolModalV3Props) {
  const { toast } = useToast();
  const { createPool, state, error, reset } = useCooperativePool();

  const [poolName, setPoolName] = React.useState("");
  const [minContribution, setMinContribution] = React.useState("0.001");
  const [maxContribution, setMaxContribution] = React.useState("0.1");
  const [maxMembers, setMaxMembers] = React.useState([10]);

  const [validationError, setValidationError] = React.useState("");

  // Validate inputs
  const validate = React.useCallback(() => {
    if (!poolName.trim()) {
      setValidationError("Pool name is required");
      return false;
    }

    const min = parseFloat(minContribution);
    const max = parseFloat(maxContribution);

    if (isNaN(min) || min <= 0) {
      setValidationError("Minimum contribution must be greater than 0");
      return false;
    }

    if (isNaN(max) || max <= 0) {
      setValidationError("Maximum contribution must be greater than 0");
      return false;
    }

    if (min < 0.001) {
      setValidationError("Minimum contribution must be at least 0.001 BTC");
      return false;
    }

    if (max < min) {
      setValidationError("Maximum contribution must be greater than minimum");
      return false;
    }

    if (maxMembers[0] < 2) {
      setValidationError("Pool must allow at least 2 members");
      return false;
    }

    setValidationError("");
    return true;
  }, [poolName, minContribution, maxContribution, maxMembers]);

  // Handle create
  const handleCreate = async () => {
    if (!validate()) {
      return;
    }

    try {
      await createPool(
        poolName.trim(),
        minContribution,
        maxContribution,
        maxMembers[0],
      );
    } catch (err) {
      console.error("Create pool error:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          err instanceof Error
            ? err.message
            : "Failed to create pool. Please try again.",
      });
    }
  };

  // Handle success
  React.useEffect(() => {
    if (state === "success") {
      toast({
        title: "Pool Created!",
        description: "Your cooperative pool has been created successfully.",
      });
      onSuccess?.();
      handleClose();
    }
  }, [state]);

  // Handle close
  const handleClose = () => {
    setPoolName("");
    setMinContribution("0.001");
    setMaxContribution("0.1");
    setMaxMembers([10]);
    setValidationError("");
    reset();
    onClose();
  };

  const isProcessing = state === "executing" || state === "processing";
  const canSubmit =
    !isProcessing && poolName.trim() && minContribution && maxContribution;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-heading">
            Create Cooperative Pool
          </DialogTitle>
          <DialogDescription>
            Set up a new pool where members can save together and earn yields
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Pool Name */}
          <div className="space-y-2">
            <Label htmlFor="pool-name">Pool Name</Label>
            <Input
              id="pool-name"
              placeholder="e.g., Friends Savings Pool"
              value={poolName}
              onChange={(e) => setPoolName(e.target.value)}
              disabled={isProcessing}
              maxLength={50}
            />
            <p className="text-xs text-muted-foreground">
              A friendly name for your pool (max 50 characters)
            </p>
          </div>

          {/* Contribution Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="min-contribution">
                Minimum Contribution (BTC)
              </Label>
              <div className="relative">
                <Bitcoin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="min-contribution"
                  type="number"
                  step="0.001"
                  min="0.001"
                  placeholder="0.001"
                  value={minContribution}
                  onChange={(e) => setMinContribution(e.target.value)}
                  disabled={isProcessing}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-contribution">
                Maximum Contribution (BTC)
              </Label>
              <div className="relative">
                <Bitcoin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="max-contribution"
                  type="number"
                  step="0.01"
                  min="0.001"
                  placeholder="0.1"
                  value={maxContribution}
                  onChange={(e) => setMaxContribution(e.target.value)}
                  disabled={isProcessing}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          {/* Max Members */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Maximum Members</Label>
              <span className="text-sm font-medium">
                {maxMembers[0]} members
              </span>
            </div>
            <Slider
              value={maxMembers}
              onValueChange={setMaxMembers}
              min={2}
              max={100}
              step={1}
              disabled={isProcessing}
              className="py-4"
              aria-label="Maximum pool members"
            />
            <p className="text-xs text-muted-foreground">
              The maximum number of members who can join this pool
            </p>
          </div>

          {/* Preview */}
          <Card className="border-accent/20 bg-accent/5">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-accent">
                <Shield className="h-4 w-4" />
                Pool Preview
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Pool Name</p>
                  <p className="font-medium">{poolName || "Not set"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Max Members</p>
                  <p className="font-medium">{maxMembers[0]}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Min Contribution</p>
                  <p className="font-mono font-medium">{minContribution} BTC</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Max Contribution</p>
                  <p className="font-mono font-medium">{maxContribution} BTC</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Validation Error */}
          {validationError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{validationError}</AlertDescription>
            </Alert>
          )}

          {/* Transaction Error */}
          {error && state === "error" && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Info */}
          <Alert>
            <Users className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Note:</strong> Creating a pool is free. Members will
              contribute BTC when they join, which will be automatically
              deposited into the Mezo protocol to generate yields.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button variant="accent" onClick={handleCreate} disabled={!canSubmit}>
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {state === "executing"
                  ? "Confirm in Wallet..."
                  : "Creating Pool..."}
              </>
            ) : (
              "Create Pool"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
