/**
 * WaitlistPosition Component
 *
 * Standalone component for displaying waitlist position.
 * Can be used independently from the confirmation flow.
 *
 * Usage:
 * ```tsx
 * <WaitlistPosition
 *   position={123}
 *   referralCode="REF123ABC"
 *   referralCount={5}
 *   locale="en"
 * />
 * ```
 */

'use client';

import { useMemo } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import { formatPosition } from '@/lib/waitingList/helpers';
import { REFERRAL_CONFIG } from '@/lib/waitingList/constants';
import styles from './WaitlistPosition.module.css';

/**
 * WaitlistPosition Props
 */
export interface WaitlistPositionProps {
  /** Current position on waitlist */
  position: number;
  /** User's referral code */
  referralCode: string;
  /** Number of successful referrals */
  referralCount: number;
  /** User's locale for formatting */
  locale: string;
  /** Show referral info */
  showReferralInfo?: boolean;
  /** Show position improvement indicator */
  showImprovement?: boolean;
  /** Original position (for improvement calculation) */
  originalPosition?: number;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Optional class name */
  className?: string;
}

export function WaitlistPosition({
  position,
  referralCode,
  referralCount,
  locale,
  showReferralInfo = true,
  showImprovement = true,
  originalPosition,
  size = 'md',
  className,
}: WaitlistPositionProps) {
  const intl = useTranslation();

  // Calculate spots gained from referrals
  const spotsGained = useMemo(() => {
    if (originalPosition && originalPosition > position) {
      return originalPosition - position;
    }
    return referralCount * REFERRAL_CONFIG.spotsPerReferral;
  }, [originalPosition, position, referralCount]);

  // Format position with locale
  const formattedPosition = useMemo(() => {
    return formatPosition(position, locale);
  }, [position, locale]);

  // Generate referral URL
  const referralUrl = useMemo(() => {
    const base = REFERRAL_CONFIG.referralBaseUrl;
    return `${base}?ref=${referralCode}`;
  }, [referralCode]);

  const containerClasses = [
    styles.container,
    styles[`size-${size}`],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={containerClasses}>
      {/* Position Display */}
      <div className={styles.positionSection}>
        <span className={styles.positionLabel}>
          {intl.formatMessage(
            { id: 'common.waitingList.position.label' },
            { defaultMessage: 'Your Position' }
          )}
        </span>
        <span className={styles.positionNumber}>#{formattedPosition}</span>

        {/* Improvement Indicator */}
        {showImprovement && spotsGained > 0 && (
          <span className={styles.improvement}>
            <ImprovementArrow />
            {intl.formatMessage(
              { id: 'common.waitingList.position.spotsGained' },
              {
                spots: spotsGained,
                defaultMessage: '{spots} spots gained!',
              }
            )}
          </span>
        )}
      </div>

      {/* Referral Info */}
      {showReferralInfo && (
        <div className={styles.referralSection}>
          {/* Referral Stats */}
          <div className={styles.referralStats}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{referralCount}</span>
              <span className={styles.statLabel}>
                {intl.formatMessage(
                  { id: 'common.waitingList.position.referrals' },
                  { defaultMessage: 'Referrals' }
                )}
              </span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <span className={styles.statValue}>{REFERRAL_CONFIG.spotsPerReferral}</span>
              <span className={styles.statLabel}>
                {intl.formatMessage(
                  { id: 'common.waitingList.position.spotsPerReferral' },
                  { defaultMessage: 'Spots/Referral' }
                )}
              </span>
            </div>
          </div>

          {/* Referral Code Display */}
          <div className={styles.referralCode}>
            <span className={styles.codeLabel}>
              {intl.formatMessage(
                { id: 'common.waitingList.position.yourCode' },
                { defaultMessage: 'Your Code:' }
              )}
            </span>
            <code className={styles.code}>{referralCode}</code>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Improvement Arrow Icon
 */
function ImprovementArrow() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={styles.improvementArrow}
    >
      <polyline points="18 15 12 9 6 15" />
    </svg>
  );
}

export default WaitlistPosition;
