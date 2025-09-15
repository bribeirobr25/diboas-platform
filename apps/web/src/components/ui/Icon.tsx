import React from 'react';
import { cn } from '@/lib/utils';

interface IconProps {
  children: React.ReactNode;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

interface IconContainerProps extends IconProps {
  variant?: 'primary' | 'purple' | 'coral' | 'gray';
  shape?: 'rounded' | 'circle' | 'square';
}

const sizeClasses = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8'
};

const containerSizeClasses = {
  xs: 'w-6 h-6 p-1',
  sm: 'w-8 h-8 p-2',
  md: 'w-10 h-10 p-2.5',
  lg: 'w-12 h-12 p-3',
  xl: 'w-16 h-16 p-4'
};

const variantClasses = {
  primary: 'bg-primary-100 text-primary-600',
  purple: 'bg-secondary-purple-100 text-secondary-purple-600',
  coral: 'bg-secondary-coral-100 text-secondary-coral-600',
  gray: 'bg-gray-100 text-gray-600'
};

const shapeClasses = {
  rounded: 'rounded-lg',
  circle: 'rounded-full',
  square: 'rounded-none'
};

/**
 * Icon Component
 * 
 * DRY Principle: Standardizes icon sizing and styling
 * - Consistent size variants (xs, sm, md, lg, xl)
 * - Proper accessibility attributes
 * - Theme-aware styling
 */
export function Icon({
  children,
  size = 'md',
  className,
  ...props
}: IconProps & React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(sizeClasses[size], className)}
      role="img"
      aria-hidden="true"
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * IconContainer Component
 * 
 * DRY Principle: Consolidates repeated icon container patterns
 * - Background color variants (primary, purple, coral, gray)
 * - Shape variants (rounded, circle, square)
 * - Consistent flex centering
 */
export function IconContainer({
  children,
  size = 'md',
  variant = 'primary',
  shape = 'rounded',
  className,
  ...props
}: IconContainerProps & React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'flex items-center justify-center',
        containerSizeClasses[size],
        variantClasses[variant],
        shapeClasses[shape],
        className
      )}
      role="img"
      aria-hidden="true"
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Pre-built SVG Icons
 */
export const CheckIcon = ({ size = 'sm', className, ...props }: Omit<IconProps, 'children'>) => (
  <svg
    className={cn(sizeClasses[size], className)}
    fill="currentColor"
    viewBox="0 0 20 20"
    aria-hidden="true"
    {...props}
  >
    <path
      fillRule="evenodd"
      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
      clipRule="evenodd"
    />
  </svg>
);

export const BankIcon = ({ size = 'xl', className, ...props }: Omit<IconProps, 'children'>) => (
  <svg
    className={cn(sizeClasses[size], 'text-primary-600', className)}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
    />
  </svg>
);

export const TrendingUpIcon = ({ size = 'xl', className, ...props }: Omit<IconProps, 'children'>) => (
  <svg
    className={cn(sizeClasses[size], 'text-secondary-purple-600', className)}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
    />
  </svg>
);

export const CurrencyIcon = ({ size = 'xl', className, ...props }: Omit<IconProps, 'children'>) => (
  <svg
    className={cn(sizeClasses[size], 'text-secondary-coral-600', className)}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
    />
  </svg>
);

export const StarIcon = ({ size = 'md', filled = true, className, ...props }: Omit<IconProps, 'children'> & { filled?: boolean }) => (
  <svg
    className={cn(sizeClasses[size], filled ? 'text-yellow-400' : 'text-gray-300', className)}
    fill="currentColor"
    viewBox="0 0 20 20"
    aria-hidden="true"
    {...props}
  >
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

export const ShieldIcon = ({ size = 'xl', className, ...props }: Omit<IconProps, 'children'>) => (
  <svg
    className={cn(sizeClasses[size], className)}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
    />
  </svg>
);

/**
 * StarRating Component
 * 
 * DRY Principle: Consolidates star rating display
 */
export function StarRating({
  rating = 5,
  maxRating = 5,
  size = 'md',
  className,
  ...props
}: {
  rating?: number;
  maxRating?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
} & React.ComponentProps<'div'>) {
  return (
    <div className={cn('flex items-center space-x-1', className)} {...props}>
      {[...Array(maxRating)].map((_, i) => (
        <StarIcon
          key={i}
          size={size}
          filled={i < rating}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}