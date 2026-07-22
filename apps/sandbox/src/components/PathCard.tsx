'use client';

import { FormattedMessage, useIntl } from 'react-intl';
import type { GasQuote, ProtocolApy, StrategyDef } from '@diboas/defi';
import { EXIT_FEE_CAP, EXIT_FEE_FLOOR } from '@diboas/banking';
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
  const byId = new Map(apys.map((a) => [a.protocolId, a]));
  const anyFixture = strategy.allocation.some(
    (leg) => byId.get(leg.protocolId)?.stamp.source !== 'defillama'
  );
  const newestStamp = strategy.allocation
    .map((leg) => byId.get(leg.protocolId)?.stamp.asOf)
    .filter(Boolean)
    .sort()
    .at(-1);

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
              max: money(EXIT_FEE_CAP[currency].toNumber()),
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
        {anyFixture || !newestStamp ? (
          <FormattedMessage id="common.dataFixture" values={{ date: '2026-07-18' }} />
        ) : (
          <FormattedMessage
            id="common.dataLive"
            values={{ source: 'DeFiLlama', date: date(newestStamp) }}
          />
        )}
      </p>
    </aside>
  );
}
