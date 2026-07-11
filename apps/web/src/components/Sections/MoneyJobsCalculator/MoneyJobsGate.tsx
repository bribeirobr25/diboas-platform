'use client';

/**
 * MoneyJobsGate — the inline email gate between the free split and the plan
 * (spec §5; decision 8: unlock = plan + projections).
 *
 * Gate rules honored here:
 * - Inline card, not a modal; the free summary above is complete on its own
 *   (row-15 reasoning: the split is the promised result; the plan is depth —
 *   see MONEY_JOBS_CLO_LIGHT_PASS_2026-07-11 Part 2 Q2).
 * - GDPR checkbox EXPLICIT (never the form's `compact` auto-consent mode).
 * - ALREADY_REGISTERED unlocks too (useWaitlistForm calls onSuccess for it).
 * - Decision 5: on success the email persists via POSITION_STORAGE_KEYS.email
 *   — which also repairs the dream-mode gate (nothing wrote that key before).
 * - Analytics: consent-gated tool_gate_viewed / tool_gate_unlocked, no PII.
 * - A3 (UX-01/02): the submit button is the single primary action pre-unlock.
 */

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import { useWaitlistForm, type WaitlistSuccessData } from '@/components/WaitingList/hooks';
import { POSITION_STORAGE_KEYS } from '@/lib/waitingList/constants';
import { analyticsService } from '@/lib/analytics';
import styles from './MoneyJobsCalculator.module.css';

interface MoneyJobsGateProps {
  /** Fires when the plan unlocks (fresh signup, ALREADY_REGISTERED, or a
   *  previously-persisted membership found on mount). */
  onUnlocked: (data: WaitlistSuccessData | null) => void;
  unlocked: boolean;
}

function readPersistedEmail(): string | null {
  try {
    return typeof window !== 'undefined'
      ? window.localStorage.getItem(POSITION_STORAGE_KEYS.email)
      : null;
  } catch {
    return null;
  }
}

function persistEmail(email: string): void {
  try {
    window.localStorage.setItem(POSITION_STORAGE_KEYS.email, email);
  } catch {
    // Storage unavailable (private mode) — the unlock still works this session.
  }
}

export function MoneyJobsGate({ onUnlocked, unlocked }: MoneyJobsGateProps) {
  const intl = useTranslation();
  const t = (key: string, values?: Record<string, string | number>) =>
    intl.formatMessage({ id: `tools-money-jobs.gate.${key}` }, values);

  const [success, setSuccess] = useState<WaitlistSuccessData | null>(null);
  const viewedRef = useRef(false);
  const unlockedRef = useRef(false);

  // Same try/catch shape as useWaitlistMembership: an already-persisted email
  // (waitlist member from any surface) unlocks without re-asking.
  useEffect(() => {
    if (unlockedRef.current) return;
    if (readPersistedEmail()) {
      unlockedRef.current = true;
      onUnlocked(null);
    }
  }, [onUnlocked]);

  useEffect(() => {
    if (unlocked || viewedRef.current) return;
    viewedRef.current = true;
    analyticsService.track({
      name: 'tool_gate_viewed',
      parameters: { source: 'tool_money_jobs', timestamp: Date.now() },
    });
  }, [unlocked]);

  const { formState, error, isLoading, handleInputChange, handleSubmit } = useWaitlistForm({
    source: 'tool_money_jobs',
    t: (key, values) => intl.formatMessage({ id: `common.waitingList.${key}` }, values),
    onSuccess: (data) => {
      persistEmail(formState.email.trim().toLowerCase());
      setSuccess(data);
      unlockedRef.current = true;
      analyticsService.track({
        name: 'tool_gate_unlocked',
        parameters: { source: 'tool_money_jobs', timestamp: Date.now() },
      });
      onUnlocked(data);
    },
  });

  if (unlocked) {
    return success ? (
      <p className={styles.gateFinePrint} data-testid="gate-success">
        {t('successLine', { position: success.position })}{' '}
        <a className={styles.stateLink} href={success.referralUrl}>
          {t('referralLinkLabel')}
        </a>
      </p>
    ) : null;
  }

  return (
    <section className={styles.gateCard} aria-label={t('ariaLabel')}>
      <h3 className={styles.gateTitle}>{t('title')}</h3>
      <ul className={styles.gateList}>
        <li>{t('bullets.timeline')}</li>
        <li>{t('bullets.projections')}</li>
        <li>{t('bullets.runway')}</li>
        <li>{t('bullets.nextSteps')}</li>
      </ul>
      <form className={styles.gateForm} onSubmit={handleSubmit} noValidate>
        <input
          type="email"
          name="email"
          inputMode="email"
          autoComplete="email"
          required
          placeholder={t('emailPlaceholder')}
          aria-label={t('emailPlaceholder')}
          value={formState.email}
          onChange={handleInputChange}
          className={styles.gateEmailInput}
        />
        <label className={styles.gateConsentRow}>
          <input
            type="checkbox"
            name="gdprAccepted"
            checked={formState.gdprAccepted}
            onChange={handleInputChange}
            required
          />
          <span>{t('gdprLabel')}</span>
        </label>
        {error ? (
          <p className={styles.gateError} role="alert">
            {error}
          </p>
        ) : null}
        <button type="submit" className={styles.gateSubmit} disabled={isLoading}>
          {isLoading ? t('ctaLoading') : t('cta')}
        </button>
      </form>
      <p className={styles.gateFinePrint}>{t('finePrint')}</p>
    </section>
  );
}
