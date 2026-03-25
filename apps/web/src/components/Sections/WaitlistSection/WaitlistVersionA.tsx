/**
 * WaitlistVersionA — Founding Member Signup
 *
 * Shows when founding member spots are available.
 * Displays benefits list + signup form + spots counter.
 */

'use client';

import { useState, useCallback } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import { WaitlistForm } from '@/components/WaitingList/WaitlistForm';
import { WaitlistConfirmation } from '@/components/WaitingList/WaitlistConfirmation';
import { applicationEventBus, ApplicationEventType } from '@/lib/events/ApplicationEventBus';
import styles from './WaitlistSection.module.css';

interface SignupData {
  position: number;
  referralCode: string;
  referralUrl: string;
  tier?: string;
}

interface WaitlistVersionAProps {
  config?: {
    headline?: string;
    subheadline?: string;
    belowCta?: string;
    belowCheckbox?: string;
    hideBenefits?: boolean;
    hideNoSpam?: boolean;
    namespace?: string;
    confirmationNamespace?: string;
  };
  /** Waitlist source for signup tagging (e.g., 'landing_b2b') */
  source?: string;
  stats: {
    count: number;
    foundingMemberSpotsRemaining?: number;
  };
  isLoading: boolean;
  enableAnalytics?: boolean;
}

export function WaitlistVersionA({
  config,
  source,
  stats,
  isLoading,
  enableAnalytics: _enableAnalytics = true,
}: WaitlistVersionAProps) {
  const intl = useTranslation();
  const [signupData, setSignupData] = useState<SignupData | null>(null);

  const handleSuccess = useCallback((data: SignupData) => {
    setSignupData(data);
    applicationEventBus.emit(ApplicationEventType.WAITLIST_SIGNUP_SUCCESS, {
      source: 'waitlist',
      timestamp: Date.now(),
      metadata: { position: data.position },
    });
  }, []);

  const ns = config?.namespace || 'landing-b2c.waitlist';
  const t = (key: string, values?: Record<string, React.ReactNode>) =>
    intl.formatMessage({ id: `${ns}.${key}` }, values);

  if (signupData) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.content}>
          <WaitlistConfirmation
            position={signupData.position}
            referralCode={signupData.referralCode}
            referralUrl={signupData.referralUrl}
            tier={signupData.tier}
            namespace={config?.confirmationNamespace}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.content}>
        <div className={styles.header}>
          <h2 className={styles.headline}>
            {intl.formatMessage({ id: config?.headline || 'landing-b2c.waitlist.header' })}
          </h2>
          <p className={styles.subheadline}>
            {intl.formatMessage({ id: config?.subheadline || 'landing-b2c.waitlist.description' })}
          </p>
        </div>

        {config?.hideBenefits ? null : (
          <ul className={styles.benefitsList}>
            <li className={styles.benefitItem}>{t('benefits.badge')}</li>
            <li className={styles.benefitItem}>{t('benefits.wall')}</li>
            <li className={styles.benefitItem}>{t('benefits.invites')}</li>
            <li className={styles.benefitItem}>{t('benefits.exclusive')}</li>
          </ul>
        )}

        <WaitlistForm
          onSuccess={handleSuccess}
          className={styles.form}
          source={source}
          belowCta={config?.belowCta ? intl.formatMessage({ id: config.belowCta }) : undefined}
          belowCheckbox={config?.belowCheckbox ? intl.formatMessage({ id: config.belowCheckbox }) : undefined}
        />

        {!isLoading && stats.foundingMemberSpotsRemaining != null && stats.foundingMemberSpotsRemaining > 0 ? (
          <p className={styles.counterRow}>
            {t('spotsCounter', {
              count: <span key="count" className={styles.spotsHighlight}>{stats.foundingMemberSpotsRemaining}</span>,
            })}
          </p>
        ) : null}

        {config?.hideNoSpam ? null : (() => {
          const noSpamText = t('noSpam');
          return noSpamText ? <p className={styles.noSpam}>{noSpamText}</p> : null;
        })()}
      </div>
    </div>
  );
}
