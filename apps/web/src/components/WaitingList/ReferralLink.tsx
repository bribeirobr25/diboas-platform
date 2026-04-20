'use client';

/**
 * Referral Link Component
 *
 * Displays referral link with:
 * - Copy to clipboard functionality
 * - Share buttons (WhatsApp, Twitter, LinkedIn)
 * - Visual feedback on copy
 */

import React, { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import { useLocale } from '@/components/Providers';
import { analyticsService } from '@/lib/analytics';
import { WAITING_LIST_EVENTS } from '@/lib/waitingList/constants';
import { CopyIcon, CheckIcon, WhatsAppIcon, TwitterIcon, LinkedInIcon, FacebookIcon, InstagramIcon, SubstackIcon } from './ReferralIcons';
import { type SharePlatform, shareToPlatform, copyToClipboard } from './shareUtils';
import styles from './ReferralLink.module.css';

interface ReferralLinkProps {
  /** The referral code */
  referralCode: string;
  /** Full referral URL */
  referralUrl: string;
  /** Callback when share button is clicked */
  onShare?: (platform: string) => void;
  /** Show compact version */
  compact?: boolean;
  /** Custom class name */
  className?: string;
}

export function ReferralLink({
  referralCode,
  referralUrl,
  onShare,
  compact = false,
  className = '',
}: ReferralLinkProps) {
  const intl = useTranslation();
  const { locale } = useLocale();
  const inputId = useId();
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => {
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
  }, []);

  const t = (key: string, values?: Record<string, string | number>) => {
    return intl.formatMessage({ id: `waitlist.${key}` }, values);
  };

  const st = (key: string) => {
    return intl.formatMessage({ id: `share.${key}` });
  };

  const handleCopy = async () => {
    const success = await copyToClipboard(referralUrl);

    if (success) {
      setCopied(true);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopied(false), 2000);

      analyticsService.track({
        name: WAITING_LIST_EVENTS.REFERRAL_LINK_COPIED,
        parameters: {
          referralCode,
          locale,
          timestamp: Date.now(),
        },
      });

      onShare?.('copy');
    }
  };

  const handleShare = (platform: SharePlatform) => {
    analyticsService.track({
      name: WAITING_LIST_EVENTS.REFERRAL_LINK_SHARED,
      parameters: {
        platform,
        referralCode,
        locale,
        timestamp: Date.now(),
      },
    });

    onShare?.(platform);

    // Single unified share text — Twitter mention appended by shareToPlatform()
    const shareText = intl.formatMessage({ id: 'share.waitlist.text' });

    shareToPlatform(platform, {
      referralUrl,
      shareText,
      onLinkedInCopy: () => {
        alert(intl.formatMessage({ id: 'share.toast.linkedInCopied' }));
      },
      onClipboardCopy: () => {
        alert(intl.formatMessage({ id: 'share.toast.linkCopied' }));
      },
    });
  };

  return (
    <div className={`${styles.container} ${compact ? styles.compact : ''} ${className}`}>
      <div className={styles.linkBox}>
        <input
          id={inputId}
          type="text"
          value={referralUrl}
          readOnly
          className={styles.input}
          aria-label={t('confirmation.referralLinkLabel')}
          onClick={(e) => (e.target as HTMLInputElement).select()}
        />
        <button
          onClick={handleCopy}
          className={`${styles.copyButton} ${copied ? styles.copied : ''}`}
          aria-label={copied ? t('confirmation.copied') : t('confirmation.copy')}
        >
          {copied ? (
            <>
              <CheckIcon />
              <span>{t('confirmation.copied')}</span>
            </>
          ) : (
            <>
              <CopyIcon />
              <span>{t('confirmation.copy')}</span>
            </>
          )}
        </button>
      </div>

      {!compact ? (
        <div className={styles.shareButtons}>
          <button
            onClick={() => handleShare('whatsapp')}
            className={`${styles.shareButton} ${styles.whatsapp}`}
            aria-label={st('platform.whatsapp')}
          >
            <WhatsAppIcon />
          </button>
          <button
            onClick={() => handleShare('twitter')}
            className={`${styles.shareButton} ${styles.twitter}`}
            aria-label={st('platform.twitter')}
          >
            <TwitterIcon />
          </button>
          <button
            onClick={() => handleShare('linkedin')}
            className={`${styles.shareButton} ${styles.linkedin}`}
            aria-label={st('platform.linkedin')}
          >
            <LinkedInIcon />
          </button>
          <button
            onClick={() => handleShare('facebook')}
            className={`${styles.shareButton} ${styles.facebook}`}
            aria-label={st('platform.facebook')}
          >
            <FacebookIcon />
          </button>
          <button
            onClick={() => handleShare('instagram')}
            className={`${styles.shareButton} ${styles.instagram}`}
            aria-label={st('platform.instagram')}
          >
            <InstagramIcon />
          </button>
          <button
            onClick={() => handleShare('substack')}
            className={`${styles.shareButton} ${styles.substack}`}
            aria-label={st('platform.substack')}
          >
            <SubstackIcon />
          </button>
        </div>
      ) : null}
    </div>
  );
}
