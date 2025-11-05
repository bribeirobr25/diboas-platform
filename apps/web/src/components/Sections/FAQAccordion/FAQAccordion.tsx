/**
 * FAQ Accordion Section Component
 *
 * Domain-Driven Design: FAQ domain with accessible accordion pattern
 * Service Agnostic Abstraction: Decoupled from specific FAQ content
 * Code Reusability: Reusable accordion component with configuration
 * Accessibility: Full ARIA support, keyboard navigation, screen reader friendly
 * Performance: Optimized animations and lazy content rendering
 */

'use client';

import { useState, useCallback, useEffect, useRef, KeyboardEvent } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import Link from 'next/link';
import type { FAQAccordionConfig } from '@/config/faqAccordion';
import styles from './FAQAccordion.module.css';

export interface FAQAccordionProps {
  readonly config: FAQAccordionConfig;
  readonly className?: string;
}

export function FAQAccordion({ config, className = '' }: FAQAccordionProps) {
  const intl = useTranslation();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const itemRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  // Resolve FAQ items from either registry (new mode) or direct items (legacy mode)
  const resolvedItems = (() => {
    // Registry mode: questionIds references centralized FAQ registry
    if (config.content.questionIds) {
      const questionIdsKey = config.content.questionIds as any as string;

      // If it's a translation key string, we need to access the raw array value
      if (typeof questionIdsKey === 'string' && questionIdsKey.startsWith('marketing.')) {
        // The messages object is FLATTENED with dot-notation keys
        // e.g., messages["marketing.pages.benefits.faqAccordion.questionIds"]
        // NOT a nested structure like messages.marketing.pages.benefits...

        let questionIds: string[] = [];
        try {
          // @ts-ignore - accessing internal messages structure
          const messages = intl.messages;

          // The flattenMessages function flattens arrays into individual keys with numeric indices
          // Reconstruct the array by looking for keys with numeric indices
          const baseKey = questionIdsKey;
          let index = 0;
          const reconstructedArray: string[] = [];

          while (true) {
            const indexedKey = `${baseKey}.${index}`;
            const value = messages[indexedKey];

            if (value === undefined) {
              break; // No more elements
            }

            reconstructedArray.push(value);
            index++;
          }

          questionIds = reconstructedArray;
        } catch (error) {
          console.error('Error accessing questionIds:', error);
          questionIds = [];
        }

        // Resolve each question ID from the registry
        return questionIds.map((qId: string) => ({
          id: qId,
          question: `marketing.faq.registry.${qId}.question`,
          answer: `marketing.faq.registry.${qId}.answer`,
          category: 'getting-started' as const
        }));
      }

      // Direct questionIds array (shouldn't happen with current setup)
      return config.content.questionIds.map(qId => ({
        id: qId,
        question: `marketing.faq.registry.${qId}.question`,
        answer: `marketing.faq.registry.${qId}.answer`,
        category: 'getting-started' as const
      }));
    }

    // Legacy mode: direct items array (for landing page backwards compatibility)
    return config.content.items || [];
  })();

  const handleToggle = useCallback((id: string) => {
    if (!config.settings.enableAnimations) {
      setExpandedId(prev => prev === id ? null : id);
      return;
    }

    setExpandedId(prev => {
      const newExpandedId = prev === id ? null : id;

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
  }, [config.settings.enableAnimations, config.settings.scrollIntoView]);

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
    if (expandedId && config.analytics?.enabled) {
      // Analytics tracking would go here
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'faq_expand', {
          event_category: config.analytics.trackingPrefix,
          event_label: expandedId
        });
      }
    }
  }, [expandedId, config.analytics]);

  return (
    <section
      className={`${styles.section} ${className}`}
      aria-labelledby="faq-heading"
      aria-label={config.seo.ariaLabel}
    >
      <div className={styles.container}>
        {/* Left Panel: Intro Content */}
        <div className={styles.introPanel}>
          <h2 id="faq-heading" className={styles.heading}>
            {intl.formatMessage({ id: config.content.title })}
          </h2>
          <p className={styles.description}>
            {intl.formatMessage({ id: config.content.description })}
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
                  aria-label={intl.formatMessage({ id: item.question })}
                >
                  <h3 className={styles.question}>
                    {intl.formatMessage({ id: item.question })}
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
                    {intl.formatMessage({ id: item.answer })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA Button */}
        <Link
          href={config.content.ctaHref}
          target={config.content.ctaTarget}
          className={styles.ctaButton}
          aria-label={intl.formatMessage({ id: config.content.ctaText })}
        >
          {intl.formatMessage({ id: config.content.ctaText })}
        </Link>
      </div>
    </section>
  );
}
