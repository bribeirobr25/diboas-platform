'use client';

/**
 * Footer Accordion Section Component
 *
 * Mobile-friendly collapsible section for footer navigation
 */

import Link from 'next/link';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from '@diboas/i18n/client';
import type { FooterSection } from '@/config/footer';
import styles from '../SiteFooter.module.css';

interface AccordionSectionProps {
  section: FooterSection;
  isOpen: boolean;
  onToggle: () => void;
}

export function AccordionSection({ section, isOpen, onToggle }: AccordionSectionProps) {
  const intl = useTranslation();
  const sectionId = section.title.replace(/\./g, '-');

  return (
    <>
      <button
        onClick={onToggle}
        className={styles.accordionButton}
        aria-expanded={isOpen}
        aria-controls={`footer-section-${sectionId}`}
      >
        <span className={styles.accordionTitle}>
          {intl.formatMessage({ id: section.title })}
        </span>
        {isOpen ? (
          <ChevronUp className={styles.accordionIcon} aria-hidden="true" />
        ) : (
          <ChevronDown className={styles.accordionIcon} aria-hidden="true" />
        )}
      </button>

      {isOpen && (
        <div
          id={`footer-section-${sectionId}`}
          className={styles.accordionContent}
        >
          <ul className={styles.accordionLinksList}>
            {section.links.map((link) => (
              <li key={link.id}>
                {link.external ? (
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.accordionLink}
                  >
                    {intl.formatMessage({ id: link.label })}
                  </a>
                ) : (
                  <Link href={link.href} className={styles.accordionLink}>
                    {intl.formatMessage({ id: link.label })}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
