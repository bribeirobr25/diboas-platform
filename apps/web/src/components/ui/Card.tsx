import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@diboas/ui';

const cardVariants = cva(
  "rounded-2xl border bg-white shadow-base",
  {
    variants: {
      variant: {
        default: "border-neutral-200",
        elevated: "shadow-lg border-neutral-100",
        outlined: "border-2 border-primary-200 shadow-none",
        glass: "bg-white/80 backdrop-blur-sm border-white/20",
      },
      padding: {
        none: "p-0",
        sm: "p-4",
        default: "p-6",
        lg: "p-8",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "default",
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof cardVariants> { }

const FinancialCard = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, padding, className }))}
      {...props}
    />
  )
);

const FinancialCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("card-header", className)}
    {...props}
  />
));

const FinancialCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("card-title", className)}
    {...props}
  />
));

const FinancialCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("card-description", className)}
    {...props}
  />
));

const FinancialCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props} />
));

const FinancialCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("card-footer", className)}
    {...props}
  />
));

FinancialCard.displayName = "FinancialCard";
FinancialCardHeader.displayName = "FinancialCardHeader";
FinancialCardTitle.displayName = "FinancialCardTitle";
FinancialCardDescription.displayName = "FinancialCardDescription";
FinancialCardContent.displayName = "FinancialCardContent";
FinancialCardFooter.displayName = "FinancialCardFooter";

export { FinancialCard, FinancialCardHeader, FinancialCardFooter, FinancialCardTitle, FinancialCardDescription, FinancialCardContent };