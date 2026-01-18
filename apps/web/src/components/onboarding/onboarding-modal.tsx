"use client";

import {
  Wallet,
  Coins,
  PiggyBank,
  Users,
  Trophy,
  CheckCircle2,
  ExternalLink,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { useAccount } from "wagmi";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

const ONBOARDING_STORAGE_KEY = "khipuvault_onboarding_completed";
const MEZO_FAUCET_URL = "https://faucet.mezo.org";

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  action?: React.ReactNode;
  isComplete?: boolean;
}

export function OnboardingModal() {
  const { isConnected } = useAccount();
  const [isOpen, setIsOpen] = React.useState(false);
  const [currentStep, setCurrentStep] = React.useState(0);
  const [mounted, setMounted] = React.useState(false);

  // Check if user has completed onboarding
  React.useEffect(() => {
    setMounted(true);
    const hasCompletedOnboarding = localStorage.getItem(ONBOARDING_STORAGE_KEY);

    // Show onboarding when user connects for the first time
    if (isConnected && !hasCompletedOnboarding) {
      setIsOpen(true);
    }
  }, [isConnected]);

  // Reset when wallet disconnects
  React.useEffect(() => {
    if (!isConnected) {
      setCurrentStep(0);
    }
  }, [isConnected]);

  const completeOnboarding = () => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
    setIsOpen(false);
  };

  const skipOnboarding = () => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
    setIsOpen(false);
  };

  const steps: OnboardingStep[] = [
    {
      id: 1,
      title: "Welcome to KhipuVault!",
      description:
        "Your Bitcoin savings platform on Mezo blockchain. Let's get you started in just a few steps.",
      icon: <Wallet className="h-12 w-12 text-lavanda" />,
      isComplete: isConnected,
    },
    {
      id: 2,
      title: "Get Testnet mUSD",
      description:
        "To start saving, you'll need testnet mUSD tokens. Visit the Mezo faucet to get free test tokens.",
      icon: <Coins className="h-12 w-12 text-accent" />,
      action: (
        <a
          href={MEZO_FAUCET_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2"
        >
          <Button variant="secondary" className="gap-2">
            Get Test Tokens
            <ExternalLink className="h-4 w-4" />
          </Button>
        </a>
      ),
    },
    {
      id: 3,
      title: "Choose Your Savings Type",
      description: "KhipuVault offers three ways to save and earn yields on your Bitcoin:",
      icon: <PiggyBank className="h-12 w-12 text-success" />,
      action: (
        <div className="mt-4 grid gap-3">
          <div className="flex items-start gap-3 rounded-lg border border-border bg-surface-elevated p-3">
            <PiggyBank className="mt-0.5 h-5 w-5 shrink-0 text-lavanda" />
            <div>
              <div className="text-sm font-medium">Individual Savings</div>
              <div className="text-xs text-muted-foreground">
                Save alone and earn automatic yields on your mUSD deposits
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg border border-border bg-surface-elevated p-3">
            <Users className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
            <div>
              <div className="text-sm font-medium">Cooperative Pools</div>
              <div className="text-xs text-muted-foreground">
                Join or create savings groups with friends (like Pasanaku)
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg border border-border bg-surface-elevated p-3">
            <Trophy className="mt-0.5 h-5 w-5 shrink-0 text-success" />
            <div>
              <div className="text-sm font-medium">Prize Pool</div>
              <div className="text-xs text-muted-foreground">
                No-loss lottery where you never lose your capital
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 4,
      title: "You're All Set!",
      description:
        "You're ready to start saving. Make your first deposit and watch your yields grow!",
      icon: <CheckCircle2 className="h-12 w-12 text-success" />,
      action: (
        <div className="mt-4 flex flex-col gap-3">
          <Link href="/dashboard/individual-savings" onClick={completeOnboarding}>
            <Button className="w-full gap-2">
              Start with Individual Savings
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/dashboard/cooperative-savings" onClick={completeOnboarding}>
            <Button variant="outline" className="w-full gap-2">
              Explore Cooperative Pools
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      ),
    },
  ];

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  if (!mounted) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Step {currentStep + 1} of {steps.length}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={skipOnboarding}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Skip tour
            </Button>
          </div>
          <Progress value={progress} className="mb-4 h-1" />
          <div className="mb-4 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-surface-elevated">
              {currentStepData.icon}
            </div>
          </div>
          <DialogTitle className="text-center text-xl">{currentStepData.title}</DialogTitle>
          <DialogDescription className="text-center">
            {currentStepData.description}
          </DialogDescription>
        </DialogHeader>

        {currentStepData.action && <div className="mt-2">{currentStepData.action}</div>}

        <div className="mt-6 flex justify-between">
          <Button
            variant="ghost"
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
          >
            Back
          </Button>
          {currentStep < steps.length - 1 ? (
            <Button onClick={() => setCurrentStep(currentStep + 1)}>Next</Button>
          ) : (
            <Button onClick={completeOnboarding}>Get Started</Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Hook to reset onboarding state (for testing)
 */
export function useResetOnboarding() {
  return () => {
    localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    window.location.reload();
  };
}
