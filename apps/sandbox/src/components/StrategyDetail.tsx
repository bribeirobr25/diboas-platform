'use client';

import { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Button } from './Button';
import { Card } from './Card';
import { LucideIcon } from './LucideIcon';
import { ModeChip } from './ModeChip';
import { SegmentedToggle } from './SegmentedToggle';
import { Sparkline } from './Sparkline';
import styles from './StrategyDetail.module.css';

type View = 'simple' | 'detailed';

/**
 * StrategyDetail — the dual-view showcase (Phase B; references
 * `4-goal-strategy-2views-diBoaS` (Simple) + the corrected traditional view
 * (Detailed)). SANDBOX_DESIGN_LANGUAGE_DUAL_VIEW made real:
 *
 * Simple (DEFAULT) leads ① what it is → ② how it's doing (friendly now-vs-past,
 * NOT an APY hero; Sparkline shows real dips) → ③ cost / can-I-leave, with a hero
 * band. Detailed = the traditional view (factual APY not a hero pitch, honest
 * chart, correct protocols Sky/Aave/Compound, exit terms). Toggle preserved.
 *
 * SEAM: `series`, `apyLow/High`, `protocols` come from the strategy example here;
 * real data is the packages/defi catalog + the analytics provider (deferred).
 * `onPutToWork` fires the entry seam (entry is FREE — no fee here; the 0.39% is
 * the EXIT fee, shown as "what it costs later").
 */
export function StrategyDetail({
  series,
  apyLow,
  apyHigh,
  protocols,
  onPutToWork,
}: {
  series: number[];
  apyLow: string;
  apyHigh: string;
  protocols: string[];
  onPutToWork?: () => void;
}) {
  const [view, setView] = useState<View>('simple');

  return (
    <section className={styles.wrap} aria-labelledby="strategy-title">
      <header className={styles.head}>
        <ModeChip />
        <SegmentedToggle<View>
          ariaLabel="View"
          value={view}
          onChange={setView}
          segments={[
            { id: 'simple', label: <FormattedMessage id="strategyDetail.simple" /> },
            { id: 'detailed', label: <FormattedMessage id="strategyDetail.detailed" /> },
          ]}
        />
      </header>

      {/* Hero band — calm brand wash placeholder; the final coastal illustration
          (varies by strategy character) drops in here. */}
      <div className={styles.hero}>
        <h1 id="strategy-title" className={styles.heroTitle}>
          <FormattedMessage id="strategyExample.name" />
        </h1>
        <p className={styles.heroDesc}>
          <FormattedMessage id="strategyExample.description" />
        </p>
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
                <FormattedMessage id="strategyExample.whatItIs" />
              </p>
            </div>
          </Card>

          {/* ② how it's doing — friendly now-vs-past (Sparkline shows dips) */}
          <Card className={styles.behaveCard}>
            <p className={styles.rowLabel}>
              <FormattedMessage id="strategyDetail.howItsDoing" />
            </p>
            <p className={styles.behaveLead}>
              <FormattedMessage id="strategyExample.howItsDoing" />
            </p>
            <Sparkline series={series} />
            <p className={styles.caveat}>
              <LucideIcon name="shield" size={14} />
              <FormattedMessage id="strategyDetail.caveat" />
            </p>
          </Card>

          {/* ③ cost / can-I-leave */}
          <Card className={styles.rowCard}>
            <span className={styles.rowIcon}>
              <LucideIcon name="check" size={18} />
            </span>
            <div>
              <p className={styles.rowLabel}>
                <FormattedMessage id="strategyDetail.whatItCosts" />
              </p>
              <p className={styles.rowBody}>
                <FormattedMessage id="strategyDetail.costLine" />
              </p>
            </div>
          </Card>
        </div>
      ) : (
        <div className={styles.detailed}>
          {/* Factual APY — NOT a hero pitch */}
          <div className={styles.apyRow}>
            <span className={styles.apyLabel}>
              <FormattedMessage id="strategyDetail.currentApy" />
            </span>
            <span className={styles.apyValue}>
              {apyLow} – {apyHigh}
            </span>
            <span className={styles.apyVaries}>
              <FormattedMessage id="strategyDetail.varies" />
            </span>
          </div>
          <Sparkline series={series} />

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
              0.39%
              <span className={styles.exitMin}>
                {' '}
                <FormattedMessage id="strategyDetail.minExit" />
              </span>
            </span>
          </div>

          <h2 className={styles.detailHead}>
            <FormattedMessage id="strategyDetail.underlyingProtocols" />
          </h2>
          <div className={styles.protocols}>
            {protocols.map((p) => (
              <span key={p} className={styles.protocolChip}>
                {p}
              </span>
            ))}
          </div>
          <p className={styles.protocolsNote}>
            <LucideIcon name="shield" size={14} />
            <FormattedMessage id="strategyDetail.protocolsNote" />
          </p>
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
