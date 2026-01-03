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

import React, { useState, useRef, useEffect } from 'react';
import { useIntl } from 'react-intl';
import { useLocale } from '@/components/Providers';
import { analyticsService } from '@/lib/analytics';
import { getReferralFromStorage, isValidEmail } from '@/lib/waitingList/helpers';
import { REFERRAL_CONFIG, WAITING_LIST_EVENTS } from '@/lib/waitingList/constants';
import styles from './WaitlistForm.module.css';

interface WaitlistFormProps {
  /** Called when signup is successful */
  onSuccess: (data: {
    position: number;
    referralCode: string;
    referralUrl: string;
  }) => void;
  /** Optional callback for errors */
  onError?: (error: string) => void;
  /** Show compact version (email only) */
  compact?: boolean;
  /** Custom class name */
  className?: string;
}

interface FormState {
  email: string;
  gdprAccepted: boolean;
}

export function WaitlistForm({
  onSuccess,
  onError,
  compact = false,
  className = '',
}: WaitlistFormProps) {
  const intl = useIntl();
  const { locale } = useLocale();
  const emailInputRef = useRef<HTMLInputElement>(null);

  const [formState, setFormState] = useState<FormState>({
    email: '',
    gdprAccepted: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Translation helper
  const t = (key: string, values?: Record<string, string | number>) => {
    return intl.formatMessage({ id: `waitlist.${key}` }, values);
  };

  // Get referral code from URL or cookie
  const getReferralCode = (): string | null => {
    if (typeof window === 'undefined') return null;

    // Check URL first
    const urlParams = new URLSearchParams(window.location.search);
    const refFromUrl = urlParams.get('ref');
    if (refFromUrl) return refFromUrl;

    // Check cookie
    return getReferralFromStorage(REFERRAL_CONFIG.referralCookieName);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormState((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Clear error when user types
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Track form submission
    analyticsService.track({
      name: WAITING_LIST_EVENTS.FORM_SUBMITTED,
      parameters: {
        locale,
        timestamp: Date.now(),
      },
    });

    // Validate email
    if (!formState.email || !isValidEmail(formState.email)) {
      setError(t('error.invalidEmail'));
      setIsLoading(false);
      return;
    }

    // Validate consent (unless compact mode)
    if (!compact && !formState.gdprAccepted) {
      setError(t('error.generic'));
      setIsLoading(false);
      return;
    }

    try {
      const referredBy = getReferralCode();

      const response = await fetch('/api/waitlist/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formState.email.toLowerCase().trim(),
          locale,
          gdprAccepted: compact ? true : formState.gdprAccepted,
          referredBy,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error codes
        if (data.errorCode === 'ALREADY_REGISTERED') {
          setError(t('error.alreadyRegistered'));
          // If already registered, still call onSuccess with existing data
          if (data.position && data.referralCode) {
            onSuccess({
              position: data.position,
              referralCode: data.referralCode,
              referralUrl: data.referralUrl,
            });
          }
        } else if (data.errorCode === 'INVALID_EMAIL') {
          setError(t('error.invalidEmail'));
        } else {
          setError(t('error.generic'));
        }
        onError?.(data.error || 'Unknown error');
        return;
      }

      // Track success
      analyticsService.track({
        name: WAITING_LIST_EVENTS.SUBMISSION_SUCCESS,
        parameters: {
          position: data.position,
          hasReferral: !!referredBy,
          locale,
          timestamp: Date.now(),
        },
      });

      // Call success callback
      onSuccess({
        position: data.position,
        referralCode: data.referralCode,
        referralUrl: data.referralUrl,
      });

    } catch (err) {
      console.error('Waitlist signup error:', err);
      setError(t('error.network'));
      onError?.('Network error');

      analyticsService.track({
        name: WAITING_LIST_EVENTS.SUBMISSION_FAILURE,
        parameters: {
          error: 'network_error',
          locale,
          timestamp: Date.now(),
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

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
        <button
          type="submit"
          className={styles.submitButton}
          disabled={isLoading}
        >
          {isLoading ? (
            <span className={styles.loadingSpinner} />
          ) : (
            t('form.cta')
          )}
        </button>
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
