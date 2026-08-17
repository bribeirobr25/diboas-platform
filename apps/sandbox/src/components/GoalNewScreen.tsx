'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Decimal from 'decimal.js';
import { FormattedMessage, useIntl } from 'react-intl';
import { GOAL_ICONS, validateGoalDraft } from '@diboas/investing';
import type { SandboxLocale } from '@/i18n/config';
import { CURRENCY_SYMBOL, LOCALE_CURRENCY } from '@/i18n/config';
import { useLedger } from '@/hooks/useLedger';
import { useFormatters } from '@/hooks/useFormatters';
import { createGoal } from '@/lib/ledgerClient';
import styles from './GoalNewScreen.module.css';

/** Plain goals get a neutral default icon — the per-type icons arrive with the
 *  challenge-framed goals (D-6); mockup 12 offers no icon picker. */
const DEFAULT_ICON = GOAL_ICONS[0];
const MONTHS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const YEARS_AHEAD = 40; // matches GOAL_HORIZON_MAX_MONTHS (480 = 40y)

/**
 * Create a goal (G1; mockup 12). The plain, framing-independent creation form
 * (D-6): name -> target amount -> time horizon (month + year) -> optional
 * starting amount from Available -> Create goal. Wired to the built ledger
 * (`createGoal`, emitting GoalCreated + optional GoalFunded); the goal then
 * appears on Home. Strategy entry ("put money to work") is a separate later
 * flow, not folded into creation (the challenge-framed goal-detail + strategy
 * catalog are Phase-2 / D-6). Creating routes to Home (goal-detail G2 deferred).
 */
export function GoalNewScreen({ locale }: { locale: SandboxLocale }) {
  const intl = useIntl();
  const router = useRouter();
  const state = useLedger();
  const currency = LOCALE_CURRENCY[locale];
  const symbol = CURRENCY_SYMBOL[currency];
  const { money } = useFormatters(state.currency);

  const now = new Date();
  const nowYear = now.getFullYear();
  const nowMonth = now.getMonth();
  const years = useMemo(
    () => Array.from({ length: YEARS_AHEAD + 1 }, (_, i) => nowYear + i),
    [nowYear]
  );

  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [month, setMonth] = useState<number | ''>('');
  const [year, setYear] = useState<number | ''>('');
  const [fund, setFund] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const available = useMemo(() => new Decimal(state.buckets.working), [state.buckets.working]);
  const targetValue = Number(target) || 0;
  const fundValue = Number(fund) || 0;
  const horizonSet = month !== '' && year !== '';
  const horizonMonths = horizonSet ? (Number(year) - nowYear) * 12 + (Number(month) - nowMonth) : 0;

  const draftErrors = useMemo(
    () => validateGoalDraft({ name, icon: DEFAULT_ICON, targetAmount: targetValue, horizonMonths }),
    [name, targetValue, horizonMonths]
  );

  const nameValid = name.trim().length > 0;
  const horizonValid = horizonSet && !draftErrors.includes('horizon_out_of_range');
  const fundValid = fundValue === 0 || available.gte(fundValue);
  const canSubmit = nameValid && targetValue > 0 && horizonValid && fundValid;

  // Errors surface only once the relevant field is touched (no red on untouched).
  const errors: string[] = [];
  if (target !== '' && targetValue <= 0) errors.push('goalNew.errorTarget');
  if (horizonSet && draftErrors.includes('horizon_out_of_range'))
    errors.push('goalNew.errorHorizon');
  if (fundValue > 0 && !fundValid) errors.push('goalNew.errorFund');

  function submit() {
    if (!canSubmit || submitted) return;
    setSubmitted(true);
    createGoal({
      name,
      icon: DEFAULT_ICON,
      targetAmount: targetValue,
      horizonMonths,
      fundAmount: fundValue,
    });
    router.push(`/${locale}`);
  }

  const monthName = (m: number) => intl.formatDate(new Date(nowYear, m, 1), { month: 'long' });

  return (
    <section className={styles.wrap} aria-labelledby="goalnew-title">
      <header className={styles.head}>
        <h1 id="goalnew-title" className={styles.title}>
          <FormattedMessage id="goalNew.title" />
        </h1>
        <p className={styles.subtitle}>
          <FormattedMessage id="goalNew.subtitle" />
        </p>
      </header>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="goal-name">
          <FormattedMessage id="goalNew.nameLabel" />
        </label>
        <input
          id="goal-name"
          className={styles.input}
          value={name}
          maxLength={40}
          onChange={(e) => setName(e.target.value)}
          placeholder={intl.formatMessage({ id: 'goalNew.namePlaceholder' })}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="goal-target">
          <FormattedMessage id="goalNew.targetLabel" />
        </label>
        <div className={styles.amountInput}>
          <span className={styles.amountPrefix} aria-hidden>
            {symbol}
          </span>
          <input
            id="goal-target"
            className={styles.amountField}
            type="number"
            inputMode="decimal"
            min={0}
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="0.00"
          />
        </div>
      </div>

      <fieldset className={styles.field}>
        <legend className={styles.label}>
          <FormattedMessage id="goalNew.horizonLabel" />
        </legend>
        <div className={styles.row}>
          <div className={styles.selectField}>
            <span className={styles.subLabel}>
              <FormattedMessage id="goalNew.monthLabel" />
            </span>
            <select
              className={styles.select}
              value={month}
              onChange={(e) => setMonth(e.target.value === '' ? '' : Number(e.target.value))}
              aria-label={intl.formatMessage({ id: 'goalNew.monthLabel' })}
            >
              <option value="">{intl.formatMessage({ id: 'goalNew.monthLabel' })}</option>
              {MONTHS.map((m) => (
                <option key={m} value={m}>
                  {monthName(m)}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.selectField}>
            <span className={styles.subLabel}>
              <FormattedMessage id="goalNew.yearLabel" />
            </span>
            <select
              className={styles.select}
              value={year}
              onChange={(e) => setYear(e.target.value === '' ? '' : Number(e.target.value))}
              aria-label={intl.formatMessage({ id: 'goalNew.yearLabel' })}
            >
              <option value="">{intl.formatMessage({ id: 'goalNew.yearLabel' })}</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>
      </fieldset>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="goal-fund">
          <FormattedMessage id="goalNew.startingLabel" />{' '}
          <span className={styles.optional}>
            <FormattedMessage id="goalNew.optional" />
          </span>
        </label>
        <span className={styles.subLabel}>
          <FormattedMessage id="goalNew.startingFrom" />
        </span>
        <div className={styles.amountInput}>
          <span className={styles.amountPrefix} aria-hidden>
            {symbol}
          </span>
          <input
            id="goal-fund"
            className={styles.amountField}
            type="number"
            inputMode="decimal"
            min={0}
            value={fund}
            onChange={(e) => setFund(e.target.value)}
            placeholder="0.00"
          />
        </div>
        <p className={styles.hint}>
          <FormattedMessage
            id="goalNew.fundAvailable"
            values={{ amount: money(state.buckets.working) }}
          />
        </p>
      </div>

      {errors.length > 0 ? (
        <ul className={styles.errors} role="alert">
          {errors.map((id) => (
            <li key={id}>
              <FormattedMessage id={id} />
            </li>
          ))}
        </ul>
      ) : null}

      <button
        type="button"
        className={styles.createBtn}
        onClick={submit}
        disabled={!canSubmit || submitted}
      >
        <FormattedMessage id="goalNew.createCta" />
      </button>
    </section>
  );
}
