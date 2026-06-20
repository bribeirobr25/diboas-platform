'use client';

/**
 * MarketCtaBand — the Adelaide Daily closing band (Phase 5 redesign).
 *
 * A calm "weekly cadence" frame + the two CTAs the signature surface was missing:
 * subscribe-to-waitlist and a one-tap share of the (OG-card-backed) /market page.
 * Editorial language (Fraunces / IBM Plex Mono / cream paper), reduced-motion-safe.
 * Share is Web Share API + copy fallback; analytics are Format-A (no PII).
 */

import { LocaleLink } from '@/components/UI/LocaleLink';
import { Share2, Check, ArrowRight } from '@/components/UI/LucideIcon';
import { analyticsService } from '@/lib/analytics';
import { useWebShare, SHARE_EVENTS, type SharePlatform } from '@/hooks/useWebShare';
import styles from './MarketCtaBand.module.css';

interface MarketCtaBandProps {
  /** Active locale — included in the share analytics for funnel segmentation. */
  locale: string;
  cadence: string;
  headline: string;
  body: string;
  waitlistLabel: string;
  shareLabel: string;
  shareCopied: string;
  /** Absolute canonical /market URL (carries the page's OG card). */
  shareUrl: string;
  shareText: string;
  shareTitle: string;
}

export function MarketCtaBand({
  locale,
  cadence,
  headline,
  body,
  waitlistLabel,
  shareLabel,
  shareCopied,
  shareUrl,
  shareText,
  shareTitle,
}: MarketCtaBandProps) {
  // Analytics are surface-specific (source: 'adelaide_daily'); the share/copy
  // mechanics live in the shared useWebShare engine (Principle 4 / DRY).
  const trackShare = (eventName: string, platform: SharePlatform) => {
    analyticsService.track({
      name: eventName,
      parameters: { source: 'adelaide_daily', platform, locale },
    });
  };

  const { share: onShare, copied } = useWebShare({
    shareText,
    shareTitle,
    shareUrl,
    onInitiated: (platform) => trackShare(SHARE_EVENTS.INITIATED, platform),
    onCompleted: (platform) => trackShare(SHARE_EVENTS.COMPLETED, platform),
  });

  return (
    <section className={styles.band} data-section-id="market-cta">
      <div className={styles.inner}>
        <p className={styles.eyebrow}>{cadence}</p>
        <h2 className={styles.headline}>{headline}</h2>
        <p className={styles.body}>{body}</p>
        <div className={styles.actions}>
          <LocaleLink href="/?source=adelaide_daily" className={styles.primary}>
            <span>{waitlistLabel}</span>
            <ArrowRight size={18} strokeWidth={2} aria-hidden="true" />
          </LocaleLink>
          <button type="button" onClick={() => void onShare()} className={styles.secondary}>
            {copied ? (
              <Check size={18} strokeWidth={2} aria-hidden="true" />
            ) : (
              <Share2 size={18} strokeWidth={2} aria-hidden="true" />
            )}
            <span aria-live="polite">{copied ? shareCopied : shareLabel}</span>
          </button>
        </div>
      </div>
    </section>
  );
}
