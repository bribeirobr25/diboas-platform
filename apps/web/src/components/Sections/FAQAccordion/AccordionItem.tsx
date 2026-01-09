'use client';

/**
 * FAQ Accordion Item Component
 *
 * Individual accordion item with accessibility support
 */

import { KeyboardEvent } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import type { ResolvedFAQItem } from './faqUtils';
import styles from './FAQAccordion.module.css';

interface AccordionItemProps {
  item: ResolvedFAQItem;
  index: number;
  isExpanded: boolean;
  onToggle: (id: string) => void;
  onKeyDown: (e: KeyboardEvent<HTMLButtonElement>, id: string, index: number) => void;
  setRef: (id: string, el: HTMLButtonElement | null) => void;
}

export function AccordionItem({
  item,
  index,
  isExpanded,
  onToggle,
  onKeyDown,
  setRef,
}: AccordionItemProps) {
  const intl = useTranslation();
  const contentId = `faq-content-${item.id}`;

  return (
    <div
      className={`${styles.accordionItem} ${isExpanded ? styles.accordionItemExpanded : ''}`}
    >
      <button
        ref={(el) => setRef(item.id, el)}
        className={styles.accordionHeader}
        onClick={() => onToggle(item.id)}
        onKeyDown={(e) => onKeyDown(e, item.id, index)}
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
}
