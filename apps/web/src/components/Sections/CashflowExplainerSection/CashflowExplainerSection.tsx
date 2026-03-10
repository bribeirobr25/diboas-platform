'use client';

import { memo } from 'react';
import { useConfigTranslation } from '@/lib/i18n/config-translator';
import { SectionContainer } from '@/components/Sections/SectionContainer';
import type { CashflowExplainerSectionConfig } from '@/config/cashflowExplainerSection';
import styles from './CashflowExplainerSection.module.css';

interface CashflowExplainerSectionProps {
  config: CashflowExplainerSectionConfig;
  enableAnalytics?: boolean;
  className?: string;
}

export const CashflowExplainerSection = memo(function CashflowExplainerSection({
  config,
  className = '',
}: CashflowExplainerSectionProps) {
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
      variant="narrow"
      padding="standard"
      backgroundColor="var(--section-bg-neutral)"
      ariaLabel={translated.seo.ariaLabel}
      className={className}
    >
      <h2 className={`${styles.header} ${translated.content.subheader ? styles.headerWithSub : ''}`}>
        {translated.content.header}
      </h2>
      {translated.content.subheader ? (
        <p className={styles.subheader}>{translated.content.subheader}</p>
      ) : null}

      {/* Two-part grid: Save it + Grow it */}
      <div className={styles.grid}>
        <div>
          <h3 className={styles.partTitle}>
            {translated.content.partA.title}
          </h3>
          <p className={styles.partBody}>
            {translated.content.partA.body}
          </p>
        </div>

        <div>
          <h3 className={styles.partTitle}>
            {translated.content.partB.title}
          </h3>
          <p className={styles.partBody}>
            {translated.content.partB.body}
          </p>
        </div>
      </div>

      {/* Micro-example box */}
      <div className={styles.microExample} role="region" aria-label="Example calculation">
        {translated.content.microExample}
      </div>

      {/* Honest limitation + Brand promise */}
      <p className={styles.limitation}>{translated.content.limitation}</p>
      <p className={styles.brandPromise}>{translated.content.brandPromise}</p>

      {/* CTA */}
      <div className={styles.ctaWrapper}>
        <button
          type="button"
          className={styles.cta}
          onClick={() => scrollTo(config.content.ctaHref)}
        >
          {translated.content.cta}
        </button>
      </div>

      {/* Micro-disclosure */}
      <p className={styles.microDisclosure}>
        {translated.content.microDisclosure}
      </p>
    </SectionContainer>
  );
});

export default CashflowExplainerSection;
