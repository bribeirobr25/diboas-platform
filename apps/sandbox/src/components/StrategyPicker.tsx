'use client';

import Decimal from 'decimal.js';
import { FormattedMessage } from 'react-intl';
import {
  horizonBandForMonths,
  strategiesForHorizon,
  type ProtocolApy,
  type StrategyDef,
} from '@diboas/defi';
import styles from './StrategyPicker.module.css';

/** Blended current APY for a strategy from live per-protocol APYs. */
export function blendedApy(strategy: StrategyDef, apys: ProtocolApy[]): Decimal {
  const byId = new Map(apys.map((a) => [a.protocolId, a]));
  let total = new Decimal(0);
  for (const leg of strategy.allocation) {
    const apy = byId.get(leg.protocolId)?.apyPercent ?? 0;
    total = total.plus(new Decimal(apy).mul(leg.weightPercent).div(100));
  }
  return total;
}

/** True if every leg of the strategy has a live (non-fixture) APY. */
export function isFullyLive(strategy: StrategyDef, apys: ProtocolApy[]): boolean {
  const byId = new Map(apys.map((a) => [a.protocolId, a]));
  return strategy.allocation.every((leg) => byId.get(leg.protocolId)?.stamp.source === 'defillama');
}

/**
 * Guidance WITHOUT advising (R-3): the objective horizon filter renders the
 * FULL matching list in stable catalog order. No "recommended" badge, no
 * default selection, no reordering. The user reads and picks.
 */
export function StrategyPicker({
  horizonMonths,
  apys,
  selectedId,
  onSelect,
}: {
  horizonMonths: number;
  apys: ProtocolApy[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const strategies = strategiesForHorizon(horizonBandForMonths(horizonMonths));

  return (
    <fieldset className={styles.wrap}>
      <legend className={styles.legend}>
        <FormattedMessage id="goalNew.strategiesTitle" />
      </legend>
      <p className={styles.note}>
        <FormattedMessage id="goalNew.strategiesNote" />
      </p>
      <ul className={styles.list}>
        {strategies.map((strategy) => {
          const apy = blendedApy(strategy, apys);
          const checked = selectedId === strategy.id;
          return (
            <li key={strategy.id}>
              <label className={`${styles.card} ${checked ? styles.cardSelected : ''}`}>
                <input
                  className={styles.radio}
                  type="radio"
                  name="strategy"
                  value={strategy.id}
                  checked={checked}
                  onChange={() => onSelect(strategy.id)}
                />
                <span className={styles.cardBody}>
                  <span className={styles.cardHead}>
                    <span className={styles.name}>
                      <FormattedMessage id={`catalog.strategies.${strategy.i18nKey}.name`} />
                    </span>
                    <span
                      className={
                        strategy.riskBand === 'stable' ? styles.badgeStable : styles.badgeGrowth
                      }
                    >
                      <FormattedMessage
                        id={
                          strategy.riskBand === 'stable'
                            ? 'goalNew.riskStable'
                            : 'goalNew.riskGrowth'
                        }
                      />
                    </span>
                  </span>
                  <span className={styles.tagline}>
                    <FormattedMessage id={`catalog.strategies.${strategy.i18nKey}.tagline`} />
                  </span>
                  <span className={styles.meta}>
                    <FormattedMessage
                      id="goalNew.apyNow"
                      values={{ apy: apy.toDecimalPlaces(2).toNumber() }}
                    />
                    {strategy.riskBand === 'growth' ? (
                      <>
                        {' · '}
                        <FormattedMessage
                          id="goalNew.growthExposure"
                          values={{ percent: strategy.growthExposurePercent }}
                        />
                      </>
                    ) : null}
                  </span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}
