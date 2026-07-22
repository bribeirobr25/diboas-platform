'use client';

import { useEffect, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { CURRENCY_SYMBOL, LOCALE_CURRENCY, type SandboxLocale } from '@/i18n/config';
import { setNetMonthlyIncome } from '@/lib/profileStore';
import styles from './SalaryStep.module.css';

/**
 * First-run step 1: capture net monthly income — the anchor for the
 * illustrative life-mirror and the pre-set goal targets. Optional (skippable,
 * F-A5); on-device only (F-A6). Illustrative context, never advice (Q3).
 */
export function SalaryStep({ locale, onDone }: { locale: SandboxLocale; onDone: () => void }) {
  const intl = useIntl();
  const currency = LOCALE_CURRENCY[locale];
  const [value, setValue] = useState('');

  const parsed = Number(value);
  const valid = value.trim() !== '' && Number.isFinite(parsed) && parsed > 0;

  // Land focus on the step heading when it mounts (onboarding a11y, M2).
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  function submit() {
    if (!valid) return;
    setNetMonthlyIncome(parsed);
    onDone();
  }

  return (
    <section className={styles.wrap} aria-labelledby="salary-title">
      <h1 id="salary-title" ref={headingRef} tabIndex={-1} className={styles.title}>
        <FormattedMessage id="salary.title" />
      </h1>
      <p id="salary-body" className={styles.body}>
        <FormattedMessage id="salary.body" />
      </p>

      <label className={styles.label} htmlFor="salary-input">
        <FormattedMessage id="salary.inputLabel" values={{ currency }} />
      </label>
      <div className={styles.inputRow}>
        <span className={styles.currency} aria-hidden="true">
          {CURRENCY_SYMBOL[currency]}
        </span>
        <input
          id="salary-input"
          className={styles.input}
          type="number"
          inputMode="numeric"
          min={0}
          step={100}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
          }}
          aria-describedby="salary-body"
        />
      </div>

      <button type="button" className={styles.cta} onClick={submit} disabled={!valid}>
        <FormattedMessage id="salary.continue" />
      </button>
      <button
        type="button"
        className={styles.skip}
        onClick={onDone}
        aria-label={intl.formatMessage({ id: 'salary.skip' })}
      >
        <FormattedMessage id="salary.skip" />
      </button>
    </section>
  );
}
