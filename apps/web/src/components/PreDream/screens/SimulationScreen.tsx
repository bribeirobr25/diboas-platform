'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import { usePreDream } from '../PreDreamProvider';
import { formatCurrency } from '@/lib/pre-dream';
import { useLocale } from '@/components/Providers';
import styles from '../PreDream.module.css';

const ANIMATION_DURATION_MS = 3000;
const AUTO_ADVANCE_DELAY_MS = 500;
const PARTICLE_COUNT = 20;
const RING_RADIUS = 45;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

/** Ease-out cubic: decelerates smoothly */
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function SimulationScreen() {
  const intl = useTranslation();
  const { state, goToScreen } = usePreDream();
  const { locale } = useLocale();

  const startingValue = state.result?.totalInvestment ?? state.initialAmount;
  const finalValue = state.result?.defiBalance ?? startingValue;

  const [displayValue, setDisplayValue] = useState(startingValue);
  const [progress, setProgress] = useState(0);
  const animFrameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const completedRef = useRef(false);
  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout>>();

  const t = (key: string) => intl.formatMessage({ id: `preDream.simulation.${key}` });
  const timeframeLabel = intl.formatMessage({
    id: `preDream.timeframe.options.${state.selectedTimeframe}.label`,
  });

  // Pre-compute random X positions for particles. The seeded values are
  // captured ONCE via useMemo with [] deps so they're stable across re-renders;
  // the randomness is intentional (visual variety) and runs in a memo callback
  // not in render.
  const particlePositions = useMemo(
    // eslint-disable-next-line react-hooks/purity
    () => Array.from({ length: PARTICLE_COUNT }, () => Math.random() * 100),
    []
  );
  const particleDelays = useMemo(
    // eslint-disable-next-line react-hooks/purity
    () => Array.from({ length: PARTICLE_COUNT }, () => Math.random() * 4),
    []
  );

  // requestAnimationFrame loop with ease-out-cubic
  useEffect(() => {
    completedRef.current = false;
    startTimeRef.current = 0;

    function tick(timestamp: number) {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const rawProgress = Math.min(elapsed / ANIMATION_DURATION_MS, 1);
      const eased = easeOutCubic(rawProgress);

      const value = startingValue + (finalValue - startingValue) * eased;
      setDisplayValue(value);
      setProgress(rawProgress * 100);

      if (rawProgress < 1) {
        animFrameRef.current = requestAnimationFrame(tick);
      } else {
        // Animation complete — auto-advance after delay
        if (!completedRef.current) {
          completedRef.current = true;
          autoAdvanceRef.current = setTimeout(() => {
            goToScreen('results');
          }, AUTO_ADVANCE_DELAY_MS);
        }
      }
    }

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      clearTimeout(autoAdvanceRef.current);
    };
  }, [finalValue, startingValue, goToScreen]);

  const dashOffset = RING_CIRCUMFERENCE * (1 - progress / 100);

  return (
    <div className={`${styles.screenCenter} ${styles.simulationScreen}`}>
      {/* Floating particles */}
      <div className={styles.particles}>
        {/* Stable: particlePositions is a fixed-length seeded array, never
         * reorders. Index is the stable identity. */}
        {particlePositions.map((x, i) => (
          <div
            // eslint-disable-next-line react/no-array-index-key
            key={i}
            className={styles.particle}
            style={
              {
                '--x': `${x}%`,
                '--delay': `${particleDelays[i]}s`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      <div className={styles.simulationContent}>
        <div className={styles.simulationWatermark}>{t('watermark')}</div>

        <p className={styles.simulationLabel}>{t('title')}</p>

        <div className={styles.valueDisplay}>
          <span className={styles.simulationValue}>{formatCurrency(displayValue, 2, locale)}</span>
        </div>

        {/* Progress ring */}
        <div className={styles.progressRing}>
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle
              className={styles.progressBackground}
              cx="60"
              cy="60"
              r={RING_RADIUS}
              fill="none"
              strokeWidth="6"
            />
            <circle
              className={styles.progressForeground}
              cx="60"
              cy="60"
              r={RING_RADIUS}
              fill="none"
              strokeWidth="6"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              transform="rotate(-90 60 60)"
            />
          </svg>
          <span className={styles.progressText}>{Math.round(progress)}%</span>
        </div>

        {/* Time indicator */}
        <div className={styles.timeIndicator}>
          <ClockIcon />
          <span>{timeframeLabel}</span>
        </div>
      </div>
    </div>
  );
}

function ClockIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
