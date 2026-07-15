'use client';

import { useTranslation } from '@diboas/i18n/client';
import { calculateMonthlyContributions } from '@/lib/market-data';
import { formatCurrency, SCENARIO_RATES } from '@/lib/compound-interest';
import { isValidLocale, type SupportedLocale } from '@diboas/i18n/config';
import styles from './CalculatorDefault.module.css';

interface VignetteRow {
  habit: string;
  yearly: string;
  twelveYear: string;
}

/**
 * Beat 2's vignettes table (L3 rev-3 dynamic-component fix).
 *
 * `habit` and `yearly` come from translation strings (locale-natural copy).
 * `twelveYear` is COMPUTED at render time via the canonical
 * `calculateMonthlyContributions` from `marketDataService`-backed scenario
 * rates — never hardcoded. This eliminates the arithmetic-vs-geometric
 * monthly-rate drift documented in Phase-7 audit L3.
 *
 * The vignettes use the CONSERVATIVE 7% scenario (Option A, founder
 * 2026-07-14), matching the reworked Talk 1 copy that labels them a careful
 * 7% recurring estimate. The calculator below still shows 7/10/14. The lesson
 * stays NON-HEDGED (NOT effective-rate APY); real-tool numbers may differ.
 *
 * Each vignette row in translations must have `yearlyAmount` (number) — the
 * machine-readable annual contribution that feeds the engine. The
 * `yearly` string remains the locale-natural display.
 */
export function CalculatorVignettes() {
  const intl = useTranslation();
  const locale: SupportedLocale = isValidLocale(intl.locale) ? intl.locale : 'en';
  const headers = {
    habit: intl.formatMessage({ id: 'learn-compound-interest.beat2.vignettesTableHeaders.habit' }),
    yearly: intl.formatMessage({
      id: 'learn-compound-interest.beat2.vignettesTableHeaders.yearly',
    }),
    twelveYear: intl.formatMessage({
      id: 'learn-compound-interest.beat2.vignettesTableHeaders.twelveYear',
    }),
  };

  const conservativeDecimal = SCENARIO_RATES.conservative / 100;

  const rows: VignetteRow[] = [0, 1, 2].map((i) => {
    const yearlyAmount = Number(
      intl.formatMessage({ id: `learn-compound-interest.beat2.vignettes.${i}.yearlyAmount` })
    );
    const monthly = yearlyAmount / 12;
    const fv = calculateMonthlyContributions(monthly, conservativeDecimal, 0, 144).nominalFV;
    return {
      habit: intl.formatMessage({ id: `learn-compound-interest.beat2.vignettes.${i}.habit` }),
      yearly: intl.formatMessage({ id: `learn-compound-interest.beat2.vignettes.${i}.yearly` }),
      twelveYear: `~${formatCurrency(Math.round(fv / 10) * 10, locale, { maximumFractionDigits: 0 })}`,
    };
  });

  return (
    <table className={styles.vignettesTable}>
      <thead>
        <tr>
          <th scope="col">{headers.habit}</th>
          <th scope="col">{headers.yearly}</th>
          <th scope="col">{headers.twelveYear}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.habit}>
            <th scope="row">{row.habit}</th>
            <td>{row.yearly}</td>
            <td className={styles.vignetteHighlight}>{row.twelveYear}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
