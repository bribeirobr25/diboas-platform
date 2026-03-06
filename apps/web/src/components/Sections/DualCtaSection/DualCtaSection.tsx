'use client';

import { memo, useCallback, useState } from 'react';
import { useConfigTranslation } from '@/lib/i18n/config-translator';
import { SectionContainer } from '@/components/Sections/SectionContainer';
import { WaitlistForm } from '@/components/WaitingList/WaitlistForm';
import { useWaitlistStats } from '@/hooks/useWaitlistStats';
import type { DualCtaSectionConfig } from '@/config/dualCtaSection';
import type { WaitlistSuccessData } from '@/components/WaitingList/hooks';
import styles from './DualCtaSection.module.css';

interface DualCtaSectionProps {
  config: DualCtaSectionConfig;
  enableAnalytics?: boolean;
  className?: string;
}

export const DualCtaSection = memo(function DualCtaSection({
  config,
  className = '',
}: DualCtaSectionProps) {
  const translated = useConfigTranslation(config);
  const { stats } = useWaitlistStats();
  const [signupDone, setSignupDone] = useState(false);

  const handleSuccess = useCallback((_data: WaitlistSuccessData) => {
    setSignupDone(true);
  }, []);

  // Build counter text from template
  const counterText = translated.content.counterTemplate
    .replace('{count}', String(stats.count))
    .replace('{countries}', String(stats.countries));

  return (
    <SectionContainer
      variant="standard"
      padding="standard"
      backgroundColor="var(--section-bg-enterprise)"
      ariaLabel={translated.seo.ariaLabel}
      className={className}
    >
      <h2 className={styles.header}>{translated.content.header}</h2>
      <p className={styles.counter}>{counterText}</p>

      <div className={styles.grid}>
        {/* Path A: Waitlist signup */}
        <div className={styles.path}>
          <h3 className={styles.pathHeader}>
            {translated.content.pathA.header}
          </h3>
          <p className={styles.pathDescription}>
            {translated.content.pathA.description}
          </p>

          {signupDone ? null : (
            <WaitlistForm
              onSuccess={handleSuccess}
              compact={true}
              source="landing_b2b"
            />
          )}
        </div>

        {/* Path B: Book a conversation */}
        <div className={styles.path}>
          <h3 className={styles.pathHeader}>
            {translated.content.pathB.header}
          </h3>
          <p className={styles.pathDescription}>
            {translated.content.pathB.description}
          </p>

          <a
            href={config.content.pathB.ctaHref}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.bookingCta}
          >
            {translated.content.pathB.cta}
          </a>
        </div>
      </div>
    </SectionContainer>
  );
});

export default DualCtaSection;
