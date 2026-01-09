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
import { resolveFAQItems, trackFAQExpand } from './faqUtils';
import { AccordionItem } from './AccordionItem';
import styles from './FAQAccordion.module.css';

export interface FAQAccordionProps {
  readonly config: FAQAccordionConfig;
  readonly className?: string;
}

export function FAQAccordion({ config, className = '' }: FAQAccordionProps) {
  const intl = useTranslation();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const itemRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const resolvedItems = resolveFAQItems(config, intl);

  const handleToggle = useCallback((id: string) => {
    if (!config.settings.enableAnimations) {
      setExpandedId(prev => prev === id ? null : id);
      return;
    }

    setExpandedId(prev => {
      const newExpandedId = prev === id ? null : id;

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

  const setItemRef = useCallback((id: string, el: HTMLButtonElement | null) => {
    if (el) {
      itemRefs.current.set(id, el);
    } else {
      itemRefs.current.delete(id);
    }
  }, []);

  useEffect(() => {
    if (expandedId && config.analytics?.enabled) {
      trackFAQExpand(expandedId, config.analytics.trackingPrefix);
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
          {resolvedItems.map((item, index) => (
            <AccordionItem
              key={item.id}
              item={item}
              index={index}
              isExpanded={expandedId === item.id}
              onToggle={handleToggle}
              onKeyDown={handleKeyDown}
              setRef={setItemRef}
            />
          ))}
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
