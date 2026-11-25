/**
 * ATTR-3 · the capture hook (market clean-up W-D1, spec §3.1): on first client load it removes the
 * two legacy keys and passes the URL's campaign values to the hold. Nothing is written to the
 * device; nothing happens during render; StrictMode's double mount keeps one value.
 *
 * @vitest-environment happy-dom
 */
import { StrictMode, createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useUtmCapture } from '../useUtmCapture';
import { getNoteForSignup } from '@/lib/analytics/utmAttribution';

const HOLD = Symbol.for('diboas.attributionHold');
const removed: string[] = [];
const written: string[] = [];

function visit(search: string) {
  window.history.replaceState(null, '', `/en${search}`);
}

beforeEach(() => {
  delete (globalThis as Record<symbol, unknown>)[HOLD];
  removed.length = 0;
  written.length = 0;
  vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(function (key: string) {
    removed.push(key);
  });
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (key: string) {
    written.push(key);
  });
});
afterEach(() => {
  vi.restoreAllMocks();
  visit('');
});

describe('useUtmCapture', () => {
  it('should hold the shaped first-touch values and store nothing but the two removals', () => {
    visit('?utm_source=Newsletter&utm_medium=email&t=SECRET');
    renderHook(() => useUtmCapture());
    expect(getNoteForSignup().utm).toEqual({ utm_source: 'newsletter', utm_medium: 'email' });
    expect(removed).toEqual(['diboas-utm-params', 'diboas-cta-source']);
    expect(written).toEqual([]);
  });

  it('should keep one value through a StrictMode double mount and a locale-switch remount', () => {
    visit('?utm_source=a');
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(StrictMode, null, children);
    renderHook(() => useUtmCapture(), { wrapper });
    visit('?utm_source=b');
    renderHook(() => useUtmCapture());
    expect(getNoteForSignup().utm).toEqual({ utm_source: 'a' });
  });

  it('should write nothing during render (a server render carries no value over)', () => {
    function Capture() {
      useUtmCapture();
      return null;
    }
    visit('?utm_source=one');
    renderToString(createElement(Capture));
    visit('?utm_source=two');
    renderToString(createElement(Capture));
    expect((globalThis as Record<symbol, unknown>)[HOLD]).toBeUndefined();
    expect(removed).toEqual([]);
  });
});
