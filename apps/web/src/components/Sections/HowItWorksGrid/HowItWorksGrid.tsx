'use client';

import { memo, useEffect, useRef } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import { SectionContainer } from '@/components/Sections/SectionContainer';
import { analyticsService } from '@/lib/analytics';
import styles from './HowItWorksGrid.module.css';

interface HowItWorksGridProps {
  enableAnalytics?: boolean;
  className?: string;
}

const CARD_KEYS = ['card1', 'card2', 'card3'] as const;
const CARD_NUMBERS = ['1', '2', '3'] as const;

export const HowItWorksGrid = memo(function HowItWorksGrid({
  enableAnalytics = true,
  className = '',
}: HowItWorksGridProps) {
  const intl = useTranslation();
  const sectionRef = useRef<HTMLDivElement>(null);
  const hasFiredRef = useRef(false);

  const prefix = 'landing-b2c.howItWorksDetailed';
  const t = (key: string) => intl.formatMessage({ id: `${prefix}.${key}` });
  const hasMessage = (key: string): boolean => {
    const id = `${prefix}.${key}`;
    const value = (intl.messages as Record<string, string>)?.[id];
    return typeof value === 'string' && value.length > 0;
  };

  const tSection = (key: string) =>
    intl.formatMessage({ id: `landing-b2c.sections.howItWorksDetailed.${key}` });

  // Analytics: fire once when section enters viewport
  useEffect(() => {
    if (!enableAnalytics) return;
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasFiredRef.current) {
          hasFiredRef.current = true;
          analyticsService.track({
            name: 'how_it_works_detailed_visible',
            parameters: { locale: intl.locale },
          });
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [enableAnalytics, intl.locale]);

  return (
    <SectionContainer
      variant="standard"
      padding="standard"
      backgroundColor="var(--section-bg-white)"
      ariaLabel={tSection('ariaLabel')}
      className={className}
    >
      <div ref={sectionRef} className={styles.container}>
        <h2 className={styles.heading}>{t('header')}</h2>

        <div className={styles.grid}>
          {CARD_KEYS.map((key, index) => (
            <article key={key} className={styles.card}>
              <div className={styles.numberBadge} aria-hidden="true">
                {CARD_NUMBERS[index]}
              </div>
              <h3 className={styles.cardTitle}>{t(`${key}.title`)}</h3>
              <p className={styles.cardText}>{t(`${key}.p1`)}</p>
              {hasMessage(`${key}.p2`) ? <p className={styles.cardText}>{t(`${key}.p2`)}</p> : null}
            </article>
          ))}
        </div>
      </div>
    </SectionContainer>
  );
});

HowItWorksGrid.displayName = 'HowItWorksGrid';
