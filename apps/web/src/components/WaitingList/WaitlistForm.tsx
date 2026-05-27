'use client';

/**
 * Waitlist Form Component
 *
 * Standalone form for waitlist signup with:
 * - Email validation
 * - Referral code tracking
 * - Position assignment via API
 * - Success callback with position data
 */

import React, { useId, useRef } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import { Button } from '@diboas/ui';
import { useWaitlistForm, type WaitlistSuccessData } from './hooks';
import styles from './WaitlistForm.module.css';

interface WaitlistFormProps {
  /** Called when signup is successful */
  onSuccess: (data: WaitlistSuccessData) => void;
  /** Optional callback for errors */
  onError?: (error: string) => void;
  /** Show compact version (email only) */
  compact?: boolean;
  /** Override referral code (e.g. from manually entered invite code) */
  referredBy?: string;
  /** Waitlist source identifier (e.g. 'landing_b2b') */
  source?: string;
  /** Text rendered below submit button */
  belowCta?: string;
  /** Text rendered below consent checkbox */
  belowCheckbox?: string;
  /** Custom class name */
  className?: string;
}

export function WaitlistForm({
  onSuccess,
  onError,
  compact = false,
  referredBy,
  source,
  belowCta,
  belowCheckbox,
  className = '',
}: WaitlistFormProps) {
  const intl = useTranslation();
  const uid = useId();
  const emailId = `${uid}-email`;
  const errorMsgId = `${uid}-error`;
  const gdprId = `${uid}-gdpr`;
  const emailInputRef = useRef<HTMLInputElement>(null);

  // Translation helper
  const t = (key: string, values?: Record<string, string | number>) => {
    return intl.formatMessage({ id: `waitlist.${key}` }, values);
  };

  const { formState, error, isLoading, hasReferral, handleInputChange, handleSubmit } =
    useWaitlistForm({
      compact,
      referredBy,
      source,
      onSuccess,
      onError,
      t,
    });

  return (
    <form
      onSubmit={handleSubmit}
      className={`${styles.form} ${compact ? styles.compact : ''} ${className}`}
    >
      {hasReferral ? (
        <p className={styles.referralIndicator}>{t('referral.invitedIndicator')}</p>
      ) : null}
      <fieldset className={styles.inputGroup}>
        <legend className="sr-only">{t('form.legendText')}</legend>
        <label htmlFor={emailId} className="sr-only">
          {t('form.emailLabel')}
        </label>
        <input
          ref={emailInputRef}
          id={emailId}
          type="email"
          name="email"
          value={formState.email}
          onChange={handleInputChange}
          placeholder={t('form.emailPlaceholder')}
          aria-describedby={error ? errorMsgId : undefined}
          className={`${styles.input} ${error ? styles.inputError : ''}`}
          required
          autoComplete="email"
          disabled={isLoading}
        />
        <Button
          type="submit"
          variant="primary"
          size="sm"
          loading={isLoading}
          loadingText={t('form.cta')}
          className={styles.submitButton}
          trackable
        >
          {t('form.cta')}
        </Button>
      </fieldset>

      {error && (
        <div id={errorMsgId} className={styles.error} role="alert" aria-live="assertive">
          {error}
        </div>
      )}

      {belowCta ? <p className={styles.belowCta}>{belowCta}</p> : null}

      {!compact && (
        <div className={styles.consent}>
          <label htmlFor={gdprId} className={styles.consentLabel}>
            <input
              id={gdprId}
              type="checkbox"
              name="gdprAccepted"
              checked={formState.gdprAccepted}
              onChange={handleInputChange}
              className={styles.checkbox}
              disabled={isLoading}
              aria-required="true"
            />
            <span className={styles.consentText}>{t('form.privacyNote')}</span>
          </label>
        </div>
      )}

      {compact && <p className={styles.privacyNote}>{t('form.privacyNote')}</p>}

      {belowCheckbox ? <p className={styles.belowCheckbox}>{belowCheckbox}</p> : null}
    </form>
  );
}
