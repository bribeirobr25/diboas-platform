'use client';

import { useCallback } from 'react';
import { useGoalCalculator } from '../GoalCalculatorProvider';
import { parseLocaleNumber } from '@/lib/currency';
import {
  RISK_TIERS,
  LOCALE_SMALLER_AMOUNTS,
  GOAL_CALCULATOR_EVENTS,
} from '../goalCalculatorConstants';
import {
  annualToMonthlyRate,
  suggestedMonthly,
  isBadCaseLoss,
  monthsUntil,
  getChristmasTarget,
  computeScenarios,
} from '../goalCalculatorFormulas';
import type { RiskTierIndex, GoalCalculatorConfig } from '../goalCalculatorTypes';
import styles from '../GoalCalculator.module.css';

function formatDate(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(date);
}

interface ResultsScreenProps {
  readonly translated: GoalCalculatorConfig;
  readonly formatCurrency: (value: number) => string;
  readonly locale: string;
  readonly enableAnalytics: boolean;
}

export function ResultsScreen({
  translated,
  formatCurrency,
  locale,
  enableAnalytics,
}: ResultsScreenProps) {
  const { state, dispatch, reset, trackEvent } = useGoalCalculator();

  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const goal = state.activeGoal;
  const resultStrings = translated.content.result;

  if (!goal || !state.result) return null;

  const field1 = parseLocaleNumber(state.field1Raw);
  const initialDeposit = parseLocaleNumber(state.initialDepositRaw);

  // Recompute target + months for display
  let target = 0;
  switch (goal) {
    case 'christmas': target = field1 / 12; break;
    case 'emergency': target = field1 * state.emergencyCoverage; break;
    case 'vacation': target = field1; break;
  }

  let months = 0;
  let targetDate = new Date();
  switch (goal) {
    case 'christmas': {
      const christmas = getChristmasTarget();
      targetDate = christmas.date;
      months = monthsUntil(christmas.date);
      if (months === 0) {
        targetDate = new Date(christmas.date.getFullYear() + 1, 11, 1);
        months = monthsUntil(targetDate);
      }
      break;
    }
    case 'emergency': {
      months = state.emergencyTimeline;
      const d = new Date();
      d.setMonth(d.getMonth() + state.emergencyTimeline);
      targetDate = d;
      break;
    }
    case 'vacation': {
      if (state.vacationDate) {
        months = Math.max(0, monthsUntil(state.vacationDate));
        targetDate = state.vacationDate;
      }
      break;
    }
  }

  const isOneMonth = months === 1;
  const effectiveTierIndex: RiskTierIndex = isOneMonth ? 0 : state.riskTierIndex;
  const smallerAmount = LOCALE_SMALLER_AMOUNTS[locale] || LOCALE_SMALLER_AMOUNTS['en'];

  // Compute effective monthly
  let effectiveMonthly: number;
  if (state.isStartSmaller) {
    effectiveMonthly = smallerAmount;
  } else if (state.isMonthlyOverridden) {
    effectiveMonthly = parseLocaleNumber(state.monthlyDepositRaw);
  } else {
    const tier = RISK_TIERS[effectiveTierIndex];
    const r = annualToMonthlyRate(tier.expectedAPY);
    effectiveMonthly = months > 0 ? Math.ceil(suggestedMonthly(target, initialDeposit, r, months)) : 0;
  }

  // Recompute scenarios if start-smaller toggled
  const scenarios = state.isStartSmaller
    ? computeScenarios(initialDeposit, smallerAmount, months, effectiveTierIndex)
    : state.result;

  const showLoss = isBadCaseLoss(scenarios.bad, initialDeposit, effectiveMonthly, months);

  const expectedValue = formatCurrency(scenarios.expected);
  const monthlyFormatted = formatCurrency(effectiveMonthly);

  const getHeadline = (): string => {
    switch (goal) {
      case 'christmas':
        return resultStrings.christmasHeadline.replace('{value}', expectedValue);
      case 'emergency':
        return resultStrings.emergencyHeadline
          .replace('{value}', expectedValue)
          .replace('{months}', String(state.emergencyCoverage));
      case 'vacation':
        return resultStrings.vacationHeadline
          .replace('{value}', expectedValue)
          .replace('{date}', formatDate(targetDate, locale));
    }
  };

  const planLine = resultStrings.planLine.replace('{monthly}', monthlyFormatted);

  const handleCtaClick = () => {
    scrollTo('waitlist');
    trackEvent(GOAL_CALCULATOR_EVENTS.CTA_CLICK, {
      tab: goal,
      tier: RISK_TIERS[effectiveTierIndex].label,
      expectedValue: scenarios.expected,
    });
  };

  const handleStartSmallerToggle = () => {
    dispatch({ type: 'TOGGLE_START_SMALLER' });
    trackEvent(GOAL_CALCULATOR_EVENTS.START_SMALLER_TOGGLE, {
      tab: goal,
      previousMonthly: effectiveMonthly,
      newMonthly: smallerAmount,
    });
  };

  const startSmallerPartialPercent = target > 0 ? Math.round((scenarios.expected / target) * 100) : 100;

  return (
    <div className={styles.screenContent}>
      <div className={styles.screenCard}>
        <h3 className={styles.resultHeadline}>{getHeadline()}</h3>
        <p className={styles.resultPlan}>{planLine}</p>

        {/* Scenario table */}
        <div className={styles.scenarioTable}>
          <div className={styles.scenarioRow}>
            <span className={styles.scenarioLabel}>{resultStrings.scenarioGood}</span>
            <span className={styles.scenarioValue}>{formatCurrency(scenarios.good)}</span>
          </div>
          <div className={`${styles.scenarioRow} ${styles.scenarioRowHighlight}`}>
            <span className={styles.scenarioLabel}>{resultStrings.scenarioExpected}</span>
            <span className={styles.scenarioValue}>{formatCurrency(scenarios.expected)}</span>
          </div>
          <div className={styles.scenarioRow}>
            <span className={styles.scenarioLabel}>{resultStrings.scenarioBad}</span>
            <span className={`${styles.scenarioValue} ${showLoss ? styles.scenarioValueLoss : ''}`}>
              {formatCurrency(scenarios.bad)}
            </span>
          </div>
        </div>

        {showLoss ? (
          <p className={styles.badCaseLoss}>{resultStrings.badCaseLoss}</p>
        ) : null}

        <p className={styles.resultDisclaimer}>{resultStrings.disclaimer}</p>

        {/* Start smaller toggle */}
        {!state.isStartSmaller && effectiveMonthly > smallerAmount ? (
          <div className={styles.startSmaller}>
            <p className={styles.startSmallerPrompt}>
              {resultStrings.startSmallerPrompt.replace('{monthly}', monthlyFormatted)}
            </p>
            <button
              type="button"
              className={styles.startSmallerLink}
              onClick={handleStartSmallerToggle}
            >
              {resultStrings.startSmallerToggle}
            </button>
          </div>
        ) : null}

        {state.isStartSmaller && scenarios.expected < target ? (
          <p className={styles.startSmallerPartial}>
            {resultStrings.startSmallerPartial
              .replace('{monthly}', formatCurrency(smallerAmount))
              .replace('{value}', expectedValue)
              .replace('{date}', formatDate(targetDate, locale))
              .replace('{percent}', String(startSmallerPartialPercent))}
          </p>
        ) : null}

        {/* CTAs */}
        <div className={styles.resultCtaGroup}>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={handleCtaClick}
          >
            {resultStrings.primaryCta}
          </button>
          <div className={styles.resultSecondaryLinks}>
            <button
              type="button"
              className={styles.resultSecondaryLink}
              onClick={() => scrollTo('faq')}
            >
              {resultStrings.secondaryHow}
            </button>
            <span className={styles.resultSecondaryDivider} aria-hidden="true">|</span>
            <button
              type="button"
              className={styles.resultSecondaryLink}
              onClick={() => scrollTo('faq')}
            >
              {resultStrings.secondaryRisks}
            </button>
          </div>
        </div>

        {/* Demo link */}
        <button
          type="button"
          className={styles.resultDemoLink}
          onClick={() => scrollTo('demo')}
        >
          {resultStrings.demoLink}
        </button>
      </div>

      {/* Try different goal */}
      <div className={styles.textCenter}>
        <button
          type="button"
          className={styles.startSmallerLink}
          onClick={reset}
        >
          {translated.content.tryDifferent ?? 'Try a different goal'}
        </button>
      </div>
    </div>
  );
}
