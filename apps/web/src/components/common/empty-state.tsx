"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface EmptyStateAction {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: "default" | "secondary" | "outline" | "ghost";
  external?: boolean;
}

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  primaryAction?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  className,
}: EmptyStateProps) {
  const renderAction = (action: EmptyStateAction, isPrimary: boolean) => {
    const buttonContent = (
      <Button
        variant={action.variant || (isPrimary ? "default" : "outline")}
        onClick={action.onClick}
        className={cn(isPrimary && "min-w-[200px]")}
      >
        {action.label}
      </Button>
    );

    if (action.href) {
      if (action.external) {
        return (
          <a
            href={action.href}
            target="_blank"
            rel="noopener noreferrer"
            key={action.label}
          >
            {buttonContent}
          </a>
        );
      }
      return (
        <Link href={action.href} key={action.label}>
          {buttonContent}
        </Link>
      );
    }

    return buttonContent;
  };

  return (
    <Card variant="glass" className={cn("text-center py-12", className)}>
      <CardContent className="space-y-4">
        <div className="flex justify-center">
          <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
            {icon}
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-heading font-semibold">{title}</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            {description}
          </p>
        </div>
        {(primaryAction || secondaryAction) && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            {primaryAction && renderAction(primaryAction, true)}
            {secondaryAction && renderAction(secondaryAction, false)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
