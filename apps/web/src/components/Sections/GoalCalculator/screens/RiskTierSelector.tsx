'use client';

import { ShieldCheck, TrendingUp, Zap } from '@/components/UI/LucideIcon';
import { RISK_TIERS } from '../goalCalculatorConstants';
import type { RiskTierIndex } from '../goalCalculatorTypes';
import styles from '../GoalCalculator.module.css';

const TIER_ICONS: readonly React.ReactNode[] = [
  <ShieldCheck key="careful" size={22} />,
  <TrendingUp key="moderate" size={22} />,
  <Zap key="aggressive" size={22} />,
] as const;

const TIER_KEYS = ['careful', 'moderate', 'aggressive'] as const;

interface RiskTierSelectorProps {
  readonly label: string;
  readonly tiers: { readonly careful: string; readonly moderate: string; readonly aggressive: string };
  readonly expectedReturnTemplate: string;
  readonly effectiveTierIndex: RiskTierIndex;
  readonly isOneMonth: boolean;
  readonly onSelect: (index: RiskTierIndex) => void;
}

export function RiskTierSelector({
  label,
  tiers,
  expectedReturnTemplate,
  effectiveTierIndex,
  isOneMonth,
  onSelect,
}: RiskTierSelectorProps) {
  return (
    <fieldset className={styles.fieldsetReset}>
      <legend className={styles.sliderLabel}>{label}</legend>
      <div className={styles.flexColumnSm}>
        {TIER_KEYS.map((key, index) => {
          const expectedReturnText = (expectedReturnTemplate ?? '{rate}% expected return')
            .replace('{rate}', String(Math.round(RISK_TIERS[index].expectedAPY * 100)));
          return (
            <button
              key={key}
              type="button"
              className={`${styles.tierCard} ${
                effectiveTierIndex === index ? styles.tierCardActive : ''
              } ${isOneMonth && index !== 0 ? styles.tierCardDisabled : ''}`}
              onClick={() => onSelect(index as RiskTierIndex)}
              aria-pressed={effectiveTierIndex === index}
              disabled={isOneMonth && index !== 0}
            >
              <span className={styles.tierCardIcon} aria-hidden="true">{TIER_ICONS[index]}</span>
              <div className={styles.tierCardContent}>
                <span className={styles.tierCardTitle}>{tiers[key]}</span>
                <span className={styles.tierCardSubtitle}>
                  {expectedReturnText}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
