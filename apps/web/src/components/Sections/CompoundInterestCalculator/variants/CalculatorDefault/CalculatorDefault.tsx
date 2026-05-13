'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import { analyticsService } from '@/lib/analytics';
import {
  calculateCompoundProjection,
  calculateCompoundProjectionHedged,
  CALCULATOR_EVENTS,
  DEBOUNCE_MS,
  DEFAULT_INPUT_BY_LOCALE,
  type CalculatorInput,
  type CalculatorOutput,
} from '@/lib/compound-interest';
import { isValidLocale, type SupportedLocale } from '@diboas/i18n/config';
import { CalculatorInputs } from './CalculatorInputs';
import { CalculatorOutputs } from './CalculatorOutputs';
import styles from './CalculatorDefault.module.css';

interface CalculatorDefaultProps {
  /** Optional override for the initial state — useful for Storybook. */
  initialInput?: CalculatorInput;
  enableAnalytics?: boolean;
  reducedMotion?: boolean;
  className?: string;
  /**
   * Which engine variant to use (Phase-7 Q7(a)).
   *   'lesson' (default) — non-hedged, for `/learn/compound-interest`.
   *   'tool' — currency-hedged for non-USD locales, for `/tools/*` pages.
   * The two engines are intentionally separate at the lib layer per R1 discipline.
   */
  engine?: 'lesson' | 'tool';
}

export function CalculatorDefault({
  initialInput,
  enableAnalytics = true,
  reducedMotion,
  className,
  engine = 'lesson',
}: CalculatorDefaultProps) {
  const intl = useTranslation();
  const locale: SupportedLocale = isValidLocale(intl.locale) ? intl.locale : 'en';

  const [input, setInput] = useState<CalculatorInput>(
    () => initialInput ?? { ...DEFAULT_INPUT_BY_LOCALE[locale], locale },
  );

  // Live, synchronous compute for the chart. useMemo keeps this O(1) on each
  // render; the underlying formula is fast enough that debouncing the COMPUTE
  // would add latency without saving CPU.
  const liveOutput: CalculatorOutput = useMemo(
    () =>
      engine === 'tool'
        ? calculateCompoundProjectionHedged(input)
        : calculateCompoundProjection(input),
    [input, engine],
  );

  // Debounced *display* state — what the UI actually shows. Smooths out
  // slider drag without holding back the chart's underlying data.
  const [displayedOutput, setDisplayedOutput] = useState<CalculatorOutput>(liveOutput);

  // Debounced display update
  useEffect(() => {
    const t = setTimeout(() => setDisplayedOutput(liveOutput), DEBOUNCE_MS.display);
    return () => clearTimeout(t);
  }, [liveOutput]);

  // Debounced analytics — fires only after user has stopped interacting
  const analyticsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastReportedRef = useRef<string>('');
  useEffect(() => {
    if (!enableAnalytics) return;
    if (analyticsTimer.current) clearTimeout(analyticsTimer.current);
    analyticsTimer.current = setTimeout(() => {
      const fingerprint = `${input.amount}:${input.cadence}:${input.years}:${input.locale}`;
      if (fingerprint === lastReportedRef.current) return;
      lastReportedRef.current = fingerprint;
      analyticsService.track({
        name: CALCULATOR_EVENTS.COMPUTATION_COMPLETED,
        parameters: {
          locale: input.locale,
          amount: input.amount,
          cadence: input.cadence,
          years: input.years,
          highlightedScenario: liveOutput.highlightedScenario,
          timestamp: Date.now(),
        },
      });
    }, DEBOUNCE_MS.analytics);
    return () => {
      if (analyticsTimer.current) clearTimeout(analyticsTimer.current);
    };
  }, [enableAnalytics, input, liveOutput.highlightedScenario]);

  // Fire OPENED once on mount
  const openedFiredRef = useRef(false);
  useEffect(() => {
    if (!enableAnalytics || openedFiredRef.current) return;
    openedFiredRef.current = true;
    analyticsService.track({
      name: CALCULATOR_EVENTS.OPENED,
      parameters: { locale: input.locale, timestamp: Date.now() },
    });
  }, [enableAnalytics, input.locale]);

  const disclaimer = intl.formatMessage({ id: 'common.disclaimers.educationalProjection' });
  const lastUpdatedLabel = intl.formatMessage({
    id: 'learn-compound-interest.lesson.lastUpdated.label',
  });
  const lastUpdatedDate = intl.formatMessage({
    id: 'learn-compound-interest.lesson.lastUpdated.date',
  });

  return (
    <div className={`${styles.calculator} ${className ?? ''}`}>
      <CalculatorInputs value={input} onChange={setInput} />
      <CalculatorOutputs output={displayedOutput} reducedMotion={reducedMotion} engine={engine} />
      <p className={styles.disclaimer}>
        {disclaimer}{' '}
        <span className={styles.lastUpdated}>
          {lastUpdatedLabel} {lastUpdatedDate}
        </span>
      </p>
    </div>
  );
}
