import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const cardVariants = cva(
  "rounded-lg border text-card-foreground shadow-sm transition-all duration-base",
  {
    variants: {
      variant: {
        default: "bg-card border-border",
        surface: "bg-surface border-border",
        elevated: "bg-surface-elevated border-border-strong",
        glass: "glass",
        "glass-strong": "glass-strong",
      },
      hover: {
        none: "",
        glow: "card-hover",
        "glow-lavanda": "hover:border-lavanda hover:shadow-glow-lavanda",
        "glow-orange": "hover:border-accent hover:shadow-glow-orange",
        "glow-success": "hover:border-success hover:shadow-glow-success",
      },
    },
    defaultVariants: {
      variant: "default",
      hover: "none",
    },
  },
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, hover, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, hover }), className)}
      {...props}
    />
  ),
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-2xl font-heading font-semibold leading-none tracking-tight",
      className,
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

// Stat Card - specialized variant for displaying metrics
const StatCard = React.forwardRef<
  HTMLDivElement,
  CardProps & { trend?: "up" | "down" | "neutral" }
>(({ className, trend, children, ...props }, ref) => (
  <Card
    ref={ref}
    variant="surface"
    hover="glow"
    className={cn("stat-card", className)}
    {...props}
  >
    {children}
  </Card>
));
StatCard.displayName = "StatCard";

const StatValue = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { trend?: "up" | "down" | "neutral" }
>(({ className, trend, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "data-value",
      trend === "up" && "text-success",
      trend === "down" && "text-error",
      trend === "neutral" && "text-foreground",
      className,
    )}
    {...props}
  />
));
StatValue.displayName = "StatValue";

const StatLabel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("label", className)} {...props} />
));
StatLabel.displayName = "StatLabel";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  StatCard,
  StatValue,
  StatLabel,
  cardVariants,
};
