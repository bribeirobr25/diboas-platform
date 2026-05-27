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

import { useState, useCallback, useEffect, useRef, useMemo, KeyboardEvent } from 'react';
import { sanitizeHtml } from '@/lib/security/htmlSanitizer';
import { SectionContainer } from '@/components/Sections/SectionContainer';
import type { FAQAccordionVariantProps } from '../types';
import styles from './FAQAccordionDefault.module.css';

const HTML_TAG_REGEX = /<[a-z][\s\S]*>/i;

/**
 * FAQ Answer renderer with HTML support
 * Detects HTML tags and renders safely via DOMPurify
 * Falls back to multi-paragraph plain text rendering
 */
function FAQAnswer({ answer, className }: { answer: string; className: string }) {
  const containsHtml = useMemo(() => HTML_TAG_REGEX.test(answer), [answer]);

  if (containsHtml) {
    const sanitized = sanitizeHtml(answer);
    return (
      <div
        className={className}
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: sanitized }}
      />
    );
  }

  // Plain text with paragraph splitting
  const paragraphs = answer.split('\n\n');
  if (paragraphs.length > 1) {
    return (
      <div className={className}>
        {paragraphs.map((p, i) => (
          // Stable: paragraphs come from a static FAQ answer string split on \n\n.
          // eslint-disable-next-line react/no-array-index-key
          <p key={i} className={styles.answerParagraph}>
            {p}
          </p>
        ))}
      </div>
    );
  }

  return <div className={className}>{answer}</div>;
}

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
}: FAQAccordionVariantProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const itemRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // Clear scroll timer on unmount
  useEffect(() => {
    return () => clearTimeout(scrollTimerRef.current);
  }, []);

  // Get FAQ items from direct items array (landing pages use this mode)
  // Config is pre-translated by useConfigTranslation in the factory
  const resolvedItems = config.content.items || [];

  const handleToggle = useCallback(
    (id: string) => {
      if (!config.settings.enableAnimations) {
        setExpandedId((prev) => {
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

      setExpandedId((prev) => {
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
            clearTimeout(scrollTimerRef.current);
            scrollTimerRef.current = setTimeout(() => {
              button.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 100);
          }
        }

        return newExpandedId;
      });
    },
    [config.settings.enableAnimations, config.settings.scrollIntoView, onExpand, onCollapse]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, id: string, index: number) => {
      if (!config.settings.enableKeyboardNav) return;

      const items = Array.from(itemRefs.current.keys());
      let targetIndex;

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
    },
    [config.settings.enableKeyboardNav]
  );

  // Track analytics on expansion (consent-gated via analyticsService)
  useEffect(() => {
    if (expandedId && enableAnalytics && config.analytics?.enabled) {
      import('@/lib/analytics')
        .then(({ analyticsService }) => {
          analyticsService.track({
            name: 'faq_expand',
            parameters: {
              event_category: config.analytics!.trackingPrefix,
              event_label: expandedId,
            },
          });
        })
        .catch(() => {});
    }
  }, [expandedId, enableAnalytics, config.analytics]);

  return (
    <SectionContainer
      variant="wide"
      padding="standard"
      backgroundColor={backgroundColor}
      className={className}
      containerClassName={styles.container}
      ariaLabelledBy={`faq-heading-${config.seo.region}`}
      ariaLabel={config.seo.ariaLabel}
    >
      {/* Left Panel: Intro Content - values are pre-translated */}
      <div className={styles.introPanel}>
        <h2 id={`faq-heading-${config.seo.region}`} className={styles.heading}>
          {config.content.title}
        </h2>
        {config.content.description ? (
          <p className={styles.description}>{config.content.description}</p>
        ) : null}
      </div>

      {/* Right Panel: Accordion Items */}
      <div className={styles.accordionPanel} role="region" aria-label={config.seo.ariaLabel}>
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
                <h3 className={styles.question}>{item.question}</h3>
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
                {/* aria-expanded on the button already communicates state to screen readers */}
              </button>
              <div
                id={contentId}
                className={`${styles.accordionContent} ${isExpanded ? styles.accordionContentExpanded : ''}`}
                role="region"
                aria-labelledby={`faq-header-${item.id}`}
                hidden={!isExpanded}
              >
                <FAQAnswer answer={item.answer} className={styles.answer} />
              </div>
            </div>
          );
        })}
      </div>
    </SectionContainer>
  );
}
