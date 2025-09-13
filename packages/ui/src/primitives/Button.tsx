'use client';

import { forwardRef } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { useButton } from '@react-aria/button';
import { useFocusRing } from '@react-aria/focus';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils/cn';

// Performance & SEO: Semantic button variants with clear naming
const buttonVariants = cva(
  // Accessibility: Base styles include focus management and screen reader support
  'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-primary-500 text-white hover:bg-primary-600 shadow-md hover:shadow-lg',
        secondary: 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200 border border-neutral-200',
        outline: 'border border-primary-500 text-primary-500 bg-transparent hover:bg-primary-50',
        ghost: 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',
        link: 'text-primary-500 underline-offset-4 hover:underline p-0',
        gradient: 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 shadow-lg hover:shadow-xl',
        destructive: 'bg-semantic-error text-white hover:bg-red-600',
      },
      size: {
        xs: 'h-8 px-3 text-xs',
        sm: 'h-9 px-3',
        default: 'h-10 px-4 py-2',
        lg: 'h-12 px-8',
        xl: 'h-14 px-10 text-base',
        icon: 'h-10 w-10',
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
  asChild?: boolean;
  
  // Analytics: Track user interactions
  trackingEvent?: string;
  trackingProps?: Record<string, any>;
  
  // SEO: UTM parameters for marketing
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  
  // Loading state for async operations
  loading?: boolean;
  loadingText?: string;
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
    asChild = false,
    trackingEvent,
    trackingProps,
    utmSource,
    utmMedium,
    utmCampaign,
    loading = false,
    loadingText = 'Loading...',
    disabled,
    onClick,
    href,
    children,
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedBy,
    ...props 
  }, ref) => {
    // Accessibility: React Aria hooks for proper button behavior
    const { buttonProps, isPressed } = useButton(
      {
        isDisabled: disabled || loading,
        onPress: onClick,
        'aria-label': loading ? loadingText : ariaLabel,
        'aria-describedby': ariaDescribedBy,
      },
      ref
    );
    
    // Accessibility: Focus ring management
    const { focusProps, isFocusVisible } = useFocusRing();

    // Analytics: Track button interactions
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (trackingEvent && typeof window !== 'undefined') {
        // Product KPIs: Track user interactions
        window.gtag?.('event', trackingEvent, {
          event_category: 'Button',
          event_label: ariaLabel || children?.toString(),
          utm_source: utmSource,
          utm_medium: utmMedium,
          utm_campaign: utmCampaign,
          ...trackingProps,
        });
      }
      
      onClick?.(e);
    };

    // Security: Sanitize UTM parameters
    const cleanUtmParams = () => {
      const params = new URLSearchParams();
      if (utmSource) params.append('utm_source', utmSource.replace(/[^\w-]/g, ''));
      if (utmMedium) params.append('utm_medium', utmMedium.replace(/[^\w-]/g, ''));
      if (utmCampaign) params.append('utm_campaign', utmCampaign.replace(/[^\w-]/g, ''));
      return params.toString() ? `?${params.toString()}` : '';
    };

    const Comp = asChild ? Slot : 'button';

    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size, trackable, className }),
          // Accessibility: Enhanced focus indicators
          isFocusVisible && 'ring-2 ring-primary-500 ring-offset-2',
          isPressed && 'transform scale-95',
          loading && 'cursor-wait'
        )}
        ref={ref}
        disabled={disabled || loading}
        onClick={handleClick}
        // Performance: Add UTM parameters to href if provided
        href={href ? `${href}${cleanUtmParams()}` : undefined}
        // Accessibility: Merge React Aria props
        {...buttonProps}
        {...focusProps}
        {...props}
      >
        {/* Loading state indicator */}
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        
        {/* Button content */}
        <span className={loading ? 'opacity-70' : ''}>
          {loading ? loadingText : children}
        </span>
      </Comp>
    );
  }
);

Button.displayName = 'Button';

// Export variants for external usage
export { buttonVariants };
export type { ButtonProps };