'use client';

import { FormattedMessage, useIntl } from 'react-intl';
import { FIXTURE_AS_OF, strategyProvenance } from '@diboas/defi';
import type { GasQuote, ProtocolApy, StrategyDef } from '@diboas/defi';
import { EXIT_FEE_FLOOR } from '@diboas/banking';
import { useFormatters } from '@/hooks/useFormatters';
import styles from './PathCard.module.css';

/** Network fee for a chain, converted to the ledger currency for display. */
export function networkFeeLocal(
  gas: GasQuote[],
  chain: StrategyDef['entryChain'],
  usdPriceLocal: number
): number {
  const quote = gas.find((g) => g.chain === chain);
  return (quote?.typicalFeeUsd ?? 0) * usdPriceLocal;
}

/**
 * The path, the cost, the risk — on screen BEFORE anything moves (UX-44/52,
 * the campaign's core claim). Data provenance rides along (Data Vintage).
 */
export function PathCard({
  goalName,
  strategy,
  apys,
  gas,
  usdPriceLocal,
  currency,
}: {
  goalName: string;
  strategy: StrategyDef;
  apys: ProtocolApy[];
  gas: GasQuote[];
  usdPriceLocal: number;
  currency: 'USD' | 'BRL' | 'EUR';
}) {
  const intl = useIntl();
  const { money, date } = useFormatters(currency);
  const strategyName = intl.formatMessage({ id: `catalog.strategies.${strategy.i18nKey}.name` });
  const fee = networkFeeLocal(gas, strategy.entryChain, usdPriceLocal);
  // The shared three-state predicate (§3-A) replaces the deleted inline
  // `anyFixture` — the mixed stamp NAMES the reference protocols (E5/board
  // §3.11), and the fixture date flows from FIXTURE_AS_OF through the locale
  // formatter (P-F4b: no hardcoded date literal).
  const provenance = strategyProvenance(strategy, apys);
  const fixtureProtocolNames = provenance.fixtureProtocolIds
    .map((id) => intl.formatMessage({ id: `catalog.protocols.${id}` }))
    .join(', ');

  return (
    <aside className={styles.wrap} aria-labelledby="pathcard-title">
      <h3 id="pathcard-title" className={styles.title}>
        <FormattedMessage id="pathCard.title" />
      </h3>
      <p className={styles.subtitle}>
        <FormattedMessage id="pathCard.subtitle" />
      </p>

      <h4 className={styles.sectionLabel}>
        <FormattedMessage id="pathCard.pathTitle" />
      </h4>
      <p className={styles.line}>
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

      <h4 className={styles.sectionLabel}>
        <FormattedMessage id="pathCard.costTitle" />
      </h4>
      <ul className={styles.list}>
        <li>
          <FormattedMessage id="pathCard.entryFee" />
        </li>
        <li>
          <FormattedMessage id="pathCard.networkFee" values={{ amount: money(fee) }} />
        </li>
        <li>
          <FormattedMessage
            id="pathCard.exitFee"
            values={{
              min: money(EXIT_FEE_FLOOR[currency].toNumber()),
            }}
          />
        </li>
      </ul>

      <h4 className={styles.sectionLabel}>
        <FormattedMessage id="pathCard.riskTitle" />
      </h4>
      <p className={styles.line}>
        {strategy.riskBand === 'stable' ? (
          <FormattedMessage id="pathCard.riskStable" />
        ) : (
          <FormattedMessage
            id="pathCard.riskGrowth"
            values={{ percent: strategy.growthExposurePercent }}
          />
        )}
      </p>
      <p className={styles.noPromise}>
        <FormattedMessage id="pathCard.noPromise" />
      </p>
      <p className={styles.stamp}>
        {provenance.state === 'live' ? (
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
        )}
      </p>
    </aside>
  );
}
