'use client';

import { FormattedMessage, useIntl } from 'react-intl';
import {
  emergencyFundTarget,
  financialFreedomTarget,
  illustrativeMirror,
  suggestedMonthlyContribution,
  yearsToTarget,
} from '@diboas/investing';
import { LOCALE_CURRENCY, LOCALE_MARKET, type SandboxLocale } from '@/i18n/config';
import { useFormatters } from '@/hooks/useFormatters';
import { LucideIcon } from './LucideIcon';
import styles from './PresetTemplates.module.css';

/** Conservative-7% NOMINAL (accumulation) — distinct from the SWR used for the
 *  FF *target*. Stated on-screen wherever the projection renders (UX-62). */
const ASSUMED_RATE = 7;

export interface PresetApply {
  name: string;
  icon: string;
  target: number;
}

/**
 * Pre-set goal templates (2c): Emergency Fund (fundable) + Financial Freedom
 * (with the minimal honest projection, option b). One-tap templates the user
 * then EDITS — "start from a common template", never "recommended" (Q3 / CLO
 * guidance-without-advising). Only rendered when income is known (F-A5).
 */
export function PresetTemplates({
  locale,
  income,
  essentials,
  onApply,
}: {
  locale: SandboxLocale;
  income: number;
  /** Real fixed costs override (4.3); when set, EF target + the FF suggested-monthly recompute. */
  essentials?: number;
  onApply: (p: PresetApply) => void;
}) {
  const intl = useIntl();
  const market = LOCALE_MARKET[locale];
  const { money } = useFormatters(LOCALE_CURRENCY[locale]);

  const mirror = illustrativeMirror(income, market, { essentials });
  const efTarget = emergencyFundTarget(income, market, essentials);
  const ffTarget = financialFreedomTarget(income, market);
  // Suggested monthly is capped by what's actually free (point 4.3): you can't
  // put more to work than your Working money.
  const suggested = mirror
    ? Math.min(suggestedMonthlyContribution(income), Math.round(mirror.working))
    : suggestedMonthlyContribution(income);
  const ffYears = yearsToTarget(ffTarget, suggested, ASSUMED_RATE);

  const templates = [
    {
      key: 'emergencyFund',
      icon: 'shield',
      target: efTarget,
      name: intl.formatMessage({ id: 'presets.emergencyFund.name' }),
      desc: intl.formatMessage({ id: 'presets.emergencyFund.desc' }, { target: money(efTarget) }),
      projection: null as string | null,
    },
    {
      key: 'financialFreedom',
      icon: 'palmtree',
      target: ffTarget,
      name: intl.formatMessage({ id: 'presets.financialFreedom.name' }),
      desc: intl.formatMessage(
        { id: 'presets.financialFreedom.desc' },
        { target: money(ffTarget) }
      ),
      projection:
        ffYears != null
          ? intl.formatMessage(
              { id: 'presets.financialFreedom.projection' },
              { monthly: money(suggested), rate: ASSUMED_RATE, years: Math.round(ffYears) }
            )
          : null,
    },
  ];

  return (
    <div className={styles.wrap}>
      <p className={styles.caption}>
        <FormattedMessage id="presets.caption" />
      </p>
      <div className={styles.cards}>
        {templates.map((t) => (
          <button
            key={t.key}
            type="button"
            className={styles.card}
            onClick={() => onApply({ name: t.name, icon: t.icon, target: t.target })}
          >
            <span className={styles.cardIcon}>
              <LucideIcon name={t.icon} size={20} />
            </span>
            <span className={styles.cardBody}>
              <span className={styles.cardName}>{t.name}</span>
              <span className={styles.cardDesc}>{t.desc}</span>
              {t.projection ? <span className={styles.cardProjection}>{t.projection}</span> : null}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
