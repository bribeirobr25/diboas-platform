'use client';

import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils/cn';

// Form-control subset of Button's variants/sizes per
// POST_HISTORICAL_CALIBRATION_PENDING_PLAN_2026-05-17 §2.4 + M1 audit lock.
// Variants: outline (default — neutral form-control convention) + ghost.
// Sizes: sm, default, lg (skip xs, xl, icon — not needed for form controls).
const selectVariants = cva(
  'select-base',
  {
    variants: {
      variant: {
        outline: 'select-outline',
        ghost: 'select-ghost',
      },
      size: {
        sm: 'select-sm',
        default: 'select-default',
        lg: 'select-lg',
      },
      invalid: {
        true: 'select-invalid',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'outline',
      size: 'default',
      invalid: false,
    },
  }
);

// `size` is omitted from SelectHTMLAttributes because HTMLSelectElement.size
// (visible-row-count for multi-select) collides with our cva variant `size`
// (sm/default/lg). Form-control use cases overwhelmingly want our styling
// `size`; consumers needing the HTML row-count attribute can set it via
// raw DOM ref. Same pattern Button doesn't need because ButtonHTMLAttributes
// has no `size` field.
export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'>,
    VariantProps<typeof selectVariants> {
  'aria-label'?: string;
  'aria-describedby'?: string;

  // Analytics: optional tracking hook (mirrors Button's analytics surface).
  // Consumer wires the emit; primitive only fires gtag in browsers when set.
  trackingEvent?: string;
  trackingProps?: Record<string, unknown>;
}

/**
 * Accessible Select Primitive
 *
 * Native `<select>` styled via `appearance: none` — preserves native keyboard
 * semantics (arrow keys, type-to-search, Home/End), mobile picker UI, and
 * free WCAG 2.1 AA accessibility. NOT a custom popover/combobox; that path is
 * a deferred carry-forward (see plan §8) since no current consumer needs
 * type-to-search or multi-select.
 *
 * API mirrors Button precedent: cva + forwardRef + optional analytics hook.
 * Defaults `variant='outline'`, `size='default'` — outline matches the
 * neutral-form-control convention and aligns visually with Button's outline.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      variant,
      size,
      invalid,
      trackingEvent,
      trackingProps,
      onChange,
      children,
      'aria-label': ariaLabel,
      'aria-describedby': ariaDescribedBy,
      'aria-invalid': ariaInvalidOverride,
      ...props
    },
    ref,
  ) => {
    // Analytics: tracking fires AFTER consumer's onChange so the consumer owns
    // the canonical event flow. Failure to track must not break selection.
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (trackingEvent && typeof window !== 'undefined') {
        try {
          const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
          if (gtag) {
            gtag('event', trackingEvent, {
              event_category: 'Select',
              event_label: ariaLabel,
              value: e.target.value,
              ...trackingProps,
            });
          }
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('Select analytics tracking failed:', error);
          }
        }
      }

      onChange?.(e);
    };

    const needsChangeHandler = Boolean(trackingEvent) || Boolean(onChange);
    const changeHandler = needsChangeHandler ? handleChange : undefined;

    return (
      <select
        className={cn(selectVariants({ variant, size, invalid, className }))}
        ref={ref}
        onChange={changeHandler}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        aria-invalid={ariaInvalidOverride ?? (invalid ? true : undefined)}
        {...props}
      >
        {children}
      </select>
    );
  },
);

Select.displayName = 'Select';

export { selectVariants };
