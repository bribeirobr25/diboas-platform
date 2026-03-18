'use client';

import { useEffect, useState } from 'react';
import { useGoalCalculator } from '../GoalCalculatorProvider';
import type { GoalCalculatorConfig } from '../goalCalculatorTypes';
import styles from '../GoalCalculator.module.css';

const ANIMATION_DURATION_MS = 2000;
const AUTO_ADVANCE_DELAY_MS = 500;
const RING_RADIUS = 45;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

interface SimulationScreenProps {
  readonly translated: GoalCalculatorConfig;
  readonly formatCurrency: (value: number) => string;
}

export function SimulationScreen({ translated, formatCurrency }: SimulationScreenProps) {
  const { state, finishSimulation } = useGoalCalculator();

  const startValue = 0;
  const endValue = state.result?.expected ?? 0;

  // Check reduced motion preference before mounting animation
  const prefersReducedMotion =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

  const [displayValue, setDisplayValue] = useState(() =>
    prefersReducedMotion ? endValue : startValue,
  );
  const [progress, setProgress] = useState(() =>
    prefersReducedMotion ? 100 : 0,
  );

  useEffect(() => {
    if (prefersReducedMotion) {
      finishSimulation();
      return;
    }

    let rafId: number;
    let startTime = 0;
    let autoAdvanceTimeout: ReturnType<typeof setTimeout>;

    function tick(timestamp: number) {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const rawProgress = Math.min(elapsed / ANIMATION_DURATION_MS, 1);
      const eased = easeOutCubic(rawProgress);

      setDisplayValue(startValue + (endValue - startValue) * eased);
      setProgress(rawProgress * 100);

      if (rawProgress < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        autoAdvanceTimeout = setTimeout(() => {
          finishSimulation();
        }, AUTO_ADVANCE_DELAY_MS);
      }
    }

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(autoAdvanceTimeout);
    };
  }, [endValue, startValue, prefersReducedMotion, finishSimulation]);

  const dashOffset = RING_CIRCUMFERENCE * (1 - progress / 100);

  const activeGoal = state.activeGoal || 'christmas';
  const goalLabel = translated.content.tabs[activeGoal as keyof typeof translated.content.tabs] ?? activeGoal;
  const simulationText = (translated.content.simulationLabel ?? 'Calculating your {goal} plan...')
    .replace('{goal}', goalLabel);

  return (
    <div className={styles.simulationScreen}>
      <p className={styles.simulationLabel}>
        {simulationText}
      </p>

      <span className={styles.simulationValue}>
        {formatCurrency(Math.round(displayValue))}
      </span>

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
        <span className={styles.progressText}>
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  );
}
