'use client';

/**
 * PreShareDream Section
 *
 * Embedded share section in the Results screen
 * 4 share buttons: WhatsApp, X, LinkedIn, Copy
 * Uses existing UTM infrastructure from lib/share
 */

import { useCallback, useState } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import { formatCurrency, type PreDreamResult } from '@/lib/pre-dream';
import { useLocale } from '@/components/Providers';
import { getShareUrl, type SharePlatform } from '@/lib/share';
import { analyticsService } from '@/lib/analytics';
import {
  applicationEventBus,
  ApplicationEventType,
} from '@/lib/events/ApplicationEventBus';
import styles from '../PreDream.module.css';

interface ShareDreamSectionProps {
  result: PreDreamResult;
  /** Locale-adjusted difference for accurate sharing */
  localeDifference?: number;
}

export function ShareDreamSection({ result, localeDifference }: ShareDreamSectionProps) {
  const intl = useTranslation();
  const { locale } = useLocale();
  const [copied, setCopied] = useState(false);

  const t = (key: string) => intl.formatMessage({ id: `preDream.results.${key}` });

  const getShareText = useCallback((): string => {
    const start = formatCurrency(result.totalInvestment, 0, locale);
    const end = formatCurrency(result.defiBalance, 0, locale);
    const diff = localeDifference != null ? localeDifference : result.difference;
    const difference = formatCurrency(diff, 0, locale);
    return intl.formatMessage(
      { id: 'preDream.results.shareText' },
      { start, end, difference },
    );
  }, [result, intl, localeDifference, locale]);

  const handleShare = useCallback(async (platform: 'whatsapp' | 'twitter' | 'linkedin' | 'copy') => {
    const shareText = getShareText();
    const amount = formatCurrency(result.defiBalance, 0, locale);
    const growth = `${result.growthPercentage.toFixed(0)}%`;
    const baseShareUrl = getShareUrl('dream', platform as SharePlatform);
    // Append dream result params so the landing page can render OG metadata
    // via /api/og/dream?amount=...&growth=...
    const shareUrl = `${baseShareUrl}&dream_amount=${encodeURIComponent(amount)}&dream_growth=${encodeURIComponent(growth)}`;

    applicationEventBus.emit(ApplicationEventType.PRE_DREAM_SHARE_INITIATED, {
      source: 'preDream',
      timestamp: Date.now(),
      metadata: { platform },
    });

    analyticsService.track({
      name: 'pre_dream_share',
      parameters: { platform },
    });

    try {
      switch (platform) {
        case 'whatsapp':
          window.open(
            `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`,
            '_blank',
            'width=600,height=400'
          );
          break;
        case 'twitter':
          window.open(
            `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
            '_blank',
            'width=600,height=400'
          );
          break;
        case 'linkedin':
          try {
            await navigator.clipboard.writeText(shareText);
          } catch (err) {
            console.warn('Clipboard write failed for LinkedIn share:', err);
          }
          window.open(
            `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
            '_blank',
            'width=600,height=400'
          );
          break;
        case 'copy':
          await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
          break;
      }

      analyticsService.track({
        name: 'pre_dream_share_success',
        parameters: { platform },
      });

      applicationEventBus.emit(ApplicationEventType.PRE_DREAM_SHARE_COMPLETED, {
        source: 'preDream',
        timestamp: Date.now(),
        metadata: { platform },
      });
    } catch {
      analyticsService.track({
        name: 'pre_dream_share_failed',
        parameters: { platform },
      });
    }
  }, [getShareText, result.defiBalance, result.growthPercentage]);

  return (
    <div className={styles.shareSection}>
      <p className={styles.shareTitle}>{t('shareTitle')}</p>
      <div className={styles.shareButtons}>
        <button
          onClick={() => handleShare('whatsapp')}
          className={styles.shareButton}
          style={{ '--share-bg': '#dcfce7', '--share-hover': '#bbf7d0' } as React.CSSProperties}
          title="WhatsApp"
          aria-label="Share on WhatsApp"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#25D366">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        </button>
        <button
          onClick={() => handleShare('twitter')}
          className={styles.shareButton}
          style={{ '--share-bg': '#f3f4f6', '--share-hover': '#e5e7eb' } as React.CSSProperties}
          title="X / Twitter"
          aria-label="Share on X"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#000000">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </button>
        <button
          onClick={() => handleShare('linkedin')}
          className={styles.shareButton}
          style={{ '--share-bg': '#dbeafe', '--share-hover': '#bfdbfe' } as React.CSSProperties}
          title="LinkedIn"
          aria-label="Share on LinkedIn"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#0A66C2">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
          </svg>
        </button>
        <button
          onClick={() => handleShare('copy')}
          className={styles.shareButton}
          style={{ '--share-bg': copied ? '#ccfbf1' : '#f0fdfa', '--share-hover': '#ccfbf1' } as React.CSSProperties}
          title={copied ? t('shareCopied') : 'Copy to Clipboard'}
          aria-label="Copy share text to clipboard"
        >
          {copied ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
