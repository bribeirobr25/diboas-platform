'use client';

/**
 * MarketCtaBand — the Adelaide Daily closing band (Phase 5 redesign).
 *
 * A calm "weekly cadence" frame + the two CTAs the signature surface was missing:
 * subscribe-to-waitlist and a one-tap share of the (OG-card-backed) /market page.
 * Editorial language (Fraunces / IBM Plex Mono / cream paper), reduced-motion-safe.
 * Share is Web Share API + copy fallback; analytics are Format-A (no PII).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { LocaleLink } from '@/components/UI/LocaleLink';
import { Share2, Check, ArrowRight } from '@/components/UI/LucideIcon';
import { analyticsService } from '@/lib/analytics';
import { copyToClipboard } from '@/lib/share/platformUrls';
import { Logger } from '@/lib/monitoring/Logger';
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
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(timerRef.current), []);

  const onShare = useCallback(async () => {
    const usedNative =
      typeof navigator !== 'undefined' && typeof navigator.share === 'function';
    const platform = usedNative ? 'native' : 'copy';
    analyticsService.track({
      name: 'share_initiated',
      parameters: { source: 'adelaide_daily', platform, locale },
    });
    try {
      if (usedNative) {
        try {
          await navigator.share({ title: shareTitle, text: shareText, url: shareUrl });
          analyticsService.track({
            name: 'share_completed',
            parameters: { source: 'adelaide_daily', platform: 'native', locale },
          });
          return;
        } catch (err) {
          if (err instanceof DOMException && err.name === 'AbortError') return;
          Logger.warn('Adelaide native share failed; falling back to copy', {
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }
      const ok = await copyToClipboard(`${shareText} ${shareUrl}`);
      if (ok) {
        setCopied(true);
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setCopied(false), 2000);
        analyticsService.track({
          name: 'share_completed',
          parameters: { source: 'adelaide_daily', platform: 'copy', locale },
        });
      }
    } catch (err) {
      Logger.warn('Adelaide share failed', {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }, [locale, shareTitle, shareText, shareUrl]);

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
