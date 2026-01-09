/**
 * FAQAccordionDefault Variant Component
 *
 * Domain-Driven Design: Isolated default FAQ accordion variant
 * Service Agnostic Abstraction: Pure component focused on FAQ presentation
 * Code Reusability: Can be composed into other FAQ accordion variants
 * Accessibility: Full ARIA support, keyboard navigation, screen reader friendly
 * Performance: Optimized animations and lazy content rendering
 * No Hardcoded Values: Uses design tokens and configuration
 */

'use client';

import { useState, useCallback, useEffect, useRef, KeyboardEvent } from 'react';
import Link from 'next/link';
import { SectionContainer } from '@/components/Sections/SectionContainer';
import type { FAQAccordionVariantProps } from '../types';
import styles from './FAQAccordionDefault.module.css';

/**
 * Note: Config values are pre-translated by the factory using useConfigTranslation.
 * For landing pages, items are provided directly in config and are already translated.
 */
export function FAQAccordionDefault({
  config,
  className = '',
  backgroundColor,
  enableAnalytics = true,
  onExpand,
  onCollapse,
  onCTAClick
}: FAQAccordionVariantProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const itemRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  // Get FAQ items from direct items array (landing pages use this mode)
  // Config is pre-translated by useConfigTranslation in the factory
  const resolvedItems = config.content.items || [];

  const handleToggle = useCallback((id: string) => {
    if (!config.settings.enableAnimations) {
      setExpandedId(prev => {
        const newValue = prev === id ? null : id;
        if (newValue) {
          onExpand?.(id);
        } else if (prev === id) {
          onCollapse?.(id);
        }
        return newValue;
      });
      return;
    }

    setExpandedId(prev => {
      const newExpandedId = prev === id ? null : id;

      // Call callbacks
      if (newExpandedId) {
        onExpand?.(id);
      } else if (prev === id) {
        onCollapse?.(id);
      }

      // Scroll into view if expanding and setting enabled
      if (newExpandedId && config.settings.scrollIntoView) {
        const button = itemRefs.current.get(id);
        if (button) {
          setTimeout(() => {
            button.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }, 100);
        }
      }

      return newExpandedId;
    });
  }, [config.settings.enableAnimations, config.settings.scrollIntoView, onExpand, onCollapse]);

  const handleKeyDown = useCallback((event: KeyboardEvent<HTMLButtonElement>, id: string, index: number) => {
    if (!config.settings.enableKeyboardNav) return;

    const items = Array.from(itemRefs.current.keys());
    let targetIndex = index;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        targetIndex = index + 1;
        if (targetIndex < items.length) {
          itemRefs.current.get(items[targetIndex])?.focus();
        }
        break;

      case 'ArrowUp':
        event.preventDefault();
        targetIndex = index - 1;
        if (targetIndex >= 0) {
          itemRefs.current.get(items[targetIndex])?.focus();
        }
        break;

      case 'Home':
        event.preventDefault();
        itemRefs.current.get(items[0])?.focus();
        break;

      case 'End':
        event.preventDefault();
        itemRefs.current.get(items[items.length - 1])?.focus();
        break;
    }
  }, [config.settings.enableKeyboardNav]);

  // Track analytics on expansion
  useEffect(() => {
    if (expandedId && enableAnalytics && config.analytics?.enabled) {
      // Analytics tracking
      const windowWithGtag = window as Window & { gtag?: (command: string, action: string, params: Record<string, unknown>) => void };
      if (typeof window !== 'undefined' && windowWithGtag.gtag) {
        windowWithGtag.gtag('event', 'faq_expand', {
          event_category: config.analytics.trackingPrefix,
          event_label: expandedId
        });
      }
    }
  }, [expandedId, enableAnalytics, config.analytics]);

  const handleCTAClick = useCallback(() => {
    onCTAClick?.(config.content.ctaHref);
  }, [config.content.ctaHref, onCTAClick]);

  return (
    <SectionContainer
      variant="wide"
      padding="standard"
      backgroundColor={backgroundColor}
      className={className}
      containerClassName={styles.container}
      ariaLabelledBy="faq-heading"
      ariaLabel={config.seo.ariaLabel}
    >
      {/* Left Panel: Intro Content - values are pre-translated */}
        <div className={styles.introPanel}>
          <h2 id="faq-heading" className={styles.heading}>
            {config.content.title}
          </h2>
          <p className={styles.description}>
            {config.content.description}
          </p>
        </div>

        {/* Right Panel: Accordion Items */}
        <div className={styles.accordionPanel} role="region" aria-label="FAQ items">
          {resolvedItems.map((item, index) => {
            const isExpanded = expandedId === item.id;
            const contentId = `faq-content-${item.id}`;

            return (
              <div
                key={item.id}
                className={`${styles.accordionItem} ${isExpanded ? styles.accordionItemExpanded : ''}`}
              >
                <button
                  ref={(el) => {
                    if (el) {
                      itemRefs.current.set(item.id, el);
                    } else {
                      itemRefs.current.delete(item.id);
                    }
                  }}
                  className={styles.accordionHeader}
                  onClick={() => handleToggle(item.id)}
                  onKeyDown={(e) => handleKeyDown(e, item.id, index)}
                  aria-expanded={isExpanded}
                  aria-controls={contentId}
                  aria-label={item.question}
                >
                  <h3 className={styles.question}>
                    {item.question}
                  </h3>
                  <svg
                    className={`${styles.icon} ${isExpanded ? styles.iconExpanded : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <span className={styles.srOnly}>
                    {isExpanded ? 'Collapse' : 'Expand'} question
                  </span>
                </button>
                <div
                  id={contentId}
                  className={`${styles.accordionContent} ${isExpanded ? styles.accordionContentExpanded : ''}`}
                  role="region"
                  aria-labelledby={`faq-header-${item.id}`}
                  hidden={!isExpanded}
                >
                  <p className={styles.answer}>
                    {item.answer}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA Button - Using unified CTA design tokens */}
        <Link
          href={config.content.ctaHref}
          target={config.content.ctaTarget}
          className={styles.ctaButton}
          aria-label={config.content.ctaText}
          onClick={handleCTAClick}
        >
          {config.content.ctaText}
        </Link>
    </SectionContainer>
  );
}
