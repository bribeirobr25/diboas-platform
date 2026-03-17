'use client';

import { ShieldCheck, TrendingUp, Zap } from '@/components/UI/LucideIcon';
import { useGoalCalculator } from '../GoalCalculatorProvider';
import {
  RISK_TIERS,
  LOCALE_SMALLER_AMOUNTS,
  SLIDER_CONFIG,
  GOAL_CALCULATOR_EVENTS,
} from '../goalCalculatorConstants';
import { parseLocaleNumber } from '@/lib/currency';
import {
  annualToMonthlyRate,
  suggestedMonthly,
  computeScenarios,
  monthsUntil,
  getChristmasTarget,
} from '../goalCalculatorFormulas';
import type { RiskTierIndex, GoalCalculatorConfig } from '../goalCalculatorTypes';
import styles from '../GoalCalculator.module.css';

const TIER_ICONS: readonly React.ReactNode[] = [
  <ShieldCheck key="careful" size={22} />,
  <TrendingUp key="moderate" size={22} />,
  <Zap key="aggressive" size={22} />,
] as const;

interface DepositRiskScreenProps {
  readonly translated: GoalCalculatorConfig;
  readonly formatCurrency: (value: number) => string;
  readonly locale: string;
  readonly enableAnalytics: boolean;
}

export function DepositRiskScreen({
  translated,
  formatCurrency,
  locale,
  enableAnalytics,
}: DepositRiskScreenProps) {
  const { state, dispatch, startSimulation } = useGoalCalculator();
  const goal = state.activeGoal;
  if (!goal) return null;

  const field1 = parseLocaleNumber(state.field1Raw);
  const initialDeposit = parseLocaleNumber(state.initialDepositRaw);

  // Compute target
  let target = 0;
  switch (goal) {
    case 'christmas': target = field1 / 12; break;
    case 'emergency': target = field1 * state.emergencyCoverage; break;
    case 'vacation': target = field1; break;
  }

  // Compute months
  let months = 0;
  switch (goal) {
    case 'christmas': {
      const christmas = getChristmasTarget();
      months = monthsUntil(christmas.date);
      if (months === 0) {
        months = monthsUntil(new Date(christmas.date.getFullYear() + 1, 11, 1));
      }
      break;
    }
    case 'emergency': months = state.emergencyTimeline; break;
    case 'vacation': months = state.vacationDate ? Math.max(0, monthsUntil(state.vacationDate)) : 0; break;
  }

  const isOneMonth = months === 1;
  const effectiveTierIndex: RiskTierIndex = isOneMonth ? 0 : state.riskTierIndex;
  const tier = RISK_TIERS[effectiveTierIndex];
  const r = annualToMonthlyRate(tier.expectedAPY);
  const autoMonthly = months > 0 ? Math.ceil(suggestedMonthly(target, initialDeposit, r, months)) : 0;

  const smallerAmount = LOCALE_SMALLER_AMOUNTS[locale] || LOCALE_SMALLER_AMOUNTS['en'];
  let effectiveMonthly: number;
  if (state.isMonthlyOverridden) {
    effectiveMonthly = parseLocaleNumber(state.monthlyDepositRaw);
  } else {
    effectiveMonthly = autoMonthly;
  }

  const showBigCommitment = goal === 'christmas' && field1 > 0 && effectiveMonthly > (field1 / 12) * 0.5;
  const showStartSmaller = autoMonthly > smallerAmount && !state.isMonthlyOverridden;

  const initialConfig = SLIDER_CONFIG.initialDeposit;
  const initialSliderValue = Math.max(initialConfig.min, Math.min(initialConfig.max, initialDeposit));

  const handleInitialSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'SET_INITIAL_DEPOSIT', value: e.target.value });
  };

  const handleInitialInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseInt(e.target.value) || 0;
    const clamped = Math.max(initialConfig.min, Math.min(initialConfig.max, parsed));
    dispatch({ type: 'SET_INITIAL_DEPOSIT', value: String(clamped) });
  };

  const handleMonthlyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'SET_MONTHLY_DEPOSIT', value: e.target.value });
  };

  const handleTierSelect = (index: RiskTierIndex) => {
    if (isOneMonth && index !== 0) return;
    dispatch({ type: 'SET_RISK_TIER', index });
    if (enableAnalytics) {
      import('posthog-js')
        .then(({ default: posthog }) => {
          if (posthog.__loaded) {
            posthog.capture(GOAL_CALCULATOR_EVENTS.TIER_CHANGE, {
              tier: RISK_TIERS[index].label,
              tab: goal,
              locale,
              timestamp: Date.now(),
            });
          }
        })
        .catch(() => {});
    }
  };

  const handleStartSmaller = () => {
    dispatch({ type: 'SET_MONTHLY_DEPOSIT', value: String(smallerAmount) });
    if (enableAnalytics) {
      import('posthog-js')
        .then(({ default: posthog }) => {
          if (posthog.__loaded) {
            posthog.capture(GOAL_CALCULATOR_EVENTS.START_SMALLER_EARLY, {
              goal,
              previousMonthly: autoMonthly,
              newMonthly: smallerAmount,
              locale,
              timestamp: Date.now(),
            });
          }
        })
        .catch(() => {});
    }
  };

  const handleSimulate = () => {
    try {
      const scenarios = computeScenarios(initialDeposit, effectiveMonthly, months, effectiveTierIndex);
      startSimulation(scenarios);
    } catch (error) {
      import('@/lib/errors/ErrorReportingService')
        .then(({ errorReportingService }) => {
          errorReportingService.reportError(
            error instanceof Error ? error : new Error('Scenario computation failed'),
            {
              context: {
                timestamp: Date.now(),
                customData: { source: 'DepositRiskScreen.handleSimulate', goal, months },
              },
            },
          );
        })
        .catch(() => {});
      dispatch({ type: 'RESET' });
    }
  };

  const canProceed = months > 0 && target > 0;

  const TIER_KEYS = ['careful', 'moderate', 'aggressive'] as const;

  const suggestedText = (translated.content.suggested ?? 'Suggested: {amount}/month')
    .replace('{amount}', formatCurrency(autoMonthly));
  const overrideText = translated.content.override ?? 'Override';
  const startSmallerText = (translated.content.startSmaller ?? 'More than you expected? Start with {amount}/month')
    .replace('{amount}', formatCurrency(smallerAmount));
  const backText = translated.content.back ?? 'Back';

  return (
    <div className={styles.screenContent}>
      <div className={styles.screenHeader}>
        <h2 className={styles.screenTitle}>{translated.content.fields.initialDeposit.label}</h2>
      </div>

      {/* Initial deposit slider */}
      <div className={styles.sliderCard}>
        <div className={styles.sliderHeader}>
          <span className={styles.sliderLabel}>{translated.content.fields.initialDeposit.label}</span>
          <input
            type="number"
            className={styles.sliderValueInput}
            value={state.initialDepositRaw || ''}
            onChange={handleInitialInputChange}
            min={initialConfig.min}
            max={initialConfig.max}
            aria-label={`${translated.content.fields.initialDeposit.label} amount`}
          />
        </div>
        <input
          type="range"
          className={styles.rangeSlider}
          min={initialConfig.min}
          max={initialConfig.max}
          step={initialConfig.step}
          value={initialSliderValue}
          onChange={handleInitialSliderChange}
          aria-label={`${translated.content.fields.initialDeposit.label} slider`}
        />
        <div className={styles.sliderRange}>
          <span>{formatCurrency(initialConfig.min)}</span>
          <span>{formatCurrency(initialConfig.max)}</span>
        </div>
      </div>

      {/* Monthly deposit display */}
      <div className={styles.sliderCard}>
        <div className={styles.sliderHeader}>
          <span className={styles.sliderLabel}>{translated.content.fields.monthlyDeposit.label}</span>
        </div>
        <div className={styles.monthlyDisplay}>
          <span className={styles.monthlyLabel}>
            {suggestedText}
          </span>
        </div>
        {state.isMonthlyOverridden ? (
          <input
            type="number"
            className={styles.sliderValueInput}
            value={state.monthlyDepositRaw}
            onChange={handleMonthlyChange}
            min={0}
            max={SLIDER_CONFIG.monthlyDeposit.max}
            aria-label={`${translated.content.fields.monthlyDeposit.label} override`}
            style={{ width: '100%' }}
          />
        ) : null}
        {!state.isMonthlyOverridden ? (
          <button
            type="button"
            className={styles.startSmallerLink}
            onClick={() => dispatch({ type: 'SET_MONTHLY_DEPOSIT', value: String(autoMonthly) })}
            style={{ alignSelf: 'flex-start', fontSize: 'var(--font-size-xs, 12px)' }}
          >
            {overrideText}
          </button>
        ) : null}

        {/* Start smaller escape hatch */}
        {showStartSmaller ? (
          <button
            type="button"
            className={styles.startSmallerLink}
            onClick={handleStartSmaller}
          >
            {startSmallerText}
          </button>
        ) : null}
      </div>

      {showBigCommitment ? (
        <p className={styles.warningNotice}>{translated.content.helpers.bigCommitment}</p>
      ) : null}

      {/* Risk tier selector */}
      <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
        <legend className={styles.sliderLabel}>{translated.content.fields.riskTier.label}</legend>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
          {TIER_KEYS.map((key, index) => {
            const expectedReturnText = (translated.content.expectedReturn ?? '{rate}% expected return')
              .replace('{rate}', String(Math.round(RISK_TIERS[index].expectedAPY * 100)));
            return (
              <button
                key={key}
                type="button"
                className={`${styles.tierCard} ${
                  effectiveTierIndex === index ? styles.tierCardActive : ''
                } ${isOneMonth && index !== 0 ? styles.tierCardDisabled : ''}`}
                onClick={() => handleTierSelect(index as RiskTierIndex)}
                aria-pressed={effectiveTierIndex === index}
                disabled={isOneMonth && index !== 0}
              >
                <span className={styles.tierCardIcon} aria-hidden="true">{TIER_ICONS[index]}</span>
                <div className={styles.tierCardContent}>
                  <span className={styles.tierCardTitle}>{translated.content.tiers[key]}</span>
                  <span className={styles.tierCardSubtitle}>
                    {expectedReturnText}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </fieldset>

      {isOneMonth ? (
        <p className={styles.infoNotice}>{translated.content.helpers.oneMonthWarning}</p>
      ) : null}

      <div className={styles.wizardNavigation}>
        <button type="button" className={styles.backButton} onClick={() => dispatch({ type: 'GO_BACK' })}>
          {backText}
        </button>
        <button
          type="button"
          className={styles.primaryButton}
          onClick={handleSimulate}
          disabled={!canProceed}
        >
          {translated.content.cta}
        </button>
      </div>
    </div>
  );
}
