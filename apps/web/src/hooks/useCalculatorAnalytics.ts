/**
 * useCalculatorAnalytics
 *
 * Shared open/compute analytics for the bespoke standalone calculator tools
 * (emergency-fund, idle-cash, inflation-impact, time-to-target,
 * currency-depreciation, card-fees, asset-history).
 *
 * The three `CalculatorDefault`-backed tools (compound-interest, retirement,
 * goal-savings) already fire these two events from inside that component; this
 * hook gives the seven standalones the SAME taxonomy (A16 / O-1) so the funnel
 * is uniform. It deliberately reuses `CALCULATOR_EVENTS.OPENED` +
 * `COMPUTATION_COMPLETED` (the only two of the six that fire anywhere today) and
 * adds a `tool_key` parameter so events are attributable per tool.
 *
 * Behaviour (mirrors CalculatorDefault):
 *   - `calculator_opened` fires once per mount.
 *   - `calculator_computation_completed` fires debounced (`DEBOUNCE_MS.analytics`)
 *     after interaction settles, de-duplicated on `signature` so an unchanged
 *     result doesn't re-fire.
 *
 * Consent + PII: every event flows through `analyticsService.track()`, which
 * early-returns unless `hasAnalyticsConsent()` and auto-enriches `locale`. Pass
 * only non-PII values in `signature` (it is NOT transmitted — it is a local
 * de-dupe key only; the emitted payload carries `tool_key` + `locale`).
 */

'use client';

import { useEffect, useRef } from 'react';
import { analyticsService } from '@/lib/analytics';
import { CALCULATOR_EVENTS, DEBOUNCE_MS } from '@/lib/compound-interest';
import type { ToolKey } from '@/lib/tools';

/**
 * @param toolKey   stable tool identifier emitted as `tool_key`
 * @param locale    current locale (emitted explicitly; also auto-enriched)
 * @param signature short fingerprint of the current inputs/result, or `null`
 *                  when there is no result yet. A change fires COMPUTATION_COMPLETED;
 *                  an identical repeat is suppressed. Never transmitted.
 * @param enabled   set false to disable (e.g. Storybook). Default true.
 */
export function useCalculatorAnalytics(
  toolKey: ToolKey,
  locale: string,
  signature: string | null,
  enabled = true
): void {
  // calculator_opened — once per mount.
  const openedFiredRef = useRef(false);
  useEffect(() => {
    if (!enabled || openedFiredRef.current) return;
    openedFiredRef.current = true;
    analyticsService.track({
      name: CALCULATOR_EVENTS.OPENED,
      parameters: { tool_key: toolKey, locale, timestamp: Date.now() },
    });
  }, [enabled, toolKey, locale]);

  // calculator_computation_completed — debounced + de-duped on signature.
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastReportedRef = useRef<string>('');
  useEffect(() => {
    if (!enabled || signature === null) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (signature === lastReportedRef.current) return;
      lastReportedRef.current = signature;
      analyticsService.track({
        name: CALCULATOR_EVENTS.COMPUTATION_COMPLETED,
        parameters: { tool_key: toolKey, locale, timestamp: Date.now() },
      });
    }, DEBOUNCE_MS.analytics);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [enabled, toolKey, locale, signature]);
}
