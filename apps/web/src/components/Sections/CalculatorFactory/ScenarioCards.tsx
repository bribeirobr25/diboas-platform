'use client';

import { SCENARIO_KEYS, SCENARIO_RATES, type ScenarioKey } from './calculatorUtils';
import styles from './CalculatorFactory.module.css';

interface ScenarioCardsProps {
  isCashflow: boolean;
  computeResult: (rate: number) => number;
  computeGap: (rate: number) => number;
  formatCurrency: (value: number) => string;
  scenarioLabels: Record<ScenarioKey, string>;
}

export function ScenarioCards({
  isCashflow,
  computeResult,
  computeGap,
  formatCurrency,
  scenarioLabels,
}: ScenarioCardsProps) {
  return (
    <div className={styles.scenarioCards}>
      {SCENARIO_KEYS.map((key) => {
        const scenarioRate = SCENARIO_RATES[key];
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
              <span className={styles.scenarioCardBadge} aria-label="likely scenario">
                ← likely
              </span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
