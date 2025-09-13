import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

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
    className={cn("flex flex-col space-y-1.5", className)}
    {...props}
  />
));

const FinancialCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-heading font-semibold leading-none tracking-tight text-neutral-900", className)}
    {...props}
  />
));

const FinancialCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-body text-neutral-600", className)}
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
    className={cn("flex items-center pt-4", className)}
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