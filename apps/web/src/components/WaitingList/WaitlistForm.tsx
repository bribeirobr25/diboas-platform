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

import type { WaitlistSource } from '@/lib/waitingList/store/types';
import React, { useId, useRef } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import { Button } from '@diboas/ui';
import { useWaitlistForm, type WaitlistSuccessData } from './hooks';
import { WaitlistNoteFields } from './WaitlistNoteFields';
import styles from './WaitlistForm.module.css';

interface WaitlistFormProps {
  /** Called when signup is successful */
  onSuccess: (data: WaitlistSuccessData) => void;
  /** Optional callback for errors */
  onError?: (error: string) => void;
  /** Override referral code (e.g. from manually entered invite code) */
  referredBy?: string;
  /** The signup's source, from the one list (`5.979`, plan P11 D3) */
  source?: WaitlistSource;
  /** Text rendered below submit button */
  belowCta?: string;
  /** Text rendered below the note box */
  belowCheckbox?: string;
  /** Custom class name */
  className?: string;
}

export function WaitlistForm({
  onSuccess,
  onError,
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
  const noteId = `${uid}-note`;
  const emailInputRef = useRef<HTMLInputElement>(null);

  // Translation helper
  const t = (key: string, values?: Record<string, string | number>) => {
    return intl.formatMessage({ id: `waitlist.${key}` }, values);
  };

  const { formState, error, isLoading, hasReferral, handleInputChange, handleSubmit } =
    useWaitlistForm({
      referredBy,
      source,
      onSuccess,
      onError,
      t,
    });

  return (
    <form onSubmit={handleSubmit} className={`${styles.form} ${className}`}>
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

      <div className={styles.consent}>
        <WaitlistNoteFields
          text="note"
          id={noteId}
          checked={formState.noteConsent}
          onChange={handleInputChange}
          disabled={isLoading}
          classNames={{
            notice: styles.privacyNote,
            row: styles.consentLabel,
            checkbox: styles.checkbox,
            label: styles.consentText,
          }}
        />
      </div>

      {belowCheckbox ? <p className={styles.belowCheckbox}>{belowCheckbox}</p> : null}
    </form>
  );
}
