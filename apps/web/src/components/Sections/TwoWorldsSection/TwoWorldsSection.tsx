'use client';

import { memo } from 'react';
import Image from 'next/image';
import { useConfigTranslation } from '@/lib/i18n/config-translator';
import { SectionContainer } from '@/components/Sections/SectionContainer';
import type { TwoWorldsSectionConfig } from '@/config/twoWorldsSection';
import styles from './TwoWorldsSection.module.css';

interface TwoWorldsSectionProps {
  config: TwoWorldsSectionConfig;
  enableAnalytics?: boolean;
  className?: string;
}

export const TwoWorldsSection = memo(function TwoWorldsSection({
  config,
  className = '',
}: TwoWorldsSectionProps) {
  const translated = useConfigTranslation(config);

  const scrollTo = (href: string) => {
    const id = href.replace('#', '');
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <SectionContainer
      variant="standard"
      padding="standard"
      backgroundColor="var(--section-bg-neutral)"
      ariaLabel={translated.seo.ariaLabel}
      className={className}
    >
      <h2 className={styles.header}>{translated.content.header}</h2>

      <div className={styles.grid}>
        {/* Card A: Card payments audience */}
        <article className={styles.card}>
          {config.content.cardA.image ? (
            <div className={styles.cardImageWrapper}>
              <Image
                src={config.content.cardA.image}
                alt={config.content.cardA.imageAlt || ''}
                width={560}
                height={320}
                className={styles.cardImage}
              />
            </div>
          ) : null}
          <h3 className={styles.cardHeadline}>
            {translated.content.cardA.headline}
          </h3>
          <p className={styles.cardBody}>
            {translated.content.cardA.body}
          </p>
          <button
            type="button"
            className={styles.cardCta}
            onClick={() => scrollTo(config.content.cardA.ctaHref)}
          >
            {translated.content.cardA.cta}
          </button>
        </article>

        {/* Card B: Idle cash audience */}
        <article className={styles.card}>
          {config.content.cardB.image ? (
            <div className={styles.cardImageWrapper}>
              <Image
                src={config.content.cardB.image}
                alt={config.content.cardB.imageAlt || ''}
                width={560}
                height={320}
                className={styles.cardImage}
              />
            </div>
          ) : null}
          <h3 className={styles.cardHeadline}>
            {translated.content.cardB.headline}
          </h3>
          <p className={styles.cardBody}>
            {translated.content.cardB.body}
          </p>
          <button
            type="button"
            className={styles.cardCta}
            onClick={() => scrollTo(config.content.cardB.ctaHref)}
          >
            {translated.content.cardB.cta}
          </button>
        </article>
      </div>
    </SectionContainer>
  );
});

export default TwoWorldsSection;
