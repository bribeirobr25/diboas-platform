'use client';

import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { EXIT_FEE_FLOOR, FEE_RATES } from '@diboas/banking';
import { FIXTURE_AS_OF, strategyProvenance } from '@diboas/defi';
import type { GasQuote, ProtocolApy, ProtocolApyHistory, StrategyDef } from '@diboas/defi';
import { blendDatedSeries } from '@diboas/investing';
import { useFormatters } from '@/hooks/useFormatters';
import { networkFeeLocal } from '@/lib/networkFee';
import { ApyChart, CHART_TIMEFRAMES, type ChartTimeframe } from './ApyChart';
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
  usdPriceLocal: number;
  currency: 'USD' | 'BRL' | 'EUR';
  onPutToWork?: () => void;
}) {
  const intl = useIntl();
  const { money, date } = useFormatters(currency);
  const [view, setView] = useState<View>('simple');
  const [requestedTimeframe, setRequestedTimeframe] = useState<ChartTimeframe>(90);

  const strategyName = intl.formatMessage({ id: `catalog.strategies.${strategy.i18nKey}.name` });
  const apy = blendedApy(strategy, apys);
  const provenance = strategyProvenance(strategy, apys);
  const fee = networkFeeLocal(gas, strategy.entryChain, usdPriceLocal);

  // The chart's series: the strategy's own legs, weighted, over real history.
  const byProtocol = new Map(histories.map((h) => [h.protocolId, h]));
  const chartSeries = blendDatedSeries(
    strategy.allocation.map((leg) => ({
      weightPercent: leg.weightPercent,
      points: byProtocol.get(leg.protocolId)?.points ?? [],
    }))
  );
  const sparkSeries = chartSeries.slice(-30).map((p) => p.apyPercent);

  const apyMessageId =
    provenance.state === 'live'
      ? 'goalNew.apyNow'
      : provenance.state === 'mixed'
        ? 'goalNew.apyNowMixed'
        : 'goalNew.apyNowFixture';

  const fixtureProtocolNames = provenance.fixtureProtocolIds
    .map((id) => intl.formatMessage({ id: `catalog.protocols.${id}` }))
    .join(', ');

  // Keep the shown timeframe honest: never mark a window active that the data
  // cannot fill. DERIVED during render (never synced via an effect, which would
  // cascade renders) — the request is what the user asked for, the effective
  // value is what history can actually answer.
  const fitting = CHART_TIMEFRAMES.filter((d) => d <= chartSeries.length);
  const widestFit = fitting.length > 0 ? fitting[fitting.length - 1] : CHART_TIMEFRAMES[0];
  const timeframe = requestedTimeframe <= widestFit ? requestedTimeframe : widestFit;

  const provenanceStamp =
    provenance.state === 'live' ? (
      <FormattedMessage
        id="common.dataLive"
        values={{ source: 'DeFiLlama', date: date(provenance.newestLiveAsOf!) }}
      />
    ) : provenance.state === 'mixed' ? (
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
      <p className={styles.itemLine}>
        <FormattedMessage
          id="pathCard.pathLine"
          values={{ goal: goalName, strategy: strategyName, chain: strategy.entryChain }}
        />
      </p>
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
        <li>
          <FormattedMessage id="pathCard.networkFee" values={{ amount: money(fee) }} />
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
            {sparkSeries.length >= 2 ? <Sparkline series={sparkSeries} /> : null}
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
              <FormattedMessage id="strategyDetail.costLine" />
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
            series={chartSeries}
            timeframe={timeframe}
            onTimeframe={setRequestedTimeframe}
          />

          <h2 className={styles.detailHead}>
            <FormattedMessage id="strategyDetail.riskFactors" />
          </h2>
          <ul className={styles.riskList}>
            {['riskSmartContract', 'riskMarketVolatility', 'riskVariableApy'].map((r) => (
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

      <Button variant="primary" fullWidth onClick={() => onPutToWork?.()}>
        <FormattedMessage id="strategyDetail.putToWork" />
      </Button>
    </section>
  );
}
