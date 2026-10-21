/**
 * Two review-gate findings, fixed 2026-10-21 (founder decision):
 *
 *  (b) The market views pass no page data to a client provider. The mock SDK's
 *      provider received every view's data as a client prop (~19 KB on the
 *      Bitcoin view, ~38 KB on the Backdrop view, measured against production)
 *      and nothing read it.
 *  (c) The five badge/card modules size text, spacing and radii with design
 *      tokens, never literals (CLAUDE.md design-token rule; `em` and the
 *      editorial `clamp()` fluid sizes are the documented exceptions).
 */
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = path.resolve(__dirname, '../../..');
const read = (rel: string) => fs.readFileSync(path.join(SRC, rel), 'utf8');

describe('(b) no client data provider on the market views', () => {
  it('should not wrap the views in a provider that takes the page data', () => {
    const shell = read('app/[locale]/(landing)/market/MarketViewShell.tsx');
    expect(shell).not.toMatch(/initialData=\{/);
    expect(shell).not.toMatch(/AnalyticsProvider/);
    expect(fs.existsSync(path.join(SRC, 'lib/analytics-sdk/mock-client.tsx'))).toBe(false);
  });
});

describe('(c) the badge/card modules use tokens for text, spacing and radii', () => {
  const MODULES = [
    'SignalCard/SignalCard.module.css',
    'DataFreshnessBadge/DataFreshnessBadge.module.css',
    'RegimeScore/RegimeScore.module.css',
    'ConfidenceBadge/ConfidenceBadge.module.css',
    'RegimeLabel/RegimeLabel.module.css',
  ];
  // A declaration whose value has a px/rem literal outside clamp().
  const LITERAL =
    /^\s*(font-size|padding(-[a-z]+)?|margin(-[a-z]+)?|gap|row-gap|column-gap|border-radius|min-height)\s*:\s*(?![^;]*clamp\()[^;]*\b\d+(\.\d+)?(px|rem)\b/m;

  it('should have no literal sizes in any of the five modules', () => {
    for (const m of MODULES) {
      const css = read(`components/Analytics/${m}`).replace(/\/\*[\s\S]*?\*\//g, '');
      expect(css.match(LITERAL)?.[0] ?? null, m).toBeNull();
    }
  });
});
