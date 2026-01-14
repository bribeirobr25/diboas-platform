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

import { useState, useEffect } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import Image from 'next/image';
import { getWaitlistStatsFromEnv } from '@/config/waitlist-stats';
import styles from './SocialProofSection.module.css';

interface SocialProofSectionProps {
  /** Translation namespace for stats (e.g., 'landing-b2c.socialProof') */
  namespace?: string;
  /** Enable analytics tracking */
  enableAnalytics?: boolean;
  /** Additional CSS class */
  className?: string;
}

interface WaitlistStats {
  count: number;
  countries: number;
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
}: SocialProofSectionProps) {
  const intl = useTranslation();
  const [stats, setStats] = useState<WaitlistStats>(getWaitlistStatsFromEnv());
  const [isLoading, setIsLoading] = useState(true);

  // Fetch stats from API
  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/waitlist/stats');
        if (response.ok) {
          const data = await response.json();
          setStats({
            count: data.count,
            countries: data.countries,
          });
        }
      } catch (error) {
        // Keep fallback values on error
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, []);

  // Translation helper with interpolation
  const t = (key: string, values?: Record<string, string | number>) => {
    const fullKey = `${namespace}.${key}`;
    return intl.formatMessage({ id: fullKey }, values);
  };

  const formattedCount = formatNumber(stats.count, intl.locale);
  const formattedCountries = formatNumber(stats.countries, intl.locale);

  return (
    <section
      className={`${styles.section} ${className}`}
      aria-label="Social proof and waitlist statistics"
    >
      <div className={styles.container}>
        {/* Section Header */}
        <header className={styles.header}>
          <h2 className={styles.title}>{t('header')}</h2>
        </header>

        {/* Stats Cards */}
        <div className={styles.cardsGrid}>
          {/* Waitlist Count Card */}
          <article className={styles.card}>
            <div className={styles.iconWrapper}>
              <Image
                src="/assets/icons/chart-growing.avif"
                alt="Growth chart icon"
                width={64}
                height={64}
                className={styles.icon}
              />
            </div>
            <div className={styles.cardContent}>
              <p className={`${styles.statText} ${isLoading ? styles.loading : ''}`}>
                {t('stats.waitlist', { count: formattedCount })}
              </p>
            </div>
          </article>

          {/* Countries Card */}
          <article className={styles.card}>
            <div className={styles.iconWrapper}>
              <Image
                src="/assets/icons/rewards-medal.avif"
                alt="Medal icon"
                width={64}
                height={64}
                className={styles.icon}
              />
            </div>
            <div className={styles.cardContent}>
              <p className={`${styles.statText} ${isLoading ? styles.loading : ''}`}>
                {t('stats.countries', { countries: formattedCountries })}
              </p>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

export default SocialProofSection;
