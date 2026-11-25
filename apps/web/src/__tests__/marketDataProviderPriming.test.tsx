/**
 * C2-S G4 — the provider primes the browser on its first render (the label-check defect).
 *
 * The provider compared `metadata.source` labels before priming; the fallback provider labels
 * the server's snapshot and the browser's constants both 'fallback', so the browser never
 * primed and the tools rendered the bare constants. This renders the provider in a DOM.
 *
 * @vitest-environment happy-dom
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MarketDataContextProvider } from '@/components/Providers/MarketDataContextProvider';
import { FallbackProvider, marketDataService } from '@/lib/market-data/service';
import { toClientSnapshot } from '@/lib/market-data/clientSnapshot';
import { FALLBACK_MARKET_DATA } from '@/lib/market-data/constants';

// Never the pipeline-written monthly data (GATE-BOUND-1): an accidental load returns nothing.
vi.mock('@/lib/market-data/data/monthlyPrices.json', () => ({ default: {} }));
vi.mock('@/lib/market-data/data/monthlyFx.json', () => ({ default: {} }));
vi.mock('@/lib/market-data/data/monthlyInflation.json', () => ({ default: {} }));

afterEach(() => marketDataService.setProvider(new FallbackProvider()));

describe('MarketDataContextProvider priming', () => {
  it('should prime the browser with the server snapshot even when both say "fallback"', () => {
    const server = toClientSnapshot({ ...FALLBACK_MARKET_DATA });
    expect(server.metadata.source).toBe(marketDataService.getSync().metadata.source);
    let seen: unknown = null;
    function Child() {
      seen = marketDataService.getSync();
      return null;
    }
    render(
      <MarketDataContextProvider initialSnapshot={server}>
        <Child />
      </MarketDataContextProvider>
    );
    expect(seen).toBe(server);
  });
});
