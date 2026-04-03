'use client';

import { SCENARIO_KEYS, type ScenarioKey } from './calculatorUtils';
import styles from './CalculatorFactory.module.css';

interface ScenarioCardsProps {
  isCashflow: boolean;
  scenarioRates: Record<ScenarioKey, number>;
  computeResult: (rate: number) => number;
  computeGap: (rate: number) => number;
  formatCurrency: (value: number) => string;
  scenarioLabels: Record<ScenarioKey, string>;
  likelyBadge?: string;
}

export function ScenarioCards({
  isCashflow,
  scenarioRates,
  computeResult,
  computeGap,
  formatCurrency,
  scenarioLabels,
  likelyBadge = '← likely',
}: ScenarioCardsProps) {
  return (
    <div className={styles.scenarioCards}>
      {SCENARIO_KEYS.map((key) => {
        const scenarioRate = scenarioRates[key];
        const result = computeResult(scenarioRate);
        const gap = computeGap(scenarioRate);
        const isHighlighted = key === 'historical';

        return (
          <div
            key={key}
            className={`${styles.scenarioCard} ${isHighlighted ? styles.scenarioCardHighlight : ''}`}
          >
            <span className={styles.scenarioCardLabel}>
              {scenarioLabels[key]}
            </span>
            <span className={styles.scenarioCardValue}>
              {formatCurrency(result)}
            </span>
            {!isCashflow ? (
              <span className={styles.scenarioCardGap}>
                +{formatCurrency(gap)}
              </span>
            ) : null}
            {isHighlighted ? (
              <span className={styles.scenarioCardBadge} aria-hidden="true">
                {likelyBadge}
              </span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
