/**
 * Social Proof Section
 *
 * Displays waitlist statistics with dynamic data fetching.
 * Falls back to configured values when API is unavailable.
 *
 * Domain-Driven Design: Social proof domain with real-time stats
 * Service Agnostic Abstraction: Uses waitlist stats API
 * Code Reusability: Reusable component for all landing pages
 */

'use client';

import React, { useCallback } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import { Users, Globe, Award } from '@/components/UI/LucideIcon';
import { analyticsService } from '@/lib/analytics';
import { setCtaSource } from '@/lib/analytics/ctaAttribution';
import { useWaitlistStats } from '@/hooks/useWaitlistStats';
import styles from './SocialProofSection.module.css';

interface SocialProofSectionProps {
  /** Translation namespace for stats (e.g., 'landing-b2c.socialProof') */
  namespace?: string;
  /** Enable analytics tracking */
  enableAnalytics?: boolean;
  /** Additional CSS class */
  className?: string;
  /** Custom background color (CSS value or variable) */
  backgroundColor?: string;
  /** Translation key for CTA button text (appended to namespace) */
  ctaText?: string;
  /** Waitlist source for audience-specific stats (e.g., 'landing_b2b') */
  source?: 'landing_b2c' | 'landing_b2b';
}

/**
 * Format number with locale-specific formatting
 */
function formatNumber(num: number, locale: string): string {
  return new Intl.NumberFormat(locale).format(num);
}

export function SocialProofSection({
  namespace = 'landing-b2c.socialProof',
  enableAnalytics = true,
  className = '',
  backgroundColor,
  ctaText,
  source,
}: SocialProofSectionProps) {
  const intl = useTranslation();
  const { stats, isLoading } = useWaitlistStats(source ? { source } : undefined);

  // Translation helper with rich text support for highlighting numbers
  const t = (key: string, values?: Record<string, React.ReactNode>) => {
    const fullKey = `${namespace}.${key}`;
    return intl.formatMessage({ id: fullKey }, values);
  };

  // Use placeholder while loading to avoid flashing "0" before real data arrives
  const formattedCount = isLoading ? '—' : formatNumber(stats.count, intl.locale);
  const formattedCountries = isLoading ? '—' : formatNumber(stats.countries, intl.locale);

  // Wrap numbers in highlight span for styling
  const highlightedCount = <span key="count" className={styles.highlight}>{formattedCount}</span>;
  const highlightedCountries = <span key="countries" className={styles.highlight}>{formattedCountries}</span>;

  const handleCtaClick = useCallback(() => {
    if (enableAnalytics) {
      analyticsService.track({
        name: 'social_proof_cta_click',
        parameters: { locale: intl.locale },
      });
    }
    setCtaSource('social-proof');
    document.getElementById('waitlist')?.scrollIntoView({ behavior: 'smooth' });
  }, [enableAnalytics, intl.locale]);

  return (
    <section
      className={`${styles.section} ${className}`}
      aria-label={intl.formatMessage({ id: 'common.aria.socialProof' })}
      style={backgroundColor ? { backgroundColor } : undefined}
    >
      <div className={styles.container}>
        {/* Stats Cards */}
        <div className={styles.cardsGrid}>
          {/* Waitlist Count Card */}
          <div role="group" className={styles.card}>
            <div className={styles.iconWrapper}>
              <Users className={styles.icon} aria-hidden="true" />
            </div>
            <div className={styles.cardContent}>
              <p className={`${styles.statText} ${isLoading ? styles.loading : ''}`}>
                {t('stats.waitlist', { count: highlightedCount })}
              </p>
            </div>
          </div>

          {/* Countries Card */}
          <div role="group" className={styles.card}>
            <div className={styles.iconWrapper}>
              <Globe className={styles.icon} aria-hidden="true" />
            </div>
            <div className={styles.cardContent}>
              <p className={`${styles.statText} ${isLoading ? styles.loading : ''}`}>
                {t('stats.countries', { countries: highlightedCountries })}
              </p>
            </div>
          </div>

          {/* Founding Member Spots Card */}
          {stats.foundingMemberSpotsRemaining != null && stats.foundingMemberSpotsRemaining > 0 ? (
            <div role="group" className={styles.card}>
              <div className={styles.iconWrapper}>
                <Award className={styles.icon} aria-hidden="true" />
              </div>
              <div className={styles.cardContent}>
                <p className={`${styles.statText} ${isLoading ? styles.loading : ''}`}>
                  {intl.formatMessage(
                    { id: 'waitlist.tier.spotsRemaining' },
                    { spots: <span key="spots" className={styles.highlight}>{formatNumber(stats.foundingMemberSpotsRemaining, intl.locale)}</span> }
                  )}
                </p>
              </div>
            </div>
          ) : stats.foundingMemberSpotsRemaining != null && stats.foundingMemberSpotsRemaining === 0 ? (
            <div role="group" className={styles.card}>
              <div className={styles.iconWrapper}>
                <Award className={styles.icon} aria-hidden="true" />
              </div>
              <div className={styles.cardContent}>
                <p className={`${styles.statText} ${isLoading ? styles.loading : ''}`}>
                  {intl.formatMessage({ id: 'waitlist.stats.foundingMembersFull' })}
                </p>
              </div>
            </div>
          ) : null}
        </div>

        {ctaText && (
          <div className={styles.ctaWrapper}>
            <button
              className={styles.ctaButton}
              onClick={handleCtaClick}
              type="button"
            >
              {t(ctaText)}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

