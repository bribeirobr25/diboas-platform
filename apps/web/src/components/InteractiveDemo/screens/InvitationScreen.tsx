'use client';

/**
 * Invitation Screen (Screen 5)
 *
 * Waitlist signup form
 */

import { Button } from '@diboas/ui';
import { Screen5CTA } from '../Screen5CTA';
import styles from '../InteractiveDemo.module.css';

interface InvitationScreenProps {
  isOnWaitlist: boolean;
  email: string;
  isSubmitting: boolean;
  locale: string;
  onEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEmailFocus: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onJoinWaitlist: () => void;
  onTryDreamMode: () => void;
  onExplore: () => void;
  t: (id: string) => string;
}

export function InvitationScreen({
  isOnWaitlist,
  email,
  isSubmitting,
  locale,
  onEmailChange,
  onEmailFocus,
  onSubmit,
  onJoinWaitlist,
  onTryDreamMode,
  onExplore,
  t,
}: InvitationScreenProps) {
  return (
    <div className={styles.screen}>
      <h2 className={styles.header}>
        {t('landing-b2c.demo.invitation.header')}
      </h2>
      <p className={styles.subheader}>
        {t('landing-b2c.demo.invitation.subheader')}
      </p>
      <p className={styles.callToAction}>
        {t('landing-b2c.demo.invitation.callToAction')}
      </p>

      {/* Conditional CTA based on user waitlist status */}
      {isOnWaitlist ? (
        <Screen5CTA
          isOnWaitlist={true}
          onJoinWaitlist={onJoinWaitlist}
          onTryDreamMode={onTryDreamMode}
          onExplore={onExplore}
        />
      ) : (
        <>
          <form onSubmit={onSubmit} className={styles.signupForm}>
            <label htmlFor="demo-email" className="sr-only">
              {t('landing-b2c.demo.invitation.emailPlaceholder')}
            </label>
            <input
              id="demo-email"
              type="email"
              className={styles.emailInput}
              placeholder={t('landing-b2c.demo.invitation.emailPlaceholder')}
              value={email}
              onChange={onEmailChange}
              onFocus={onEmailFocus}
              required
              aria-required="true"
            />
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className={`${styles.ctaButton} ${styles.submitButton}`}
              disabled={isSubmitting}
              loading={isSubmitting}
              aria-label={t('landing-b2c.demo.invitation.submitButton')}
            >
              {t('landing-b2c.demo.invitation.submitButton')}
            </Button>
          </form>
          <ul className={styles.trustPoints}>
            <li>{t('landing-b2c.demo.invitation.trustPoint1')}</li>
            <li>{t('landing-b2c.demo.invitation.trustPoint2')}</li>
            <li>{t('landing-b2c.demo.invitation.trustPoint3')}</li>
          </ul>
        </>
      )}
    </div>
  );
}
