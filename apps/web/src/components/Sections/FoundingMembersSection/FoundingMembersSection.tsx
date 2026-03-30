'use client';

import { memo, useCallback } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import { SectionContainer } from '@/components/Sections/SectionContainer';
import { SocialProofSection } from '@/components/Sections/SocialProofSection/SocialProofSection';
import { analyticsService } from '@/lib/analytics';
import { setCtaSource } from '@/lib/analytics/ctaAttribution';
import { useWaitlistStats } from '@/hooks/useWaitlistStats';
import styles from './FoundingMembersSection.module.css';

interface FoundingMembersSectionProps {
  enableAnalytics?: boolean;
  className?: string;
}

export const FoundingMembersSection = memo(function FoundingMembersSection({
  enableAnalytics = true,
  className = '',
}: FoundingMembersSectionProps) {
  const intl = useTranslation();
  const { stats } = useWaitlistStats({ source: 'landing_b2c' });

  const t = (key: string) =>
    intl.formatMessage({ id: `landing-b2c.socialProof.${key}` });

  const ariaLabel = intl.formatMessage({ id: 'landing-b2c.sections.socialProof.ariaLabel' });

  const hasCount = stats.count > 0;

  const handleCtaClick = useCallback(() => {
    if (enableAnalytics) {
      analyticsService.track({
        name: 'founding_members_cta_click',
        parameters: { locale: intl.locale },
      });
    }
    setCtaSource('founding-members');
    document.getElementById('waitlist')?.scrollIntoView({ behavior: 'smooth' });
  }, [enableAnalytics, intl.locale]);

  return (
    <SectionContainer
      variant="standard"
      padding="standard"
      backgroundColor="var(--section-bg-white)"
      ariaLabel={ariaLabel}
      className={className}
    >
      <div className={styles.container}>
        <h2 className={styles.heading}>{t('header')}</h2>
        <p className={styles.description}>{t('subtext')}</p>

        {hasCount ? (
          <SocialProofSection
            namespace="landing-b2c.socialProof"
            enableAnalytics={enableAnalytics}
            source="landing_b2c"
            ctaText="cta"
          />
        ) : (
          <div className={styles.zeroState}>
            <p className={styles.zeroText}>{t('zeroState')}</p>
            <button
              type="button"
              className={styles.cta}
              onClick={handleCtaClick}
            >
              {t('cta')}
            </button>
          </div>
        )}
      </div>
    </SectionContainer>
  );
});

FoundingMembersSection.displayName = 'FoundingMembersSection';
