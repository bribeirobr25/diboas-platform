'use client';

import { useCallback } from 'react';
import type { GoalTab, RiskTierIndex, ScenarioResult } from './goalCalculatorTypes';
import { isBadCaseLoss } from './goalCalculatorFormulas';
import { LOCALE_SMALLER_AMOUNTS } from './goalCalculatorConstants';
import styles from './GoalCalculator.module.css';

interface GoalCalculatorResultCardProps {
  readonly tab: GoalTab;
  readonly scenarios: ScenarioResult;
  readonly monthlyDeposit: number;
  readonly initialDeposit: number;
  readonly months: number;
  readonly tierIndex: RiskTierIndex;
  readonly targetDate: Date;
  readonly emergencyCoverage: number;
  readonly target: number;
  readonly isStartSmaller: boolean;
  readonly locale: string;
  readonly formatCurrency: (value: number) => string;
  readonly translated: {
    readonly content: {
      readonly result: {
        readonly christmasHeadline: string;
        readonly emergencyHeadline: string;
        readonly vacationHeadline: string;
        readonly planLine: string;
        readonly scenarioGood: string;
        readonly scenarioExpected: string;
        readonly scenarioBad: string;
        readonly badCaseLoss: string;
        readonly disclaimer: string;
        readonly startSmallerToggle: string;
        readonly startSmallerPrompt: string;
        readonly startSmallerPartial: string;
        readonly primaryCta: string;
        readonly secondaryHow: string;
        readonly secondaryRisks: string;
        readonly demoLink: string;
      };
    };
  };
  readonly onStartSmallerToggle: () => void;
  readonly onCtaClick: () => void;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function GoalCalculatorResultCard({
  tab,
  scenarios,
  monthlyDeposit,
  initialDeposit,
  months,
  tierIndex,
  targetDate,
  emergencyCoverage,
  target,
  isStartSmaller,
  locale,
  formatCurrency,
  translated,
  onStartSmallerToggle,
  onCtaClick,
}: GoalCalculatorResultCardProps) {
  const result = translated.content.result;
  const expectedValue = formatCurrency(scenarios.expected);
  const monthlyFormatted = formatCurrency(monthlyDeposit);
  const smallerAmount = LOCALE_SMALLER_AMOUNTS[locale] || LOCALE_SMALLER_AMOUNTS['en'];
  const showLoss = isBadCaseLoss(scenarios.bad, initialDeposit, monthlyDeposit, months);

  const getHeadline = useCallback((): string => {
    switch (tab) {
      case 'christmas':
        return result.christmasHeadline
          .replace('{value}', expectedValue);
      case 'emergency':
        return result.emergencyHeadline
          .replace('{value}', expectedValue)
          .replace('{months}', String(emergencyCoverage));
      case 'vacation':
        return result.vacationHeadline
          .replace('{value}', expectedValue)
          .replace('{date}', formatDate(targetDate));
    }
  }, [tab, result, expectedValue, emergencyCoverage, targetDate]);

  const planLine = result.planLine.replace('{monthly}', monthlyFormatted);

  const scrollTo = useCallback((href: string) => {
    const id = href.replace('#', '');
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const startSmallerPartialPercent = target > 0
    ? Math.round((scenarios.expected / target) * 100)
    : 100;

  return (
    <div
      className={styles.resultCard}
      role="region"
      aria-live="polite"
      aria-label="Calculator results"
    >
      <h3 className={styles.resultHeadline}>{getHeadline()}</h3>
      <p className={styles.resultPlan}>{planLine}</p>

      {/* Scenario table */}
      <div className={styles.scenarioTable}>
        <div className={styles.scenarioRow}>
          <span className={styles.scenarioLabel}>{result.scenarioGood}</span>
          <span className={styles.scenarioValue}>{formatCurrency(scenarios.good)}</span>
        </div>
        <div className={`${styles.scenarioRow} ${styles.scenarioRowHighlight}`}>
          <span className={styles.scenarioLabel}>{result.scenarioExpected}</span>
          <span className={styles.scenarioValue}>{formatCurrency(scenarios.expected)}</span>
        </div>
        <div className={styles.scenarioRow}>
          <span className={styles.scenarioLabel}>{result.scenarioBad}</span>
          <span className={`${styles.scenarioValue} ${showLoss ? styles.scenarioValueLoss : ''}`}>
            {formatCurrency(scenarios.bad)}
          </span>
        </div>
      </div>

      {showLoss ? (
        <p className={styles.badCaseLoss}>{result.badCaseLoss}</p>
      ) : null}

      <p className={styles.resultDisclaimer}>{result.disclaimer}</p>

      {/* Start smaller toggle */}
      {!isStartSmaller && monthlyDeposit > smallerAmount ? (
        <div className={styles.startSmaller}>
          <p className={styles.startSmallerPrompt}>
            {result.startSmallerPrompt.replace('{monthly}', monthlyFormatted)}
          </p>
          <button
            type="button"
            className={styles.startSmallerToggle}
            onClick={onStartSmallerToggle}
          >
            {result.startSmallerToggle}
          </button>
        </div>
      ) : null}

      {isStartSmaller && scenarios.expected < target ? (
        <p className={styles.startSmallerPartial}>
          {result.startSmallerPartial
            .replace('{monthly}', formatCurrency(smallerAmount))
            .replace('{value}', expectedValue)
            .replace('{date}', formatDate(targetDate))
            .replace('{percent}', String(startSmallerPartialPercent))}
        </p>
      ) : null}

      {/* CTAs */}
      <div className={styles.resultCtaGroup}>
        <button
          type="button"
          className={styles.resultCtaPrimary}
          onClick={onCtaClick}
        >
          {result.primaryCta}
        </button>
        <div className={styles.resultSecondaryLinks}>
          <button
            type="button"
            className={styles.resultSecondaryLink}
            onClick={() => scrollTo('#faq')}
          >
            {result.secondaryHow}
          </button>
          <span className={styles.resultSecondaryDivider} aria-hidden="true">|</span>
          <button
            type="button"
            className={styles.resultSecondaryLink}
            onClick={() => scrollTo('#faq')}
          >
            {result.secondaryRisks}
          </button>
        </div>
      </div>

      {/* Demo link */}
      <button
        type="button"
        className={styles.resultDemoLink}
        onClick={() => scrollTo('#demo')}
      >
        {result.demoLink}
      </button>
    </div>
  );
}
