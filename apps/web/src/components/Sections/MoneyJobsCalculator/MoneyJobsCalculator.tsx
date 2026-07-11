'use client';

/**
 * Money Jobs — tool #11, the /tools entry point (NEW_TOOL_PROPOSAL.md §5/§7).
 *
 * Thin client renderer over the lib/money-jobs engines. Instant compute on
 * input (no button); the free summary is complete on its own (headline +
 * cost line + three-job split); the gate below unlocks plan + projections
 * (decision 8). Dignity state (F3) and B2B runway mode (decision 9) are
 * first-class paths that suppress the sell.
 *
 * Build conditions honored (CLO C1–C5 + UX-governance A1–A4):
 *  A1 essentials = number field + dual-bound slider · A2 mode pills =
 *  shared SegmentedControl · A3 gate CTA is the single primary action
 *  pre-unlock (share renders as a quiet secondary) · C2 the ideal◄►max
 *  band carries its slack explainer · C3 the tool disclaimer renders on
 *  the free surface · C4 Conservative leads the gated projections · C1
 *  the BR dollar line is gated and carries the hedge sentence beside it.
 */

import { useId, useMemo, useState } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import type { SupportedLocale } from '@diboas/i18n/config';
import { useLocale } from '@/components/Providers';
import { SegmentedControl } from '@/components/UI';
import { LocaleLink } from '@/components/UI/LocaleLink';
import { useCalculatorAnalytics } from '@/hooks/useCalculatorAnalytics';
import { useResultShare } from '@/hooks/useResultShare';
import { marketDataService, LOCALE_CURRENCY } from '@/lib/market-data';
import { formatCurrency } from '@/lib/compound-interest';
import { calculateCompoundProjectionHedged } from '@/lib/compound-interest/calculatorHedged';
import {
  MONEY_JOBS_MODEL,
  MONEY_JOBS_COST_LINE_YEARS,
  calculateMoneyJobsPersonal,
  calculateMoneyJobsBusiness,
  calculateMoneyJobsPersonalPlan,
  calculateMoneyJobsBusinessPlan,
} from '@/lib/money-jobs';
import {
  MONEY_JOBS_DEFAULTS,
  MONEY_JOBS_INCOME_BOUNDS,
  MONEY_JOBS_ESSENTIALS_BOUNDS,
  MONEY_JOBS_SAVINGS_BOUNDS,
  MONEY_JOBS_REVENUE_BOUNDS,
  MONEY_JOBS_BURN_BOUNDS,
  MONEY_JOBS_CASH_BOUNDS,
  clampInput,
} from '@/lib/tools';
import { MoneyJobsGate } from './MoneyJobsGate';
import styles from './MoneyJobsCalculator.module.css';

type Mode = 'personal' | 'business';

interface MoneyJobsCalculatorProps {
  /** Decision 6: page passes 'business' for ?for=business / b2b UTM arrivals. */
  initialMode?: Mode;
}

export function MoneyJobsCalculator({ initialMode = 'personal' }: MoneyJobsCalculatorProps) {
  const intl = useTranslation();
  const { locale } = useLocale();
  const baseId = useId();

  const t = (key: string, values?: Record<string, string | number>) =>
    intl.formatMessage({ id: `tools-money-jobs.${key}` }, values);
  const tShared = (key: string, values?: Record<string, string | number>) =>
    intl.formatMessage({ id: `tools-shared.${key}` }, values);

  const localeKey = (locale ?? 'en') as SupportedLocale;
  const fmt = (v: number) => formatCurrency(v, localeKey, { maximumFractionDigits: 0 });

  const [mode, setMode] = useState<Mode>(initialMode);

  // ---- B2C state. Essentials pre-fills from the attested share (the
  // personalization hook) and re-derives on income change until the user
  // touches it — then their number wins ("estimated — adjust to your reality").
  const defaultIncome = MONEY_JOBS_DEFAULTS.personal.monthlyIncome[localeKey];
  const [income, setIncome] = useState<number>(defaultIncome);
  const [essentialsTouched, setEssentialsTouched] = useState(false);
  const [essentialsManual, setEssentialsManual] = useState<number>(0);
  const [savings, setSavings] = useState<number>(
    MONEY_JOBS_DEFAULTS.personal.currentSavings[localeKey]
  );
  const essentials = essentialsTouched
    ? essentialsManual
    : Math.round(income * MONEY_JOBS_MODEL.essentialsShare[localeKey]);

  // ---- B2B state.
  const [revenue, setRevenue] = useState<number>(
    MONEY_JOBS_DEFAULTS.business.monthlyRevenue[localeKey]
  );
  const [burn, setBurn] = useState<number>(MONEY_JOBS_DEFAULTS.business.monthlyBurn[localeKey]);
  const [cash, setCash] = useState<number>(MONEY_JOBS_DEFAULTS.business.cashOnHand[localeKey]);

  const [unlocked, setUnlocked] = useState(false);

  const snapshot = marketDataService.getSync();

  const personal = useMemo(
    () =>
      mode === 'personal'
        ? calculateMoneyJobsPersonal(
            {
              monthlyIncome: income,
              monthlyEssentials: essentials,
              currentSavings: savings,
              locale: localeKey,
            },
            snapshot
          )
        : null,
    [mode, income, essentials, savings, localeKey, snapshot]
  );

  const business = useMemo(
    () =>
      mode === 'business'
        ? calculateMoneyJobsBusiness(
            { monthlyRevenue: revenue, monthlyBurn: burn, cashOnHand: cash, locale: localeKey },
            snapshot
          )
        : null,
    [mode, revenue, burn, cash, localeKey, snapshot]
  );

  const personalPlan = useMemo(
    () =>
      unlocked && personal && !personal.dignityState
        ? calculateMoneyJobsPersonalPlan(personal, snapshot)
        : null,
    [unlocked, personal, snapshot]
  );

  const businessPlan = useMemo(
    () => (unlocked && business ? calculateMoneyJobsBusinessPlan(business, snapshot) : null),
    [unlocked, business, snapshot]
  );

  // Gated working-money projections (hedged engine returns all three canonical
  // scenarios; C4: Conservative renders first with the lead emphasis).
  const projections = useMemo(() => {
    if (!unlocked || mode !== 'personal' || !personal || personal.dignityState) return null;
    if (personal.workingIdeal <= 0) return null;
    try {
      const out = calculateCompoundProjectionHedged({
        amount: Math.round(personal.workingIdeal),
        cadence: 'monthly',
        years: 10,
        locale: localeKey,
      });
      const order = ['conservative', 'historical', 'optimistic'] as const;
      return order.map((scenario) => {
        const series = out.series.find((s) => s.scenario === scenario);
        return {
          scenario,
          fiveYear: series?.yearlyValues[5] ?? 0,
          tenYear: series?.finalValue ?? 0,
        };
      });
    } catch {
      return null;
    }
  }, [unlocked, mode, personal, localeKey]);

  useCalculatorAnalytics(
    'money-jobs',
    localeKey,
    personal || business
      ? JSON.stringify({ mode, income, essentials, savings, revenue, burn, cash })
      : null
  );

  const headlineValue =
    mode === 'personal' ? (personal?.joblessMoney ?? 0) : (business?.idleExcess ?? 0);
  const { share, copied } = useResultShare({
    toolKey: 'money-jobs',
    value: Math.round(headlineValue),
    currency: LOCALE_CURRENCY[localeKey],
    years: 0,
    locale: localeKey,
    tone: 'neutral',
    shareText: t('share.text', { value: fmt(headlineValue) }),
    shareTitle: t('share.title'),
    enabled: headlineValue > 0,
  });

  const numberField = (
    id: string,
    label: string,
    value: number,
    onChange: (n: number) => void,
    bounds: { min: number; max: number },
    help?: string
  ) => (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        min={bounds.min}
        max={bounds.max}
        value={value}
        onChange={(e) => onChange(clampInput(Number(e.target.value), bounds))}
        className={styles.numberInput}
      />
      {help ? <span className={styles.help}>{help}</span> : null}
    </div>
  );

  const jobsBand = (ideal: number, max: number) => {
    const idealPct = max > 0 ? Math.round((ideal / max) * 100) : 0;
    return (
      <div className={styles.band}>
        <div className={styles.bandTrack} aria-hidden="true">
          <div className={styles.bandFillMax} style={{ width: '100%' }} />
          <div className={styles.bandFillIdeal} style={{ width: `${idealPct}%` }} />
        </div>
        <div className={styles.bandLegend}>
          <span>
            {t('band.ideal')} <span className={styles.mono}>{fmt(ideal)}</span>
          </span>
          <span>
            {t('band.maximum')} <span className={styles.mono}>{fmt(max)}</span>
          </span>
        </div>
        {/* C2: the band explains its own gap */}
        <p className={styles.bandExplainer}>{t('band.explainer')}</p>
      </div>
    );
  };

  return (
    <div className={styles.calculator}>
      {/* A2: shared SegmentedControl, never bespoke pills */}
      <SegmentedControl
        ariaLabel={t('mode.ariaLabel')}
        value={mode}
        onChange={(m) => setMode(m)}
        options={[
          { value: 'personal', label: t('mode.personal') },
          { value: 'business', label: t('mode.business') },
        ]}
      />

      {mode === 'personal' ? (
        <>
          <div className={styles.inputsRow}>
            {numberField(
              `${baseId}-income`,
              t('inputs.incomeLabel'),
              income,
              (n) => setIncome(clampInput(n, MONEY_JOBS_INCOME_BOUNDS)),
              MONEY_JOBS_INCOME_BOUNDS
            )}
            {/* A1: essentials = number field + dual-bound slider */}
            <div className={styles.field}>
              <label htmlFor={`${baseId}-essentials`} className={styles.label}>
                {t('inputs.essentialsLabel')}
              </label>
              <div className={styles.sliderRow}>
                <input
                  id={`${baseId}-essentials`}
                  type="number"
                  inputMode="decimal"
                  min={MONEY_JOBS_ESSENTIALS_BOUNDS.min}
                  max={MONEY_JOBS_ESSENTIALS_BOUNDS.max}
                  value={essentials}
                  onChange={(e) => {
                    setEssentialsTouched(true);
                    setEssentialsManual(
                      clampInput(Number(e.target.value), MONEY_JOBS_ESSENTIALS_BOUNDS)
                    );
                  }}
                  className={styles.numberInput}
                />
                <input
                  type="range"
                  aria-label={t('inputs.essentialsLabel')}
                  min={0}
                  max={income}
                  step={10}
                  value={Math.min(essentials, income)}
                  onChange={(e) => {
                    setEssentialsTouched(true);
                    setEssentialsManual(Number(e.target.value));
                  }}
                  className={styles.range}
                />
              </div>
              {/* Attestation contract: the pre-fill is an estimate, say so */}
              <span className={styles.help}>{t('inputs.essentialsHelp')}</span>
            </div>
            {numberField(
              `${baseId}-savings`,
              t('inputs.savingsLabel'),
              savings,
              (n) => setSavings(clampInput(n, MONEY_JOBS_SAVINGS_BOUNDS)),
              MONEY_JOBS_SAVINGS_BOUNDS,
              t('inputs.savingsHelp')
            )}
          </div>

          {personal?.dignityState ? (
            // F3 — the dignity state: no split, no gate, one caring next step.
            <div className={styles.stateCard} data-testid="dignity-state">
              <p className={styles.stateHeadline}>{t('dignity.headline')}</p>
              <p className={styles.stateBody}>{t('dignity.body')}</p>
              <LocaleLink
                href="/tools/emergency-fund"
                className={styles.stateLink}
                prefetch={false}
              >
                {t('dignity.cta')}
              </LocaleLink>
            </div>
          ) : personal ? (
            <>
              <div className={styles.headlineBlock}>
                <p className={styles.headlineKicker}>{t('headline.kicker')}</p>
                <p className={styles.headline}>
                  <span className={styles.headlineValue}>{fmt(personal.joblessMoney)}</span>{' '}
                  {t('headline.personalSuffix')}
                </p>
                {personal.joblessCostOfInflation !== null ? (
                  <p className={styles.costLine}>
                    {t('costLine.personal', {
                      cost: fmt(personal.joblessCostOfInflation),
                      years: MONEY_JOBS_COST_LINE_YEARS,
                    })}
                  </p>
                ) : null}
                {/* C3: the tool disclaimer on the free surface itself */}
                <p className={styles.freeDisclaimer}>{t('disclaimer')}</p>
              </div>

              <div className={styles.jobsGrid}>
                <div className={styles.jobCard}>
                  <p className={styles.jobLabel}>{t('jobs.floor.label')}</p>
                  <p className={styles.jobValue}>{fmt(personal.floor)}</p>
                  <p className={styles.jobMeaning}>{t('jobs.floor.meaning')}</p>
                </div>
                <div className={styles.jobCard}>
                  <p className={styles.jobLabel}>{t('jobs.cushion.label')}</p>
                  <p className={styles.jobValue}>{fmt(personal.cushionContribution)}</p>
                  <p className={styles.jobMeaning}>
                    {t('jobs.cushion.meaning', {
                      target: fmt(personal.cushionTarget),
                      current: fmt(personal.cushionCurrent),
                    })}
                  </p>
                </div>
                <div className={styles.jobCard}>
                  <p className={styles.jobLabel}>{t('jobs.working.label')}</p>
                  <p className={styles.jobValue}>{fmt(personal.workingIdeal)}</p>
                  <p className={styles.jobMeaning}>{t('jobs.working.meaning')}</p>
                </div>
              </div>

              {jobsBand(personal.workingIdeal, personal.workingMax)}

              {/* A3: share stays secondary — quiet link, never a second primary */}
              {personal.joblessMoney > 0 ? (
                <div className={styles.shareRow}>
                  <button type="button" onClick={share} className={styles.stateLink}>
                    {copied ? t('share.copied') : t('share.cta')}
                  </button>
                </div>
              ) : null}

              <MoneyJobsGate unlocked={unlocked} onUnlocked={() => setUnlocked(true)} />

              {unlocked ? (
                <section className={styles.planSection} data-testid="personal-plan">
                  <h3 className={styles.planTitle}>{t('plan.title')}</h3>
                  {personalPlan ? (
                    <p className={styles.planLine}>
                      {personalPlan.cushionMonthsToTarget === 0
                        ? t('plan.cushionFunded')
                        : personalPlan.cushionMonthsToTarget !== null
                          ? t('plan.cushionTimeline', {
                              months: Math.ceil(personalPlan.cushionMonthsToTarget),
                            })
                          : t('plan.cushionUnreachable')}
                    </p>
                  ) : null}
                  {projections ? (
                    <>
                      <p className={styles.planLine}>{t('plan.projectionsIntro')}</p>
                      <div className={styles.projTableWrap}>
                        <table className={styles.projTable}>
                          <thead>
                            <tr>
                              <th scope="col">{t('plan.scenarioColumn')}</th>
                              <th scope="col">{t('plan.fiveYears')}</th>
                              <th scope="col">{t('plan.tenYears')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {projections.map((row, i) => (
                              <tr
                                key={row.scenario}
                                className={i === 0 ? styles.projRowLead : undefined}
                              >
                                {/* Hedge disclosure rides the rate label (house
                                  pattern: TimeToTarget per-scenario suffix) */}
                                <th scope="row">
                                  {tShared(`scenarios.${row.scenario}`)}
                                  {personalPlan?.hedged
                                    ? tShared('scenarios.digitalDollarSuffix')
                                    : ''}
                                </th>
                                <td className={styles.mono}>{fmt(row.fiveYear)}</td>
                                <td className={styles.mono}>{fmt(row.tenYear)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <p className={styles.freeDisclaimer}>{tShared('disclaimer')}</p>
                    </>
                  ) : null}
                  {/* C1: BR-only dollar line — gated, hedge sentence directly beside it */}
                  {localeKey === 'pt-BR' ? (
                    <p className={styles.planLine}>
                      {t('plan.brDollarLine')} {t('plan.brDollarBothWays')}
                    </p>
                  ) : null}
                  <div className={styles.nextSteps}>
                    <LocaleLink
                      href="/tools/emergency-fund"
                      className={styles.nextStepLink}
                      prefetch={false}
                    >
                      {t('plan.nextCushion')}
                    </LocaleLink>
                    <LocaleLink
                      href="/tools/compound-interest"
                      className={styles.nextStepLink}
                      prefetch={false}
                    >
                      {t('plan.nextWorking')}
                    </LocaleLink>
                    {localeKey === 'pt-BR' ? (
                      <LocaleLink
                        href="/tools/currency-depreciation"
                        className={styles.nextStepLink}
                        prefetch={false}
                      >
                        {t('plan.nextCurrency')}
                      </LocaleLink>
                    ) : null}
                  </div>
                </section>
              ) : null}
            </>
          ) : null}
        </>
      ) : (
        <>
          <div className={styles.inputsRow}>
            {numberField(
              `${baseId}-revenue`,
              t('inputs.revenueLabel'),
              revenue,
              (n) => setRevenue(clampInput(n, MONEY_JOBS_REVENUE_BOUNDS)),
              MONEY_JOBS_REVENUE_BOUNDS,
              t('inputs.revenueHelp')
            )}
            {numberField(
              `${baseId}-burn`,
              t('inputs.burnLabel'),
              burn,
              (n) => setBurn(clampInput(n, MONEY_JOBS_BURN_BOUNDS)),
              MONEY_JOBS_BURN_BOUNDS,
              t('inputs.burnHelp')
            )}
            {numberField(
              `${baseId}-cash`,
              t('inputs.cashLabel'),
              cash,
              (n) => setCash(clampInput(n, MONEY_JOBS_CASH_BOUNDS)),
              MONEY_JOBS_CASH_BOUNDS
            )}
          </div>

          {business ? (
            <>
              {business.runwayMode ? (
                // Decision 9: runway-led free surface; invest framing suppressed.
                <div className={styles.stateCard} data-testid="runway-mode">
                  <p className={styles.stateHeadline}>{t('runway.headline')}</p>
                  <p className={styles.stateBody}>
                    {t('runway.body', {
                      months: (business.runwayMonths as number).toFixed(1),
                      floor: fmt(business.operatingFloor),
                    })}
                  </p>
                </div>
              ) : (
                <div className={styles.headlineBlock}>
                  <p className={styles.headlineKicker}>{t('headline.kicker')}</p>
                  <p className={styles.headline}>
                    <span className={styles.headlineValue}>{fmt(business.idleExcess)}</span>{' '}
                    {t('headline.businessSuffix')}
                  </p>
                  {business.idleExcessCostOfInflation !== null ? (
                    <p className={styles.costLine}>
                      {t('costLine.business', {
                        cost: fmt(business.idleExcessCostOfInflation),
                        years: MONEY_JOBS_COST_LINE_YEARS,
                      })}
                    </p>
                  ) : null}
                  <p className={styles.freeDisclaimer}>{t('disclaimer')}</p>
                </div>
              )}

              <div className={styles.runwayStrip}>
                <div className={styles.jobCard}>
                  <p className={styles.jobLabel}>{t('jobs.operatingFloor.label')}</p>
                  <p className={styles.jobValue}>{fmt(business.operatingFloor)}</p>
                  <p className={styles.jobMeaning}>{t('jobs.operatingFloor.meaning')}</p>
                </div>
                <div className={styles.jobCard}>
                  <p className={styles.jobLabel}>
                    {business.cashPositive ? t('jobs.coverage.label') : t('jobs.runway.label')}
                  </p>
                  <p className={styles.jobValue}>
                    {business.cashPositive
                      ? t('jobs.coverage.value', {
                          months: business.grossCoverageMonths.toFixed(1),
                        })
                      : t('jobs.runway.value', {
                          months: (business.runwayMonths as number).toFixed(1),
                        })}
                  </p>
                  <p className={styles.jobMeaning}>
                    {business.cashPositive ? t('jobs.coverage.meaning') : t('jobs.runway.meaning')}
                  </p>
                </div>
                <div className={styles.jobCard}>
                  <p className={styles.jobLabel}>{t('jobs.excess.label')}</p>
                  <p className={styles.jobValue}>{fmt(business.excess)}</p>
                  <p className={styles.jobMeaning}>{t('jobs.excess.meaning')}</p>
                </div>
              </div>

              {!business.runwayMode && business.excess > 0
                ? jobsBand(business.excessIdeal, business.excessMax)
                : null}

              {!business.runwayMode && business.idleExcess > 0 ? (
                <div className={styles.shareRow}>
                  <button type="button" onClick={share} className={styles.stateLink}>
                    {copied ? t('share.copied') : t('share.cta')}
                  </button>
                </div>
              ) : null}

              <MoneyJobsGate unlocked={unlocked} onUnlocked={() => setUnlocked(true)} />

              {unlocked ? (
                <section className={styles.planSection} data-testid="business-plan">
                  <h3 className={styles.planTitle}>{t('plan.title')}</h3>
                  {business.runwayMode ? (
                    <>
                      {/* Runway-led plan (decision 9): idle-cash table HELD. */}
                      <p className={styles.planLine}>
                        {t('plan.runwayLed', {
                          months: (business.runwayMonths as number).toFixed(1),
                          floor: fmt(business.operatingFloor),
                        })}
                      </p>
                      <div className={styles.nextSteps}>
                        <LocaleLink
                          href="/tools/card-fees"
                          className={styles.nextStepLink}
                          prefetch={false}
                        >
                          {t('plan.nextCardFees')}
                        </LocaleLink>
                        <LocaleLink
                          href="/business#founder"
                          className={styles.nextStepLink}
                          prefetch={false}
                        >
                          {t('plan.nextFounder')}
                        </LocaleLink>
                      </div>
                    </>
                  ) : (
                    <>
                      {businessPlan?.idleComparison &&
                      businessPlan.idleComparison.difference > 0 ? (
                        <p className={styles.planLine}>
                          {t('plan.idleComparison', {
                            amount: fmt(business.excessIdeal),
                            delta: fmt(businessPlan.idleComparison.difference),
                          })}
                          {businessPlan.idleComparison.hedged
                            ? ` ${tShared('scenarios.digitalDollarSuffix')}`
                            : ''}
                        </p>
                      ) : null}
                      <p className={styles.freeDisclaimer}>{tShared('disclaimer')}</p>
                      <div className={styles.nextSteps}>
                        <LocaleLink
                          href="/tools/idle-cash"
                          className={styles.nextStepLink}
                          prefetch={false}
                        >
                          {t('plan.nextIdleCash')}
                        </LocaleLink>
                        <LocaleLink
                          href="/tools/card-fees"
                          className={styles.nextStepLink}
                          prefetch={false}
                        >
                          {t('plan.nextCardFees')}
                        </LocaleLink>
                        <LocaleLink
                          href="/business#founder"
                          className={styles.nextStepLink}
                          prefetch={false}
                        >
                          {t('plan.nextFounder')}
                        </LocaleLink>
                      </div>
                    </>
                  )}
                </section>
              ) : null}
            </>
          ) : null}
        </>
      )}
    </div>
  );
}
