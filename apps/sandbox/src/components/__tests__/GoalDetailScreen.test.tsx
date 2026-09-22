// @vitest-environment happy-dom
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  fixtureDateSeries,
  fixturePriceSeries,
  type ProtocolApyHistory,
  type ProtocolPriceHistory,
  FIXTURE_STAMP,
  observedStamp,
} from '@diboas/defi';
import {
  advanceTime,
  createGoal,
  enterStrategy,
  grantPlayMoney,
  resetSandbox,
} from '@/lib/ledgerClient';
import { GoalDetailScreen } from '../GoalDetailScreen';
import { getMessages } from '@/i18n/loadMessages';

/**
 * ⛑ STAGE H (`5.309`, resolved 2026-09-22) · THE CLOCK IS NOW LOAD-BEARING.
 *
 * The gas quotes this harness supplies carry `FIXTURE_STAMP` (2026-07-18), and
 * the surface now refuses evidence outside the acceptable current-facing
 * vintage. Every test below is about exit scope, CTA honesty, provenance or
 * cost presentation — none of them is about the age contract — so the clock is
 * pinned INSIDE the fixture's window and each keeps asserting exactly what it
 * always asserted. The age contract has its own tests, which supply their own
 * over-age clock rather than borrowing this one.
 *
 * Pinning also removes a latent landmine: before this, these tests read the
 * real wall clock and would have changed behaviour on a date nobody chose.
 */
const WITHIN_FIXTURE_WINDOW = new Date('2026-07-25T09:00:00Z');

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(WITHIN_FIXTURE_WINDOW);
});
afterEach(() => {
  vi.useRealTimers();
});

/**
 * The market must be PRESENT for these tests: an exit cannot be priced without
 * it, so every exit control is gated on it. Before this mock existed the exit
 * tests ran against a null market and were quietly asserting an unpriceable
 * ceremony (network fee $0.00) — the exact state the gate now refuses.
 */
/**
 * ⚑ `vi.hoisted` is lifted ABOVE the imports, so its factory must not touch an
 * imported binding — referencing `FIXTURE_STAMP` here threw
 * `Cannot access '__vi_import_2__' before initialization` and the whole suite
 * failed to LOAD (13 tests silently not run). The holder therefore starts
 * empty; the snapshot is built at module scope, after the imports, and the mock
 * factory reads `h.market` lazily so it sees the assignment.
 *
 * The market must be PRESENT for these tests: an exit cannot be priced without
 * it, so every exit control is gated on it. Before this mock existed the exit
 * tests ran against a null market and were quietly asserting an unpriceable
 * ceremony (network fee $0.00) — the exact state the gate now refuses.
 */
const h = vi.hoisted(() => ({ market: null as unknown }));
vi.mock('@/hooks/useMarket', () => ({
  useMarket: () => ({ market: h.market, marketError: h.market === null, refreshMarket: () => {} }),
  fetchHistories: () => Promise.resolve([]),
}));

const MARKET_OK = {
  apys: [],
  gas: [{ chain: 'Arbitrum', typicalFeeUsd: 0.03, stamp: FIXTURE_STAMP }],
  usdPriceLocal: 1,
} as unknown;
h.market = MARKET_OK;

function renderDetail(goalId: string) {
  return render(
    <IntlProvider locale="en" messages={getMessages('en')}>
      <GoalDetailScreen locale="en" goalId={goalId} />
    </IntlProvider>
  );
}

describe('GoalDetailScreen — the dual-view host (§4.2, mockup 14)', () => {
  beforeEach(() => {
    resetSandbox();
    grantPlayMoney(10_000, 'USD', 'b2c');
  });

  it('should lead with the Simple view: numbered sections, percent, saved line — no pace claim without a plan', () => {
    const goalId = createGoal({
      name: 'Trip',
      icon: 'plane',
      targetAmount: 4000,
      horizonMonths: 12,
      fundAmount: 1000,
    });
    renderDetail(goalId);
    expect(screen.getByText(/Am I on track to get there/)).toBeTruthy();
    expect(screen.getByText(/What your money's doing/)).toBeTruthy();
    expect(screen.getByText(/What you can do next/)).toBeTruthy();
    expect(screen.getByText('25%')).toBeTruthy(); // 1,000 of 4,000
    expect(screen.getByText(/of the way there/)).toBeTruthy();
    // No recurring plan → no projection/pace sentence (absent over false).
    expect(screen.queryByText(/At this pace/i)).toBeNull();
  });

  it('should switch to Detailed: the operational surface (source rows + put-to-work)', () => {
    const goalId = createGoal({
      name: 'Trip',
      icon: 'plane',
      targetAmount: 4000,
      horizonMonths: 12,
      fundAmount: 1000,
    });
    renderDetail(goalId);
    // Two 'Detailed' buttons exist (the toggle segment + the ③ tile) — the
    // segment carries aria-pressed; click that one.
    fireEvent.click(
      screen
        .getAllByRole('button', { name: 'Detailed' })
        .find((b) => b.hasAttribute('aria-pressed'))!
    );
    expect(screen.getByText('Your contributions')).toBeTruthy();
    expect(screen.getByText('Market change')).toBeTruthy();
    expect(screen.getByText('Put it to work')).toBeTruthy();
  });

  it('should open the invest flow from the Simple "Add money" tile (switches to Detailed)', () => {
    const goalId = createGoal({
      name: 'Trip',
      icon: 'plane',
      targetAmount: 4000,
      horizonMonths: 12,
      fundAmount: 1000,
    });
    renderDetail(goalId);
    fireEvent.click(screen.getByText('Add money'));
    expect(screen.getByLabelText('Move this much working money into the goal now')).toBeTruthy(); // the invest field is live
  });

  it('should show the target-reached status line when current ≥ target', () => {
    const goalId = createGoal({
      name: 'Done goal',
      icon: 'target',
      targetAmount: 500,
      horizonMonths: 6,
      fundAmount: 500,
    });
    renderDetail(goalId);
    expect(screen.getAllByText('You reached this goal, in practice.').length).toBeGreaterThan(0);
  });

  it('should render nothing but the back link for an unknown goal (no crash)', () => {
    renderDetail('ghost');
    expect(screen.getByText('Back')).toBeTruthy();
  });
});

describe('GoalDetailScreen — exit scope (§4.7 G7, board §3.3)', () => {
  beforeEach(() => {
    resetSandbox();
    grantPlayMoney(10_000, 'USD', 'b2c');
  });

  /** A goal with TWO open positions — the case that exposed the scope bug. */
  function goalWithTwoPositions(): string {
    const goalId = createGoal({
      name: 'Trip',
      icon: 'plane',
      targetAmount: 4000,
      horizonMonths: 12,
      fundAmount: 1000,
    });
    enterStrategy({ goalId, strategyId: 'safeHarbor', totalFromCash: 50, networkFeeLocal: 0 });
    enterStrategy({ goalId, strategyId: 'safeHarbor', totalFromCash: 50, networkFeeLocal: 0 });
    return goalId;
  }

  it('should stop the WHOLE goal from "Also stop the strategy" (regression: it stopped only the first position)', () => {
    const goalId = goalWithTwoPositions();
    renderDetail(goalId);
    fireEvent.click(screen.getByRole('button', { name: 'Pause plan' }));
    fireEvent.click(screen.getByRole('button', { name: 'Also stop the strategy' }));

    // Goal scope: the ceremony covers BOTH positions and names the goal-level
    // action. Before this fix it opened on openPositions[0] alone, leaving the
    // second position quietly working behind a "stopped" label.
    expect(screen.getByText('2 strategies working')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Stop this goal' })).toBeTruthy();
    // Two floors, itemized (the arithmetic that a summed-gross fee would hide).
    expect(screen.getByText('$0.50')).toBeTruthy();
  });

  it("should stop only ONE position from that position's own Stop control", () => {
    const goalId = goalWithTwoPositions();
    renderDetail(goalId);
    fireEvent.click(
      screen
        .getAllByRole('button', { name: 'Detailed' })
        .find((b) => b.hasAttribute('aria-pressed'))!
    );
    fireEvent.click(screen.getAllByRole('button', { name: 'Take the money out' })[0]);
    expect(screen.getByText('1 strategy working')).toBeTruthy();
  });

  it('should return to the goal on cancel, moving nothing', () => {
    const goalId = goalWithTwoPositions();
    renderDetail(goalId);
    fireEvent.click(screen.getByRole('button', { name: 'Pause plan' }));
    fireEvent.click(screen.getByRole('button', { name: 'Also stop the strategy' }));
    fireEvent.click(screen.getByRole('button', { name: 'Keep it working' }));
    expect(screen.queryByText('Review before you stop')).toBeNull();
    expect(screen.getByText(/of the way there/)).toBeTruthy();
  });
});

describe('GoalDetailScreen — an exit that cannot be priced is never offered (R-13, FC-15)', () => {
  beforeEach(() => {
    resetSandbox();
    grantPlayMoney(10_000, 'USD', 'b2c');
  });

  it('should disable the stop control and say why when market data is missing', () => {
    // `market` is null until the fetch resolves, and STAYS null if it fails.
    // Without the gate the ceremony renders "Network cost $0.00" and a net that
    // overstates what comes back — an understated cost on the fee-truth screen —
    // and the confirm silently no-ops on approveExit's !market guard.
    h.market = null;
    try {
      const goalId = createGoal({
        name: 'Trip',
        icon: 'plane',
        targetAmount: 4000,
        horizonMonths: 12,
        fundAmount: 1000,
      });
      enterStrategy({ goalId, strategyId: 'safeHarbor', totalFromCash: 50, networkFeeLocal: 0 });
      renderDetail(goalId);
      fireEvent.click(
        screen
          .getAllByRole('button', { name: 'Detailed' })
          .find((b) => b.hasAttribute('aria-pressed'))!
      );
      const stop = screen.getByRole('button', { name: 'Take the money out' }) as HTMLButtonElement;
      expect(stop.disabled).toBe(true);
      expect(screen.getByText(/Costs can't be priced right now/)).toBeTruthy();
      // And it cannot be forced open.
      fireEvent.click(stop);
      expect(screen.queryByText('Review before you stop')).toBeNull();
    } finally {
      h.market = MARKET_OK;
    }
  });

  it('should disable the stop control when the position CHAIN has no gas quote', () => {
    /**
     * ⚑ AUD-F05. `exitFeeFor` keeps a numeric signature because the domain
     * callbacks require one, so it ends in `?? 0`. That zero must be
     * UNREACHABLE rather than a fallback — `canPriceExit` now requires EVERY
     * open position to price. This test is what holds that true: the market
     * resolves fine, but its gas list carries no Arbitrum quote, so the
     * Arbitrum position cannot be priced and the ceremony is refused instead of
     * itemizing a free exit. Without the `every(...)` gate this renders a
     * 0.00 network cost, which is the 5.199 class on the fee-truth surface.
     */
    h.market = { ...(MARKET_OK as Record<string, unknown>), gas: [] } as unknown;
    try {
      const goalId = createGoal({
        name: 'Trip',
        icon: 'plane',
        targetAmount: 4000,
        horizonMonths: 12,
        fundAmount: 1000,
      });
      enterStrategy({ goalId, strategyId: 'safeHarbor', totalFromCash: 50, networkFeeLocal: 0 });
      renderDetail(goalId);
      fireEvent.click(
        screen
          .getAllByRole('button', { name: 'Detailed' })
          .find((b) => b.hasAttribute('aria-pressed'))!
      );
      const stop = screen.getByRole('button', { name: 'Take the money out' }) as HTMLButtonElement;
      expect(stop.disabled).toBe(true);
      expect(screen.getByText(/Costs can't be priced right now/)).toBeTruthy();
      fireEvent.click(stop);
      expect(screen.queryByText('Review before you stop')).toBeNull();
    } finally {
      h.market = MARKET_OK;
    }
  });
});

/**
 * `5.283` — the earnings line took the GAIN colour whatever its sign.
 *
 * Since the §4.8 replay a growth position can fall, so `position.accrued` can
 * be negative; the line still painted it in the teal this app uses for a gain
 * (History, the month report). The requirement, derived from that colour
 * grammar and Mode × Appearance §18: a rise reads as a gain, a fall as a loss,
 * and zero as neither. The fall is produced by the app's own replay against
 * the real-shaped fixture series — the same path `g8FallingPosition` proves.
 */
describe('GoalDetailScreen — the earnings line takes its colour from its sign (5.283)', () => {
  /**
   * The shared fixture calendar, built ONCE per length.
   *
   * `fixtureDateSeries` walks `days` dates, so calling it inside a per-point
   * callback is O(days²) — measured consequence: `g8FallingPosition`'s
   * higher-exposure test TIMED OUT at 5000ms in the full suite (roughly a million
   * date operations per builder call, six protocols deep, twice per test) while
   * passing in isolation. Hoisted, not inlined.
   */
  const datesFor = (() => {
    const cache = new Map<number, string[]>();
    return (days: number): string[] => {
      const hit = cache.get(days);
      if (hit) return hit;
      const built = fixtureDateSeries(days);
      cache.set(days, built);
      return built;
    };
  })();

  const PROTOCOLS = ['skySsr', 'aaveV3', 'compoundV3', 'sanctumInf', 'jupiterJlp', 'jito'] as const;
  const apy = (days: number): ProtocolApyHistory[] =>
    PROTOCOLS.map((protocolId) => ({
      protocolId,
      points: Array.from({ length: days }, (_, i) => ({
        date: datesFor(days)[i],
        apyPercent: 5,
      })),
      stamp: observedStamp('defillama', '2026-08-20T00:00:00Z'),
    }));
  const prices = (days: number): ProtocolPriceHistory[] =>
    PROTOCOLS.map((protocolId) => ({
      protocolId,
      points: fixturePriceSeries(protocolId, days),
      stamp: FIXTURE_STAMP,
    }));

  const earningsSign = (strategyId: 'fullThrottle' | 'safeHarbor', advance: boolean) => {
    const goalId = createGoal({
      name: 'Trip',
      icon: 'plane',
      targetAmount: 5000,
      horizonMonths: 24,
      fundAmount: 1000,
    });
    enterStrategy({ goalId, strategyId, totalFromCash: 1000, networkFeeLocal: 0 });
    if (advance) advanceTime(180, apy(400), 'machine', prices(400));
    const { container } = renderDetail(goalId);
    fireEvent.click(
      screen
        .getAllByRole('button', { name: 'Detailed' })
        .find((b) => b.hasAttribute('aria-pressed'))!
    );
    return container.querySelector('p[data-sign]')?.getAttribute('data-sign');
  };

  beforeEach(() => {
    resetSandbox();
    grantPlayMoney(10_000, 'USD', 'b2c');
  });

  it('should mark a FALLEN position as a loss, never in the gain colour', () => {
    // 85% growth exposure across a falling market: accrued < 0 (g8's headline).
    expect(earningsSign('fullThrottle', true)).toBe('neg');
  });

  it('should mark a position that earned as a gain', () => {
    // All-lending at a flat 5%: accrual can only be positive.
    expect(earningsSign('safeHarbor', true)).toBe('pos');
  });

  it('should claim neither before anything has accrued', () => {
    expect(earningsSign('safeHarbor', false)).toBe('none');
  });
});

/**
 * `5.406` §4 · a multi-network Candidate cannot be PRICED, so it cannot be
 * STOPPED — FC-15, *"no honest price, no operable control."*
 *
 * `5.347`'s closure records FC-15 as having covered the EXIT first ("now for
 * the ENTRY as well"), and `goalDetail.exitPricingUnavailable` is already
 * shipped, approved copy for this state. So no new control flow and no new copy
 * is introduced here; only the predicate changed.
 *
 * ⚑ THE MARKET QUOTES BOTH CHAINS ON PURPOSE. This file's `MARKET_OK` carries
 * an Arbitrum quote only, so a Solana-entry position could not price BEFORE
 * this change either — a test using it would pass for the wrong reason and
 * prove nothing about the containment. With both chains quoted the legacy path
 * priced `fullThrottle` confidently at `0.001 x FX` ("about $0.00") for a
 * composition 15% on Arbitrum, where that leg's own quote is `0.03`. That is
 * the state this refuses.
 */
describe('5.406 — the exit refuses a multi-network Candidate, and only that class', () => {
  const MARKET_BOTH_CHAINS = {
    apys: [],
    gas: [
      { chain: 'Arbitrum', typicalFeeUsd: 0.03, stamp: FIXTURE_STAMP },
      { chain: 'Solana', typicalFeeUsd: 0.001, stamp: FIXTURE_STAMP },
    ],
    usdPriceLocal: 1,
  } as unknown;

  beforeEach(() => {
    resetSandbox();
    grantPlayMoney(10_000, 'USD', 'b2c');
  });

  /** Open a position and switch to the Detailed view, where the exit lives. */
  function openPositionIn(strategyId: 'fullThrottle' | 'safeHarbor') {
    const goalId = createGoal({
      name: 'Trip',
      icon: 'plane',
      targetAmount: 4000,
      horizonMonths: 12,
      fundAmount: 1000,
    });
    enterStrategy({ goalId, strategyId, totalFromCash: 500, networkFeeLocal: 0 });
    renderDetail(goalId);
    fireEvent.click(
      screen
        .getAllByRole('button', { name: 'Detailed' })
        .find((b) => b.hasAttribute('aria-pressed'))!
    );
  }

  it('should refuse to stop a multi-network position EVEN THOUGH both chains are quoted', () => {
    h.market = MARKET_BOTH_CHAINS;
    try {
      openPositionIn('fullThrottle');
      const stop = screen.getByRole('button', {
        name: 'Take the money out',
      }) as HTMLButtonElement;
      expect(stop.disabled).toBe(true);
      // The approved treatment, adjacent to the blocked control.
      expect(screen.getByText(/Costs can't be priced right now/)).toBeTruthy();
      // And it cannot be forced open into a ceremony with an untruthful fee.
      fireEvent.click(stop);
      expect(screen.queryByText('Review before you stop')).toBeNull();
    } finally {
      h.market = MARKET_OK;
    }
  });

  it('should still stop a single-network position under the SAME market (§7 boundary)', () => {
    /* The containment must affect only the class that requires it. Same market,
       same flow, a genuinely single-network Arbitrum blend — operable. */
    h.market = MARKET_BOTH_CHAINS;
    try {
      openPositionIn('safeHarbor');
      const stop = screen.getByRole('button', {
        name: 'Take the money out',
      }) as HTMLButtonElement;
      expect(stop.disabled).toBe(false);
      expect(screen.queryByText(/Costs can't be priced right now/)).toBeNull();
    } finally {
      h.market = MARKET_OK;
    }
  });
});

/**
 * ⛑ STAGE H · THE AGE CONTRACT ON THE EXIT SURFACE (`5.309`, option A3).
 *
 * The exit is the half `5.347`'s closure records as having been covered first,
 * so it is the half most likely to be assumed rather than checked. Evidence
 * past the acceptable current-facing vintage must block the stop with the
 * ALREADY-APPROVED sentence — the ruling §11 requirement that controlled
 * unavailable uses existing Product authority rather than invented copy.
 *
 * Note what does NOT happen: the position is not force-closed, no zero fee is
 * committed to the event log, and the money keeps working. "Costs can't be
 * priced right now, so stopping is unavailable" is the whole behaviour.
 */
describe('5.309 · an over-age quote blocks the exit with the approved sentence', () => {
  beforeEach(() => {
    vi.setSystemTime(new Date('2026-09-22T00:00:00Z'));
    resetSandbox();
    grantPlayMoney(10_000, 'USD', 'b2c');
    h.market = MARKET_OK;
  });

  /** Self-contained: the 5.406 block's helper is scoped to that block. */
  function openSafeHarbor() {
    const goalId = createGoal({
      name: 'Trip',
      icon: 'plane',
      targetAmount: 4000,
      horizonMonths: 12,
      fundAmount: 1000,
    });
    enterStrategy({ goalId, strategyId: 'safeHarbor', totalFromCash: 500, networkFeeLocal: 0 });
    renderDetail(goalId);
    fireEvent.click(
      screen
        .getAllByRole('button', { name: 'Detailed' })
        .find((b) => b.hasAttribute('aria-pressed'))!
    );
  }

  it('should disable the stop control and say why', () => {
    openSafeHarbor();
    const stop = screen.getByRole('button', { name: 'Take the money out' }) as HTMLButtonElement;
    expect(stop.disabled).toBe(true);
    expect(screen.getByText(/Costs can't be priced right now/)).toBeTruthy();
  });

  it('should keep the money working rather than forcing an unpriceable exit', () => {
    openSafeHarbor();
    expect(screen.getByText(/Your money keeps working/)).toBeTruthy();
  });

  it('should style the blocked stop control as disabled, not merely mark it so', () => {
    /**
     * ⛑ FOUND IN THE STAGE H VISUAL GATE, 2026-09-22. `.exit` carried no
     * `:disabled` rule at all, so the blocked control rendered at full opacity
     * with `cursor: pointer` and still lit up on hover — it looked available.
     * Only the sentence beside it said otherwise, which fails "the disabled
     * state must be visually understandable".
     *
     * ⚑ ASSERTED AGAINST THE STYLESHEET, NOT `getComputedStyle`. This harness
     * loads no CSS — class names are hashed CSS-module identifiers and no rule
     * is ever applied — so a computed-style assertion here resolves to jsdom
     * defaults and would pass whether or not the rule exists. A first draft did
     * exactly that and failed for the wrong reason. The rendered effect was
     * verified in the browser during the visual gate; what this guard protects
     * is that the RULE cannot be deleted again.
     */
    /* `import.meta.url` is an http URL under happy-dom, not a file URL, so the
       path is resolved from the package root instead. */
    const css = readFileSync(
      join(process.cwd(), 'src/components/GoalDetailScreen.module.css'),
      'utf8'
    );
    /* The disabled treatment exists, and matches the already-ratified sibling
       control rather than inventing a second look for the same meaning. */
    expect(css).toMatch(/\.exit:disabled\s*\{[^}]*opacity:\s*0\.5/);
    expect(css).toMatch(/\.exit:disabled\s*\{[^}]*cursor:\s*default/);
    /* And hover must not light up a control that cannot be pressed. */
    expect(css).toContain('.exit:hover:not(:disabled)');
    expect(css).not.toMatch(/\.exit:hover\s*\{/);
  });
});

/**
 * `5.436` · AN ALREADY-SELECTED CANDIDATE KEEPS ITS CONTEXT.
 *
 * Product ruling §6: if a candidate was selected or configured BEFORE its rate
 * became unavailable, the selection and the user's inputs are preserved —
 * continuation is what becomes unavailable, not the work already done. Clearing
 * someone's amount because a provider went quiet would be the product punishing
 * the user for the data's failure.
 */
describe('5.436 · an unavailable rate does not clear work already done', () => {
  beforeEach(() => {
    vi.setSystemTime(new Date('2026-09-22T00:00:00Z'));
    resetSandbox();
    grantPlayMoney(10_000, 'USD', 'b2c');
    h.market = MARKET_OK;
  });

  it('should keep an existing position visible and its money working', () => {
    /* The active Money Job is settled state: today's evidence loss must not
       reach it. Measured on the rendered surface, not only in the ledger. */
    const goalId = createGoal({
      name: 'Trip',
      icon: 'plane',
      targetAmount: 4000,
      horizonMonths: 12,
      fundAmount: 1000,
    });
    enterStrategy({ goalId, strategyId: 'safeHarbor', totalFromCash: 500, networkFeeLocal: 0 });
    renderDetail(goalId);
    fireEvent.click(
      screen
        .getAllByRole('button', { name: 'Detailed' })
        .find((b) => b.hasAttribute('aria-pressed'))!
    );
    /* The position card names the strategy AND its amount — the job survived
       the evidence loss intact. Plural matcher: $500.00 legitimately appears
       more than once (the position and the goal's own cash line). */
    expect(screen.getByText(/Working in Safe Harbor/)).toBeTruthy();
    expect(screen.getAllByText(/\$500\.00/).length).toBeGreaterThan(0);
  });
});
