/**
 * SectionContainer Component
 *
 * Unified section wrapper component that eliminates ~300 lines of repeated boilerplate
 *
 * Domain-Driven Design: Centralized section container logic
 * Code Reusability: Single source of truth for section/container patterns
 * No Hardcoded Values: Uses semantic design tokens for padding and max-widths
 * Accessibility: Built-in ARIA support and semantic HTML
 *
 * Architecture Pattern: Follows the same factory/variant pattern as other sections
 *
 * @example
 * ```tsx
 * // Standard section (1200px container, standard padding)
 * <SectionContainer variant="standard" padding="standard">
 *   <YourContent />
 * </SectionContainer>
 *
 * // Wide section with custom background (1400px container)
 * <SectionContainer
 *   variant="wide"
 *   padding="standard"
 *   backgroundColor="#f8f9fa"
 * >
 *   <YourContent />
 * </SectionContainer>
 *
 * // Hero section (standard container, no padding)
 * <SectionContainer variant="standard" padding="hero-nav">
 *   <YourHeroContent />
 * </SectionContainer>
 * ```
 */

'use client';

import { memo } from 'react';
import type { SectionContainerProps } from './types';
import styles from './SectionContainer.module.css';

export const SectionContainer = memo(function SectionContainer({
  children,
  variant = 'standard',
  padding = 'standard',
  backgroundColor,
  className = '',
  containerClassName = '',
  ariaLabel,
  ariaLabelledBy,
  role,
  as: Element = 'section',
  style,
  'data-testid': testId
}: SectionContainerProps) {
  // Map padding variant to CSS class
  const paddingClass = {
    standard: styles.sectionStandard,
    'hero-nav': styles.sectionHeroNav,
    none: styles.sectionNone
  }[padding];

  // Map container variant to CSS class
  const containerVariantClass = {
    standard: styles.containerStandard,
    wide: styles.containerWide,
    narrow: styles.containerNarrow
  }[variant];

  // Combine section classes
  const sectionClasses = `${styles.section} ${paddingClass} ${className}`.trim();

  // Combine container classes
  const containerClasses = `${styles.container} ${containerVariantClass} ${containerClassName}`.trim();

  // Merge custom styles with backgroundColor override
  const sectionStyle = {
    ...style,
    ...(backgroundColor && { backgroundColor })
  };

  return (
    <Element
      className={sectionClasses}
      style={Object.keys(sectionStyle).length > 0 ? sectionStyle : undefined}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      role={role}
      data-testid={testId}
    >
      <div className={containerClasses}>
        {children}
      </div>
    </Element>
  );
});

/**
 * Display name for React DevTools
 */
SectionContainer.displayName = 'SectionContainer';
