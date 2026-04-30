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
  /** Translation namespace (default: 'landing-b2c.socialProof') */
  namespace?: string;
  /** Waitlist source filter (default: 'landing_b2c') */
  source?: 'landing_b2c' | 'landing_b2b';
  /** Background color CSS value (default: 'var(--section-bg-white)') */
  backgroundColor?: string;
}

export const FoundingMembersSection = memo(function FoundingMembersSection({
  enableAnalytics = true,
  className = '',
  namespace = 'landing-b2c.socialProof',
  source = 'landing_b2c',
  backgroundColor = 'var(--section-bg-white)',
}: FoundingMembersSectionProps) {
  const intl = useTranslation();
  const { stats } = useWaitlistStats({ source });

  const t = (key: string) =>
    intl.formatMessage({ id: `${namespace}.${key}` });

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
      backgroundColor={backgroundColor}
      ariaLabel={ariaLabel}
      className={className}
    >
      <div className={styles.container}>
        <h3 className={styles.heading}>{t('header')}</h3>
        <p className={styles.description}>{t('subtext')}</p>

        {hasCount ? (
          <SocialProofSection
            namespace={namespace}
            enableAnalytics={enableAnalytics}
            source={source}
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
