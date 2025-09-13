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
  1: 'grid-cols-1',
  2: 'grid-cols-1 lg:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  6: 'grid-cols-1 md:grid-cols-3 lg:grid-cols-6'
};

const gapClasses = {
  sm: 'gap-4',
  md: 'gap-6',
  lg: 'gap-8',
  xl: 'gap-12'
};

const alignClasses = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch'
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
        'grid',
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