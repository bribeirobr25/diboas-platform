'use client';

/**
 * StepGuideDefault Variant Component
 *
 * Domain-Driven Design: Step-by-step guide presentation domain
 * Service Agnostic Abstraction: Pure presentation component
 * Performance Optimization: Performance monitoring
 * SEO Optimization: Semantic HTML, proper heading hierarchy
 * Accessibility: ARIA attributes, semantic HTML, ordered list structure
 */

import { useEffect } from 'react';
import type { StepGuideVariantProps, Step } from '../../types';
import { usePerformanceMonitoring } from '@/lib/monitoring/performance-monitor';
import styles from './StepGuideDefault.module.css';

/**
 * Individual Step Row Component
 */
function StepRow({ step }: { step: Step }) {
  return (
    <li className={styles.stepRow}>
      <span className={styles.stepNumber} aria-hidden="true">
        {step.number}
      </span>
      <span className={styles.stepText}>
        {step.text}
      </span>
    </li>
  );
}

/**
 * StepGuideDefault Variant
 *
 * Step-by-step guide section with numbered instructions in a white rounded container.
 *
 * Features:
 * - Performance monitoring with render time tracking
 * - Accessibility with semantic HTML and ordered list
 * - SEO optimization with configurable heading levels
 * - Responsive design with mobile-first approach
 * - White rounded background for steps container
 *
 * @param config - Section configuration
 * @param className - Additional CSS class names
 * @param enableAnalytics - Enable analytics tracking
 */
export function StepGuideDefault({
  config,
  className = '',
  enableAnalytics = true
}: StepGuideVariantProps) {
  // Performance monitoring
  const { recordSectionRenderTime } = usePerformanceMonitoring();

  // Record render time on mount
  useEffect(() => {
    if (!enableAnalytics) return;

    const renderStart = performance.now();

    const recordRenderTime = () => {
      const renderEnd = performance.now();
      const sectionId = config.analytics?.sectionId || 'step-guide-default';
      recordSectionRenderTime(sectionId, renderEnd - renderStart);
    };

    const timeoutId = setTimeout(recordRenderTime, 0);

    return () => clearTimeout(timeoutId);
  }, [config.analytics?.sectionId, recordSectionRenderTime, enableAnalytics]);

  // Destructure config
  const { content, seo } = config;
  const HeadingTag = seo.headingLevel || 'h2';

  return (
    <section
      className={`${styles.section} ${className}`}
      aria-label={seo.ariaLabel || 'Step-by-step guide'}
      data-section-id={config.analytics?.sectionId}
      data-analytics-category={config.analytics?.category}
    >
      <div className={styles.container}>
        <div className={styles.content}>
          {/* Section Title */}
          <HeadingTag className={styles.title}>
            {content.title}
          </HeadingTag>

          {/* Steps Container */}
          <div className={styles.stepsContainer}>
            {/* Ordered list for semantic HTML and accessibility */}
            <ol className={styles.stepsList}>
              {content.steps.map((step) => (
                <StepRow key={step.id} step={step} />
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
