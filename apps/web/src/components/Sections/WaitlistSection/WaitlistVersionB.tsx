/**
 * WaitlistVersionB — Invite Code / Priority Waitlist
 *
 * Shows when founding member spots are full.
 * Path 1: Enter invite code -> validate -> signup as Early Member
 * Path 2: Join priority waitlist (no invite code)
 */

'use client';

import { useState, useCallback } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import { WaitlistForm } from '@/components/WaitingList/WaitlistForm';
import { WaitlistConfirmation } from '@/components/WaitingList/WaitlistConfirmation';
import { applicationEventBus, ApplicationEventType } from '@/lib/events/ApplicationEventBus';
import { fetchWithRetry } from '@/lib/utils/fetchWithRetry';
import styles from './WaitlistSection.module.css';

interface SignupData {
  position: number;
  referralCode: string;
  referralUrl: string;
  tier?: string;
}

interface WaitlistVersionBProps {
  config?: {
    headline?: string;
    subheadline?: string;
    belowCta?: string;
    belowCheckbox?: string;
    namespace?: string;
    confirmationNamespace?: string;
  };
  /** Waitlist source for signup tagging (e.g., 'landing_b2b') */
  source?: string;
  enableAnalytics?: boolean;
}

export function WaitlistVersionB({
  config,
  source,
  enableAnalytics: _enableAnalytics = true,
}: WaitlistVersionBProps) {
  const intl = useTranslation();
  const [inviteCode, setInviteCode] = useState('');
  const [inviteValid, setInviteValid] = useState<boolean | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [signupData, setSignupData] = useState<SignupData | null>(null);

  const ns = config?.namespace ?? 'landing-b2c.waitlist.versionB';
  const t = (key: string) =>
    intl.formatMessage({ id: `${ns}.${key}` });

  const handleValidateCode = useCallback(async () => {
    if (!inviteCode.trim()) return;
    setIsValidating(true);
    try {
      const res = await fetchWithRetry(`/api/waitlist/referral?code=${encodeURIComponent(inviteCode.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setInviteValid(data.valid && data.referrer?.remainingInvites > 0);
      } else {
        setInviteValid(false);
      }
    } catch {
      setInviteValid(false);
    } finally {
      setIsValidating(false);
    }
  }, [inviteCode]);

  const handleSuccess = useCallback((data: SignupData) => {
    setSignupData(data);
    applicationEventBus.emit(ApplicationEventType.WAITLIST_SIGNUP_SUCCESS, {
      source: 'waitlist',
      timestamp: Date.now(),
      metadata: { position: data.position },
    });
  }, []);

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
          <h3 className={styles.headline}>{t('header')}</h3>
          <p className={styles.subheadline}>{t('description')}</p>
        </div>

        <div className={styles.versionBPaths}>
          {/* Path 1: Invite Code */}
          <div className={styles.inviteCodeSection}>
            <div className={styles.inviteCodeRow}>
              <input
                type="text"
                value={inviteCode}
                onChange={e => { setInviteCode(e.target.value); setInviteValid(null); }}
                placeholder={t('inviteCodePlaceholder')}
                className={styles.inviteCodeInput}
                aria-label={t('inviteCodePlaceholder')}
              />
              <button
                type="button"
                onClick={handleValidateCode}
                disabled={isValidating || !inviteCode.trim()}
                className={styles.inviteCodeButton}
              >
                {t('inviteSubmit')}
              </button>
            </div>

            {inviteValid === true ? (
              <WaitlistForm
                onSuccess={handleSuccess}
                referredBy={inviteCode.trim()}
                source={source}
                className={styles.form}
                belowCta={config?.belowCta ? intl.formatMessage({ id: config.belowCta }) : undefined}
                belowCheckbox={config?.belowCheckbox ? intl.formatMessage({ id: config.belowCheckbox }) : undefined}
              />
            ) : inviteValid === false ? (
              <p className={styles.inviteError}>
                {intl.formatMessage({ id: 'waitlist.referral.invalid' })}
              </p>
            ) : null}
          </div>

          {/* Path 2: Priority Waitlist */}
          <div className={styles.prioritySection}>
            <WaitlistForm
              onSuccess={handleSuccess}
              source={source}
              className={styles.form}
              belowCta={config?.belowCta ? intl.formatMessage({ id: config.belowCta }) : undefined}
              belowCheckbox={config?.belowCheckbox ? intl.formatMessage({ id: config.belowCheckbox }) : undefined}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
