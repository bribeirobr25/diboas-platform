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
import { enterStrategy, exitPosition, previewExit, splitEntry } from '@/lib/ledgerClient';
import { BottomSheet } from './BottomSheet';
import { LucideIcon } from './LucideIcon';
import { Manifest } from './Manifest';
import { PathCard, networkFeeLocal } from './PathCard';
import { Projection } from './Projection';
import { RecurringControl } from './RecurringControl';
import { Settlement } from './Settlement';
import { StrategyPicker } from './StrategyPicker';
import styles from './GoalDetailScreen.module.css';

/**
 * Goal detail: progress with the contributions-vs-earnings honesty split,
 * "put it to work" for goal cash, and the exit flow — every movement through
 * the manifest, every figure stamped.
 */
export function GoalDetailScreen({ locale, goalId }: { locale: SandboxLocale; goalId: string }) {
  const intl = useIntl();
  const state = useLedger();
  const currency = LOCALE_CURRENCY[locale];
  const { market } = useMarket(currency);
  const { money } = useFormatters(state.currency);

  const goal = state.goals.find((g) => g.goalId === goalId);
  const openPositions = state.positions.filter((p) => p.goalId === goalId && p.open);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [strategyId, setStrategyId] = useState<string | null>(null);
  const [investAmount, setInvestAmount] = useState('');
  const [entryManifest, setEntryManifest] = useState(false);
  const [exitManifestFor, setExitManifestFor] = useState<string | null>(null);
  const [settling, setSettling] = useState<
    { kind: 'entry' } | { kind: 'exit'; positionId: string } | null
  >(null);
  const [busy, setBusy] = useState(false);

  const current = useMemo(() => {
    if (!goal) return new Decimal(0);
    let total = new Decimal(goal.cash);
    for (const p of openPositions) total = total.plus(p.principal).plus(p.accrued);
    return total;
  }, [goal, openPositions]);

  if (!goal) {
    return (
      <section className={styles.wrap}>
        <Link href={`/${locale}`} className={styles.backLink}>
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
    setBusy(false);
    setSettling(null);
    setExitManifestFor(null);
  }

  const ratio = new Decimal(goal.targetAmount).gt(0)
    ? Decimal.min(current.div(goal.targetAmount), 1).mul(100).toNumber()
    : 0;

  // The goal's total recurring monthly (across its positions) drives the honest
  // path projection (C2) — the far-off-goal display deferred from 2c.
  const goalMonthly = state.recurring
    .filter((r) => r.goalId === goalId)
    .reduce((acc, r) => acc.plus(r.monthlyAmount), new Decimal(0))
    .toNumber();

  return (
    <section className={styles.wrap} aria-labelledby="goaldetail-title">
      <Link href={`/${locale}`} className={styles.backLink}>
        <LucideIcon name="arrow-left" size={16} />
        <FormattedMessage id="goalDetail.backToGoal" />
      </Link>

      <div className={styles.head}>
        <span className={styles.goalIcon}>
          <LucideIcon name={goal.icon} size={26} />
        </span>
        <div>
          <h1 id="goaldetail-title" className={styles.title}>
            {goal.name}
          </h1>
          <p className={styles.progressText}>
            <FormattedMessage
              id="goalDetail.progress"
              values={{ current: money(current.toFixed(2)), target: money(goal.targetAmount) }}
            />
          </p>
        </div>
      </div>

      <span
        className={styles.progressTrack}
        role="progressbar"
        aria-valuenow={Math.round(ratio)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <span className={styles.progressFill} style={{ width: `${ratio}%` }} />
      </span>

      <div className={styles.stats}>
        <p className={styles.stat}>
          <FormattedMessage id="goalDetail.cashInGoal" values={{ amount: money(goal.cash) }} />
        </p>
        <p className={styles.stat}>
          <FormattedMessage
            id="goalDetail.contributions"
            values={{
              amount: money(
                state.events
                  .filter((e) => e.type === 'GoalFunded' && e.goalId === goalId)
                  .reduce((acc, e) => acc.plus((e as { amount: string }).amount), new Decimal(0))
                  .toFixed(2)
              ),
            }}
          />
        </p>
      </div>

      {/* Goal-reached milestone (WS-E). R-2 allows "goals reached" as
          product-true progression; honest + non-triumphalist, no gamification. */}
      {new Decimal(goal.targetAmount).gt(0) && current.gte(goal.targetAmount) ? (
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
                    const preview = previewExit(position.positionId);
                    const fee =
                      posStrategy && market
                        ? networkFeeLocal(market.gas, posStrategy.entryChain, market.usdPriceLocal)
                        : 0;
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
                              { amount: money(fee) }
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
            <button type="button" className={styles.primary} onClick={() => setPickerOpen(true)}>
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
