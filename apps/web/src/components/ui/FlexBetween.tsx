import React from 'react';
import { cn } from '@/lib/utils';

interface FlexBetweenProps {
  children: React.ReactNode;
  align?: 'start' | 'center' | 'end' | 'stretch';
  className?: string;
  as?: 'div' | 'header' | 'nav' | 'section';
}

const alignClasses = {
  start: 'items-start',
  center: 'items-center', 
  end: 'items-end',
  stretch: 'items-stretch'
};

/**
 * FlexBetween Component
 * 
 * DRY Principle: Consolidates repeated flex layout pattern
 * - `flex items-center justify-between` pattern used 15+ times
 * - Configurable alignment
 * - Semantic HTML element options
 */
export function FlexBetween({
  children,
  align = 'center',
  className,
  as: Component = 'div',
  ...props
}: FlexBetweenProps & React.ComponentProps<'div'>) {
  return (
    <Component
      className={cn(
        'flex justify-between',
        alignClasses[align],
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}