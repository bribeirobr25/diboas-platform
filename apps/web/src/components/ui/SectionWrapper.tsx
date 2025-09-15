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
  white: 'section-white',
  gray: 'section-gray',
  gradient: 'section-gradient',
  dark: 'section-dark'
};

const spacingClasses = {
  sm: 'section-spacing-sm',
  md: 'section-spacing-md',
  lg: 'section-spacing-lg',
  xl: 'section-spacing-xl'
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