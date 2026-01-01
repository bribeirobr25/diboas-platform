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
import { useIntl } from 'react-intl';
import { useLocale } from '@/components/LocaleProvider';
import { analyticsService } from '@/lib/analytics';
import { WAITING_LIST_EVENTS } from '@/lib/waitingList/constants';
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

type SharePlatform = 'twitter' | 'whatsapp' | 'facebook' | 'linkedin' | 'copy';

export function ReferralLink({
  referralCode,
  referralUrl,
  onShare,
  compact = false,
  className = '',
}: ReferralLinkProps) {
  const intl = useIntl();
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
    try {
      await navigator.clipboard.writeText(referralUrl);
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
    } catch (err) {
      console.error('Failed to copy:', err);
      // Fallback: select the input
      const input = document.getElementById('referral-url-input') as HTMLInputElement;
      if (input) {
        input.select();
        document.execCommand('copy');
      }
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

    const shareText = intl.formatMessage(
      { id: 'share.waitlistPosition.whatsapp' },
      { position: '###', referralUrl }
    );

    switch (platform) {
      case 'twitter':
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(
            intl.formatMessage({ id: 'share.waitlistPosition.twitter' }, { position: '###' })
          )}&url=${encodeURIComponent(referralUrl)}`,
          '_blank'
        );
        break;
      case 'whatsapp':
        window.open(
          `https://wa.me/?text=${encodeURIComponent(shareText)}`,
          '_blank'
        );
        break;
      case 'facebook':
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralUrl)}`,
          '_blank'
        );
        break;
      case 'linkedin':
        window.open(
          `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralUrl)}`,
          '_blank'
        );
        break;
    }
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

// Icon components
function CopyIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

function TwitterIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}
