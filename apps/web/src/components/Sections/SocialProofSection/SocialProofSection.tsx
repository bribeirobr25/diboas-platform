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

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import { Users, Globe } from 'lucide-react';
import { getWaitlistStatsFromEnv } from '@/config/waitlist-stats';
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
  backgroundColor,
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

  // Translation helper with rich text support for highlighting numbers
  const t = (key: string, values?: Record<string, React.ReactNode>) => {
    const fullKey = `${namespace}.${key}`;
    return intl.formatMessage({ id: fullKey }, values);
  };

  const formattedCount = formatNumber(stats.count, intl.locale);
  const formattedCountries = formatNumber(stats.countries, intl.locale);

  // Wrap numbers in highlight span for styling
  const highlightedCount = <span key="count" className={styles.highlight}>{formattedCount}</span>;
  const highlightedCountries = <span key="countries" className={styles.highlight}>{formattedCountries}</span>;

  return (
    <section
      className={`${styles.section} ${className}`}
      aria-label="Social proof and waitlist statistics"
      style={backgroundColor ? { backgroundColor } : undefined}
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
              <Users className={styles.icon} aria-hidden="true" />
            </div>
            <div className={styles.cardContent}>
              <p className={`${styles.statText} ${isLoading ? styles.loading : ''}`}>
                {t('stats.waitlist', { count: highlightedCount })}
              </p>
            </div>
          </article>

          {/* Countries Card */}
          <article className={styles.card}>
            <div className={styles.iconWrapper}>
              <Globe className={styles.icon} aria-hidden="true" />
            </div>
            <div className={styles.cardContent}>
              <p className={`${styles.statText} ${isLoading ? styles.loading : ''}`}>
                {t('stats.countries', { countries: highlightedCountries })}
              </p>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

export default SocialProofSection;
