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

import React, { useRef } from 'react';
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
  /** Custom class name */
  className?: string;
}

export function WaitlistForm({
  onSuccess,
  onError,
  compact = false,
  className = '',
}: WaitlistFormProps) {
  const intl = useTranslation();
  const emailInputRef = useRef<HTMLInputElement>(null);

  // Translation helper
  const t = (key: string, values?: Record<string, string | number>) => {
    return intl.formatMessage({ id: `waitlist.${key}` }, values);
  };

  const {
    formState,
    error,
    isLoading,
    handleInputChange,
    handleSubmit,
  } = useWaitlistForm({
    compact,
    onSuccess,
    onError,
    t,
  });

  return (
    <form
      onSubmit={handleSubmit}
      className={`${styles.form} ${compact ? styles.compact : ''} ${className}`}
    >
      <div className={styles.inputGroup}>
        <label htmlFor="waitlist-email" className="sr-only">
          {t('form.emailLabel')}
        </label>
        <input
          ref={emailInputRef}
          id="waitlist-email"
          type="email"
          name="email"
          value={formState.email}
          onChange={handleInputChange}
          placeholder={t('form.emailPlaceholder')}
          aria-describedby={error ? 'waitlist-error' : undefined}
          className={`${styles.input} ${error ? styles.inputError : ''}`}
          required
          autoComplete="email"
          disabled={isLoading}
        />
        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={isLoading}
          loadingText={t('form.cta')}
          className={styles.submitButton}
          trackable
        >
          {t('form.cta')}
        </Button>
      </div>

      {error && (
        <div id="waitlist-error" className={styles.error} role="alert" aria-live="assertive">
          {error}
        </div>
      )}

      {!compact && (
        <div className={styles.consent}>
          <label htmlFor="waitlist-gdpr" className={styles.consentLabel}>
            <input
              id="waitlist-gdpr"
              type="checkbox"
              name="gdprAccepted"
              checked={formState.gdprAccepted}
              onChange={handleInputChange}
              className={styles.checkbox}
              disabled={isLoading}
              aria-required="true"
            />
            <span className={styles.consentText}>
              {t('form.privacyNote')}
            </span>
          </label>
        </div>
      )}

      {compact && (
        <p className={styles.privacyNote}>
          {t('form.privacyNote')}
        </p>
      )}
    </form>
  );
}
