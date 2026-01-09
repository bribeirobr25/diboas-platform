'use client';

/**
 * Success Screen (Screen 6)
 *
 * Thank you with share options and Dream Mode CTA
 */

import { Button } from '@diboas/ui';
import styles from '../InteractiveDemo.module.css';

interface SuccessScreenProps {
  waitlistPosition: number | null;
  referralCode: string | null;
  locale: string;
  onShare: (platform: string) => void;
  onDreamModeClick: () => void;
  onCalculatorClick: () => void;
  t: (id: string, values?: Record<string, string | number | null>) => string;
}

export function SuccessScreen({
  waitlistPosition,
  referralCode,
  locale,
  onShare,
  onDreamModeClick,
  onCalculatorClick,
  t,
}: SuccessScreenProps) {
  return (
    <div className={styles.screen}>
      <h2 className={styles.header}>
        {t('landing-b2c.demo.success.header')}
      </h2>
      <p className={styles.position}>
        {t('landing-b2c.demo.success.positionLabel', {
          position: waitlistPosition
        })}
      </p>
      <div className={styles.referralSection}>
        <h3 className={styles.incentiveHeader}>
          {t('landing-b2c.demo.success.incentiveHeader')}
        </h3>
        <p className={styles.incentiveMechanic}>
          {t('landing-b2c.demo.success.incentiveMechanic')}
        </p>
        <div className={styles.linkBox}>
          <span className={styles.linkBoxLabel}>
            {t('landing-b2c.demo.success.linkBoxLabel')}
          </span>
          <code className={styles.referralLink}>
            diboas.com/invite/{referralCode}
          </code>
        </div>
      </div>
      <p className={styles.shareLabel}>
        {t('landing-b2c.demo.success.shareLabel')}
      </p>
      <div className={styles.shareButtons} role="group" aria-label={t('common.accessibility.shareOptions')}>
        <button type="button" className={styles.socialButton} onClick={() => onShare('twitter')} aria-label={t('common.accessibility.shareOnTwitter')}>
          Twitter
        </button>
        <button type="button" className={styles.socialButton} onClick={() => onShare('whatsapp')} aria-label={t('common.accessibility.shareOnWhatsapp')}>
          WhatsApp
        </button>
        <button type="button" className={styles.socialButton} onClick={() => onShare('linkedin')} aria-label={t('common.accessibility.shareOnLinkedin')}>
          LinkedIn
        </button>
        <button type="button" className={styles.socialButton} onClick={() => onShare('copy')} aria-label={t('common.accessibility.copyReferralLink')}>
          {t('landing-b2c.demo.success.copyLink')}
        </button>
      </div>

      {/* Dream Mode CTA - for users who completed waitlist signup */}
      <div className={styles.dreamModeSection}>
        <h3 className={styles.dreamModeHeader}>
          {t('landing-b2c.demo.success.dreamModeHeader')}
        </h3>
        <Button
          variant="secondary"
          size="lg"
          className={styles.dreamModeButton}
          onClick={onDreamModeClick}
        >
          {t('landing-b2c.demo.success.dreamModeCta')}
        </Button>
      </div>

      {/* Calculator suggestion - EP3 */}
      <div className={styles.calculatorSuggestion}>
        <button
          type="button"
          className={styles.calculatorLink}
          onClick={onCalculatorClick}
        >
          {t('landing-b2c.demo.success.calculatorSuggestion')}
        </button>
      </div>
    </div>
  );
}
