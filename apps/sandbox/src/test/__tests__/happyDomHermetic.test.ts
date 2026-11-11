/**
 * Component tests never touch the network or run page scripts (happy-dom 21, 2026-11-11).
 *
 * The vitest config sets `enableIframePageLoading: false` (the explicit form of what happy-dom 21
 * defaults to; the old `disableIframePageLoading` is deprecated). This reads the settings the test
 * window ACTUALLY runs with, so a config edit or a future happy-dom default that turns iframe
 * loading or script evaluation back on fails here (an iframe `src` fetched a real page from unit
 * tests once, Phase-3 audit 2026-07-16).
 *
 * @vitest-environment happy-dom
 */
import { describe, expect, it } from 'vitest';

interface HappyDomWindow {
  happyDOM: {
    settings: { enableIframePageLoading?: boolean; enableJavaScriptEvaluation?: boolean };
  };
}

describe('the happy-dom test window', () => {
  it('should load no iframe page and evaluate no page script when a component test runs', () => {
    const { settings } = (window as unknown as HappyDomWindow).happyDOM;
    expect(settings.enableIframePageLoading).toBe(false);
    expect(settings.enableJavaScriptEvaluation).not.toBe(true);
  });
});
