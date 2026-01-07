/**
 * PageHeroSection Component
 *
 * Reusable dark gradient hero section for content pages
 * Replaces inline Tailwind patterns across Strategies, FutureYou, About pages
 *
 * Domain-Driven Design: Centralized page hero presentation
 * Code Reusability: Single source of truth for page hero styling
 * No Hardcoded Values: Uses design tokens and i18n
 * Accessibility: Semantic HTML with proper heading hierarchy
 */

'use client';

import { memo } from 'react';
import { SectionContainer } from '@/components/Sections/SectionContainer';
import styles from './PageHeroSection.module.css';

export interface PageHeroSectionProps {
  /** Main headline (H1) */
  headline: string;
  /** Primary subheadline (larger, lighter) */
  subheadline?: string;
  /** Secondary subheadline (smaller, dimmer) */
  subheadline2?: string;
  /** Content alignment */
  align?: 'center' | 'left';
  /** Additional CSS class */
  className?: string;
  /** Data test ID for testing */
  'data-testid'?: string;
}

export const PageHeroSection = memo(function PageHeroSection({
  headline,
  subheadline,
  subheadline2,
  align = 'center',
  className = '',
  'data-testid': testId
}: PageHeroSectionProps) {
  const alignmentClass = align === 'center' ? styles.alignCenter : styles.alignLeft;

  return (
    <SectionContainer
      variant="standard"
      padding="standard"
      className={`${styles.hero} ${className}`}
      ariaLabel="Page hero section"
      data-testid={testId}
    >
      <div className={`${styles.content} ${alignmentClass}`}>
        <h1 className={styles.headline}>
          {headline}
        </h1>
        {subheadline && (
          <p className={styles.subheadline}>
            {subheadline}
          </p>
        )}
        {subheadline2 && (
          <p className={styles.subheadline2}>
            {subheadline2}
          </p>
        )}
      </div>
    </SectionContainer>
  );
});

PageHeroSection.displayName = 'PageHeroSection';
