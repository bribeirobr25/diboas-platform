import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@diboas/ui';

const inputVariants = cva(
  "flex w-full rounded-xl border bg-neutral-50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border-neutral-200 focus-visible:border-primary-500",
        error: "border-semantic-error focus-visible:border-semantic-error focus-visible:ring-semantic-error",
        success: "border-semantic-success focus-visible:border-semantic-success focus-visible:ring-semantic-success",
      },
      size: {
        default: "h-10",
        sm: "h-9 px-2 text-sm",
        lg: "h-12 px-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
  VariantProps<typeof inputVariants> { }

const DiboasInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, size, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(inputVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

DiboasInput.displayName = "DiboasInput";

export { DiboasInput, inputVariants };