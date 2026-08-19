'use client';

import Decimal from 'decimal.js';
import { FormattedMessage } from 'react-intl';
import {
  horizonBandForMonths,
  strategiesForHorizon,
  strategyProvenance,
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
      <p className={styles.note}>
        <FormattedMessage id="goalNew.strategiesBands" />
      </p>
      <ul className={styles.list}>
        {strategies.map((strategy) => {
          const apy = blendedApy(strategy, apys);
          // The shared three-state predicate (§3-A): the row's rate line says
          // what the number IS — "real" is reserved for the all-live state.
          const provenance = strategyProvenance(strategy, apys);
          const apyMessageId =
            provenance.state === 'live'
              ? 'goalNew.apyNow'
              : provenance.state === 'mixed'
                ? 'goalNew.apyNowMixed'
                : 'goalNew.apyNowFixture';
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
                      id={apyMessageId}
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
