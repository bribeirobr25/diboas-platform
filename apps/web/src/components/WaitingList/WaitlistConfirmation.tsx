'use client';

/**
 * Waitlist Confirmation Component
 *
 * Displays after successful signup:
 * - Position number with animation
 * - Tier badge for founding members
 * - Referral link with copy functionality
 * - Share buttons
 * - Dream Mode CTA
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import { useLocale } from '@/components/Providers';
import { ReferralLink } from './ReferralLink';
import { formatPosition } from '@/lib/waitingList/helpers';
import styles from './WaitlistConfirmation.module.css';

/** Config map for tier-specific display (Principle 4 — DRY) */
const TIER_CONFIG: Record<string, { badge?: string; explanation?: string }> = {
  founding_member: {
    badge: 'tier.badge.foundingMember',
    explanation: 'tier.explanation.foundingMember',
  },
  early_member: {
    badge: 'tier.badge.earlyMember',
    explanation: 'tier.explanation.earlyMember',
  },
  priority_waitlist: {
    explanation: 'tier.explanation.priorityWaitlist',
  },
};

interface WaitlistConfirmationProps {
  /** User's position on the waitlist */
  position: number;
  /** User's referral code */
  referralCode: string;
  /** Full referral URL */
  referralUrl: string;
  /** Number of successful referrals (optional) */
  referralCount?: number;
  /** User's tier */
  tier?: string;
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
  tier,
  onShareClick,
  className = '',
}: WaitlistConfirmationProps) {
  const intl = useTranslation();
  const { locale } = useLocale();
  const [animatedPosition, setAnimatedPosition] = useState(position + 100);

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

  return (
    <div className={`${styles.container} ${className}`}>
      {/* Success header */}
      <div className={styles.header}>
        <h2 className={styles.headline}>{t('confirmation.headline')}</h2>
      </div>

      {/* Position card with tier-specific badge */}
      {(() => {
        const config = tier ? TIER_CONFIG[tier] : undefined;
        return (
          <>
            <div className={styles.positionCard}>
              <span className={styles.positionLabel}>
                {config?.badge ? t(config.badge) : t('confirmation.positionIntro')}
              </span>
              <span className={styles.positionNumber}>
                #{formatPosition(animatedPosition, locale)}
              </span>
            </div>
            {config?.explanation ? (
              <p className={styles.tierExplanation}>{t(config.explanation)}</p>
            ) : null}
          </>
        );
      })()}

      {/* Referral section */}
      <div className={styles.referralSection}>
        <h3 className={styles.referralHeadline}>{t('confirmation.shareIntro')}</h3>
        <p className={styles.referralBenefit}>
          {t('confirmation.shareBenefit')}
        </p>

        <ReferralLink
          referralCode={referralCode}
          referralUrl={referralUrl}
          position={position}
          tier={tier}
          onShare={onShareClick}
        />

        {referralCount > 0 && (
          <p className={styles.referralCount}>
            {t('returningUser.referralCount', { count: referralCount })}
          </p>
        )}
      </div>

    </div>
  );
}
