'use client';

/**
 * DemoEmbedDefault Variant Component
 *
 * Domain-Driven Design: Demo embed presentation domain
 * Service Agnostic Abstraction: Pure presentation component
 * Performance Optimization: Performance monitoring
 * SEO Optimization: Semantic HTML, proper heading hierarchy
 * Accessibility: ARIA attributes, semantic HTML
 */

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useTranslation } from '@diboas/i18n/client';
import type { DemoEmbedVariantProps } from '../../types';
import { usePerformanceMonitoring } from '@/lib/monitoring/performance-monitor';
import styles from './DemoEmbedDefault.module.css';

/**
 * DemoEmbedDefault Variant
 *
 * Centered section with header, subtext, and demo embed area.
 *
 * Features:
 * - Performance monitoring with render time tracking
 * - Accessibility with semantic HTML and ARIA attributes
 * - SEO optimization with configurable heading levels
 * - Support for iframe embeds or custom components
 * - Placeholder state when demo is not available
 * - Responsive design with mobile-first approach
 *
 * @param config - Section configuration
 * @param className - Additional CSS class names
 * @param enableAnalytics - Enable analytics tracking
 */
export function DemoEmbedDefault({
  config,
  className = '',
  enableAnalytics = true
}: DemoEmbedVariantProps) {
  const intl = useTranslation();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  // Performance monitoring
  const { recordSectionRenderTime } = usePerformanceMonitoring();

  // Record render time on mount
  useEffect(() => {
    const renderStart = performance.now();

    const recordRenderTime = () => {
      const renderEnd = performance.now();
      const sectionId = config.analytics?.sectionId || 'demo-embed-default';
      recordSectionRenderTime(sectionId, renderEnd - renderStart);
    };

    const timeoutId = setTimeout(recordRenderTime, 0);

    return () => clearTimeout(timeoutId);
  }, [config.analytics?.sectionId, recordSectionRenderTime]);

  // Destructure config
  const { content, demo, seo } = config;
  const HeadingTag = seo.headingLevel || 'h2';

  // Render demo content
  const renderDemoContent = () => {
    // If a custom component is provided, render it with locale
    if (demo?.component) {
      const DemoComponent = demo.component;
      return <DemoComponent locale={locale} />;
    }

    // If an embed URL is provided, render an iframe
    if (demo?.embedUrl) {
      return (
        <iframe
          src={demo.embedUrl}
          className={styles.iframe}
          title={intl.formatMessage({ id: content.header })}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      );
    }

    // Placeholder when no demo is configured
    return (
      <div className={styles.placeholder}>
        <div className={styles.placeholderContent}>
          <span className={styles.placeholderIcon} aria-hidden="true">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          </span>
          <p className={styles.placeholderText}>
            {demo?.placeholder || 'Interactive demo coming soon'}
          </p>
        </div>
      </div>
    );
  };

  return (
    <section
      className={`${styles.section} ${className}`}
      aria-label={seo.ariaLabel || 'Demo section'}
      data-section-id={config.analytics?.sectionId}
      data-analytics-category={config.analytics?.category}
    >
      <div className={styles.container}>
        {/* Header Content */}
        <div className={styles.header}>
          <HeadingTag className={styles.title}>
            {intl.formatMessage({ id: content.header })}
          </HeadingTag>
          <p className={styles.subtext}>
            {intl.formatMessage({ id: content.subtext })}
          </p>
        </div>

        {/* Demo Embed Area */}
        <div className={styles.demoContainer}>
          {renderDemoContent()}
        </div>
      </div>
    </section>
  );
}
