'use client';

/**
 * Waitlist Confirmation Component
 *
 * Displays after successful signup:
 * - Position number with animation
 * - Referral link with copy functionality
 * - Share buttons
 * - Dream Mode CTA
 */

import React, { useState, useEffect } from 'react';
import { useIntl } from 'react-intl';
import { useLocale } from '@/components/LocaleProvider';
import { ReferralLink } from './ReferralLink';
import { REFERRAL_CONFIG, WAITING_LIST_EVENTS } from '@/lib/waitingList/constants';
import { formatPosition } from '@/lib/waitingList/helpers';
import { analyticsService } from '@/lib/analytics';
import styles from './WaitlistConfirmation.module.css';

interface WaitlistConfirmationProps {
  /** User's position on the waitlist */
  position: number;
  /** User's referral code */
  referralCode: string;
  /** Full referral URL */
  referralUrl: string;
  /** Number of successful referrals (optional) */
  referralCount?: number;
  /** Callback when Dream Mode CTA is clicked */
  onDreamModeClick?: () => void;
  /** Callback when share is initiated */
  onShareClick?: (platform: string) => void;
  /** Custom class name */
  className?: string;
}

export function WaitlistConfirmation({
  position,
  referralCode,
  referralUrl,
  referralCount = 0,
  onDreamModeClick,
  onShareClick,
  className = '',
}: WaitlistConfirmationProps) {
  const intl = useIntl();
  const { locale } = useLocale();
  const [animatedPosition, setAnimatedPosition] = useState(position + 100);
  const [showConfetti, setShowConfetti] = useState(true);

  // Translation helper
  const t = (key: string, values?: Record<string, string | number>) => {
    return intl.formatMessage({ id: `waitlist.${key}` }, values);
  };

  // Animate position number counting down
  useEffect(() => {
    const duration = 1500; // 1.5 seconds
    const steps = 30;
    const stepTime = duration / steps;
    const diff = animatedPosition - position;
    const stepValue = diff / steps;

    let current = animatedPosition;
    const timer = setInterval(() => {
      current -= stepValue;
      if (current <= position) {
        setAnimatedPosition(position);
        clearInterval(timer);
      } else {
        setAnimatedPosition(Math.ceil(current));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [position]);

  // Hide confetti after animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleDreamModeClick = () => {
    analyticsService.track({
      name: 'waitlist_dream_mode_click',
      parameters: {
        position,
        locale,
        timestamp: Date.now(),
      },
    });
    onDreamModeClick?.();
  };

  return (
    <div className={`${styles.container} ${className}`}>
      {/* Confetti animation */}
      {showConfetti && (
        <div className={styles.confetti} aria-hidden="true">
          <span className={styles.confettiPiece}>🎉</span>
          <span className={styles.confettiPiece}>✨</span>
          <span className={styles.confettiPiece}>🎊</span>
        </div>
      )}

      {/* Success header */}
      <div className={styles.header}>
        <div className={styles.successIcon}>
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <h2 className={styles.headline}>{t('confirmation.headline')}</h2>
        <p className={styles.subhead}>{t('confirmation.subhead')}</p>
      </div>

      {/* Position display */}
      <div className={styles.positionCard}>
        <span className={styles.positionLabel}>{t('confirmation.positionIntro')}</span>
        <span className={styles.positionNumber}>
          #{formatPosition(animatedPosition, locale)}
        </span>
      </div>

      {/* Referral section */}
      <div className={styles.referralSection}>
        <h3 className={styles.referralHeadline}>{t('confirmation.shareIntro')}</h3>
        <p className={styles.referralBenefit}>
          {t('confirmation.shareBenefit', { spots: REFERRAL_CONFIG.spotsPerReferral })}
        </p>

        <ReferralLink
          referralCode={referralCode}
          referralUrl={referralUrl}
          onShare={onShareClick}
        />

        {referralCount > 0 && (
          <p className={styles.referralCount}>
            {t('returningUser.referralCount', { count: referralCount })}
          </p>
        )}
      </div>

      {/* Dream Mode CTA */}
      {onDreamModeClick && (
        <button
          className={styles.dreamModeCta}
          onClick={handleDreamModeClick}
        >
          {t('confirmation.dreamModeCta')}
        </button>
      )}

      {/* Secondary CTA */}
      <a href="#how-it-works" className={styles.exploreCta}>
        {t('confirmation.exploreCta')}
      </a>
    </div>
  );
}
