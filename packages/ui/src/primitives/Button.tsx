'use client';

import { forwardRef } from 'react';
// import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils/cn';

// Performance & SEO: Semantic button variants with clear naming
const buttonVariants = cva(
  // Accessibility: Base styles include focus management and screen reader support
  'btn-base',
  {
    variants: {
      variant: {
        primary: 'btn-primary',
        secondary: 'btn-secondary',
        outline: 'btn-outline',
        ghost: 'btn-ghost',
        link: 'btn-link',
        gradient: 'btn-gradient',
        destructive: 'btn-destructive',
      },
      size: {
        xs: 'btn-xs',
        sm: 'btn-sm',
        default: 'btn-default',
        lg: 'btn-lg',
        xl: 'btn-xl',
        icon: 'btn-icon',
      },
      // Analytics: Track interaction states
      trackable: {
        true: 'data-trackable="true"',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
      trackable: false,
    },
  }
);

// DRY Principle: Comprehensive button interface
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  // Accessibility: Required for screen readers
  'aria-label'?: string;
  'aria-describedby'?: string;

  // Performance: Render as different element
  // asChild?: boolean;

  // Analytics: Track user interactions
  trackingEvent?: string;
  trackingProps?: Record<string, any>;

  // SEO: UTM parameters for marketing
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;

  // Loading state for async operations
  loading?: boolean;
  loadingText?: string; // Must be provided by consumer for i18n support
}

/**
 * Accessible Button Component
 * 
 * Follows WCAG 2.1 AA standards and includes:
 * - Keyboard navigation support
 * - Screen reader compatibility
 * - Focus management
 * - Loading states
 * - Analytics tracking
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant,
    size,
    trackable,
    // asChild = false,
    trackingEvent,
    trackingProps,
    utmSource,
    utmMedium,
    utmCampaign,
    loading = false,
    loadingText,
    disabled,
    onClick,
    children,
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedBy,
    ...props
  }, ref) => {

    // Analytics: Track button interactions with error handling
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (trackingEvent && typeof window !== 'undefined') {
        try {
          // Product KPIs: Track user interactions
          const gtag = (window as any).gtag;
          if (gtag) {
            gtag('event', trackingEvent, {
              event_category: 'Button',
              event_label: ariaLabel || children?.toString(),
              utm_source: utmSource,
              utm_medium: utmMedium,
              utm_campaign: utmCampaign,
              ...trackingProps,
            });
          }
        } catch (error) {
          // Analytics failures should not break button functionality
          if (process.env.NODE_ENV === 'development') {
            console.warn('Button analytics tracking failed:', error);
          }
        }
      }

      onClick?.(e);
    };

    // Only add onClick if we have tracking or an existing onClick handler
    const needsClickHandler = trackingEvent || onClick;
    const clickHandler = needsClickHandler ? handleClick : undefined;


    const Comp = 'button';

    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size, trackable, className }),
          loading && 'cursor-wait'
        )}
        ref={ref}
        disabled={disabled || loading}
        onClick={clickHandler}
        aria-label={loading && loadingText ? loadingText : ariaLabel}
        aria-describedby={ariaDescribedBy}
        {...props}
      >
        {/* Loading state indicator */}
        {loading && (
          <svg
            className="btn-spinner"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="spinner-circle"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="spinner-path"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}

        {/* Button content */}
        <span className={loading ? 'btn-content-loading' : 'btn-content'}>
          {loading && loadingText ? loadingText : children}
        </span>
      </Comp>
    );
  }
);

Button.displayName = 'Button';

// Export variants for external usage
export { buttonVariants };