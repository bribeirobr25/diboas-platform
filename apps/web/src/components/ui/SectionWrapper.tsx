import React from 'react';
import { cn } from '@/lib/utils';
import { Container } from './Container';

interface SectionWrapperProps {
  children: React.ReactNode;
  className?: string;
  background?: 'white' | 'gray' | 'gradient' | 'dark';
  spacing?: 'sm' | 'md' | 'lg' | 'xl';
  containerSize?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  noPadding?: boolean;
}

const backgroundClasses = {
  white: 'bg-white',
  gray: 'bg-gray-50',
  gradient: 'bg-gradient-to-br from-teal-50 to-white',
  dark: 'bg-gray-900'
};

const spacingClasses = {
  sm: 'py-12',
  md: 'py-16', 
  lg: 'py-20',
  xl: 'py-24'
};

/**
 * SectionWrapper Component
 * 
 * DRY Principle: Consolidates repeated section layout patterns
 * - Consistent vertical spacing (py-20, py-16, etc.)
 * - Background variants
 * - Container wrapping
 * - Semantic section structure
 */
export function SectionWrapper({
  children,
  className,
  background = 'white',
  spacing = 'lg',
  containerSize = 'lg',
  noPadding = false,
  ...props
}: SectionWrapperProps & React.ComponentProps<'section'>) {
  return (
    <section
      className={cn(
        backgroundClasses[background],
        !noPadding && spacingClasses[spacing],
        className
      )}
      {...props}
    >
      <Container size={containerSize}>
        {children}
      </Container>
    </section>
  );
}