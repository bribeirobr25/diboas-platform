'use client';

/**
 * Higher-Order Component for Section Error Boundary
 *
 * Service Agnostic Abstraction: Easy integration with any section component
 */

import React from 'react';
import { SectionErrorBoundary } from './SectionErrorBoundary';
import type { SectionErrorBoundaryProps } from './types';

/**
 * Higher-Order Component for wrapping sections with error boundary
 */
export function withSectionErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  sectionId: string,
  sectionType: string,
  options?: Omit<SectionErrorBoundaryProps, 'children' | 'sectionId' | 'sectionType'>
) {
  const WrappedWithErrorBoundary = (props: P) => {
    return (
      <SectionErrorBoundary
        sectionId={sectionId}
        sectionType={sectionType}
        {...options}
      >
        <WrappedComponent {...props} />
      </SectionErrorBoundary>
    );
  };

  WrappedWithErrorBoundary.displayName = `withSectionErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WrappedWithErrorBoundary;
}
