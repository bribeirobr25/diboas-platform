/**
 * useResultShare — the Money Tools result-moment share (Phase 3).
 *
 * Validates:
 *   - native Web Share path fires share_initiated + share_completed (platform native)
 *   - a dismissed native sheet (AbortError) fires initiated but NOT completed
 *   - no Web Share API → copy fallback: clipboard written, copied flips true,
 *     share_initiated + share_completed fire (platform copy)
 *   - enabled:false short-circuits all analytics
 *   - no PII in the tracked parameters (only tool_key / platform / locale)
 *
 * @vitest-environment happy-dom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useResultShare } from '../useResultShare';

const trackMock = vi.fn();
const copyMock = vi.fn().mockResolvedValue(true);

vi.mock('@/config/env', () => ({ APP_URL: 'https://diboas.com' }));
vi.mock('@/lib/analytics', () => ({
  analyticsService: { track: (...args: unknown[]) => trackMock(...args) },
}));
vi.mock('@/lib/og/share', () => ({
  getToolResultSharePageUrl: () => 'https://diboas.com/en/share?type=tool-result',
}));
vi.mock('@/lib/share/platformUrls', () => ({
  copyToClipboard: (...args: unknown[]) => copyMock(...args),
}));
vi.mock('@/lib/monitoring/Logger', () => ({ Logger: { warn: vi.fn() } }));

type TrackArg = { name: string; parameters?: Record<string, unknown> };
const callsNamed = (name: string) =>
  trackMock.mock.calls.filter(([e]) => (e as TrackArg).name === name);

const baseInput = {
  toolKey: 'currency-depreciation' as const,
  value: 16105,
  currency: 'BRL',
  years: 5,
  locale: 'pt-BR',
  shareText: 'In 5 years my BRL could hold R$16K.',
  shareTitle: 'My diBoaS result',
};

function setNavigatorShare(fn: ((data: ShareData) => Promise<void>) | undefined) {
  Object.defineProperty(navigator, 'share', { value: fn, configurable: true, writable: true });
}

describe('useResultShare', () => {
  beforeEach(() => {
    trackMock.mockClear();
    copyMock.mockClear();
  });
  afterEach(() => {
    setNavigatorShare(undefined);
  });

  it('should use the Web Share API and fire initiated + completed when available', async () => {
    const shareSpy = vi.fn().mockResolvedValue(undefined);
    setNavigatorShare(shareSpy);

    const { result } = renderHook(() => useResultShare(baseInput));
    await act(async () => {
      await result.current.share();
    });

    expect(shareSpy).toHaveBeenCalledWith({
      title: 'My diBoaS result',
      text: baseInput.shareText,
      url: 'https://diboas.com/en/share?type=tool-result',
    });
    expect(callsNamed('share_initiated')).toHaveLength(1);
    expect(callsNamed('share_completed')).toHaveLength(1);
    expect((callsNamed('share_completed')[0][0] as TrackArg).parameters).toMatchObject({
      tool_key: 'currency-depreciation',
      platform: 'native',
      locale: 'pt-BR',
    });
  });

  it('should fire initiated but NOT completed when the native sheet is dismissed', async () => {
    const abort = new DOMException('cancelled', 'AbortError');
    setNavigatorShare(vi.fn().mockRejectedValue(abort));

    const { result } = renderHook(() => useResultShare(baseInput));
    await act(async () => {
      await result.current.share();
    });

    expect(callsNamed('share_initiated')).toHaveLength(1);
    expect(callsNamed('share_completed')).toHaveLength(0);
    expect(copyMock).not.toHaveBeenCalled();
  });

  it('should copy to clipboard and flip copied when no Web Share API exists', async () => {
    setNavigatorShare(undefined);

    const { result } = renderHook(() => useResultShare(baseInput));
    await act(async () => {
      await result.current.share();
    });

    expect(copyMock).toHaveBeenCalledWith(
      `${baseInput.shareText} https://diboas.com/en/share?type=tool-result`
    );
    await waitFor(() => expect(result.current.copied).toBe(true));
    expect((callsNamed('share_completed')[0][0] as TrackArg).parameters).toMatchObject({
      platform: 'copy',
    });
  });

  it('should not track anything when disabled', async () => {
    setNavigatorShare(vi.fn().mockResolvedValue(undefined));

    const { result } = renderHook(() => useResultShare({ ...baseInput, enabled: false }));
    await act(async () => {
      await result.current.share();
    });

    expect(trackMock).not.toHaveBeenCalled();
  });

  it('should never include PII in tracked parameters', async () => {
    setNavigatorShare(vi.fn().mockResolvedValue(undefined));

    const { result } = renderHook(() => useResultShare(baseInput));
    await act(async () => {
      await result.current.share();
    });

    for (const [event] of trackMock.mock.calls) {
      const params = (event as TrackArg).parameters ?? {};
      expect(Object.keys(params).sort()).toEqual(['locale', 'platform', 'tool_key']);
    }
  });
});
