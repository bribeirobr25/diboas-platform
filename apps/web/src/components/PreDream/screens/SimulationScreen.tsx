'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import { usePreDream } from '../PreDreamProvider';
import styles from '../PreDream.module.css';

const ANIMATION_STEPS = 50;
const ANIMATION_INTERVAL_MS = 60;

function formatCurrency(amount: number, decimals = 0): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

export function SimulationScreen() {
  const intl = useTranslation();
  const { state, goToScreen } = usePreDream();

  const startingValue = state.initialAmount;
  const totalInvestment = state.result?.totalInvestment ?? startingValue;
  const finalValue = state.result?.defiBalance ?? startingValue;

  const [displayValue, setDisplayValue] = useState(startingValue);
  const completedRef = useRef(false);

  const t = (key: string) => intl.formatMessage({ id: `preDream.simulation.${key}` });
  const timeframeLabel = intl.formatMessage({
    id: `preDream.timeframe.options.${state.selectedTimeframe}.label`,
  });

  // Growth percentage: how much the displayed value has grown beyond total investment
  const growthPercent = totalInvestment > 0
    ? Math.max(0, ((displayValue - totalInvestment) / totalInvestment) * 100)
    : 0;

  // Animate value via setInterval (matching original linear interpolation)
  useEffect(() => {
    completedRef.current = false;
    const stepValue = (finalValue - startingValue) / ANIMATION_STEPS;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      const newValue = startingValue + stepValue * currentStep;
      setDisplayValue(Math.min(newValue, finalValue));

      if (currentStep >= ANIMATION_STEPS) {
        clearInterval(interval);
        if (!completedRef.current) {
          completedRef.current = true;
          setTimeout(() => {
            goToScreen('results');
          }, 500);
        }
      }
    }, ANIMATION_INTERVAL_MS);

    return () => {
      clearInterval(interval);
    };
  }, [finalValue, startingValue, goToScreen]);

  return (
    <div className={`${styles.screenCenter} ${styles.simulationScreen}`}>
      <div className={styles.simulationContent}>
        <div className={styles.simulationWatermark}>{t('watermark')}</div>

        <p className={styles.simulationLabel}>{t('title')}</p>

        <div className={styles.valueDisplay}>
          <span className={styles.simulationValue}>
            {formatCurrency(displayValue)}
          </span>
        </div>

        {/* Indicator badges row */}
        <div className={styles.indicatorRow}>
          <div className={styles.growthBadge}>
            <TrendUpIcon />
            <span>{growthPercent.toFixed(0)}%</span>
          </div>
          <div className={styles.timeBadge}>
            <ClockIcon />
            <span>{timeframeLabel}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function TrendUpIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
