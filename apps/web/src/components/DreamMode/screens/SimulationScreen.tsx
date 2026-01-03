'use client';

/**
 * Simulation Screen
 *
 * Fourth screen - animated growth visualization
 */

import React, { useEffect, useState, useRef } from 'react';
import { useIntl } from 'react-intl';
import { useDreamMode } from '../DreamModeProvider';
import { formatCurrency, getCurrencyLocale } from '@/lib/calculator';
import styles from './screens.module.css';

const ANIMATION_DURATION = 3000; // 3 seconds

export function SimulationScreen() {
  const intl = useIntl();
  const { state, dispatch, nextScreen } = useDreamMode();

  // Use total investment (initial + monthly contributions) as starting point
  const startingValue = state.result?.totalInvestment || state.input.initialAmount;
  const finalValue = state.result?.defiBalance || startingValue;

  const [displayValue, setDisplayValue] = useState(startingValue);
  const [progress, setProgress] = useState(0);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const t = (key: string) => intl.formatMessage({ id: `dreamMode.simulation.${key}` });

  const currencyLocale = getCurrencyLocale(state.input.currency);

  // Run animation
  useEffect(() => {
    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progressPercent = Math.min(elapsed / ANIMATION_DURATION, 1);

      // Easing function (ease-out-cubic)
      const eased = 1 - Math.pow(1 - progressPercent, 3);

      // Interpolate value
      const currentValue =
        startingValue + (finalValue - startingValue) * eased;

      setDisplayValue(currentValue);
      setProgress(progressPercent * 100);

      dispatch({ type: 'SET_ANIMATION_PROGRESS', progress: progressPercent * 100 });

      if (progressPercent < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        dispatch({ type: 'COMPLETE_SIMULATION' });
        // Auto-advance after a short delay
        setTimeout(() => {
          nextScreen();
        }, 500);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [finalValue, startingValue, dispatch, nextScreen]);

  return (
    <div className={`${styles.screen} ${styles.simulationScreen}`}>
      <div className={styles.content}>
        {/* Animated growth display */}
        <div className={styles.simulationDisplay}>
          <p className={styles.simulationLabel}>{t('growing')}</p>

          <div className={styles.valueDisplay}>
            <span className={styles.simulationValue}>
              {formatCurrency(displayValue, state.input.currency, currencyLocale)}
            </span>
          </div>

          {/* Progress ring */}
          <div className={styles.progressRing}>
            <svg viewBox="0 0 100 100">
              <circle
                className={styles.progressBackground}
                cx="50"
                cy="50"
                r="45"
                fill="none"
                strokeWidth="6"
              />
              <circle
                className={styles.progressForeground}
                cx="50"
                cy="50"
                r="45"
                fill="none"
                strokeWidth="6"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
                transform="rotate(-90 50 50)"
              />
            </svg>
            <div className={styles.progressText}>{Math.round(progress)}%</div>
          </div>

          {/* Time indicator */}
          <div className={styles.timeIndicator}>
            <ClockIcon />
            <span>{t(`timeframe.${state.input.timeframe}`)}</span>
          </div>
        </div>

        {/* Floating particles animation */}
        <div className={styles.particles}>
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className={styles.particle}
              style={{
                '--delay': `${i * 0.15}s`,
                '--x': `${Math.random() * 100}%`,
              } as React.CSSProperties}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ClockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
