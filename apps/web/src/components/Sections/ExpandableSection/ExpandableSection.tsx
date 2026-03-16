'use client';

import { memo, useId, useState, useCallback, type ReactNode } from 'react';
import { ChevronDown } from '@/components/UI/LucideIcon';
import { SectionContainer } from '@/components/Sections/SectionContainer';
import { useConfigTranslation } from '@/lib/i18n/config-translator';
import type { ExpandableSectionConfig } from '@/config/expandableSection';
import styles from './ExpandableSection.module.css';

interface ExpandableSectionProps {
  config: ExpandableSectionConfig;
  enableAnalytics?: boolean;
  className?: string;
  children?: ReactNode;
}

export const ExpandableSection = memo(function ExpandableSection({
  config,
  enableAnalytics = true,
  className = '',
  children,
}: ExpandableSectionProps) {
  const translated = useConfigTranslation(config);
  const uid = useId();
  const toggleId = `${uid}-toggle`;
  const contentId = `${uid}-content`;
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  return (
    <SectionContainer
      variant="narrow"
      padding="standard"
      backgroundColor={translated.style?.backgroundColor}
      ariaLabel={translated.seo.ariaLabel}
      className={className}
    >
      <div className={styles.container}>
        <button
          type="button"
          id={toggleId}
          className={styles.toggle}
          onClick={handleToggle}
          aria-expanded={isExpanded}
          aria-controls={contentId}
        >
          <span className={styles.toggleText}>{translated.content.toggleLabel}</span>
          <ChevronDown
            className={`${styles.chevron} ${isExpanded ? styles.chevronOpen : ''}`}
            aria-hidden="true"
          />
        </button>

        <div
          id={contentId}
          className={`${styles.content} ${isExpanded ? styles.contentOpen : ''}`}
          role="region"
          aria-labelledby={toggleId}
          hidden={!isExpanded}
        >
          <div className={styles.inner}>
            {children ?? (
              <>
                {translated.content.paragraphs?.map((paragraph: string, index: number) => (
                  <p key={index} className={styles.paragraph}>{paragraph}</p>
                ))}
                {translated.content.linkText && translated.content.linkHref ? (
                  <a
                    href={translated.content.linkHref}
                    className={styles.link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {translated.content.linkText}
                  </a>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>
    </SectionContainer>
  );
});

ExpandableSection.displayName = 'ExpandableSection';
