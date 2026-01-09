'use client';

/**
 * Referral Link Component
 *
 * Displays referral link with:
 * - Copy to clipboard functionality
 * - Share buttons for different platforms
 * - Visual feedback on copy
 */

import React, { useState } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import { useLocale } from '@/components/Providers';
import { analyticsService } from '@/lib/analytics';
import { WAITING_LIST_EVENTS } from '@/lib/waitingList/constants';
import { CopyIcon, CheckIcon, WhatsAppIcon, TwitterIcon, LinkedInIcon } from './ReferralIcons';
import { type SharePlatform, shareToplatform, copyToClipboard } from './shareUtils';
import styles from './ReferralLink.module.css';

interface ReferralLinkProps {
  /** The referral code */
  referralCode: string;
  /** Full referral URL */
  referralUrl: string;
  /** User's position on the waitlist */
  position?: number;
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
  position,
  onShare,
  compact = false,
  className = '',
}: ReferralLinkProps) {
  const intl = useTranslation();
  const { locale } = useLocale();
  const [copied, setCopied] = useState(false);

  // Translation helper
  const t = (key: string, values?: Record<string, string | number>) => {
    return intl.formatMessage({ id: `waitlist.${key}` }, values);
  };

  const st = (key: string) => {
    return intl.formatMessage({ id: `share.${key}` });
  };

  const handleCopy = async () => {
    const success = await copyToClipboard(referralUrl, 'referral-url-input');

    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);

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

    // Format position for display
    const formattedPosition = position
      ? new Intl.NumberFormat(locale).format(position)
      : '---';

    const shareText = intl.formatMessage(
      { id: 'share.waitlistPosition.whatsapp' },
      { position: formattedPosition, referralUrl }
    );

    const twitterText = intl.formatMessage(
      { id: 'share.waitlistPosition.twitter' },
      { position: formattedPosition, referralUrl }
    );

    const linkedInText = intl.formatMessage(
      { id: 'share.waitlistPosition.linkedin' },
      { position: formattedPosition, referralUrl }
    );

    shareToplatform(platform, {
      referralUrl,
      shareText,
      twitterText,
      linkedInText,
      onLinkedInCopy: () => {
        alert(intl.formatMessage({ id: 'share.toast.linkedInCopied' }));
      },
    });
  };

  return (
    <div className={`${styles.container} ${compact ? styles.compact : ''} ${className}`}>
      <label className={styles.label}>
        {t('confirmation.referralLinkLabel')}
      </label>

      <div className={styles.linkBox}>
        <input
          id="referral-url-input"
          type="text"
          value={referralUrl}
          readOnly
          className={styles.input}
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

      {!compact && (
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
        </div>
      )}
    </div>
  );
}
