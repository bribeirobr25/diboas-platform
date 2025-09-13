/**
 * DRY Principle: Centralized container component
 * 
 * Eliminates repeated max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 patterns
 * across the application for consistent layout and easier maintenance
 */

import { cn } from '@diboas/ui';

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  noPadding?: boolean;
}

const containerSizes = {
  sm: 'max-w-3xl',
  md: 'max-w-5xl', 
  lg: 'max-w-7xl',
  xl: 'max-w-screen-2xl',
  full: 'max-w-none'
} as const;

export function Container({ 
  className, 
  size = 'lg', 
  noPadding = false,
  children, 
  ...props 
}: ContainerProps) {
  return (
    <div
      className={cn(
        'mx-auto',
        containerSizes[size],
        !noPadding && 'px-4 sm:px-6 lg:px-8',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}