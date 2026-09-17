'use client';

import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { EXIT_FEE_FLOOR, FEE_RATES } from '@diboas/banking';
import { FIXTURE_AS_OF, isMultiNetworkCandidate, strategyProvenance } from '@diboas/defi';
import type { GasQuote, ProtocolApy, ProtocolApyHistory, StrategyDef } from '@diboas/defi';
import { useFormatters } from '@/hooks/useFormatters';
import { gasStampFor, networkFeeLocal } from '@/lib/networkFee';
import { selectStrategyChartSeries, type ChartTimeframe } from '@/view/strategy';
import { ApyChart } from './ApyChart';
import { Button } from './Button';
import { Card } from './Card';
import { LucideIcon } from './LucideIcon';
import { SegmentedToggle } from './SegmentedToggle';
import { Sparkline } from './Sparkline';
import { blendedApy } from './StrategyPicker';
import styles from './StrategyDetail.module.css';

type View = 'simple' | 'detailed';

/**
 * StrategyDetail — the G6 PRE-COMMIT READ (§4.6; mockups 03 +
 * 4-goal-strategy-2views), wired to live catalog + market data.
 *
 * Board §3.2: this is the surface, and **PathCard's cost/risk itemization is a
 * SECTION within it** — FC-15 radical fee transparency requires the itemized
 * costs at the pre-commit moment, so PathCard was absorbed here and deleted.
 *
 * Simple (default) leads ① what it is → ② how it's doing (friendly now-vs-past,
 * NOT an APY hero; the Sparkline shows real dips) → ③ the path, the cost, the
 * risk (the folded itemization). Detailed = the traditional read: the factual
 * rate with its provenance label, the AXED chart over real history, risk
 * factors, exit terms from the fee CONSTANTS, and the real underlying
 * protocols with their weights.
 *
 * DRIFT — build follows doc/code (Stage-D): mockup 03 folds an exit fee into
 * the ENTRY total (entry is FREE; the exit fee applies later, and the built
 * Manifest is correct), and mockup 19-detailed lists "Curve" (the real
 * allocation is Sky/Aave/Compound). Neither is reproduced.
 */
/** Exported for the composed-id gate (CID-1): `strategyDetail.${r}` resolves from here. */
export const RISK_FACTOR_KEYS = [
  'riskSmartContract',
  'riskMarketVolatility',
  'riskVariableApy',
] as const;

export function StrategyDetail({
  strategy,
  goalName,
  apys,
  histories,
  gas,
  usdPriceLocal,
  currency,
  onPutToWork,
}: {
  strategy: StrategyDef;
  goalName: string;
  apys: ProtocolApy[];
  /** Real per-protocol history for the axed chart; empty until it loads. */
  histories: ProtocolApyHistory[];
  gas: GasQuote[];
  usdPriceLocal: number | null;
  currency: 'USD' | 'BRL' | 'EUR';
  onPutToWork?: () => void;
}) {
  const intl = useIntl();
  const { money, date } = useFormatters(currency);
  const [view, setView] = useState<View>('simple');
  const [requestedTimeframe, setRequestedTimeframe] = useState<ChartTimeframe>(90);

  const strategyName = intl.formatMessage({ id: `catalog.strategies.${strategy.i18nKey}.name` });
  const apy = blendedApy(strategy, apys);
  /* This surface renders the NETWORK FEE as well as the rates, so its stamp
     must cover the gas source too (GAS-1) — a live-rate strategy with a
     fixture fee is `mixed`, not `live`. */
  const provenance = strategyProvenance(strategy, apys, gasStampFor(gas, strategy.entryChain));
  const fee = networkFeeLocal(gas, strategy, usdPriceLocal);

  /* The chart's series — derived in `view/strategy.ts` (AUD-C02). The selector
     also REFUSES when a leg has no history, rather than blending the rest and
     publishing a silently low curve as the strategy's own past. */
  const chart = selectStrategyChartSeries({
    allocation: strategy.allocation,
    histories,
    requestedTimeframe,
  });

  /* `5.402`: the APY label derives from the APY axis ONLY. Reading
     `provenance.state` let a reference-backed GAS quote select
     `apyNowMixed` — "includes documented reference values" — over three
     live rates, a false statement about the rates in all four locales. The
     fee's own provenance is stated by the gas sentence below, not here. */
  const apyMessageId =
    provenance.apyProvenance === 'live'
      ? 'goalNew.apyNow'
      : provenance.apyProvenance === 'mixed'
        ? 'goalNew.apyNowMixed'
        : 'goalNew.apyNowFixture';

  const fixtureProtocolNames = provenance.fixtureProtocolIds
    .map((id) => intl.formatMessage({ id: `catalog.protocols.${id}` }))
    .join(', ');

  const provenanceStamp =
    provenance.state === 'live' ? (
      <FormattedMessage
        id="common.dataLive"
        values={{ source: 'DeFiLlama', date: date(provenance.newestLiveAsOf!) }}
      />
    ) : provenance.state === 'mixed' ? (
      /**
       * TWO mixed shapes, and they must not share one sentence (`5.316`; Legal
       * ruling 2026-09-14).
       *
       * When at least one APY leg carries a reference value, `common.dataMixed`
       * names those protocols — unchanged.
       *
       * When every APY is live and only the NETWORK FEE sits on reference
       * values, `fixtureProtocolIds` is empty BY CONSTRUCTION (it accumulates
       * APY legs only), so joining it rendered *"Reference values (18.07.2026)
       * for: ."* — a sentence claiming reference values and naming none, on the
       * pre-commit money surface, in all four locales, while the test asserted
       * only that it was PRESENT. Legal's disposition: identify the
       * reference-backed INPUT, keep APY provenance accurate and SEPARATE,
       * never render an empty `for:`, and never invent protocol names. So the
       * live stamp states what IS live and the approved gas sentence states what
       * is not. The `mixed` CLASSIFICATION is untouched — only the sentence is.
       */
      provenance.fixtureProtocolIds.length > 0 ? (
        <FormattedMessage
          id="common.dataMixed"
          values={{
            source: 'DeFiLlama',
            date: date(provenance.newestLiveAsOf!),
            fixtureDate: date(FIXTURE_AS_OF),
            protocols: fixtureProtocolNames,
          }}
        />
      ) : (
        <>
          {/* `dataPartlyLive`, NOT `dataLive`. GAS-1 (founder 2026-08-21) is
              encoded in this surface's own test: it may not open with "Live
              from DeFiLlama" above a fixture fee — that claim is exactly what
              GAS-1 was raised to stop. "Partly live" is what `mixed` means
              here (rates live, network fee on reference values), and the
              approved sentence beside it names which input that is. */}
          <FormattedMessage
            id="common.dataPartlyLive"
            values={{ source: 'DeFiLlama', date: date(provenance.newestLiveAsOf!) }}
          />{' '}
          {/* Stated only when a reference-backed fee is actually ON SCREEN.
              `fee` is null when the chain has no quote OR when FX failed
              (`networkFeeLocal` returns null for either), and the cost row is
              then absent — so this sentence would describe a value the reader
              was never shown. Finding 1: `unavailable` is not `reference`. */}
          {fee !== null && provenance.feeProvenance === 'reference' ? (
            <FormattedMessage id="common.dataGasReference" />
          ) : null}
        </>
      )
    ) : (
      <FormattedMessage id="common.dataFixture" values={{ date: date(FIXTURE_AS_OF) }} />
    );

  /**
   * The folded PathCard (board §3.2). `full` (Simple view) carries path · cost ·
   * risk · no-promise · provenance. `compact` (Detailed view) drops the exit
   * line and the risk paragraph because that view states BOTH in its own
   * sections — the same figure twice is the repeated-data anti-slop pattern,
   * and a fee stated twice invites the reader to wonder if they are different.
   */
  const renderItemization = (variant: 'full' | 'compact') => (
    <div className={styles.itemization}>
      <h2 className={styles.detailHead}>
        <FormattedMessage id="pathCard.pathTitle" />
      </h2>
      {/* `5.406` §6 · A multi-network Candidate has no truthful single-chain
          Path claim. `pathCard.pathLine` is "{goal} -> {strategy} -> real
          protocols on {chain}" in all four locales, and NO approved chain-less
          variant exists — so for a Candidate spanning two networks the false
          whole-Candidate claim is SUPPRESSED rather than reworded. §6: *"Do not
          invent replacement copy."* The `Path` heading and the weighted leg list
          below still render, so composition stays visible; what disappears is
          only the sentence that named 1 of 2 networks as if it were all of
          them. Single-network Candidates are untouched (§7). */}
      {!isMultiNetworkCandidate(strategy) ? (
        <p className={styles.itemLine}>
          <FormattedMessage
            id="pathCard.pathLine"
            values={{ goal: goalName, strategy: strategyName, chain: strategy.entryChain }}
          />
        </p>
      ) : null}
      <ul className={styles.allocation}>
        {strategy.allocation.map((leg) => (
          <li key={leg.protocolId} className={styles.allocationLeg}>
            {leg.weightPercent}%{' · '}
            <FormattedMessage id={`catalog.protocols.${leg.protocolId}`} />
          </li>
        ))}
      </ul>

      <h2 className={styles.detailHead}>
        <FormattedMessage id="pathCard.costTitle" />
      </h2>
      <ul className={styles.costList}>
        <li>
          <FormattedMessage id="pathCard.entryFee" />
        </li>
        {/* `5.348` (Execution Rulings §17). The row is no longer OMITTED when the
            amount is unknown: the approved string replaces the figure, because
            `amount unavailable != zero != waived != free network`. Omitting it
            left the reader a shorter list with no note; `about $0.00` would have
            understated the one cost this list exists to state (AUD-F05). */}
        <li>
          {fee !== null ? (
            <FormattedMessage id="pathCard.networkFee" values={{ amount: money(fee) }} />
          ) : (
            <FormattedMessage id="pathCard.networkFeeUnavailable" />
          )}
        </li>
        {variant === 'full' ? (
          <li>
            <FormattedMessage
              id="pathCard.exitFee"
              values={{ min: money(EXIT_FEE_FLOOR[currency].toNumber()) }}
            />
          </li>
        ) : null}
      </ul>

      {variant === 'full' ? (
        <>
          <h2 className={styles.detailHead}>
            <FormattedMessage id="pathCard.riskTitle" />
          </h2>
          <p className={styles.itemLine}>
            {strategy.riskBand === 'stable' ? (
              <FormattedMessage id="pathCard.riskStable" />
            ) : (
              <FormattedMessage
                id="pathCard.riskGrowth"
                values={{ percent: strategy.growthExposurePercent }}
              />
            )}
          </p>
        </>
      ) : null}
      <p className={styles.noPromise}>
        <FormattedMessage id="pathCard.noPromise" />
      </p>
      <p className={styles.stamp}>{provenanceStamp}</p>
    </div>
  );

  return (
    <section className={styles.wrap} aria-labelledby="strategy-title">
      <header className={styles.head}>
        <SegmentedToggle<View>
          ariaLabel={intl.formatMessage({ id: 'goalsList.viewToggle' })}
          value={view}
          onChange={setView}
          segments={[
            { id: 'simple', label: <FormattedMessage id="strategyDetail.simple" /> },
            { id: 'detailed', label: <FormattedMessage id="strategyDetail.detailed" /> },
          ]}
        />
      </header>

      <div className={styles.hero}>
        <span className={styles.heroIcon}>
          <LucideIcon name={strategy.icon} size={22} />
        </span>
        <div>
          {/* The hero carries the NAME only: the catalog has one descriptive
              string per strategy (its tagline), and ① "What it is" is where it
              belongs. Printing it twice is duplicated copy, not a richer
              header — the mockup's second line would need product copy that
              does not exist, and inventing it is not ours to do. */}
          <h1 id="strategy-title" className={styles.heroTitle}>
            {strategyName}
          </h1>
        </div>
      </div>

      {view === 'simple' ? (
        <div className={styles.simple}>
          {/* ① what it is — the largest, most prominent (no APY hero) */}
          <Card className={styles.rowCard}>
            <span className={styles.rowIcon}>
              <LucideIcon name="shield" size={18} />
            </span>
            <div>
              <p className={styles.rowLabel}>
                <FormattedMessage id="strategyDetail.whatItIs" />
              </p>
              <p className={styles.rowLead}>
                <FormattedMessage id={`catalog.strategies.${strategy.i18nKey}.tagline`} />
              </p>
            </div>
          </Card>

          {/* ② how it's doing — the real recent series (dips included) */}
          <Card className={styles.behaveCard}>
            <p className={styles.rowLabel}>
              <FormattedMessage id="strategyDetail.howItsDoing" />
            </p>
            <p className={styles.behaveLead}>
              <FormattedMessage
                id={apyMessageId}
                values={{ apy: apy.toDecimalPlaces(2).toNumber() }}
              />
            </p>
            {chart.sparkSeries.length >= 2 ? <Sparkline series={chart.sparkSeries} /> : null}
            <p className={styles.caveat}>
              <LucideIcon name="shield" size={14} />
              <FormattedMessage id="strategyDetail.caveat" />
            </p>
          </Card>

          {/* ③ the path, the cost, the risk. The mockup's Simple view is a
              friendly one-liner; board §3.2 requires the itemization at the
              pre-commit moment. Both: the plain line leads, the itemized
              detail follows it. */}
          <Card className={styles.itemCard}>
            <p className={styles.costLead}>
              <FormattedMessage
                id="strategyDetail.costLine"
                values={{ min: money(EXIT_FEE_FLOOR[currency].toNumber()) }}
              />
            </p>
            {renderItemization('full')}
          </Card>
        </div>
      ) : (
        <div className={styles.detailed}>
          <div className={styles.apyRow}>
            <span className={styles.apyLabel}>
              <FormattedMessage id="strategyDetail.currentApy" />
            </span>
            <span className={styles.apyValue}>
              {intl.formatNumber(apy.toDecimalPlaces(2).toNumber(), {
                maximumFractionDigits: 2,
              })}
              %
            </span>
            <span className={styles.apyVaries}>
              <FormattedMessage id="strategyDetail.varies" />
            </span>
          </div>
          <p className={styles.apyProvenance}>
            <FormattedMessage
              id={apyMessageId}
              values={{ apy: apy.toDecimalPlaces(2).toNumber() }}
            />
          </p>

          <ApyChart
            series={chart.series}
            timeframe={chart.timeframe}
            onTimeframe={setRequestedTimeframe}
          />

          <h2 className={styles.detailHead}>
            <FormattedMessage id="strategyDetail.riskFactors" />
          </h2>
          <ul className={styles.riskList}>
            {RISK_FACTOR_KEYS.map((r) => (
              <li key={r} className={styles.riskRow}>
                <LucideIcon name="shield" size={16} />
                <FormattedMessage id={`strategyDetail.${r}`} />
              </li>
            ))}
          </ul>

          <h2 className={styles.detailHead}>
            <FormattedMessage id="strategyDetail.whatHappensOnExit" />
          </h2>
          <div className={styles.exitRow}>
            <span>
              <FormattedMessage id="strategyDetail.exitFee" />
            </span>
            <span className={styles.exitVal}>
              {/* From the fee CONSTANTS — never a literal in a component (R-3). */}
              {intl.formatNumber(FEE_RATES.exit.toNumber(), {
                style: 'percent',
                maximumFractionDigits: 2,
              })}
              <span className={styles.exitMin}>
                {' '}
                <FormattedMessage
                  id="strategyDetail.minExit"
                  values={{ min: money(EXIT_FEE_FLOOR[currency].toNumber()) }}
                />
              </span>
            </span>
          </div>

          {/* The real allocation, with weights — not the mockup's "Curve". */}
          <h2 className={styles.detailHead}>
            <FormattedMessage id="strategyDetail.underlyingProtocols" />
          </h2>
          <div className={styles.protocols}>
            {strategy.allocation.map((leg) => (
              <span key={leg.protocolId} className={styles.protocolChip}>
                <FormattedMessage id={`catalog.protocols.${leg.protocolId}`} />
                {` ${leg.weightPercent}%`}
              </span>
            ))}
          </div>
          <p className={styles.protocolsNote}>
            <LucideIcon name="shield" size={14} />
            <FormattedMessage id="strategyDetail.protocolsNote" />
          </p>

          {renderItemization('compact')}
        </div>
      )}

      {view === 'simple' ? (
        <button type="button" className={styles.seeDetail} onClick={() => setView('detailed')}>
          <FormattedMessage id="strategyDetail.seeDetail" />
          <LucideIcon name="chevron-right" size={16} />
        </button>
      ) : null}

      {/* No handler → no operable control. A CTA that looks live but does
          nothing is the fake-control veto; and a silently-disabled one is
          barely better, so the reason renders with it. */}
      <Button variant="primary" fullWidth disabled={!onPutToWork} onClick={() => onPutToWork?.()}>
        <FormattedMessage id="strategyDetail.putToWork" />
      </Button>
      {!onPutToWork ? (
        <p className={styles.ctaHint}>
          {/* `5.347` (Execution Rulings §16): the refusal explanation must stay
              ADJACENT to the blocked action — and it must be the RIGHT reason.
              `fee === null` here is exactly `GoalDetailScreen`'s
              `canPriceEntry === false`: both call `networkFeeLocal` with this
              strategy's `entryChain` and the same FX, so an unpriceable entry is
              knowable locally. Before this, an unpriceable entry rendered
              "Enter an amount above", which named a cause that was not the
              cause. One reason renders, never both. */}
          {fee === null ? (
            <FormattedMessage id="goalDetail.entryPricingUnavailable" />
          ) : (
            <FormattedMessage id="strategyDetail.needAmount" />
          )}
        </p>
      ) : null}
    </section>
  );
}
