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
  sm: 'container-sm',
  md: 'container-md', 
  lg: 'container-lg',
  xl: 'container-xl',
  full: 'container-full'
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
        'content-container',
        containerSizes[size],
        noPadding && 'container-no-padding',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}