'use client';

import { useEffect, useRef } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import { usePreDream } from '../PreDreamProvider';
import { ShareDreamSection } from '../components/ShareDreamSection';
import { formatCurrency, calculatePreDreamResult } from '@/lib/pre-dream';
import { useMarketData } from '@/hooks/useMarketData';
import type { SupportedLocale } from '@/lib/market-data';
import { formatRate } from '@/lib/market-data/formatters';
import { useLocale } from '@/components/Providers';
import { TrendingUp } from '@/components/UI/LucideIcon';
import { analyticsService } from '@/lib/analytics';
import styles from '../PreDream.module.css';

interface ResultsScreenProps {
  onBackToHome?: () => void;
}

export function ResultsScreen({ onBackToHome }: ResultsScreenProps) {
  const intl = useTranslation();
  const { state, reset } = usePreDream();
  const { locale } = useLocale();
  const trackedRef = useRef(false);

  const t = (key: string, values?: Record<string, string>) => {
    return intl.formatMessage({ id: `preDream.results.${key}` }, values);
  };

  const result = state.result;

  // Bank display values from market data (locale-aware)
  const { data: marketData } = useMarketData();
  const localeKey = (locale in marketData.rates.bankRates ? locale : 'en') as SupportedLocale;
  const bankRates = marketData.rates.bankRates[localeKey];
  const bankBalance = result?.bankBalance ?? 0;
  const bankInterest = result?.bankInterest ?? 0;
  const difference = result?.difference ?? 0;
  const hasCurrencyHedge = Boolean(result?.diboasYieldBalance);

  // Track pre_dream_completed when results are shown
  useEffect(() => {
    if (result && !trackedRef.current) {
      trackedRef.current = true;
      analyticsService.track({
        name: 'pre_dream_completed',
        parameters: {
          path: state.selectedPath,
          timeframe: state.selectedTimeframe,
          initial_amount: result.totalInvestment,
          defi_balance: result.defiBalance,
          bank_balance: bankBalance,
          difference: difference,
        },
      });
    }
  }, [result, state.selectedPath, state.selectedTimeframe, bankBalance, difference]);

  if (!result) return null;

  // Scale BOTH bars to a common max so the chart reflects the real outcome, rather
  // than hard-pinning diBoaS to 100% (visual-audit F-2: the diBoaS bar was
  // `width:100%` regardless, always "winning" the chart on a projected number).
  const maxBalance = Math.max(result.defiBalance, bankBalance);
  const diboasBarWidth = maxBalance > 0 ? (result.defiBalance / maxBalance) * 100 : 0;
  const bankBarWidth = maxBalance > 0 ? (bankBalance / maxBalance) * 100 : 0;

  // UX-60 (canon Part 9): the chosen path is one of three assumptions, not a
  // certainty. Show what the SAME money would show on the other two paths so the
  // outcome reads as a scenario spread, not a single deterministic number. The
  // chosen path keeps its exact figure above; these are the alternatives.
  const scenarioSpread = (['safety', 'balance', 'growth'] as const)
    .filter((p) => p !== state.selectedPath)
    .map((p) => ({
      path: p,
      label: intl.formatMessage({ id: `preDream.pathSelect.paths.${p}.name` }),
      balance: calculatePreDreamResult(
        p,
        state.selectedTimeframe,
        state.initialAmount,
        state.monthlyContribution,
        result.bankApy,
        locale,
        marketData
      ).defiBalance,
    }));

  const goalName = state.selectedGoal
    ? intl.formatMessage({ id: `preDream.goalStrategy.options.${state.selectedGoal}.label` })
    : null;

  return (
    <div className={styles.screenContent}>
      <div className={styles.screenHeader}>
        <h1 className={styles.screenTitle}>
          {goalName
            ? t('titleWithGoal', { goalName })
            : t('titlePrefix', { amount: formatCurrency(result.totalInvestment, 0, locale) })}
        </h1>
      </div>

      {/* Comparison Cards */}
      <div className={styles.comparisonCards}>
        {/* diBoaS Card */}
        <div className={styles.comparisonCardDiboas}>
          <div className={styles.comparisonHeader}>
            <div>
              <p className={styles.comparisonLabel}>{t('withDiboas')}</p>
              <p className={styles.comparisonApy}>
                {t('assumedApy', { apy: String(result.pathApy) })}
              </p>
            </div>
            <div className={styles.comparisonValues}>
              <p className={styles.comparisonAmount}>
                {formatCurrency(result.defiBalance, 0, locale)}
              </p>
              <p className={styles.comparisonGain}>
                +{formatCurrency(result.defiInterest, 0, locale)}
              </p>
              {hasCurrencyHedge && result.diboasYieldBalance != null && (
                <p className={styles.comparisonGainMuted}>
                  {t('yieldCurrencyValue', {
                    amount: formatCurrency(result.diboasYieldBalance, 0, 'en'),
                  })}
                </p>
              )}
            </div>
          </div>
          <div className={styles.progressBarBg}>
            <div className={styles.progressBarDiboas} style={{ width: `${diboasBarWidth}%` }} />
          </div>
        </div>

        {/* Bank Card */}
        <div className={styles.comparisonCardBank}>
          <div className={styles.comparisonHeader}>
            <div>
              <p className={styles.comparisonLabelMuted}>{t('bankWouldGive')}</p>
              <p className={styles.comparisonApyMuted}>{bankRates.savings}% APY</p>
            </div>
            <div className={styles.comparisonValues}>
              <p className={styles.comparisonAmountMuted}>
                {formatCurrency(bankBalance, 0, locale)}
              </p>
              <p className={styles.comparisonGainMuted}>
                +{formatCurrency(bankInterest, 0, locale)}
              </p>
            </div>
          </div>
          <div className={styles.progressBarBgMuted}>
            <div className={styles.progressBarBank} style={{ width: `${bankBarWidth}%` }} />
          </div>
        </div>
      </div>

      {/* Difference Highlight */}
      <div className={styles.differenceHighlight}>
        <div className={styles.differenceIcon}>
          <TrendingUp width={20} height={20} strokeWidth={2} aria-hidden="true" />
        </div>
        <div>
          <p className={styles.differenceText}>
            {t('differenceMore', { amount: formatCurrency(difference, 0, locale) })}
          </p>
          <p className={styles.differenceSubtext}>{t('differenceSubtext')}</p>
        </div>
      </div>

      {/* UX-60: the same money on the other paths — the outcome is a scenario,
          not a single certain number. */}
      <p className={styles.scenarioSpread}>
        {t('scenarioPrefix')}{' '}
        {scenarioSpread.map((s, i) => (
          <span key={s.path} className={styles.scenarioItem}>
            {i > 0 ? ' · ' : ''}
            {s.label} {formatCurrency(s.balance, 0, locale)}
          </span>
        ))}
      </p>

      {/* UX-63: the caveat travels with the figures, not a footnote. */}
      <p className={styles.resultCaveat}>
        {intl.formatMessage({ id: 'preDream.disclaimer.bullets.pastPerformance' })}
      </p>

      {/* Share Section */}
      <ShareDreamSection result={result} difference={difference} />

      {/* Bank Source */}
      <p className={styles.bankSource}>
        {/* Phase 7 PR-2 (2026-05-18): bank rate sourced from marketDataService
            single source of truth, NOT a translation-string literal. */}
        {intl.formatMessage(
          {
            id:
              localeKey === 'pt-BR'
                ? 'dreamMode.results.bank_source_br'
                : localeKey === 'en'
                  ? 'dreamMode.results.bank_source_us'
                  : 'dreamMode.results.bank_source_eu',
          },
          { rate: formatRate(bankRates.savings, localeKey) }
        )}
      </p>

      {/* Actions */}
      <div className={styles.resultActions}>
        <button type="button" onClick={reset} className={styles.primaryButton}>
          {t('tryDifferent')}
        </button>
        {onBackToHome && (
          <button type="button" onClick={onBackToHome} className={styles.secondaryButton}>
            {t('backToHome')}
          </button>
        )}
      </div>
    </div>
  );
}
