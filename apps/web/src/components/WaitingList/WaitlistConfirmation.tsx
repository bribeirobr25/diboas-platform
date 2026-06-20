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
import { GoalRing } from '@/components/UI/GoalRing';
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
  /** Live founding-member spots remaining (drives the celebratory ring). */
  foundingSpotsRemaining?: number;
  /** Founding-member cap (for the ring's fill fraction). */
  foundingCap?: number;
  /** Callback when share is initiated */
  onShareClick?: (platform: string) => void;
  /** Custom class name */
  className?: string;
  /** Translation namespace prefix (default: 'waitlist') */
  namespace?: string;
}

export function WaitlistConfirmation({
  position,
  referralCode,
  referralUrl,
  referralCount = 0,
  tier,
  foundingSpotsRemaining,
  foundingCap,
  onShareClick,
  className = '',
  namespace = 'waitlist',
}: WaitlistConfirmationProps) {
  const intl = useTranslation();
  const { locale } = useLocale();
  const [animatedPosition, setAnimatedPosition] = useState(position + 100);

  // Translation helper
  const t = (key: string, values?: Record<string, string | number>) => {
    return intl.formatMessage({ id: `${namespace}.${key}` }, values);
  };
  // Founding-celebration copy lives in the shared `landing-b2c` namespace
  // (loaded on both the B2C and B2B pages) so a single key serves both
  // confirmation namespaces.
  const tFounding = (key: string, values?: Record<string, string | number>) =>
    intl.formatMessage({ id: `landing-b2c.waitlistFounding.${key}` }, values);

  const foundingFilled =
    foundingCap && foundingCap > 0 && foundingSpotsRemaining != null && foundingSpotsRemaining >= 0
      ? Math.min(1, Math.max(0, (foundingCap - foundingSpotsRemaining) / foundingCap))
      : null;

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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- animatedPosition is intentionally excluded; it's the value being animated, including it would restart the animation on every frame
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

      {/* Founding-member celebration beat — a filling ring + live scarcity line.
          Only when there are founding spots left and the cap is known. */}
      {foundingFilled != null && foundingSpotsRemaining! > 0 ? (
        <div className={styles.founding}>
          <GoalRing
            progress={foundingFilled}
            size={120}
            variant="action"
            ariaLabel={tFounding('spotsLeft', {
              remaining: foundingSpotsRemaining!,
              cap: foundingCap!,
            })}
            label={
              <span className={`u-numeric ${styles.foundingPct}`}>
                {Math.round(foundingFilled * 100)}%
              </span>
            }
          />
          <p className={styles.foundingSpots}>
            {tFounding('spotsLeft', { remaining: foundingSpotsRemaining!, cap: foundingCap! })}
          </p>
        </div>
      ) : null}

      {/* Referral section */}
      <div className={styles.referralSection}>
        <h3 className={styles.referralHeadline}>{t('confirmation.shareIntro')}</h3>
        <p className={styles.referralBenefit}>{t('confirmation.shareBenefit')}</p>

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
    </div>
  );
}
