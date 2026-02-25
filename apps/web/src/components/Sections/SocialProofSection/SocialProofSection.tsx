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

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import { Users, Globe, Star } from 'lucide-react';
import { analyticsService } from '@/lib/analytics';
import { getWaitlistStatsFromEnv } from '@/config/waitlist-stats';
import { applicationEventBus, ApplicationEventType } from '@/lib/events/ApplicationEventBus';
import type { ApplicationEventPayload } from '@/lib/events/ApplicationEventBus';
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
}

interface WaitlistStats {
  count: number;
  countries: number;
  foundingMemberSpotsRemaining?: number;
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
}: SocialProofSectionProps) {
  const intl = useTranslation();
  const [stats, setStats] = useState<WaitlistStats>(getWaitlistStatsFromEnv());
  const [isLoading, setIsLoading] = useState(true);

  // Fetch stats from API with sessionStorage cache (5-minute TTL)
  useEffect(() => {
    const CACHE_KEY = 'diboas-waitlist-stats';
    const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

    const controller = new AbortController();

    async function fetchStats() {
      // Check cache first
      try {
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_TTL) {
            setStats(data);
            setIsLoading(false);
            return;
          }
        }
      } catch {
        // Cache read failed — continue to fetch
      }

      try {
        const response = await fetch('/api/waitlist/stats', { signal: controller.signal });
        if (response.ok) {
          const data = await response.json();
          const statsData = {
            count: data.count,
            countries: data.countries,
            foundingMemberSpotsRemaining: data.foundingMemberSpotsRemaining,
          };
          setStats(statsData);

          // Write to cache
          try {
            sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data: statsData, timestamp: Date.now() }));
          } catch {
            // sessionStorage full or unavailable
          }
        }
      } catch {
        // Keep fallback values on error
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();

    return () => controller.abort();
  }, []);

  // Listen for waitlist signup success to update counter in real-time
  useEffect(() => {
    const unsubscribe = applicationEventBus.on<ApplicationEventPayload>(
      ApplicationEventType.WAITLIST_SIGNUP_SUCCESS,
      (event) => {
        const position = (event.metadata as { position?: number } | undefined)?.position;
        if (typeof position === 'number') {
          // Optimistically update count
          setStats(prev => ({ ...prev, count: position }));
        }

        // Clear cache so next page load fetches fresh data
        try {
          sessionStorage.removeItem('diboas-waitlist-stats');
        } catch {
          // sessionStorage unavailable
        }

        // Re-fetch authoritative data from API (bypass HTTP + CDN cache)
        const refetchController = new AbortController();
        fetch('/api/waitlist/stats?fresh=1', { signal: refetchController.signal, cache: 'no-store' })
          .then(res => {
            if (res.ok) return res.json();
            return null;
          })
          .then(data => {
            if (data) {
              setStats({
                count: data.count,
                countries: data.countries,
                foundingMemberSpotsRemaining: data.foundingMemberSpotsRemaining,
              });
            }
          })
          .catch(() => {
            // Keep optimistic update on error
          });
      }
    );

    return unsubscribe;
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

  const handleCtaClick = useCallback(() => {
    if (enableAnalytics) {
      analyticsService.track({
        name: 'social_proof_cta_click',
        parameters: { locale: intl.locale },
      });
    }
    document.getElementById('waitlist')?.scrollIntoView({ behavior: 'smooth' });
  }, [enableAnalytics, intl.locale]);

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

          {/* Founding Member Spots Card */}
          {stats.foundingMemberSpotsRemaining != null && stats.foundingMemberSpotsRemaining > 0 ? (
            <article className={styles.card}>
              <div className={styles.iconWrapper}>
                <Star className={styles.icon} aria-hidden="true" />
              </div>
              <div className={styles.cardContent}>
                <p className={`${styles.statText} ${isLoading ? styles.loading : ''}`}>
                  {intl.formatMessage(
                    { id: 'waitlist.tier.spotsRemaining' },
                    { spots: <span key="spots" className={styles.highlight}>{formatNumber(stats.foundingMemberSpotsRemaining, intl.locale)}</span> }
                  )}
                </p>
              </div>
            </article>
          ) : stats.foundingMemberSpotsRemaining != null && stats.foundingMemberSpotsRemaining === 0 ? (
            <article className={styles.card}>
              <div className={styles.iconWrapper}>
                <Star className={styles.icon} aria-hidden="true" />
              </div>
              <div className={styles.cardContent}>
                <p className={`${styles.statText} ${isLoading ? styles.loading : ''}`}>
                  {intl.formatMessage({ id: 'waitlist.stats.foundingMembersFull' })}
                </p>
              </div>
            </article>
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

