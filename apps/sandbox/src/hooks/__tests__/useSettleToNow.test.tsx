// @vitest-environment happy-dom
import { render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { LedgerEvent } from '@diboas/banking';
import { getLedgerState, grantPlayMoney, resetSandbox } from '@/lib/ledgerClient';
import { fetchSeries } from '../useMarket';
import { useSettleToNow } from '../useSettleToNow';

/**
 * WS-F — the real-time settle. It runs on every Home load and MOVES MONEY
 * (it appends a replay), and it had 0% coverage: the in-flight lock, the
 * idempotency, the cap and the fail-open were all promises in a comment.
 *
 * The provider is stubbed (the only external boundary); the ledger is real.
 * Only `Date` is faked, so React's scheduling and `waitFor` keep real timers.
 * Every expectation derives from WS-F's definition — whole real days since
 * genesis, minus days already settled — not from running the hook.
 */
vi.mock('../useMarket', () => ({ fetchSeries: vi.fn() }));
const mockedFetch = vi.mocked(fetchSeries);

const DAY = 86_400_000;
const GENESIS = Date.parse('2026-06-01T09:00:00Z');
const at = (ms: number) => vi.setSystemTime(new Date(ms));
const tick = () => new Promise((resolve) => setTimeout(resolve, 20));

type TimeAdvanced = Extract<LedgerEvent, { type: 'TimeAdvanced' }>;
const realAdvances = () =>
  getLedgerState().events.filter(
    (e): e is TimeAdvanced => e.type === 'TimeAdvanced' && e.source === 'real'
  );

function Settle() {
  useSettleToNow();
  return null;
}

describe('WS-F real-time settle — the money path that runs on every load', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    at(GENESIS);
    resetSandbox();
    grantPlayMoney(10_000, 'USD', 'b2c');
    mockedFetch.mockReset();
    mockedFetch.mockResolvedValue({ histories: [], priceHistories: [] });
  });
  afterEach(() => vi.useRealTimers());

  it('should settle exactly the whole real days elapsed since genesis', async () => {
    at(GENESIS + 10 * DAY + 3_600_000); // ten days and an hour
    render(<Settle />);
    await waitFor(() => expect(realAdvances()).toHaveLength(1));
    // Whole days only: the extra hour is not a day yet (D-2 daily granularity).
    expect(realAdvances()[0].days).toBe(10);
    expect(getLedgerState().realSettledDays).toBe(10);
  });

  it('should settle nothing on a second load the same day (idempotent)', async () => {
    at(GENESIS + 3 * DAY);
    const first = render(<Settle />);
    await waitFor(() => expect(realAdvances()).toHaveLength(1));
    first.unmount();
    render(<Settle />);
    await tick();
    expect(realAdvances()).toHaveLength(1);
    expect(mockedFetch).toHaveBeenCalledTimes(1); // the gap was 0, so nothing was even fetched
  });

  it('should settle ONCE when two mounts race (StrictMode double-invoke, fast remount)', async () => {
    at(GENESIS + 5 * DAY);
    render(
      <>
        <Settle />
        <Settle />
      </>
    );
    await waitFor(() => expect(realAdvances()).toHaveLength(1));
    await tick();
    // Without the in-flight lock both effects fetch and both append: the same
    // five real days counted twice, into real money-shaped state.
    expect(realAdvances()).toHaveLength(1);
    expect(mockedFetch).toHaveBeenCalledTimes(1);
  });

  it('should leave time unsettled and not throw when the provider fails, then settle next load', async () => {
    at(GENESIS + 4 * DAY);
    mockedFetch.mockRejectedValueOnce(new Error('provider down'));
    const first = render(<Settle />);
    await waitFor(() => expect(mockedFetch).toHaveBeenCalledTimes(1));
    await tick();
    expect(realAdvances()).toHaveLength(0); // fail-open: time simply waits
    first.unmount();
    // The lock was released in `finally`, so the next load is not wedged.
    render(<Settle />);
    await waitFor(() => expect(realAdvances()).toHaveLength(1));
    expect(realAdvances()[0].days).toBe(4);
  });

  it('should cap one settle at the history cap and size the fetch to it', async () => {
    at(GENESIS + 1000 * DAY);
    render(<Settle />);
    await waitFor(() => expect(realAdvances()).toHaveLength(1));
    // 730 = the server's history cap (the route clamps `days` there); a longer
    // absence settles across successive loads rather than in one huge replay.
    expect(realAdvances()[0].days).toBe(730);
    // The fetch covers the capped span plus a 30-day anchor margin.
    expect(mockedFetch).toHaveBeenCalledWith(760);
  });

  it('should do nothing at all before a whole day has passed', async () => {
    at(GENESIS + 23 * 3_600_000);
    render(<Settle />);
    await tick();
    expect(mockedFetch).not.toHaveBeenCalled();
    expect(realAdvances()).toHaveLength(0);
  });
});
