'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Decimal from 'decimal.js';
import { FormattedMessage, useIntl } from 'react-intl';
import { getStrategy } from '@diboas/defi';
import {
  GOAL_HORIZON_MAX_MONTHS,
  GOAL_HORIZON_MIN_MONTHS,
  GOAL_ICONS,
  validateGoalDraft,
} from '@diboas/investing';
import type { SandboxLocale } from '@/i18n/config';
import { LOCALE_CURRENCY } from '@/i18n/config';
import { useLedger } from '@/hooks/useLedger';
import { useMarket } from '@/hooks/useMarket';
import { useProfile } from '@/hooks/useProfile';
import { useFormatters } from '@/hooks/useFormatters';
import { createGoal, enterStrategy, setRecurring, splitEntry } from '@/lib/ledgerClient';
import { BottomSheet } from './BottomSheet';
import { LucideIcon } from './LucideIcon';
import { Manifest } from './Manifest';
import { PathCard, networkFeeLocal } from './PathCard';
import { PresetTemplates, type PresetApply } from './PresetTemplates';
import { Projection } from './Projection';
import { Settlement } from './Settlement';
import { StrategyPicker } from './StrategyPicker';
import styles from './GoalNewScreen.module.css';

const TOTAL_STEPS = 3;

/**
 * New goal, as a focused three-step wizard (C1, closes F-2): name the want →
 * set the plan (target, horizon, first amount, optional monthly) → choose the
 * path (strategy, the honest projection, approve). One job per screen (UX-56);
 * validation is deferred per step (no red on an untouched step, B5); focus
 * moves to each step heading. "Keep it as cash" stays available on the last
 * step (the calm choice is never buried).
 */
export function GoalNewScreen({ locale }: { locale: SandboxLocale }) {
  const intl = useIntl();
  const router = useRouter();
  const state = useLedger();
  const profile = useProfile();
  const currency = LOCALE_CURRENCY[locale];
  const { market } = useMarket(currency);
  const { money } = useFormatters(state.currency);

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState<string>(GOAL_ICONS[0]);
  const [target, setTarget] = useState('');
  const [horizonMonths, setHorizonMonths] = useState(24);
  const [fund, setFund] = useState('');
  const [recurring, setRecurringAmount] = useState('');
  const [strategyId, setStrategyId] = useState<string | null>(null);
  const [showManifest, setShowManifest] = useState(false);
  const [settling, setSettling] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  const workingRaw = state.buckets.working;
  const working = useMemo(() => new Decimal(workingRaw), [workingRaw]);
  const fundValue = Number(fund) || 0;
  const targetValue = Number(target) || 0;
  const recurringValue = Number(recurring) || 0;

  const draftErrors = useMemo(
    () => validateGoalDraft({ name, icon, targetAmount: targetValue, horizonMonths }),
    [name, icon, targetValue, horizonMonths]
  );

  const step1Valid = name.trim().length > 0;
  const step2Valid =
    targetValue > 0 &&
    !draftErrors.includes('horizon_out_of_range') &&
    (fundValue === 0 || working.gte(fundValue));

  // Step-2 error list, shown only once the plan step is dirty (B5).
  const step2Errors = useMemo(() => {
    const list: string[] = [];
    if (draftErrors.includes('target_not_positive')) list.push('goalNew.errorTarget');
    if (draftErrors.includes('horizon_out_of_range')) list.push('goalNew.errorHorizon');
    if (fundValue > 0 && working.lt(fundValue)) list.push('goalNew.errorFund');
    return list;
  }, [draftErrors, fundValue, working]);
  const step2Dirty = target !== '' || fund !== '' || recurring !== '' || horizonMonths !== 24;

  const strategy = strategyId ? getStrategy(strategyId) : undefined;
  const wantsStrategy = Boolean(strategy) && fundValue > 0;
  const canSubmit = step1Valid && step2Valid;

  const feeLocal =
    strategy && market ? networkFeeLocal(market.gas, strategy.entryChain, market.usdPriceLocal) : 0;

  function applyPreset(p: PresetApply) {
    setName(p.name);
    setIcon(p.icon);
    setTarget(String(p.target));
  }

  function submitCashOnly() {
    if (!canSubmit || submitted) return;
    setSubmitted(true);
    createGoal({ name, icon, targetAmount: targetValue, horizonMonths, fundAmount: fundValue });
    router.push(`/${locale}`);
  }

  function approveWithStrategy() {
    if (!canSubmit || !strategy || submitted) return;
    setSubmitted(true);
    const goalId = createGoal({
      name,
      icon,
      targetAmount: targetValue,
      horizonMonths,
      fundAmount: fundValue,
    });
    const positionId = enterStrategy({
      goalId,
      strategyId: strategy.id,
      totalFromCash: fundValue,
      networkFeeLocal: feeLocal,
    });
    // Attach the optional recurring plan to the freshly opened position (C3).
    if (recurringValue > 0) {
      setRecurring({ goalId, positionId, monthlyAmount: recurringValue });
    }
    router.push(`/${locale}/goals/${goalId}`);
  }

  const stepTitleId =
    step === 1 ? 'goalNew.step1Title' : step === 2 ? 'goalNew.step2Title' : 'goalNew.step3Title';

  return (
    <section className={styles.wrap} aria-labelledby="goalnew-title">
      <div className={styles.stepHead}>
        <span className={styles.stepLabel}>
          <FormattedMessage id="goalNew.stepLabel" values={{ current: step, total: TOTAL_STEPS }} />
        </span>
        <h1 id="goalnew-title" ref={headingRef} tabIndex={-1} className={styles.stepTitle}>
          <FormattedMessage id={stepTitleId} />
        </h1>
        <div className={styles.dots} aria-hidden>
          {[1, 2, 3].map((n) => (
            <span key={n} className={styles.dot} data-active={n <= step} />
          ))}
        </div>
      </div>

      {/* ── Step 1 — the want ─────────────────────────────────────────────── */}
      {step === 1 ? (
        <div className={styles.step}>
          {profile.netMonthlyIncome != null ? (
            <PresetTemplates
              locale={locale}
              income={profile.netMonthlyIncome}
              essentials={profile.essentials ?? undefined}
              onApply={applyPreset}
            />
          ) : null}

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

          <fieldset className={styles.iconField}>
            <legend className={styles.label}>
              <FormattedMessage id="goalNew.iconLabel" />
            </legend>
            <div className={styles.iconGrid}>
              {GOAL_ICONS.map((iconName) => (
                <label
                  key={iconName}
                  className={`${styles.iconChoice} ${icon === iconName ? styles.iconChoiceSelected : ''}`}
                >
                  <input
                    className={styles.visuallyHidden}
                    type="radio"
                    name="goal-icon"
                    value={iconName}
                    checked={icon === iconName}
                    onChange={() => setIcon(iconName)}
                    aria-label={intl.formatMessage({ id: `goalNew.icon.${iconName}` })}
                  />
                  <LucideIcon name={iconName} size={20} />
                </label>
              ))}
            </div>
          </fieldset>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.primary}
              onClick={() => setStep(2)}
              disabled={!step1Valid}
            >
              <FormattedMessage id="goalNew.next" />
            </button>
          </div>
        </div>
      ) : null}

      {/* ── Step 2 — the plan ─────────────────────────────────────────────── */}
      {step === 2 ? (
        <div className={styles.step}>
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="goal-target">
                <FormattedMessage id="goalNew.targetLabel" />
              </label>
              <input
                id="goal-target"
                className={styles.input}
                type="number"
                inputMode="decimal"
                min={0}
                value={target}
                onChange={(e) => setTarget(e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="goal-horizon">
                <FormattedMessage id="goalNew.horizonLabel" />
              </label>
              <input
                id="goal-horizon"
                className={styles.slider}
                type="range"
                min={GOAL_HORIZON_MIN_MONTHS}
                max={Math.min(GOAL_HORIZON_MAX_MONTHS, 240)}
                step={1}
                value={horizonMonths}
                onChange={(e) => setHorizonMonths(Number(e.target.value))}
                aria-valuetext={intl.formatMessage(
                  { id: 'goalNew.horizonValue' },
                  { months: horizonMonths }
                )}
              />
              <p className={styles.sliderValue}>
                <FormattedMessage id="goalNew.horizonValue" values={{ months: horizonMonths }} />
              </p>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="goal-fund">
              <FormattedMessage id="goalNew.fundLabel" />
            </label>
            <input
              id="goal-fund"
              className={styles.input}
              type="number"
              inputMode="decimal"
              min={0}
              value={fund}
              onChange={(e) => setFund(e.target.value)}
            />
            <p className={styles.hint}>
              <FormattedMessage
                id="goalNew.fundAvailable"
                values={{ amount: money(state.buckets.working) }}
              />
            </p>
          </div>

          {fundValue > 0 ? (
            <div className={styles.field}>
              <label className={styles.label} htmlFor="goal-recurring">
                <FormattedMessage id="goalNew.recurringLabel" />
              </label>
              <input
                id="goal-recurring"
                className={styles.input}
                type="number"
                inputMode="decimal"
                min={0}
                value={recurring}
                onChange={(e) => setRecurringAmount(e.target.value)}
              />
              <p className={styles.hint}>
                <FormattedMessage id="goalNew.recurringHint" />
              </p>
            </div>
          ) : null}

          {step2Dirty && step2Errors.length > 0 ? (
            <ul className={styles.errors} role="alert">
              {step2Errors.map((id) => (
                <li key={id}>
                  <FormattedMessage id={id} />
                </li>
              ))}
            </ul>
          ) : null}

          <div className={styles.actions}>
            <button type="button" className={styles.secondary} onClick={() => setStep(1)}>
              <FormattedMessage id="common.back" />
            </button>
            <button
              type="button"
              className={styles.primary}
              onClick={() => setStep(3)}
              disabled={!step2Valid}
            >
              <FormattedMessage id="goalNew.next" />
            </button>
          </div>
        </div>
      ) : null}

      {/* ── Step 3 — the path ─────────────────────────────────────────────── */}
      {step === 3 ? (
        <div className={styles.step}>
          {fundValue > 0 && market ? (
            <StrategyPicker
              horizonMonths={horizonMonths}
              apys={market.apys}
              selectedId={strategyId}
              onSelect={setStrategyId}
            />
          ) : fundValue > 0 && !market ? (
            <p className={styles.hint}>
              <FormattedMessage id="goalNew.pathUnavailable" />
            </p>
          ) : (
            <p className={styles.hint}>
              <FormattedMessage id="goalNew.noFundPath" />
            </p>
          )}

          {strategy && market && fundValue > 0 ? (
            <>
              <PathCard
                goalName={name.trim() || intl.formatMessage({ id: 'goalNew.title' })}
                strategy={strategy}
                apys={market.apys}
                gas={market.gas}
                usdPriceLocal={market.usdPriceLocal}
                currency={currency}
              />
              {recurringValue > 0 ? (
                <Projection
                  target={targetValue}
                  monthlyContribution={recurringValue}
                  currentValue={fundValue}
                  currency={state.currency}
                />
              ) : null}
            </>
          ) : null}

          {recurringValue > 0 ? (
            <p className={styles.hint}>
              <FormattedMessage id="goalNew.cashDropsRecurring" />
            </p>
          ) : null}

          <div className={styles.actions}>
            <button type="button" className={styles.secondary} onClick={() => setStep(2)}>
              <FormattedMessage id="common.back" />
            </button>
            <button
              type="button"
              className={styles.secondary}
              onClick={submitCashOnly}
              disabled={!canSubmit || submitted}
            >
              <FormattedMessage id={fundValue > 0 ? 'goalNew.skipStrategy' : 'goalNew.createCta'} />
            </button>
            {wantsStrategy ? (
              <button
                type="button"
                className={styles.primary}
                onClick={() => setShowManifest(true)}
                disabled={!canSubmit || submitted}
              >
                <FormattedMessage id="goalNew.reviewPath" />
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {showManifest && strategy && !settling ? (
        <Manifest
          titleId="manifest.title"
          rows={[
            { labelId: 'manifest.fromLabel', value: name.trim() },
            {
              labelId: 'manifest.toLabel',
              value: intl.formatMessage({ id: `catalog.strategies.${strategy.i18nKey}.name` }),
            },
            {
              labelId: 'manifest.amountLabel',
              value: money(splitEntry(fundValue, feeLocal).invested.toFixed(2)),
            },
            {
              labelId: 'manifest.riskLabel',
              value:
                strategy.riskBand === 'stable'
                  ? intl.formatMessage({ id: 'goalNew.riskStable' })
                  : intl.formatMessage(
                      { id: 'goalNew.growthExposure' },
                      { percent: strategy.growthExposurePercent }
                    ),
            },
          ]}
          ctaId="manifest.approveEntry"
          ctaValues={{ amount: money(fundValue) }}
          reassuranceId="manifest.withdrawReassurance"
          onApprove={() => setSettling(true)}
          onCancel={() => setShowManifest(false)}
          approving={submitted}
        />
      ) : null}

      {settling && strategy ? (
        <BottomSheet titleId="settlement.title" tone="ink" dismissible={false} onClose={() => {}}>
          <Settlement onComplete={approveWithStrategy} />
        </BottomSheet>
      ) : null}
    </section>
  );
}
