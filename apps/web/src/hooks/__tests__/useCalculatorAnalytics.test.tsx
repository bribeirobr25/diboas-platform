/**
 * useCalculatorAnalytics — open/compute analytics for the standalone tools (A16/O-1)
 *
 * Validates:
 *   - calculator_opened fires once per mount with tool_key + locale
 *   - calculator_computation_completed fires debounced when signature is non-null
 *   - no computation event while signature is null (no result yet)
 *   - identical signatures de-duplicate; a changed signature re-fires
 *   - enabled:false short-circuits everything
 *
 * @vitest-environment happy-dom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCalculatorAnalytics } from '../useCalculatorAnalytics';

const trackMock = vi.fn();
vi.mock('@/lib/analytics', () => ({
  analyticsService: { track: (...args: unknown[]) => trackMock(...args) },
}));
vi.mock('@/lib/compound-interest', () => ({
  CALCULATOR_EVENTS: {
    OPENED: 'calculator_opened',
    COMPUTATION_COMPLETED: 'calculator_computation_completed',
  },
  DEBOUNCE_MS: { analytics: 500 },
}));

type TrackArg = { name: string; parameters?: Record<string, unknown> };
const callsNamed = (name: string) =>
  trackMock.mock.calls.filter(([e]) => (e as TrackArg).name === name);

describe('useCalculatorAnalytics', () => {
  beforeEach(() => {
    trackMock.mockClear();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('should fire calculator_opened once on mount with tool_key and locale', () => {
    renderHook(() => useCalculatorAnalytics('emergency-fund', 'en', 'sig-1'));
    const opened = callsNamed('calculator_opened');
    expect(opened).toHaveLength(1);
    expect((opened[0][0] as TrackArg).parameters).toMatchObject({
      tool_key: 'emergency-fund',
      locale: 'en',
    });
  });

  it('should fire calculator_computation_completed debounced when signature is non-null', () => {
    renderHook(() => useCalculatorAnalytics('card-fees', 'de', 'sig-1'));
    expect(callsNamed('calculator_computation_completed')).toHaveLength(0);
    vi.advanceTimersByTime(500);
    const computed = callsNamed('calculator_computation_completed');
    expect(computed).toHaveLength(1);
    expect((computed[0][0] as TrackArg).parameters).toMatchObject({
      tool_key: 'card-fees',
      locale: 'de',
    });
  });

  it('should NOT fire computation when signature is null (no result yet)', () => {
    renderHook(() => useCalculatorAnalytics('idle-cash', 'en', null));
    vi.advanceTimersByTime(1000);
    expect(callsNamed('calculator_computation_completed')).toHaveLength(0);
  });

  it('should de-duplicate identical signatures', () => {
    const { rerender } = renderHook(
      ({ sig }) => useCalculatorAnalytics('time-to-target', 'en', sig),
      { initialProps: { sig: 'same' } }
    );
    vi.advanceTimersByTime(500);
    rerender({ sig: 'same' });
    vi.advanceTimersByTime(500);
    expect(callsNamed('calculator_computation_completed')).toHaveLength(1);
  });

  it('should fire again when the signature changes', () => {
    const { rerender } = renderHook(
      ({ sig }) => useCalculatorAnalytics('time-to-target', 'en', sig),
      { initialProps: { sig: 'a' } }
    );
    vi.advanceTimersByTime(500);
    rerender({ sig: 'b' });
    vi.advanceTimersByTime(500);
    expect(callsNamed('calculator_computation_completed')).toHaveLength(2);
  });

  it('should not fire anything when disabled', () => {
    renderHook(() => useCalculatorAnalytics('card-fees', 'en', 'sig', false));
    vi.advanceTimersByTime(1000);
    expect(trackMock).not.toHaveBeenCalled();
  });
});
