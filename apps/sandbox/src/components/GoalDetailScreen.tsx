'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { getStrategy, strategyRateAvailability } from '@diboas/defi';
import type { ProtocolApyHistory } from '@diboas/defi';
import type { SandboxLocale } from '@/i18n/config';
import { useLedger } from '@/hooks/useLedger';
import { fetchHistories, useMarket } from '@/hooks/useMarket';
import { useFormatters } from '@/hooks/useFormatters';
import {
  accomplishGoal,
  enterStrategy,
  exitPosition,
  pauseGoal,
  resumeGoal,
  stopGoalStrategies,
} from '@/lib/ledgerClient';
import {
  selectAmountSign,
  selectCanInvest,
  selectEntrySplit,
  selectExitPreview,
  selectGoalDetailView,
  selectPositionValue,
} from '@/view/home';
import { previewGoalStop, previewPositionStop, splitEntry } from '@/lib/ledgerClient';
import { positionValueSeries } from '@/lib/positionSeries';
import { BottomSheet } from './BottomSheet';
import { goalAccentIndex } from '@/lib/goalAccent';
import { LucideIcon } from './LucideIcon';
import { ExitCeremony } from './ExitCeremony';
import { GoalCompletionScreen } from './GoalCompletionScreen';
import { GoalPauseSheet } from './GoalPauseSheet';
import { Manifest } from './Manifest';
import { goalUsesCoinGeckoPrices } from '@/view/marketDataAttribution';
import { CoinGeckoAttribution } from './CoinGeckoAttribution';
import { networkFeeLocal } from '@/lib/networkFee';
import { Projection } from './Projection';
import { RecurringControl } from './RecurringControl';
import { SegmentedToggle } from './SegmentedToggle';
import { Settlement } from './Settlement';
import { Sparkline } from './Sparkline';
import { StrategyDetail } from './StrategyDetail';
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
  // Both the market conversion and the formatter must key off the LEDGER's
  // currency, not the locale's. The ledger is denominated by the grant and
  // never re-denominates, so a reader who switches locale (en → pt-BR) still
  // holds US dollars. Keying the market on the locale converted the gas fee
  // into the locale's currency while `money()` still labelled it in the
  // ledger's — the same two positions read "$0.03" on /en and "US$ 0,16" on
  // /pt-BR. Wrong anywhere; unacceptable on the fee-truth screen.
  const { market } = useMarket(state.currency);
  const { money } = useFormatters(state.currency);

  const goal = state.goals.find((g) => g.goalId === goalId);
  const openPositions = state.positions.filter((p) => p.goalId === goalId && p.open);

  const [view, setView] = useState<View>('simple');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [strategyId, setStrategyId] = useState<string | null>(null);
  const [investAmount, setInvestAmount] = useState('');
  const [entryManifest, setEntryManifest] = useState(false);
  // G7: the exit ceremony is SCOPED. A position-scope stop leaves the goal's
  // other positions working; a goal-scope stop composes every open position
  // into one decision (board §3.3) — which is what G3's "also stop" and G4's
  // "stop strategy" mean, and what they must actually do.
  const [exitIntent, setExitIntent] = useState<
    { scope: 'position'; positionId: string } | { scope: 'goal' } | null
  >(null);
  const [settling, setSettling] = useState<{ kind: 'entry' } | { kind: 'exit' } | null>(null);
  const [busy, setBusy] = useState(false);
  const [pauseSheet, setPauseSheet] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [histories, setHistories] = useState<ProtocolApyHistory[]>([]);
  // G4: the user chose "Stop strategy" from the completion screen — close the
  // goal as held-as-cash once the LAST open position has actually exited.
  const [completeAfterExit, setCompleteAfterExit] = useState(false);

  // The G6 chart's history: fetched only once a strategy is actually being
  // read (never on mount — the goal page must not pay for data it may not
  // show). Server-cached at the ruled 6h TTL, so re-reads are free. R-rows:
  // an `active` flag guards the unmount race; failure leaves the chart in its
  // honest "not enough history" state rather than blanking the screen (P7).
  useEffect(() => {
    if (strategyId === null || histories.length > 0) return;
    let active = true;
    fetchHistories(365)
      .then((h) => {
        if (active) setHistories(h);
      })
      .catch(() => {
        /* honest empty state; never a crash */
      });
    return () => {
      active = false;
    };
  }, [strategyId, histories.length]);

  /**
   * ⛑ STAGE H · the CURRENT-FACING reference moment for the age contract
   * (`5.309`), memoised per mount so entry and exit judge the same instant.
   *
   * Declared HERE, above the `!goal` early return, because a hook after a
   * conditional return is a rules-of-hooks violation — caught by lint, not by
   * the tests, which never exercised both branches in one mount.
   */
  const nowIso = useMemo(() => new Date().toISOString(), []);

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
  /**
   * ⚑ AUD-F05. This fell back to `0`, and `approveEntry` never checked
   * `market` — so a failed market fetch or a missing chain quote COMMITTED a
   * 0.00 network fee into the event log as the move's real cost. `null` is
   * UNKNOWN, and every path that would price an entry now refuses.
   */
  const feeLocal =
    strategy && market ? networkFeeLocal(market.gas, strategy, market.usdPriceLocal, nowIso) : null;
  /** FC-15 "no honest price, no operable control" — now for the ENTRY as well. */
  const canPriceEntry = feeLocal !== null;
  /**
   * ⛑ `5.436` · the candidate's own current-rate availability, through the
   * shared Stage H gate. A candidate whose rate is unknowable cannot be chosen
   * for a NEW rate-dependent decision, so it gates the entry handler and the
   * consequence sheet exactly as an unpriceable cost already does.
   */
  const rateAvailable = strategy
    ? strategyRateAvailability(strategy, market?.apys ?? [], nowIso).available
    : false;
  // VIEW-2: the affordability guard gates a real money movement, so it is
  // derived and unit-tested rather than computed in the render body.
  const canInvest = selectCanInvest(state, goalId, investValue);

  function approveEntry() {
    /* `5.436`: the commit path refuses too, not only the control that opens
       it — a disabled button is a UI fact, this is the money fact. */
    if (!strategy || !canInvest || busy || feeLocal === null || !rateAvailable) return;
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

  /** Each position pays its OWN network fee, on its own strategy's chain. */
  function exitFeeOrNull(positionId: string): number | null {
    if (!market) return null;
    const position = openPositions.find((p) => p.positionId === positionId);
    const posStrategy = position ? getStrategy(position.strategyId) : undefined;
    if (!posStrategy) return null;
    /**
     * `5.406` §4 · exit is the SAME untruthful single-chain fee as entry: this
     * number is what `journey.ts` commits into `StrategyExited`. So a
     * multi-network position cannot be priced, `canPriceExit` goes false, and
     * the already-approved `goalDetail.exitPricingUnavailable` renders beside a
     * disabled control — FC-15, *"no honest price, no operable control"*, which
     * `5.347`'s closure records as having covered the EXIT first.
     *
     * Consequence, stated not buried: a multi-network Practice position cannot
     * be stopped until F/G land. The alternative is committing a fee wrong by up
     * to 70% of allocation into the event log.
     */
    return networkFeeLocal(market.gas, posStrategy, market.usdPriceLocal, nowIso);
  }

  /**
   * The numeric adapter the domain callbacks require. Reached ONLY behind
   * `canPriceExit`, which proves every open position prices — so the `?? 0` is
   * unreachable rather than a fallback, and a test holds that true (if it ever
   * became reachable, this would be the 5.199 class all over again).
   */
  function exitFeeFor(positionId: string): number {
    return exitFeeOrNull(positionId) ?? 0;
  }

  function approveExit() {
    if (busy || !market || !exitIntent) return;
    setBusy(true);
    // How many stay working after this decision — the completion guard below
    // must never mark a goal "held as cash" while money is still in a strategy.
    let remaining: number;
    if (exitIntent.scope === 'goal') {
      stopGoalStrategies(goalId, exitFeeFor);
      remaining = 0;
    } else {
      exitPosition({
        positionId: exitIntent.positionId,
        networkFeeLocal: exitFeeFor(exitIntent.positionId),
      });
      remaining = openPositions.length - 1;
    }
    if (completeAfterExit && remaining === 0) {
      accomplishGoal(goalId, 'held-as-cash');
    }
    setCompleteAfterExit(false);
    setBusy(false);
    setSettling(null);
    setExitIntent(null);
  }

  // VIEW-2: every figure below is DERIVED. This block re-implemented
  // `targetReached` and the clamped ratio that `selectGoalProgress` already
  // owned (`5.224`), summed recurring schedules and walked the event log — all
  // in the render body of a two-view component, so each figure fed several
  // render sites. The selector returns both shapes its consumers need: display
  // strings for money, plain numbers for the numeric `Projection` props.
  const detail = selectGoalDetailView(state, goalId);
  const { targetReached, ratioPercent: ratio, goalMonthly, contributionsTotal } = detail;

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

  // The settling animation plays OVER whatever surface approved it (entry
  // manifest or exit ceremony), so it is shared by both returns below.
  const settlementSheet = settling ? (
    <BottomSheet titleId="settlement.title" tone="ink" dismissible={false} onClose={() => {}}>
      <Settlement
        onComplete={() => {
          if (settling.kind === 'entry') approveEntry();
          else approveExit();
        }}
      />
    </BottomSheet>
  ) : null;

  // An exit cannot be PRICED without market data: `exitFeeFor` falls back to 0
  // without it, which on this screen would render "Network cost $0.00" and a
  // net that overstates what comes back — an understated cost on the one
  // surface whose entire job is fee truth (FC-15). `market` is null until the
  // fetch resolves and STAYS null if it fails, so this is reachable, not
  // theoretical. Every exit entry point is therefore gated on it, the same way
  // §4.6 gates the entry CTA: no honest price, no operable control.
  const canPriceExit =
    market !== null && openPositions.every((p) => exitFeeOrNull(p.positionId) !== null);

  // G7 (§4.7): the exit ceremony takes the WHOLE screen — this is the last
  // read before money moves, and a bottom sheet cannot carry an itemization
  // that grows with the number of positions.
  // VIEW-2 at `error` caught this one: the exit preview is a money derivation
  // (it itemizes principal, accrued, exit fee and network fee per position),
  // and it was composed here in the render body. The domain functions are
  // passed in, so they keep one owner; the `null` contract is unchanged, so a
  // goal with nothing open still says so instead of rendering a zeroed
  // ceremony.
  const exitPreview = selectExitPreview({
    intent: exitIntent,
    canPrice: canPriceExit,
    goalId,
    /* The same state this render read — AUD-C01. */
    snapshot: state,
    feeFor: exitFeeFor,
    previewGoal: previewGoalStop,
    previewPosition: previewPositionStop,
  });

  if (exitIntent && exitPreview) {
    return (
      <>
        <ExitCeremony
          preview={exitPreview}
          goalName={goal.name}
          goalIcon={goal.icon}
          currency={state.currency}
          busy={busy}
          onConfirm={() => setSettling({ kind: 'exit' })}
          onCancel={() => {
            // Clearing the intent matters: a cancelled G4 "stop strategy" must
            // never silently close the goal on some LATER, unrelated exit.
            setCompleteAfterExit(false);
            setExitIntent(null);
          }}
        />
        {settlementSheet}
      </>
    );
  }

  if (showCompletion) {
    return (
      <GoalCompletionScreen
        goal={goal}
        state={state}
        onClose={() => setShowCompletion(false)}
        onStopStrategy={
          openPositions.length > 0 && canPriceExit
            ? () => {
                // The REAL exit path (board §3.1): the ceremony itemizes, and
                // the goal closes as held-as-cash only after the last position
                // actually exits. Scope is the GOAL — "stop strategy" from a
                // finished goal means stop all of it, not whichever position
                // happens to sit first in the ledger.
                setCompleteAfterExit(true);
                setShowCompletion(false);
                setExitIntent({ scope: 'goal' });
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
        {/* The goal's identity colour, same as the rows it was opened from —
            a goal that changes colour when you tap into it is not an identity. */}
        <span
          className={goal.status === 'paused' ? styles.goalIconPaused : styles.goalIcon}
          data-accent={goal.status === 'paused' ? undefined : goalAccentIndex(goal.goalId)}
        >
          <LucideIcon name={goal.status === 'paused' ? 'pause' : goal.icon} size={26} />
        </span>
        <div>
          <h1 id="goaldetail-title" className={styles.title}>
            {goal.name}
          </h1>
          {/* The honest status line (mockup 14's slot): a derived STATUS, never
              a pace claim (board §6a) — paused duality (W-17d, second half only
              when true) · accomplished · target-reached; plain active = no line. */}
          {goal.status === 'accomplished' ? (
            <p className={styles.statusLine}>
              <FormattedMessage id="goalsList.status.accomplished" />
            </p>
          ) : (
            <>
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
              ) : null}
              {/* Paused and reached are independent facts: a paused PLAN never
                  blocks closing a goal that got there anyway. */}
              {targetReached ? (
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
            </>
          )}
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
              values={{ current: money(detail.current), target: money(goal.targetAmount) }}
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
              currentValue={detail.currentValue}
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
                        amount: money(selectPositionValue(position)),
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
            {detail.hasCash ? (
              <button
                type="button"
                className={styles.actionTile}
                onClick={() => {
                  setView('detailed');
                  setStrategyId(null); // E8: the picker always opens unselected
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
            {/* No "Detailed" tile and no "see the detail" link here (founder
                2026-08-22, PENDING_ALL 5.118). The Simple|Detailed toggle above
                already switches the view and is the persistent control; this
                row is for ACTIONS. A view switch standing as a visual peer of
                "Add money" and "Pause plan" overstated itself and understated
                them — and the screen offered the same destination three ways. */}
          </div>
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

          {/**
           * REPLAY-OUTCOME ATTRIBUTION (Legal 2026-09-22).
           *
           * It sits against the MARKET CHANGE row directly above, which IS the
           * replayed outcome — not against the goal total, and not against the
           * screen. That placement is what keeps the association truthful in a
           * MIXED group: the row above it ("Your contributions") is the user's
           * own money and owes nothing to any provider, so attributing the
           * decomposition at the point of the market figure says CoinGecko is
           * an underlying source of THAT calculation, and claims nothing about
           * the rest.
           *
           * The condition reads RECORDED PROVENANCE — which legs this goal's
           * accruals actually replayed — never the strategy's name, the
           * screen, or "growth means CoinGecko".
           */}
          {goalUsesCoinGeckoPrices(state.events, goal.goalId) ? <CoinGeckoAttribution /> : null}

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
              currentValue={detail.currentValue}
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
                        amount: money(selectPositionValue(position)),
                      }}
                    />
                  </h2>
                  <p className={styles.earningsTitle}>
                    <FormattedMessage id="goalDetail.earningsTitle" />
                  </p>
                  <p className={styles.earningsLine} data-sign={selectAmountSign(position.accrued)}>
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
                    disabled={!canPriceExit}
                    onClick={() =>
                      setExitIntent({ scope: 'position', positionId: position.positionId })
                    }
                  >
                    <FormattedMessage id="goalDetail.exitCta" />
                  </button>
                  {!canPriceExit ? (
                    <p className={styles.exitUnavailable}>
                      <FormattedMessage id="goalDetail.exitPricingUnavailable" />
                    </p>
                  ) : null}
                </article>
              );
            })
          )}

          {detail.hasCash ? (
            <div className={styles.investBlock}>
              {!pickerOpen ? (
                <button
                  type="button"
                  className={styles.primary}
                  onClick={() => {
                    setStrategyId(null); // E8: the picker always opens unselected
                    setPickerOpen(true);
                  }}
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
                      now={nowIso}
                    />
                  ) : null}
                  {strategy && market ? (
                    // G6: StrategyDetail IS the pre-commit read (board §3.2) —
                    // it carries the folded cost/risk itemization, so there is
                    // no path to the Manifest that skips the itemized costs.
                    <StrategyDetail
                      strategy={strategy}
                      goalName={goal.name}
                      apys={market.apys}
                      histories={histories}
                      gas={market.gas}
                      usdPriceLocal={market.usdPriceLocal}
                      currency={state.currency}
                      onPutToWork={
                        canInvest && canPriceEntry && rateAvailable && !busy
                          ? () => setEntryManifest(true)
                          : undefined
                      }
                    />
                  ) : null}
                </>
              )}
            </div>
          ) : null}
        </div>
      )}

      {pauseSheet ? (
        <GoalPauseSheet
          currency={state.currency}
          onConfirm={() => {
            pauseGoal(goalId);
            setPauseSheet(false);
          }}
          onDismiss={() => setPauseSheet(false)}
          onStopStrategy={
            openPositions.length > 0 && canPriceExit
              ? () => {
                  // The REAL exit path (Stage-D G3): fee already disclosed in
                  // the sheet line; the ceremony itemizes before anything moves.
                  // "Also stop" means the goal's money stops working — all of
                  // it, or the pause would leave positions running behind a
                  // label that says they stopped.
                  setPauseSheet(false);
                  setExitIntent({ scope: 'goal' });
                }
              : undefined
          }
        />
      ) : null}

      {entryManifest && strategy && feeLocal !== null && rateAvailable && !settling ? (
        <Manifest
          /* The fee row below is `typicalFeeUsd x usdPriceLocal` — a
             local-currency amount derived from CoinGecko FX, so this sheet
             carries the attribution. `feeLocal !== null` is guaranteed here:
             the manifest only opens when the entry prices (`canPriceEntry`),
             and the commit path refuses a null fee independently (`5.436`). */
          attributeCoinGecko
          titleId="manifest.title"
          rows={[
            { labelId: 'manifest.fromLabel', value: goal.name },
            {
              labelId: 'manifest.toLabel',
              value: intl.formatMessage({ id: `catalog.strategies.${strategy.i18nKey}.name` }),
            },
            /**
             * ⚑ AUD-B04. The amount row showed the NET (599.97) while the CTA
             * beside it said 600.00, and no row explained the 0.03 between
             * them — the selector computed `fee` and this call threw it away.
             * The row now states the GROSS the CTA commits to, and the cost is
             * itemized on its own row, so the two reconcile on screen (FC-15:
             * the itemization is the point, not decoration).
             */
            { labelId: 'manifest.amountLabel', value: money(investValue.toFixed(2)) },
            {
              labelId: 'manifest.feeLabel',
              value: money(
                selectEntrySplit({
                  totalFromCash: investValue,
                  networkFeeLocal: feeLocal,
                  split: splitEntry,
                }).fee
              ),
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

      {settlementSheet}
    </section>
  );
}
