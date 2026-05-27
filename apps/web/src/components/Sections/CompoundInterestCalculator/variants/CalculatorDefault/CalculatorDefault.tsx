'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import { analyticsService } from '@/lib/analytics';
import {
  calculateCompoundProjection,
  calculateCompoundProjectionHedged,
  calculateCompoundProjectionPathDependent,
  CALCULATOR_EVENTS,
  DEBOUNCE_MS,
  LESSON_DEFAULT_INPUT_BY_LOCALE,
  MAX_RETROSPECTIVE_YEARS,
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
  /**
   * Phase D.3 (2026-05-16): opt-in retrospective DCA mode for /tools/goal-savings.
   * When `true`, surfaces a "Forward / Retrospective" mode toggle. Toggling on
   * activates `calculateCompoundProjectionPathDependent` (third named engine —
   * separate function per R1 discipline; NOT a `pathDependent: boolean` flag).
   * Default `false`: tool stays smoothed-hedge only.
   */
  enablePathDependent?: boolean;
  /**
   * C6 close (TOOLS_41_DEFECTS_FIX_PLAN.md §4.5, 2026-05-26): see factory prop.
   */
  recurringSliderMax?: number;
}

export function CalculatorDefault({
  initialInput,
  enableAnalytics = true,
  reducedMotion,
  className,
  engine = 'lesson',
  enablePathDependent = false,
  recurringSliderMax,
}: CalculatorDefaultProps) {
  const intl = useTranslation();
  const locale: SupportedLocale = isValidLocale(intl.locale) ? intl.locale : 'en';

  const [input, setInput] = useState<CalculatorInput>(
    () => initialInput ?? { ...LESSON_DEFAULT_INPUT_BY_LOCALE[locale], locale }
  );
  const [retrospective, setRetrospective] = useState(false);

  // C7 fix (2026-05-25): clamp `years` to MAX_RETROSPECTIVE_YEARS at the
  // state-setter level whenever retrospective mode is active. This is the
  // single chokepoint every mutation path passes through — the slider, future
  // preset buttons, programmatic test updates. The slider's `max` attribute
  // (via `maxYearsOverride` prop below) is the visible affordance; this
  // setter is the correctness guarantee. Per CTO-board v1.1 M1.
  const setInputClamped = useCallback(
    (next: CalculatorInput | ((prev: CalculatorInput) => CalculatorInput)) => {
      setInput((prev) => {
        const candidate = typeof next === 'function' ? next(prev) : next;
        if (retrospective && candidate.years > MAX_RETROSPECTIVE_YEARS) {
          return { ...candidate, years: MAX_RETROSPECTIVE_YEARS };
        }
        return candidate;
      });
    },
    [retrospective]
  );

  // Event handler — toggling ON clamps years to the bucket coverage cap
  // (path-dependent engine throws if years > 16). Belt-and-braces with the
  // state-setter clamp above; this handles the case where retrospective flips
  // on with years already > 16.
  const handleSetRetrospective = (value: boolean) => {
    setRetrospective(value);
    if (value && input.years > MAX_RETROSPECTIVE_YEARS) {
      setInput((prev) => ({ ...prev, years: MAX_RETROSPECTIVE_YEARS }));
    }
  };

  // Live, synchronous compute for the chart. useMemo keeps this O(1) on each
  // render; the underlying formula is fast enough that debouncing the COMPUTE
  // would add latency without saving CPU.
  const liveOutput: CalculatorOutput = useMemo(() => {
    if (engine === 'tool' && enablePathDependent && retrospective) {
      return calculateCompoundProjectionPathDependent(input);
    }
    if (engine === 'tool') {
      return calculateCompoundProjectionHedged(input);
    }
    return calculateCompoundProjection(input);
  }, [input, engine, enablePathDependent, retrospective]);

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
  const calibrationNote =
    engine === 'lesson'
      ? intl.formatMessage({ id: 'learn-compound-interest.calculator.calibrationNote' })
      : '';

  const modeForwardLabel = intl.formatMessage({ id: 'tools-shared.calculatorMode.forward' });
  const modeRetrospectiveLabel = intl.formatMessage({
    id: 'tools-shared.calculatorMode.retrospective',
  });
  const modeAriaLabel = intl.formatMessage({ id: 'tools-shared.calculatorMode.ariaLabel' });
  const modeRetrospectiveHint = intl.formatMessage(
    { id: 'tools-shared.calculatorMode.retrospectiveHint' },
    { years: MAX_RETROSPECTIVE_YEARS }
  );

  return (
    <div className={`${styles.calculator} ${className ?? ''}`}>
      {enablePathDependent && (
        <>
          <div className={styles.modeToggle} role="tablist" aria-label={modeAriaLabel}>
            <button
              type="button"
              role="tab"
              aria-selected={!retrospective}
              className={`${styles.modeButton} ${!retrospective ? styles.modeButtonActive : ''}`}
              onClick={() => handleSetRetrospective(false)}
            >
              {modeForwardLabel}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={retrospective}
              className={`${styles.modeButton} ${retrospective ? styles.modeButtonActive : ''}`}
              onClick={() => handleSetRetrospective(true)}
            >
              {modeRetrospectiveLabel}
            </button>
          </div>
          {retrospective && <p className={styles.modeHint}>{modeRetrospectiveHint}</p>}
        </>
      )}
      <CalculatorInputs
        value={input}
        onChange={setInputClamped}
        maxYearsOverride={retrospective ? MAX_RETROSPECTIVE_YEARS : undefined}
        recurringSliderMax={recurringSliderMax}
      />
      <CalculatorOutputs output={displayedOutput} reducedMotion={reducedMotion} engine={engine} />
      {calibrationNote && <p className={styles.calibrationNote}>{calibrationNote}</p>}
      <p className={styles.disclaimer}>
        {disclaimer}{' '}
        <span className={styles.lastUpdated}>
          {lastUpdatedLabel} {lastUpdatedDate}
        </span>
      </p>
    </div>
  );
}
