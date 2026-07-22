'use client';

import { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { MONEY_JOBS_MODEL } from '@diboas/investing';
import { CURRENCY_SYMBOL, LOCALE_CURRENCY, LOCALE_MARKET, type SandboxLocale } from '@/i18n/config';
import { useProfile } from '@/hooks/useProfile';
import { setEssentials } from '@/lib/profileStore';
import { BottomSheet } from './BottomSheet';
import styles from './CostAdjustSheet.module.css';

/**
 * 4.3 spending-recompute (2d): the user sets their REAL fixed costs, overriding
 * the market-share default. Pure illustrative arithmetic — "here's your actual
 * picture", NEVER "you should spend X" (Voice Q3 hard-blocker; a new
 * advice-adjacent surface for CLO). Essentials persist client-side only (F-A6).
 */
export function CostAdjustSheet({
  locale,
  onClose,
}: {
  locale: SandboxLocale;
  onClose: () => void;
}) {
  const profile = useProfile();
  const currency = LOCALE_CURRENCY[locale];
  const income = profile.netMonthlyIncome ?? 0;
  const defaultEssentials = Math.round(
    income * MONEY_JOBS_MODEL.essentialsShare[LOCALE_MARKET[locale]]
  );

  const [value, setValue] = useState(String(profile.essentials ?? defaultEssentials));
  const parsed = Number(value);
  // Require a positive number: essentials of exactly 0 is unrealistic and makes
  // the Emergency-Fund target (essentials × 6) zero, which is un-submittable.
  const valid = value.trim() !== '' && Number.isFinite(parsed) && parsed > 0;

  function save() {
    if (!valid) return;
    setEssentials(parsed);
    onClose();
  }

  function useDefault() {
    setEssentials(null);
    onClose();
  }

  return (
    <BottomSheet titleId="costAdjust.title" onClose={onClose}>
      <div className={styles.wrap}>
        <p className={styles.body}>
          <FormattedMessage id="costAdjust.body" />
        </p>
        <label className={styles.label} htmlFor="cost-input">
          <FormattedMessage id="costAdjust.label" />
        </label>
        <div className={styles.inputRow}>
          <span className={styles.currency} aria-hidden="true">
            {CURRENCY_SYMBOL[currency]}
          </span>
          <input
            id="cost-input"
            className={styles.input}
            type="number"
            inputMode="numeric"
            min={0}
            step={50}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') save();
            }}
          />
        </div>
        <button type="button" className={styles.save} onClick={save} disabled={!valid}>
          <FormattedMessage id="costAdjust.save" />
        </button>
        <button type="button" className={styles.useDefault} onClick={useDefault}>
          <FormattedMessage id="costAdjust.useDefault" />
        </button>
      </div>
    </BottomSheet>
  );
}
