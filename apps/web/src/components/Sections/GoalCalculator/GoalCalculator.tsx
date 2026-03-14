'use client';

import { memo, useCallback, useId } from 'react';
import { useLocale } from '@/components/Providers';
import { useConfigTranslation } from '@/lib/i18n/config-translator';
import { CURRENCY_CONFIG } from '@/lib/currency';
import type { GoalCalculatorConfig, GoalTab, RiskTierIndex } from './goalCalculatorTypes';
import { RISK_TIERS, LOCALE_SMALLER_AMOUNTS } from './goalCalculatorConstants';
import {
  annualToMonthlyRate,
  suggestedMonthly,
  computeScenarios,
  monthsUntil,
  getChristmasTarget,
} from './goalCalculatorFormulas';
import { useGoalCalculatorState } from './useGoalCalculatorState';
import { GoalCalculatorInputs } from './GoalCalculatorInputs';
import { GoalCalculatorSharedFields } from './GoalCalculatorSharedFields';
import { GoalCalculatorResultCard } from './GoalCalculatorResultCard';
import styles from './GoalCalculator.module.css';

interface GoalCalculatorProps {
  readonly config: GoalCalculatorConfig;
  readonly enableAnalytics?: boolean;
}

export const GoalCalculator = memo(function GoalCalculator({
  config,
  enableAnalytics = false,
}: GoalCalculatorProps) {
  const { locale } = useLocale();
  const translated = useConfigTranslation(config);
  const uid = useId();
  const currencyInfo = CURRENCY_CONFIG[locale] || CURRENCY_CONFIG['en'];

  const state = useGoalCalculatorState(enableAnalytics);

  const formatCurrency = useCallback((value: number): string => {
    return new Intl.NumberFormat(currencyInfo.locale, {
      style: 'currency',
      currency: currencyInfo.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }, [currencyInfo]);

  // Compute target based on active tab
  let target = 0;
  switch (state.activeTab) {
    case 'christmas':
      target = state.field1 / 12;
      break;
    case 'emergency':
      target = state.field1 * state.emergencyCoverage;
      break;
    case 'vacation':
      target = state.field1;
      break;
  }

  // Compute months remaining
  let months = 0;
  let christmasRolledOver = false;
  let christmasTargetDate = new Date();
  switch (state.activeTab) {
    case 'christmas': {
      const christmas = getChristmasTarget();
      christmasTargetDate = christmas.date;
      christmasRolledOver = christmas.rolledOver;
      months = monthsUntil(christmas.date);
      if (months === 0) {
        const nextYear = getChristmasTarget();
        christmasTargetDate = nextYear.date;
        christmasRolledOver = true;
        months = monthsUntil(nextYear.date);
      }
      break;
    }
    case 'emergency':
      months = state.emergencyTimeline;
      break;
    case 'vacation': {
      const m = monthsUntil(state.vacationDate);
      months = Math.max(0, m);
      break;
    }
  }

  // n=1 edge case: auto-select careful
  const isOneMonth = months === 1;
  const effectiveTierIndex: RiskTierIndex = isOneMonth ? 0 : state.riskTierIndex;

  // Compute suggested monthly deposit
  const tier = RISK_TIERS[effectiveTierIndex];
  const r = annualToMonthlyRate(tier.expectedAPY);
  const autoMonthly = months > 0
    ? Math.ceil(suggestedMonthly(target, state.initialDeposit, r, months))
    : 0;

  // Effective monthly deposit (user override or auto)
  const smallerAmount = LOCALE_SMALLER_AMOUNTS[locale] || LOCALE_SMALLER_AMOUNTS['en'];
  let effectiveMonthly: number;
  if (state.isStartSmaller) {
    effectiveMonthly = smallerAmount;
  } else if (state.isMonthlyOverridden) {
    effectiveMonthly = parseFloat(state.monthlyDepositRaw) || 0;
  } else {
    effectiveMonthly = autoMonthly;
  }

  // Big commitment warning (Christmas only)
  const showBigCommitment = state.activeTab === 'christmas'
    && state.field1 > 0
    && effectiveMonthly > (state.field1 / 12) * 0.5;

  // Compute scenarios
  const scenarios = computeScenarios(state.initialDeposit, effectiveMonthly, months, effectiveTierIndex);

  // Vacation date minimum warning
  const showVacationWarning = state.activeTab === 'vacation' && monthsUntil(state.vacationDate) < 3;

  // Target date for result card
  const resultTargetDate = state.activeTab === 'christmas'
    ? christmasTargetDate
    : state.activeTab === 'vacation'
      ? state.vacationDate
      : (() => { const d = new Date(); d.setMonth(d.getMonth() + state.emergencyTimeline); return d; })();

  const displayedMonthly = state.isMonthlyOverridden
    ? state.monthlyDepositRaw
    : (autoMonthly > 0 ? autoMonthly.toLocaleString(currencyInfo.locale) : '');

  const TABS: GoalTab[] = ['christmas', 'emergency', 'vacation'];

  return (
    <section
      className={styles.section}
      aria-label={translated.seo.ariaLabel}
    >
      <div className={styles.container}>
        <h2 id={`${uid}-title`} className={styles.title}>{translated.content.header}</h2>

        {/* Tab bar */}
        <div className={styles.tabBar} role="tablist" aria-label={translated.content.header}>
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              className={`${styles.tab} ${state.activeTab === tab ? styles.tabActive : ''}`}
              aria-selected={state.activeTab === tab}
              aria-controls={`${uid}-tabpanel`}
              onClick={() => state.handleTabChange(tab)}
            >
              {translated.content.tabs[tab]}
            </button>
          ))}
        </div>

        <div className={styles.card} id={`${uid}-tabpanel`} role="tabpanel">
          {/* Tab-specific inputs */}
          <GoalCalculatorInputs
            tab={state.activeTab}
            field1Raw={state.field1Raw}
            currencySymbol={currencyInfo.symbol}
            vacationDate={state.vacationDate}
            emergencyCoverage={state.emergencyCoverage}
            emergencyTimeline={state.emergencyTimeline}
            translated={translated}
            onField1Change={state.handleField1Change}
            onCoverageChange={state.handleCoverageChange}
            onTimelineChange={state.handleTimelineChange}
            onVacationDateChange={state.handleVacationDateChange}
          />

          {/* Christmas rollover notice */}
          {state.activeTab === 'christmas' && christmasRolledOver ? (
            <p className={styles.infoNotice}>
              {translated.content.helpers.christmasRollover.replace('{year}', String(christmasTargetDate.getFullYear()))}
            </p>
          ) : null}

          {/* Vacation date warning */}
          {showVacationWarning ? (
            <p className={styles.warningNotice}>{translated.content.helpers.vacationDateMinimum}</p>
          ) : null}

          {/* Shared fields: initial deposit, monthly deposit, risk tier */}
          <GoalCalculatorSharedFields
            initialDepositRaw={state.initialDepositRaw}
            displayedMonthly={displayedMonthly}
            effectiveTierIndex={effectiveTierIndex}
            isOneMonth={isOneMonth}
            currencySymbol={currencyInfo.symbol}
            showBigCommitment={showBigCommitment}
            translated={translated}
            onInitialDepositChange={state.handleInitialDepositChange}
            onMonthlyDepositChange={state.handleMonthlyDepositChange}
            onTierChange={(index) => state.handleTierChange(index, isOneMonth)}
          />

          {/* CTA */}
          <div className={styles.ctaWrapper}>
            <button
              type="button"
              className={styles.cta}
              onClick={() => state.handleShowResult({
                tab: state.activeTab,
                tier: tier.label,
                initialDeposit: state.initialDeposit,
                monthlyDeposit: effectiveMonthly,
                target,
                months,
                expectedValue: scenarios.expected,
              })}
              disabled={state.field1 <= 0 || months <= 0}
            >
              {translated.content.cta}
            </button>
          </div>

          <p className={styles.microcopy}>{translated.content.microcopy}</p>
        </div>

        {/* Result Card */}
        {state.showResult ? (
          <GoalCalculatorResultCard
            tab={state.activeTab}
            scenarios={scenarios}
            monthlyDeposit={effectiveMonthly}
            initialDeposit={state.initialDeposit}
            months={months}
            tierIndex={effectiveTierIndex}
            targetDate={resultTargetDate}
            emergencyCoverage={state.emergencyCoverage}
            target={target}
            isStartSmaller={state.isStartSmaller}
            locale={locale}
            formatCurrency={formatCurrency}
            translated={translated}
            onStartSmallerToggle={() => state.handleStartSmallerToggle({
              tab: state.activeTab,
              previousMonthly: effectiveMonthly,
              newMonthly: smallerAmount,
            })}
            onCtaClick={() => state.handleCtaClick({
              tab: state.activeTab,
              tier: tier.label,
              expectedValue: scenarios.expected,
            })}
          />
        ) : null}
      </div>
    </section>
  );
});
