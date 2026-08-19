'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import Decimal from 'decimal.js';
import { FormattedMessage, useIntl } from 'react-intl';
import { getStrategy } from '@diboas/defi';
import type { SandboxLocale } from '@/i18n/config';
import { LOCALE_CURRENCY } from '@/i18n/config';
import { useLedger } from '@/hooks/useLedger';
import { useMarket } from '@/hooks/useMarket';
import { useFormatters } from '@/hooks/useFormatters';
import {
  accomplishGoal,
  enterStrategy,
  exitPosition,
  pauseGoal,
  previewExit,
  resumeGoal,
  splitEntry,
} from '@/lib/ledgerClient';
import { goalCurrentValue } from '@/lib/goalValue';
import { positionValueSeries } from '@/lib/positionSeries';
import { BottomSheet } from './BottomSheet';
import { LucideIcon } from './LucideIcon';
import { GoalCompletionScreen } from './GoalCompletionScreen';
import { GoalPauseSheet } from './GoalPauseSheet';
import { Manifest } from './Manifest';
import { PathCard, networkFeeLocal } from './PathCard';
import { Projection } from './Projection';
import { RecurringControl } from './RecurringControl';
import { SegmentedToggle } from './SegmentedToggle';
import { Settlement } from './Settlement';
import { Sparkline } from './Sparkline';
import { StrategyPicker } from './StrategyPicker';
import styles from './GoalDetailScreen.module.css';

type View = 'simple' | 'detailed';

/**
 * Goal detail — the dual-view host (§4.2; mockup 14, folded in from the
 * GoalDetailDual scaffold which this refactor DELETED). Simple leads the goal
 * ①→②→③: ① am I on track (progress + the HONEST recurring-driven projection —
 * a pace renders only when a plan exists to derive it from, absent over false)
 * → ② what my money's doing (real per-position value + its real event-stepped
 * sparkline) → ③ what I can do next (Add today; Pause and More arrive with
 * G3/G4 — a control that does nothing is a fake control, so they are absent
 * until their increments land). Detailed = the full operational surface:
 * stats, source-separation, positions, recurring, exit, and the put-to-work
 * flow — every movement through the manifest, every figure stamped.
 */
export function GoalDetailScreen({ locale, goalId }: { locale: SandboxLocale; goalId: string }) {
  const intl = useIntl();
  const state = useLedger();
  const currency = LOCALE_CURRENCY[locale];
  const { market } = useMarket(currency);
  const { money } = useFormatters(state.currency);

  const goal = state.goals.find((g) => g.goalId === goalId);
  const openPositions = state.positions.filter((p) => p.goalId === goalId && p.open);

  const [view, setView] = useState<View>('simple');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [strategyId, setStrategyId] = useState<string | null>(null);
  const [investAmount, setInvestAmount] = useState('');
  const [entryManifest, setEntryManifest] = useState(false);
  const [exitManifestFor, setExitManifestFor] = useState<string | null>(null);
  const [settling, setSettling] = useState<
    { kind: 'entry' } | { kind: 'exit'; positionId: string } | null
  >(null);
  const [busy, setBusy] = useState(false);
  const [pauseSheet, setPauseSheet] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  // G4: the user chose "Stop strategy" from the completion screen — close the
  // goal as held-as-cash once the LAST open position has actually exited.
  const [completeAfterExit, setCompleteAfterExit] = useState(false);

  const current = useMemo(() => goalCurrentValue(state, goalId), [state, goalId]);

  if (!goal) {
    return (
      <section className={styles.wrap}>
        <Link href={`/${locale}/goals`} className={styles.backLink}>
          <LucideIcon name="arrow-left" size={16} />
          <FormattedMessage id="common.back" />
        </Link>
      </section>
    );
  }

  const strategy = strategyId ? getStrategy(strategyId) : undefined;
  const investValue = Number(investAmount) || 0;
  const cash = new Decimal(goal.cash);
  const feeLocal =
    strategy && market ? networkFeeLocal(market.gas, strategy.entryChain, market.usdPriceLocal) : 0;
  const canInvest = investValue > 0 && cash.gte(new Decimal(investValue));

  function approveEntry() {
    if (!strategy || !canInvest || busy) return;
    setBusy(true);
    enterStrategy({
      goalId,
      strategyId: strategy.id,
      totalFromCash: investValue,
      networkFeeLocal: feeLocal,
    });
    setBusy(false);
    setSettling(null);
    setEntryManifest(false);
    setPickerOpen(false);
    setStrategyId(null);
    setInvestAmount('');
  }

  function approveExit(positionId: string) {
    if (busy || !market) return;
    setBusy(true);
    const position = openPositions.find((p) => p.positionId === positionId);
    const posStrategy = position ? getStrategy(position.strategyId) : undefined;
    const fee = posStrategy
      ? networkFeeLocal(market.gas, posStrategy.entryChain, market.usdPriceLocal)
      : 0;
    exitPosition({ positionId, networkFeeLocal: fee });
    // Only close the goal when nothing is left working (a partial stop must
    // never mark a goal "held as cash" while money is still in a strategy).
    if (completeAfterExit && openPositions.length === 1) {
      accomplishGoal(goalId, 'held-as-cash');
    }
    setCompleteAfterExit(false);
    setBusy(false);
    setSettling(null);
    setExitManifestFor(null);
  }

  const targetReached = new Decimal(goal.targetAmount).gt(0) && current.gte(goal.targetAmount);
  const ratio = new Decimal(goal.targetAmount).gt(0)
    ? Decimal.min(current.div(goal.targetAmount), 1).mul(100).toNumber()
    : 0;

  // The goal's total recurring monthly (across its positions) drives the honest
  // path projection (C2) — the far-off-goal display deferred from 2c.
  const goalMonthly = state.recurring
    .filter((r) => r.goalId === goalId)
    .reduce((acc, r) => acc.plus(r.monthlyAmount), new Decimal(0))
    .toNumber();

  const contributionsTotal = state.events
    .filter((e) => e.type === 'GoalFunded' && e.goalId === goalId)
    .reduce((acc, e) => acc.plus((e as { amount: string }).amount), new Decimal(0))
    .toFixed(2);

  const progressBar = (
    <span
      className={styles.progressTrack}
      role="progressbar"
      aria-label={goal.name}
      aria-valuenow={Math.round(ratio)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <span className={styles.progressFill} style={{ width: `${ratio}%` }} />
    </span>
  );

  if (showCompletion) {
    return (
      <GoalCompletionScreen
        goal={goal}
        state={state}
        onClose={() => setShowCompletion(false)}
        onStopStrategy={
          openPositions.length > 0
            ? () => {
                // The REAL exit path (board §3.1): the manifest itemizes, and
                // the goal closes as held-as-cash only after the last position
                // actually exits.
                setCompleteAfterExit(true);
                setShowCompletion(false);
                setView('detailed');
                setExitManifestFor(openPositions[0].positionId);
              }
            : undefined
        }
      />
    );
  }

  return (
    <section className={styles.wrap} aria-labelledby="goaldetail-title">
      <div className={styles.heroBand} aria-hidden />

      <Link href={`/${locale}/goals`} className={styles.backLink}>
        <LucideIcon name="arrow-left" size={16} />
        <FormattedMessage id="goalDetail.backToGoal" />
      </Link>

      <div className={styles.head}>
        <span className={goal.status === 'paused' ? styles.goalIconPaused : styles.goalIcon}>
          <LucideIcon name={goal.status === 'paused' ? 'pause' : goal.icon} size={26} />
        </span>
        <div>
          <h1 id="goaldetail-title" className={styles.title}>
            {goal.name}
          </h1>
          {/* The honest status line (mockup 14's slot): a derived STATUS, never
              a pace claim (board §6a) — paused duality (W-17d, second half only
              when true) · accomplished · target-reached; plain active = no line. */}
          {goal.status === 'paused' ? (
            <p className={`${styles.statusLine} ${styles.statusPaused}`}>
              <FormattedMessage id="goalDual.paused" />
              {openPositions.length > 0 ? (
                <span className={styles.statusSub}>
                  {' · '}
                  <FormattedMessage id="goalDual.moneyStillWorking" />
                </span>
              ) : null}
            </p>
          ) : goal.status === 'accomplished' ? (
            <p className={styles.statusLine}>
              <FormattedMessage id="goalsList.status.accomplished" />
            </p>
          ) : targetReached ? (
            <>
              <p className={styles.statusLine} role="status">
                <FormattedMessage id="goalDetail.milestoneTitle" />
              </p>
              {/* D-e §3: the user opens the completion state themselves — a
                  calm affordance, never an auto-modal, never a nag. */}
              <button
                type="button"
                className={styles.reviewCta}
                onClick={() => setShowCompletion(true)}
              >
                <FormattedMessage id="goalComplete.reviewCta" />
                <LucideIcon name="chevron-right" size={16} />
              </button>
            </>
          ) : null}
        </div>
      </div>

      <div className={styles.toggleRow}>
        <SegmentedToggle<View>
          ariaLabel={intl.formatMessage({ id: 'goalsList.viewToggle' })}
          value={view}
          onChange={setView}
          segments={[
            { id: 'simple', label: intl.formatMessage({ id: 'goalDual.simple' }) },
            { id: 'detailed', label: intl.formatMessage({ id: 'goalDual.detailed' }) },
          ]}
        />
      </div>

      {view === 'simple' ? (
        <div className={styles.simpleView}>
          {/* ① am I on track */}
          <h2 className={styles.sectionHead}>
            1. <FormattedMessage id="goalDual.onTrackLabel" />
          </h2>
          <p className={styles.savedLine}>
            <FormattedMessage
              id="goalDetail.progress"
              values={{ current: money(current.toFixed(2)), target: money(goal.targetAmount) }}
            />
          </p>
          <p className={styles.percentLine}>
            <span className={styles.percentBig}>{Math.round(ratio)}%</span>{' '}
            <FormattedMessage id="goalDetail.percentWay" />
          </p>
          {progressBar}
          {goalMonthly > 0 ? (
            <Projection
              target={Number(goal.targetAmount)}
              monthlyContribution={goalMonthly}
              currentValue={current.toNumber()}
              horizonMonths={goal.horizonMonths}
              currency={state.currency}
            />
          ) : null}

          {/* ② what my money's doing — real per-position value + real series */}
          <h2 className={styles.sectionHead}>
            2. <FormattedMessage id="goalDual.howLabel" />
          </h2>
          {openPositions.length === 0 ? (
            <p className={styles.simpleEmpty}>
              <FormattedMessage id="goalDetail.noPosition" />
            </p>
          ) : (
            openPositions.map((position) => {
              const posStrategy = getStrategy(position.strategyId);
              const strategyName = posStrategy
                ? intl.formatMessage({ id: `catalog.strategies.${posStrategy.i18nKey}.name` })
                : position.strategyId;
              const series = positionValueSeries(state, position.positionId);
              return (
                <div key={position.positionId} className={styles.simplePosition}>
                  <p className={styles.simplePositionLead}>
                    <FormattedMessage
                      id="goalDetail.investedLine"
                      values={{
                        strategy: strategyName,
                        amount: money(
                          new Decimal(position.principal).plus(position.accrued).toFixed(2)
                        ),
                      }}
                    />
                  </p>
                  <p className={styles.simplePositionSub}>
                    <FormattedMessage
                      id="goalDetail.earningsLine"
                      values={{ amount: money(position.accrued) }}
                    />
                  </p>
                  {series.length >= 2 ? <Sparkline series={series} /> : null}
                </div>
              );
            })
          )}

          {/* ③ what I can do next — Add today; Pause/More arrive with G3/G4
              (absent, never fake controls). */}
          <h2 className={styles.sectionHead}>
            3. <FormattedMessage id="goalDual.nextLabel" />
          </h2>
          <div className={styles.actionTiles}>
            {cash.gt(0) ? (
              <button
                type="button"
                className={styles.actionTile}
                onClick={() => {
                  setView('detailed');
                  setPickerOpen(true);
                }}
              >
                <span className={styles.actionTileIcon}>
                  <LucideIcon name="plus" size={18} />
                </span>
                <FormattedMessage id="goalDual.add" />
              </button>
            ) : null}
            {goal.status === 'active' ? (
              <button
                type="button"
                className={styles.actionTile}
                onClick={() => setPauseSheet(true)}
              >
                <span className={styles.actionTileIconPause}>
                  <LucideIcon name="pause" size={18} />
                </span>
                <FormattedMessage id="goalDual.pausePlan" />
              </button>
            ) : goal.status === 'paused' ? (
              <button
                type="button"
                className={styles.actionTile}
                onClick={() => resumeGoal(goalId)}
              >
                <span className={styles.actionTileIcon}>
                  <LucideIcon name="play" size={18} />
                </span>
                <FormattedMessage id="goalPause.resume" />
              </button>
            ) : null}
            <button type="button" className={styles.actionTile} onClick={() => setView('detailed')}>
              <span className={styles.actionTileIcon}>
                <LucideIcon name="list" size={18} />
              </span>
              <FormattedMessage id="goalDual.detailed" />
            </button>
          </div>

          <button type="button" className={styles.seeDetail} onClick={() => setView('detailed')}>
            <FormattedMessage id="goalDual.seeDetail" />
            <LucideIcon name="chevron-right" size={16} />
          </button>
        </div>
      ) : (
        <div className={styles.detailedView}>
          {progressBar}

          <div className={styles.stats}>
            <p className={styles.stat}>
              <FormattedMessage id="goalDetail.cashInGoal" values={{ amount: money(goal.cash) }} />
            </p>
            <p className={styles.stat}>
              <FormattedMessage
                id="goalDetail.contributions"
                values={{ amount: money(contributionsTotal) }}
              />
            </p>
          </div>

          {/* Source-separation (UX-63): contributions vs market change, distinct. */}
          <div className={styles.breakRow}>
            <span>
              <FormattedMessage id="goalDual.contributions" />
            </span>
            <span className={styles.breakVal}>{money(contributionsTotal)}</span>
          </div>
          <div className={styles.breakRow}>
            <span>
              <FormattedMessage id="goalDual.marketChange" />
            </span>
            <span className={styles.breakVal}>{money(goal.earnings)}</span>
          </div>

          {/* Goal-reached milestone (WS-E). R-2 allows "goals reached" as
              product-true progression; honest + non-triumphalist, no gamification. */}
          {targetReached ? (
            <div className={styles.milestone} role="status">
              <span className={styles.milestoneIcon}>
                <LucideIcon name="check" size={18} />
              </span>
              <div>
                <p className={styles.milestoneTitle}>
                  <FormattedMessage id="goalDetail.milestoneTitle" />
                </p>
                <p className={styles.milestoneBody}>
                  <FormattedMessage id="goalDetail.milestoneBody" />
                </p>
              </div>
            </div>
          ) : null}

          {goalMonthly > 0 ? (
            <Projection
              target={Number(goal.targetAmount)}
              monthlyContribution={goalMonthly}
              currentValue={current.toNumber()}
              horizonMonths={goal.horizonMonths}
              currency={state.currency}
            />
          ) : null}

          {openPositions.length === 0 ? (
            <div className={styles.noPosition}>
              <span className={styles.noPositionIcon}>
                <LucideIcon name="wallet" size={24} />
              </span>
              <p className={styles.noPositionTitle}>
                <FormattedMessage id="goalDetail.noPositionTitle" />
              </p>
              <p className={styles.noPositionBody}>
                <FormattedMessage id="goalDetail.noPosition" />
              </p>
            </div>
          ) : (
            openPositions.map((position) => {
              const posStrategy = getStrategy(position.strategyId);
              const strategyName = posStrategy
                ? intl.formatMessage({ id: `catalog.strategies.${posStrategy.i18nKey}.name` })
                : position.strategyId;
              return (
                <article key={position.positionId} className={styles.position}>
                  <h2 className={styles.positionTitle}>
                    <FormattedMessage
                      id="goalDetail.investedLine"
                      values={{
                        strategy: strategyName,
                        amount: money(
                          new Decimal(position.principal).plus(position.accrued).toFixed(2)
                        ),
                      }}
                    />
                  </h2>
                  <p className={styles.earningsTitle}>
                    <FormattedMessage id="goalDetail.earningsTitle" />
                  </p>
                  <p className={styles.earningsLine}>
                    <FormattedMessage
                      id="goalDetail.earningsLine"
                      values={{ amount: money(position.accrued) }}
                    />
                  </p>
                  <RecurringControl
                    goalId={goalId}
                    positionId={position.positionId}
                    schedule={state.recurring.find((r) => r.positionId === position.positionId)}
                    workingBalance={state.buckets.working}
                    currency={state.currency}
                  />

                  <button
                    type="button"
                    className={styles.exit}
                    onClick={() => setExitManifestFor(position.positionId)}
                  >
                    <FormattedMessage id="goalDetail.exitCta" />
                  </button>

                  {exitManifestFor === position.positionId && !settling
                    ? (() => {
                        const fee =
                          posStrategy && market
                            ? networkFeeLocal(
                                market.gas,
                                posStrategy.entryChain,
                                market.usdPriceLocal
                              )
                            : 0;
                        const preview = previewExit(position.positionId, fee);
                        return preview ? (
                          <Manifest
                            titleId="goalDetail.exitTitle"
                            titleValues={{ strategy: strategyName }}
                            rows={[
                              { labelId: 'manifest.fromLabel', value: strategyName },
                              { labelId: 'manifest.toLabel', value: goal.name },
                              { labelId: 'manifest.amountLabel', value: money(preview.gross) },
                              {
                                labelId: 'manifest.exitCostLabel',
                                value: `${money(preview.exitFee)} · ${intl.formatMessage(
                                  { id: 'pathCard.networkFee' },
                                  { amount: money(preview.networkFee) }
                                )}`,
                              },
                            ]}
                            ctaId="manifest.approveExit"
                            ctaValues={{ amount: money(preview.gross) }}
                            onApprove={() =>
                              setSettling({ kind: 'exit', positionId: position.positionId })
                            }
                            onCancel={() => setExitManifestFor(null)}
                            approving={busy}
                          />
                        ) : null;
                      })()
                    : null}
                </article>
              );
            })
          )}

          {cash.gt(0) ? (
            <div className={styles.investBlock}>
              {!pickerOpen ? (
                <button
                  type="button"
                  className={styles.primary}
                  onClick={() => setPickerOpen(true)}
                >
                  <FormattedMessage id="goalDetail.putToWork" />
                </button>
              ) : (
                <>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="invest-amount">
                      <FormattedMessage id="goalNew.fundLabel" />
                    </label>
                    <input
                      id="invest-amount"
                      className={styles.input}
                      type="number"
                      inputMode="decimal"
                      min={0}
                      value={investAmount}
                      onChange={(e) => setInvestAmount(e.target.value)}
                    />
                    <p className={styles.hint}>
                      <FormattedMessage
                        id="goalNew.fundAvailable"
                        values={{ amount: money(goal.cash) }}
                      />
                    </p>
                  </div>
                  {market ? (
                    <StrategyPicker
                      horizonMonths={goal.horizonMonths}
                      apys={market.apys}
                      selectedId={strategyId}
                      onSelect={setStrategyId}
                    />
                  ) : null}
                  {strategy && market ? (
                    <>
                      <PathCard
                        goalName={goal.name}
                        strategy={strategy}
                        apys={market.apys}
                        gas={market.gas}
                        usdPriceLocal={market.usdPriceLocal}
                        currency={currency}
                      />
                      <button
                        type="button"
                        className={styles.primary}
                        onClick={() => setEntryManifest(true)}
                        disabled={!canInvest || busy}
                      >
                        <FormattedMessage id="goalNew.reviewPath" />
                      </button>
                    </>
                  ) : null}
                </>
              )}
            </div>
          ) : null}
        </div>
      )}

      {pauseSheet ? (
        <GoalPauseSheet
          onConfirm={() => {
            pauseGoal(goalId);
            setPauseSheet(false);
          }}
          onDismiss={() => setPauseSheet(false)}
          onStopStrategy={
            openPositions.length > 0
              ? () => {
                  // The REAL exit path (Stage-D G3): fee already disclosed in
                  // the sheet line; the manifest itemizes before anything moves.
                  setPauseSheet(false);
                  setView('detailed');
                  setExitManifestFor(openPositions[0].positionId);
                }
              : undefined
          }
        />
      ) : null}

      {entryManifest && strategy && !settling ? (
        <Manifest
          titleId="manifest.title"
          rows={[
            { labelId: 'manifest.fromLabel', value: goal.name },
            {
              labelId: 'manifest.toLabel',
              value: intl.formatMessage({ id: `catalog.strategies.${strategy.i18nKey}.name` }),
            },
            {
              labelId: 'manifest.amountLabel',
              value: money(splitEntry(investValue, feeLocal).invested.toFixed(2)),
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
          ctaValues={{ amount: money(investValue) }}
          reassuranceId="manifest.withdrawReassurance"
          onApprove={() => setSettling({ kind: 'entry' })}
          onCancel={() => setEntryManifest(false)}
          approving={busy}
        />
      ) : null}

      {settling ? (
        <BottomSheet titleId="settlement.title" tone="ink" dismissible={false} onClose={() => {}}>
          <Settlement
            onComplete={() => {
              if (settling.kind === 'entry') approveEntry();
              else approveExit(settling.positionId);
            }}
          />
        </BottomSheet>
      ) : null}
    </section>
  );
}
