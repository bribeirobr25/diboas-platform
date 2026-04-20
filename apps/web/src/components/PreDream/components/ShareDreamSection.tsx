'use client';

/**
 * PreShareDream Section
 *
 * Embedded share section in the Results screen
 * 7 share buttons: WhatsApp, X, Facebook, LinkedIn, Instagram, Substack, Copy
 * Uses existing UTM infrastructure from lib/share
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import { formatCurrency, type PreDreamResult } from '@/lib/pre-dream';
import { useLocale } from '@/components/Providers';
import { getShareUrl, type SharePlatform } from '@/lib/share';
import {
  getTwitterShareUrl,
  getWhatsAppShareUrl,
  getLinkedInShareUrl,
  getFacebookShareUrl,
  openShareWindow,
  copyToClipboard,
} from '@/lib/share/platformUrls';
import { Logger } from '@/lib/monitoring/Logger';
import { analyticsService } from '@/lib/analytics';
import {
  applicationEventBus,
  ApplicationEventType,
} from '@/lib/events/ApplicationEventBus';
import {
  WhatsAppIcon,
  TwitterIcon,
  LinkedInIcon,
  FacebookIcon,
  InstagramIcon,
  SubstackIcon,
} from '@/components/WaitingList/ReferralIcons';
import styles from '../PreDream.module.css';

interface ShareDreamSectionProps {
  result: PreDreamResult;
  /** Locale-adjusted difference for accurate sharing */
  difference?: number;
}

export function ShareDreamSection({ result, difference: differenceProp }: ShareDreamSectionProps) {
  const intl = useTranslation();
  const copyTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // Clear copy feedback timer on unmount
  useEffect(() => {
    return () => clearTimeout(copyTimerRef.current);
  }, []);
  const { locale } = useLocale();
  const [copied, setCopied] = useState(false);

  const t = (key: string) => intl.formatMessage({ id: `preDream.results.${key}` });

  const getShareText = useCallback((): string => {
    const start = formatCurrency(result.totalInvestment, 0, locale);
    const end = formatCurrency(result.defiBalance, 0, locale);
    const diff = differenceProp != null ? differenceProp : result.difference;
    const difference = formatCurrency(diff, 0, locale);
    return intl.formatMessage(
      { id: 'preDream.results.shareText' },
      { start, end, difference },
    );
  }, [result, intl, differenceProp, locale]);

  const handleShare = useCallback(async (platform: SharePlatform) => {
    const shareText = getShareText();
    const amount = formatCurrency(result.defiBalance, 0, locale);
    const growth = `${result.growthPercentage.toFixed(0)}%`;
    const baseShareUrl = getShareUrl('dream', platform, undefined, locale);
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
          openShareWindow(getWhatsAppShareUrl(shareText, shareUrl));
          break;
        case 'twitter':
          openShareWindow(getTwitterShareUrl(shareText, shareUrl));
          break;
        case 'facebook':
          openShareWindow(getFacebookShareUrl(shareText, shareUrl));
          break;
        case 'linkedin':
          try {
            await copyToClipboard(shareText);
          } catch (err) {
            Logger.warn('Clipboard write failed for LinkedIn share', { error: err instanceof Error ? err.message : String(err) });
          }
          openShareWindow(getLinkedInShareUrl(shareUrl));
          break;
        case 'instagram':
        case 'substack': {
          const success = await copyToClipboard(`${shareText} ${shareUrl}`);
          if (success) {
            setCopied(true);
            clearTimeout(copyTimerRef.current);
            copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
          }
          break;
        }
        case 'copy': {
          const success = await copyToClipboard(`${shareText} ${shareUrl}`);
          if (success) {
            setCopied(true);
            clearTimeout(copyTimerRef.current);
            copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
          }
          break;
        }
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
  }, [getShareText, result.defiBalance, result.growthPercentage, locale]);

  return (
    <div className={styles.shareSection}>
      <p className={styles.shareTitle}>{t('shareTitle')}</p>
      <div className={styles.shareButtons}>
        <button
          onClick={() => handleShare('whatsapp')}
          className={styles.shareButton}
          style={{ '--share-bg': '#dcfce7', '--share-hover': '#bbf7d0' } as React.CSSProperties}
          title="WhatsApp"
          aria-label={intl.formatMessage({ id: 'common.accessibility.shareOnWhatsapp' })}
        >
          <WhatsAppIcon />
        </button>
        <button
          onClick={() => handleShare('twitter')}
          className={styles.shareButton}
          style={{ '--share-bg': '#f3f4f6', '--share-hover': '#e5e7eb' } as React.CSSProperties}
          title="X / Twitter"
          aria-label={intl.formatMessage({ id: 'common.accessibility.shareOnX' })}
        >
          <TwitterIcon />
        </button>
        <button
          onClick={() => handleShare('facebook')}
          className={styles.shareButton}
          style={{ '--share-bg': '#dbeafe', '--share-hover': '#bfdbfe' } as React.CSSProperties}
          title="Facebook"
          aria-label={intl.formatMessage({ id: 'share.platform.facebook' })}
        >
          <FacebookIcon />
        </button>
        <button
          onClick={() => handleShare('linkedin')}
          className={styles.shareButton}
          style={{ '--share-bg': '#dbeafe', '--share-hover': '#bfdbfe' } as React.CSSProperties}
          title="LinkedIn"
          aria-label={intl.formatMessage({ id: 'common.accessibility.shareOnLinkedin' })}
        >
          <LinkedInIcon />
        </button>
        <button
          onClick={() => handleShare('instagram')}
          className={styles.shareButton}
          style={{ '--share-bg': '#fce7f3', '--share-hover': '#fbcfe8' } as React.CSSProperties}
          title="Instagram"
          aria-label={intl.formatMessage({ id: 'share.platform.instagram' })}
        >
          <InstagramIcon />
        </button>
        <button
          onClick={() => handleShare('substack')}
          className={styles.shareButton}
          style={{ '--share-bg': '#fff7ed', '--share-hover': '#ffedd5' } as React.CSSProperties}
          title="Substack"
          aria-label={intl.formatMessage({ id: 'share.platform.substack' })}
        >
          <SubstackIcon />
        </button>
        <button
          onClick={() => handleShare('copy')}
          className={styles.shareButton}
          style={{ '--share-bg': copied ? '#ccfbf1' : '#f0fdfa', '--share-hover': '#ccfbf1' } as React.CSSProperties}
          title={copied ? t('shareCopied') : 'Copy to Clipboard'}
          aria-label={intl.formatMessage({ id: 'common.accessibility.copyToClipboard' })}
        >
          {copied ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--social-download)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--social-download)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
