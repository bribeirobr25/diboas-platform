import React from 'react';
import { cn } from '@/lib/utils';

interface GridLayoutProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4 | 6;
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  alignItems?: 'start' | 'center' | 'end' | 'stretch';
  className?: string;
}

const columnClasses = {
  1: 'grid-1-col',
  2: 'grid-2-col',
  3: 'grid-3-col',
  4: 'grid-4-col',
  6: 'grid-6-col'
};

const gapClasses = {
  sm: 'grid-gap-sm',
  md: 'grid-gap-md',
  lg: 'grid-gap-lg',
  xl: 'grid-gap-xl'
};

const alignClasses = {
  start: 'grid-align-start',
  center: 'grid-align-center',
  end: 'grid-align-end',
  stretch: 'grid-align-stretch'
};

/**
 * GridLayout Components
 * 
 * DRY Principle: Consolidates repeated grid layout patterns
 * - Responsive grid layouts (1, 2, 3, 4, 6 columns)
 * - Consistent gap spacing
 * - Item alignment options
 * - Mobile-first responsive design
 */
export function GridLayout({
  children,
  columns = 3,
  gap = 'lg',
  alignItems = 'start',
  className,
  ...props
}: GridLayoutProps & React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'grid-base',
        columnClasses[columns],
        gapClasses[gap],
        alignItems !== 'start' && alignClasses[alignItems],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * TwoColumnGrid - Commonly used 2-column layout
 */
export function TwoColumnGrid({
  children,
  gap = 'xl',
  alignItems = 'center',
  className,
  ...props
}: Omit<GridLayoutProps, 'columns'> & React.ComponentProps<'div'>) {
  return (
    <GridLayout
      columns={2}
      gap={gap}
      alignItems={alignItems}
      className={className}
      {...props}
    >
      {children}
    </GridLayout>
  );
}

/**
 * ThreeColumnGrid - Commonly used 3-column layout  
 */
export function ThreeColumnGrid({
  children,
  gap = 'lg',
  className,
  ...props
}: Omit<GridLayoutProps, 'columns'> & React.ComponentProps<'div'>) {
  return (
    <GridLayout
      columns={3}
      gap={gap}
      className={className}
      {...props}
    >
      {children}
    </GridLayout>
  );
}