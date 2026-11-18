'use client';

import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { EXIT_FEE_FLOOR, FEE_RATES } from '@diboas/banking';
import {
  FIXTURE_AS_OF,
  isMultiNetworkCandidate,
  strategyProvenance,
  strategyRateAvailability,
  sourceLabelOf,
} from '@diboas/defi';
import type { GasQuote, ProtocolApy, ProtocolApyHistory, StrategyDef } from '@diboas/defi';
import { useFormatters } from '@/hooks/useFormatters';
import { gasStampFor, networkFeeLocal } from '@/lib/networkFee';
import { CoinGeckoAttribution } from './CoinGeckoAttribution';
import { selectStrategyChartSeries, type ChartTimeframe } from '@/view/strategy';
import { ApyChart } from './ApyChart';
import { Button } from './Button';
import { Card } from './Card';
import { LucideIcon } from './LucideIcon';
import { RateLine } from './RateLine';
import { SegmentedToggle } from './SegmentedToggle';
import { Sparkline } from './Sparkline';
import { strategyRateDisplay } from '@/view/strategy';
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
  now,
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
  /**
   * ⛑ STAGE H · the CURRENT-FACING reference moment for the age contract
   * (`5.309`), REQUIRED and owned by the screen (`5.814`): the same clock ages
   * the rate in the picker and here, read once at screen mount, so a re-render
   * cannot move a rendered cost or rate across a policy boundary mid-session.
   */
  now: string;
  onPutToWork?: () => void;
}) {
  const intl = useIntl();
  const { money, date, percent } = useFormatters(currency);
  const [view, setView] = useState<View>('simple');
  const [requestedTimeframe, setRequestedTimeframe] = useState<ChartTimeframe>(90);

  const strategyName = intl.formatMessage({ id: `catalog.strategies.${strategy.i18nKey}.name` });
  /* This surface renders the NETWORK FEE as well as the rates, so its stamp
     must cover the gas source too (GAS-1) — a live-rate strategy with a
     fixture fee is `mixed`, not `live`. */
  const provenance = strategyProvenance(strategy, apys, gasStampFor(gas, strategy.entryChain));
  const rateDisplay = strategyRateDisplay(strategy, apys, now);
  const fee = networkFeeLocal(gas, strategy, usdPriceLocal, now);
  /**
   * ⛑ `5.436` · the RATE half of the same age contract, through the SAME
   * generic gate the fee above uses. The candidate stays readable; what it
   * loses is the number and the ability to be committed.
   */
  const rate = strategyRateAvailability(strategy, apys, now);
  /**
   * `5.440` · THE ATTRIBUTION NAMES THE SOURCE THAT ACTUALLY SERVED.
   *
   * These four message values were the literal `'DeFiLlama'`, written here. The
   * message CATALOGUE was already provider-agnostic — it takes `{source}` — so
   * the coupling was entirely in this component, and substituting the provider
   * would have kept a retired vendor's name on a live money surface in four
   * locales. It is now looked up from the stamp of the leg that produced
   * `newestLiveAsOf`, so the name and the date come from the SAME observation.
   *
   * Non-null on every branch that renders it: those branches require
   * `provenance.state !== 'fixture'`, and the domain invariant is that
   * `newestLiveSource` and `newestLiveAsOf` are set together or not at all.
   */
  const liveSourceLabel = provenance.newestLiveSource
    ? sourceLabelOf(provenance.newestLiveSource)
    : '';

  /* The chart's series — derived in `view/strategy.ts` (AUD-C02). The selector
     also REFUSES when a leg has no history, rather than blending the rest and
     publishing a silently low curve as the strategy's own past. */
  const chart = selectStrategyChartSeries({
    allocation: strategy.allocation,
    histories,
    requestedTimeframe,
  });

  /* The rate line (`5.814`) is chosen in `view/strategy.ts` by the rate's
     ORIGIN (the APY axis only, `5.402`: a reference-backed GAS quote never
     makes live rates read as reference values) and its AGE (no Practice rate is
     current). The fee's own provenance is stated by the gas sentence below. */

  const fixtureProtocolNames = provenance.fixtureProtocolIds
    .map((id) => intl.formatMessage({ id: `catalog.protocols.${id}` }))
    .join(', ');

  /**
   * Which stamp sentence renders — decided ONCE, and both the sentence and its
   * test id read it, so they cannot disagree (GAS-1, `5.316`, `5.814`).
   *
   * TWO mixed shapes, and they must not share one sentence (`5.316`; Legal
   * ruling 2026-09-14). When at least one APY leg carries a reference value,
   * `common.dataMixed` names those protocols. When every APY is live and only the
   * NETWORK FEE sits on reference values, `fixtureProtocolIds` is empty BY
   * CONSTRUCTION (it accumulates APY legs only), so joining it rendered
   * *"Reference values (18.07.2026) for: ."* — a sentence claiming reference
   * values and naming none. Legal's disposition: identify the reference-backed
   * INPUT, keep APY provenance accurate and SEPARATE, never render an empty
   * `for:`, never invent protocol names. So that branch (`partly-live`) names the
   * pool rates and the approved gas sentence names the reference-backed fee.
   *
   * Since `5.814` (D3) every live stamp names only the pool rates, and the
   * all-live and partly-live sentences differ by a final period: tests tell the
   * branches apart by this id plus the gas sentence, never by text.
   */
  /* `none`: a live or mixed stamp needs the live date it states; without one
     (no rate-owing leg at all — no catalogue strategy today) no stamp renders,
     never "Pool rates from , fetched ". */
  const stampKind: 'live' | 'mixed' | 'partly-live' | 'fixture' | 'none' =
    provenance.state === 'fixture'
      ? 'fixture'
      : provenance.newestLiveAsOf === null
        ? 'none'
        : provenance.state === 'live'
          ? 'live'
          : provenance.fixtureProtocolIds.length > 0
            ? 'mixed'
            : 'partly-live';
  const liveDate = provenance.newestLiveAsOf ? date(provenance.newestLiveAsOf) : '';

  const provenanceStamp =
    stampKind === 'live' ? (
      <FormattedMessage id="common.dataLive" values={{ source: liveSourceLabel, date: liveDate }} />
    ) : stampKind === 'mixed' ? (
      <FormattedMessage
        id="common.dataMixed"
        values={{
          source: liveSourceLabel,
          date: liveDate,
          fixtureDate: date(FIXTURE_AS_OF),
          protocols: fixtureProtocolNames,
        }}
      />
    ) : stampKind === 'partly-live' ? (
      <>
        <FormattedMessage
          id="common.dataPartlyLive"
          values={{ source: liveSourceLabel, date: liveDate }}
        />{' '}
        {/* Stated only when a reference-backed fee is actually ON SCREEN.
            `fee` is null when the chain has no quote OR when FX failed
            (`networkFeeLocal` returns null for either), and the cost row is
            then absent — so this sentence would describe a value the reader
            was never shown. Finding 1: `unavailable` is not `reference`. */}
        {fee !== null &&
        provenance.feeEvidence.rendered &&
        provenance.feeEvidence.availability === 'AVAILABLE' &&
        provenance.feeEvidence.origin !== 'OBSERVED' ? (
          <FormattedMessage id="common.dataGasReference" />
        ) : null}
      </>
    ) : stampKind === 'fixture' ? (
      <FormattedMessage id="common.dataFixture" values={{ date: date(FIXTURE_AS_OF) }} />
    ) : null;

  /**
   * The folded PathCard (board §3.2). `full` (Simple view) carries path · cost ·
   * risk · no-promise · provenance. `compact` (Detailed view) drops the exit
   * line and the risk paragraph because that view states BOTH in its own
   * sections — the same figure twice is the repeated-data anti-slop pattern,
   * and a fee stated twice invites the reader to wonder if they are different.
   */
  const renderItemization = (variant: 'full' | 'compact') => (
    <div className={styles.itemization}>
      <h3 className={styles.detailHead}>
        <FormattedMessage id="pathCard.pathTitle" />
      </h3>
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

      {/* `5.421` · THE REFERENCE-COST GROUP IS ONE SEMANTIC UNIT.
          Product/UIUX requires the order heading -> qualifier -> governed rows,
          with the qualifier INSIDE the group, immediately below the heading and
          immediately above the first row. It is a visible <p> in normal DOM
          reading order — never sr-only, never a tooltip, never a footer — and
          the ARIA association only REINFORCES an order that already reads
          correctly without it (§5: ARIA may not compensate for detached
          content). The qualifier renders in BOTH variants, because the compact
          itemization the Detailed view renders carries this same heading and a
          governed network-cost row; leaving that instance unqualified would
          reopen exactly the gap `5.421` closes. */}
      <section
        className={styles.costGroup}
        aria-labelledby="cost-group-title"
        aria-describedby="cost-group-qualifier"
      >
        <h3 id="cost-group-title" className={styles.detailHead}>
          <FormattedMessage id="pathCard.costTitle" />
        </h3>
        <p id="cost-group-qualifier" className={styles.qualifier}>
          <FormattedMessage id="strategyDetail.referenceCostQualifier" />
        </p>
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
        {/**
         * ATTRIBUTION PROXIMITY. The network fee is a LOCAL-CURRENCY AMOUNT
         * DERIVED FROM COINGECKO FX (`typicalFeeUsd x usdPriceLocal`), so the
         * attribution sits immediately below the cost list it belongs to — not
         * in a footer, tooltip, modal or overflow menu, and identically on
         * mobile and desktop because nothing here is viewport-gated.
         *
         * Guarded on `fee !== null` on purpose: when the amount is refused the
         * row reads "amount unavailable" and NOTHING CoinGecko-derived
         * renders, so attributing it would brand a surface showing none of
         * their data — the failure the ruling names in its own words.
         */}
        {fee !== null ? <CoinGeckoAttribution /> : null}
      </section>

      {variant === 'full' ? (
        <>
          <h3 className={styles.detailHead}>
            <FormattedMessage id="pathCard.riskTitle" />
          </h3>
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
      {provenanceStamp !== null ? (
        <p className={styles.stamp} data-testid={`provenance-stamp-${stampKind}`}>
          {provenanceStamp}
        </p>
      ) : null}
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
          <h2 id="strategy-title" className={styles.heroTitle}>
            {strategyName}
          </h2>
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
              {/* ⛑ `5.444` · RATE-DISPLAYABLE, not AVAILABILITY. */}
              {rateDisplay.displayable ? (
                <RateLine display={rateDisplay} />
              ) : rate.available ? null : (
                /* `5.436`: the approved GENERIC state, never a stale number,
                   never 0%, never a bare dash. Reserved for a genuinely
                   unavailable strategy. */
                <FormattedMessage id="common.optionUnavailable" />
              )}
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
          {/* `5.541` — the picker's three-way rule (`StrategyPicker.tsx`), applied here
              too: a displayable rate shows the rate; an AVAILABLE strategy with no
              displayable rate (a market leg's return is a price, not an APY) states
              NO rate, so the row is omitted; only an UNAVAILABLE strategy shows the
              generic unavailable state. Before, this view said "This option is not
              available right now" for a strategy the user could select. */}
          {rateDisplay.displayable || !rate.available ? (
            <div className={styles.apyRow}>
              {/* `5.226` · one neutral title in every state (plan P10, D5): the
                  line under it states the rate's origin and age. */}
              <span className={styles.apyLabel} data-testid="rate-title">
                <FormattedMessage id="strategyDetail.poolRate" />
              </span>
              {rateDisplay.displayable ? (
                <>
                  <span className={styles.apyValue}>
                    {intl.formatNumber(rateDisplay.apy.toDecimalPlaces(2).toNumber(), {
                      maximumFractionDigits: 2,
                    })}
                    %
                  </span>
                  <span className={styles.apyVaries}>
                    <FormattedMessage id="strategyDetail.varies" />
                  </span>
                </>
              ) : (
                /* Reached only for an UNAVAILABLE strategy: the title stays —
                   "Pool rate" is still the right question; only the answer is
                   unavailable. `varies` describes a rate, so it goes with the rate. */
                <span className={styles.apyValue}>
                  <FormattedMessage id="common.optionUnavailable" />
                </span>
              )}
            </div>
          ) : null}
          {/* ⛑ `5.444` · THE QUALIFIER GOES WITH THE NUMBER. This sentence explains
              where a rate came from; rendering it without the rate would leave prose
              describing something that is not on screen. */}
          {rateDisplay.displayable ? (
            <p className={styles.apyProvenance}>
              <RateLine display={rateDisplay} />
            </p>
          ) : null}

          <ApyChart
            series={chart.series}
            timeframe={chart.timeframe}
            onTimeframe={setRequestedTimeframe}
          />

          <h3 className={styles.detailHead}>
            <FormattedMessage id="strategyDetail.riskFactors" />
          </h3>
          <ul className={styles.riskList}>
            {RISK_FACTOR_KEYS.map((r) => (
              <li key={r} className={styles.riskRow}>
                <LucideIcon name="shield" size={16} />
                <FormattedMessage id={`strategyDetail.${r}`} />
              </li>
            ))}
          </ul>

          <h3 className={styles.detailHead}>
            <FormattedMessage id="strategyDetail.whatHappensOnExit" />
          </h3>
          {/* `5.421` · THE DETAILED VIEW IS INDEPENDENTLY COMPLETE. A reader can
              land here via the toggle without ever seeing Simple, so this group
              carries its OWN qualifier — the same reusable key, never a second
              copy of the wording — in the order label -> qualifier -> rate ->
              floor. The rate still comes from the fee CONSTANTS (R-3), and the
              floor travels with it (FE-1). */}
          <section
            className={styles.exitGroup}
            aria-labelledby="exit-fee-label"
            aria-describedby="exit-fee-qualifier"
          >
            <h4 id="exit-fee-label" className={styles.exitLabel}>
              <FormattedMessage id="strategyDetail.exitFee" />
            </h4>
            <p id="exit-fee-qualifier" className={styles.qualifier}>
              <FormattedMessage id="strategyDetail.referenceCostQualifier" />
            </p>
            <div className={styles.exitRow}>
              <span className={styles.exitVal}>
                {/* From the fee CONSTANTS — never a literal in a component (R-3). */}
                {percent(FEE_RATES.exit.toNumber(), { maximumFractionDigits: 2 })}
              </span>
              <span className={styles.exitMin}>
                <FormattedMessage
                  id="strategyDetail.minExit"
                  values={{ min: money(EXIT_FEE_FLOOR[currency].toNumber()) }}
                />
              </span>
            </div>
          </section>

          {/* The real allocation, with weights — not the mockup's "Curve". */}
          <h3 className={styles.detailHead}>
            <FormattedMessage id="strategyDetail.underlyingProtocols" />
          </h3>
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
      {/* ⛑ `5.436`: the rate gate is applied HERE as well as in the parent, so
          the refusal holds even if a future caller passes a handler. Blocking
          in one place only is how a "cannot commit" becomes "committed anyway"
          two refactors later. */}
      <Button
        variant="primary"
        fullWidth
        disabled={!onPutToWork || !rate.available}
        onClick={() => onPutToWork?.()}
      >
        <FormattedMessage id="strategyDetail.putToWork" />
      </Button>
      {!onPutToWork || !rate.available ? (
        <p className={styles.ctaHint}>
          {/* `5.347` (Execution Rulings §16): the refusal explanation must stay
              ADJACENT to the blocked action — and it must be the RIGHT reason.
              `fee === null` here is exactly `GoalDetailScreen`'s
              `canPriceEntry === false`: both call `networkFeeLocal` with this
              strategy's `entryChain` and the same FX, so an unpriceable entry is
              knowable locally. Before this, an unpriceable entry rendered
              "Enter an amount above", which named a cause that was not the
              cause. One reason renders, never both. */}
          {/* ⛑ `5.436` takes precedence: when the RATE is unavailable the
              candidate itself cannot be chosen, which is a broader statement
              than "this cost cannot be priced" and must not be described as a
              cost problem. Still exactly one reason, never two. */}
          {!rate.available ? (
            <FormattedMessage id="common.optionUnavailable" />
          ) : fee === null ? (
            <FormattedMessage id="goalDetail.entryPricingUnavailable" />
          ) : (
            <FormattedMessage id="strategyDetail.needAmount" />
          )}
        </p>
      ) : null}
    </section>
  );
}
