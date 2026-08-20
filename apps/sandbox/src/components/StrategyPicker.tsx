'use client';

import { useEffect, useId, useState } from 'react';
import Decimal from 'decimal.js';
import { FormattedMessage, useIntl } from 'react-intl';
import {
  horizonBandForMonths,
  STRATEGY_CATALOG,
  strategiesForHorizon,
  strategyProvenance,
  type HorizonBand,
  type ProtocolApy,
  type RiskBand,
  type StrategyDef,
} from '@diboas/defi';
import { LucideIcon } from './LucideIcon';
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

const HORIZON_BANDS: HorizonBand[] = ['short', 'medium', 'long', 'wealth'];
const RISK_BANDS: RiskBand[] = ['stable', 'growth'];

/**
 * The strategy catalog (G5, §4.5; mockup 13) — EMBEDDED in the goal-funding
 * flow, never a standalone browsable route (board §3.5: a catalog detached
 * from a goal is strategy-shopping, and the goal-first framing IS the
 * never-advising posture).
 *
 * Guidance WITHOUT advising (R-3): the filters are OBJECTIVE dimensions the
 * user controls; within any filter the FULL matching list renders in stable
 * catalog order — no scoring, no "recommended" badge, no default selection,
 * no reordering. The horizon filter starts at the goal's own band (the goal
 * set it, not us) and the user may widen it.
 *
 * Two deliberate mockup-vs-doc deviations, both "build follows doc/code":
 * (1) the risk pill shows the RULED two bands (stable/growth), not the
 * mockup's Low/Medium/High — that third taxonomy exists nowhere in the data,
 * and inventing a risk tier is a compliance problem, not a style choice;
 * (2) the rate is the live blended POINT with its three-state provenance
 * label, not the mockup's range — an unsourced range would violate the
 * STRATEGY_RETURNS_ATTESTATION rule that every rendered figure has a row.
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
  const intl = useIntl();
  const fieldId = useId();
  const goalBand = horizonBandForMonths(horizonMonths);
  const [horizon, setHorizon] = useState<HorizonBand | 'any'>(goalBand);
  const [risk, setRisk] = useState<RiskBand | 'any'>('any');

  // DRY: the horizon rule (incl. the 'anytime' span) lives in ONE place —
  // the domain's `strategiesForHorizon`, which the E11 guard also pins. The
  // component only adds the risk dimension on top.
  const byHorizon = horizon === 'any' ? STRATEGY_CATALOG : strategiesForHorizon(horizon);
  const strategies = byHorizon.filter((s) => risk === 'any' || s.riskBand === risk);

  // E8: a selection that leaves the visible list must clear — approve can
  // never commit a strategy the user can no longer see (the exact interaction
  // the F6 disclosure invites). Derived from the filtered list, never guessed.
  const selectionVisible = selectedId !== null && strategies.some((s) => s.id === selectedId);
  useEffect(() => {
    if (selectedId !== null && !selectionVisible) onSelect('');
  }, [selectedId, selectionVisible, onSelect]);

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

      <div className={styles.filters}>
        <span className={styles.filter}>
          <span className={styles.filterIcon}>
            <LucideIcon name="calendar" size={16} />
          </span>
          <span className={styles.filterBody}>
            <label className={styles.filterLabel} htmlFor={`${fieldId}-horizon`}>
              <FormattedMessage id="catalogFilters.horizon" />
            </label>
            <select
              id={`${fieldId}-horizon`}
              className={styles.select}
              value={horizon}
              onChange={(e) => setHorizon(e.target.value as HorizonBand | 'any')}
            >
              <option value="any">{intl.formatMessage({ id: 'catalogFilters.any' })}</option>
              {HORIZON_BANDS.map((band) => (
                <option key={band} value={band}>
                  {intl.formatMessage({ id: `catalogFilters.horizonBand.${band}` })}
                </option>
              ))}
            </select>
          </span>
        </span>

        <span className={styles.filter}>
          <span className={styles.filterIcon}>
            <LucideIcon name="shield" size={16} />
          </span>
          <span className={styles.filterBody}>
            <label className={styles.filterLabel} htmlFor={`${fieldId}-risk`}>
              <FormattedMessage id="catalogFilters.risk" />
            </label>
            <select
              id={`${fieldId}-risk`}
              className={styles.select}
              value={risk}
              onChange={(e) => setRisk(e.target.value as RiskBand | 'any')}
            >
              <option value="any">{intl.formatMessage({ id: 'catalogFilters.any' })}</option>
              {RISK_BANDS.map((band) => (
                <option key={band} value={band}>
                  {intl.formatMessage({
                    id: band === 'stable' ? 'goalNew.riskStable' : 'goalNew.riskGrowth',
                  })}
                </option>
              ))}
            </select>
          </span>
        </span>
      </div>

      {/* Defensive: unreachable with today's catalog (the two 'anytime'
          strategies put a row in every filter combination), but D-8 states the
          catalog is not frozen — a filter UI must never render a silent void. */}
      {strategies.length === 0 ? (
        <p className={styles.empty}>
          <FormattedMessage id="catalogFilters.empty" />
        </p>
      ) : (
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
                  <span className={styles.rowIcon}>
                    <LucideIcon name={strategy.icon} size={20} />
                  </span>
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
                    {/* "Varies" as its own line (mockup 13): the rate is a
                        current reading, never a promise of what comes next. */}
                    <span className={styles.varies}>
                      <FormattedMessage id="catalogFilters.varies" />
                    </span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      )}

      <p className={styles.neverAdvises}>
        <LucideIcon name="info" size={14} />
        <FormattedMessage id="catalogFilters.neverAdvises" />
      </p>
    </fieldset>
  );
}
