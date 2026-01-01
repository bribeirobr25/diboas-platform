/**
 * Screen5CTA Component
 *
 * Conditional CTA component for Demo Screen 5 (Invitation).
 * Shows different CTAs based on user waitlist status:
 *
 * - Anonymous users: "Join the waitlist" form
 * - Waitlist members: "Try Dream Mode" + "Explore what's coming"
 */

'use client';

import { useTranslation } from '@diboas/i18n/client';
import { Button } from '@diboas/ui';
import type { Screen5CTAProps } from './types';
import styles from './Screen5CTA.module.css';

export function Screen5CTA({
  isOnWaitlist,
  onJoinWaitlist,
  onTryDreamMode,
  onExplore,
  className = '',
}: Screen5CTAProps) {
  const intl = useTranslation();

  // Waitlist member view - Show Dream Mode CTAs
  if (isOnWaitlist) {
    return (
      <div className={`${styles.container} ${styles.loggedIn} ${className}`}>
        {/* Dream Mode Helper Text */}
        <p className={styles.helperText}>
          {intl.formatMessage({
            id: 'landing-b2c.demo.screen5.dreamModeHelper',
          })}
        </p>

        {/* Primary CTA: Try Dream Mode */}
        <Button
          variant="primary"
          size="lg"
          className={styles.primaryCta}
          onClick={onTryDreamMode}
        >
          {intl.formatMessage({
            id: 'landing-b2c.demo.screen5.ctaLoggedIn',
          })}
        </Button>

        {/* Divider */}
        <span className={styles.divider}>
          {intl.formatMessage({
            id: 'landing-b2c.demo.screen5.divider',
          })}
        </span>

        {/* Secondary CTA: Explore */}
        <button
          type="button"
          className={styles.secondaryCta}
          onClick={onExplore}
        >
          {intl.formatMessage({
            id: 'landing-b2c.demo.screen5.ctaSecondary',
          })}
        </button>
      </div>
    );
  }

  // Anonymous user view - Show Join Waitlist CTA
  return (
    <div className={`${styles.container} ${styles.anonymous} ${className}`}>
      <Button
        variant="primary"
        size="lg"
        className={styles.primaryCta}
        onClick={onJoinWaitlist}
      >
        {intl.formatMessage({
          id: 'landing-b2c.demo.screen5.ctaAnonymous',
        })}
      </Button>
    </div>
  );
}

export default Screen5CTA;
