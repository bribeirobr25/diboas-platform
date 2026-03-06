'use client';

import { memo, useState, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';
import { SectionContainer } from '@/components/Sections/SectionContainer';
import { useConfigTranslation } from '@/lib/i18n/config-translator';
import type { ExpandableSectionConfig } from '@/config/expandableSection';
import styles from './ExpandableSection.module.css';

interface ExpandableSectionProps {
  config: ExpandableSectionConfig;
  enableAnalytics?: boolean;
  className?: string;
}

export const ExpandableSection = memo(function ExpandableSection({
  config,
  enableAnalytics = true,
  className = '',
}: ExpandableSectionProps) {
  const translated = useConfigTranslation(config);
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
          className={styles.toggle}
          onClick={handleToggle}
          aria-expanded={isExpanded}
          aria-controls="expandable-content"
        >
          <span className={styles.toggleText}>{translated.content.toggleLabel}</span>
          <ChevronDown
            className={`${styles.chevron} ${isExpanded ? styles.chevronOpen : ''}`}
            aria-hidden="true"
          />
        </button>

        <div
          id="expandable-content"
          className={`${styles.content} ${isExpanded ? styles.contentOpen : ''}`}
          role="region"
          aria-labelledby="expandable-toggle"
          hidden={!isExpanded}
        >
          <div className={styles.inner}>
            {translated.content.paragraphs.map((paragraph: string, index: number) => (
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
          </div>
        </div>
      </div>
    </SectionContainer>
  );
});

ExpandableSection.displayName = 'ExpandableSection';
