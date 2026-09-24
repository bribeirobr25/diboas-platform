// @vitest-environment happy-dom
import { fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  FIXTURE_STAMP,
  CURRENT_CATALOG_PROTOCOL_NETWORK,
  getStrategy,
  observedStamp,
} from '@diboas/defi';
import type { ProtocolApy, ProtocolApyHistory, ProtocolId } from '@diboas/defi';
import { StrategyDetail } from '../StrategyDetail';
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
/**
 * ⛑ `5.436` (2026-09-22) · THE OBSERVED DATE MOVED, AND HERE IS WHY.
 *
 * These stamps read `2026-08-19` while the pinned clock sits at `2026-07-25`
 * (inside the fixture gas window) — so the "live" APYs were 25 days in the
 * FUTURE relative to the moment the surface was judged at. Nothing read them
 * against a clock before, so the incoherence was invisible; the rate gate reads
 * them, and a future stamp is refused (a clock skew must not manufacture
 * currency).
 *
 * The date is arbitrary test data whose only job is "an observed live reading",
 * and no assertion depends on the literal. Moving it to three days before the
 * clock makes the fixture internally coherent — gas 07-18, rates 07-22, judged
 * at 07-25 — and preserves every subject: live, mixed and fixture provenance
 * all still render exactly as before.
 */
const OBSERVED_AT = '2026-07-22T00:00:00Z';

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(WITHIN_FIXTURE_WINDOW);
});
afterEach(() => {
  vi.useRealTimers();
});

/**
 * G6 pre-commit read (§4.6). Absorbs the provenance-stamp assertions that
 * lived against PathCard before board §3.2 folded it in here.
 */

const safeHarbor = getStrategy('safeHarbor')!;

function apy(protocolId: ProtocolId, source: 'defillama' | 'fixture' = 'defillama'): ProtocolApy {
  return {
    protocolId,
    apyPercent: 4,
    tvlUsd: null,
    chain: 'Arbitrum',
    stamp: source === 'fixture' ? FIXTURE_STAMP : observedStamp('defillama', OBSERVED_AT),
  };
}
const LIVE = [apy('skySsr'), apy('aaveV3'), apy('compoundV3')];
const MIXED = [apy('skySsr'), apy('aaveV3', 'fixture'), apy('compoundV3')];
const FIXTURE = [apy('skySsr', 'fixture'), apy('aaveV3', 'fixture'), apy('compoundV3', 'fixture')];

function history(protocolId: ProtocolId, days: number): ProtocolApyHistory {
  return {
    protocolId,
    points: Array.from({ length: days }, (_, i) => ({
      date: new Date(Date.UTC(2026, 4, 1 + i)).toISOString().slice(0, 10),
      apyPercent: 3 + (i % 4),
    })),
    stamp: observedStamp('defillama', OBSERVED_AT),
  };
}

function renderDetail(
  apys: ProtocolApy[] = LIVE,
  histories: ProtocolApyHistory[] = [
    history('skySsr', 120),
    history('aaveV3', 120),
    history('compoundV3', 120),
  ],
  onPutToWork?: () => void
) {
  return render(
    <IntlProvider locale="en" messages={getMessages('en')}>
      <StrategyDetail
        strategy={safeHarbor}
        goalName="Future cushion"
        apys={apys}
        histories={histories}
        gas={[
          {
            chain: 'Arbitrum',
            typicalFeeUsd: 0.03,
            stamp: FIXTURE_STAMP,
          },
        ]}
        usdPriceLocal={1}
        currency="USD"
        onPutToWork={onPutToWork}
      />
    </IntlProvider>
  );
}

describe('StrategyDetail — the G6 pre-commit read (§4.6, board §3.2)', () => {
  it("should lead Simple with what-it-is, how-it's-doing, and the FOLDED itemization (FC-15)", () => {
    renderDetail();
    expect(screen.getByText('What it is')).toBeTruthy();
    expect(screen.getByText("How it's doing")).toBeTruthy();
    // PathCard's cost/risk itemization is a section here now — never a
    // pre-commit read without the itemized costs (board §3.2).
    expect(screen.getByText('Entering: free')).toBeTruthy();
    expect(screen.getByText(/Reference network cost: about/)).toBeTruthy();
    expect(screen.getByText(/Reference diBoaS exit fee: 0\.39% or/)).toBeTruthy();
    expect(screen.getByText(/^No promises live here\./)).toBeTruthy();
  });

  it('should NOT fold any exit fee into the entry cost (mockup-03 drift: entry is FREE)', () => {
    renderDetail();
    expect(screen.getByText('Entering: free')).toBeTruthy();
    // No "total" that adds an exit fee to the entry amount anywhere.
    expect(screen.queryByText(/Total/i)).toBeNull();
  });

  it('should render the REAL allocation with weights, never the mockup\'s "Curve"', () => {
    renderDetail();
    fireEvent.click(screen.getByText('Detailed'));
    expect(screen.getByText(/Sky SSR 50%/)).toBeTruthy();
    expect(screen.getByText(/Aave V3 30%/)).toBeTruthy();
    expect(screen.getByText(/Compound V3 20%/)).toBeTruthy();
    expect(screen.queryByText(/Curve/)).toBeNull();
  });

  it('should take the exit terms from the fee CONSTANTS (no literal in the component)', () => {
    renderDetail();
    fireEvent.click(screen.getByText('Detailed'));
    expect(screen.getByText('Reference diBoaS exit fee')).toBeTruthy();
    expect(screen.getByText(/0\.39%/)).toBeTruthy(); // formatted from FEE_RATES.exit
    // FE-1: the floor travels with the rate, and it is PER EXITED POSITION.
    expect(screen.getByText('Minimum $0.25 per exited position')).toBeTruthy();
  });

  it('should stamp provenance honestly in all three states', () => {
    /* GAS-1 (founder 2026-08-21): this surface renders the NETWORK FEE beside
       the rates, so its stamp covers the gas source too. The harness supplies
       a FIXTURE gas quote (dated 2026-07-18, as the app ships today), so even
       all-live rates stamp `mixed` — it previously claimed "Live from
       DeFiLlama" directly above a fixture fee, on the pre-commit cost
       surface. */
    const { unmount } = renderDetail(LIVE);
    /**
     * `5.316`: this branch used to assert only that the mixed sentence was
     * PRESENT, and it rendered "Reference values (18.07.2026) for: ." — a
     * provenance stamp naming nothing. A mixed state must NAME what is on
     * reference values, so the assertions below are on CONTENT.
     */
    expect(screen.queryByText(/^Live from DeFiLlama/)).toBeNull();
    /**
     * Read the stamp's `textContent`, not `getByText`. The sentence is composed
     * from TWO `FormattedMessage` elements in one <p>, so React emits separate
     * text nodes and a text matcher cannot span them — the first version of
     * this assertion failed for exactly that reason while the copy rendered
     * correctly. The MIXED assertion below already used `textContent`; this
     * follows it.
     */
    const stamp = screen.getByText(/Partly live from DeFiLlama/);
    // the reference-backed input is IDENTIFIED as the network fee (Legal wording)
    expect(stamp.textContent).toContain('network fee (gas) used in this simulation');
    // and never an empty `for:` clause, in any locale
    expect(stamp.textContent).not.toMatch(/for: \.|für: \.|para: \./);
    unmount();

    const mixed = renderDetail(MIXED);
    expect(screen.getByText(/Partly live from DeFiLlama/).textContent).toContain('Aave V3');
    mixed.unmount();

    renderDetail(FIXTURE);
    expect(screen.getByText(/Documented reference values/)).toBeTruthy();
    expect(screen.queryByText(/\(real, variable\)/)).toBeNull(); // never "real" on fixtures
  });

  it('should name the LIVE source from the registry, never an empty attribution', () => {
    /**
     * `5.440` · THE BRANCH NOTHING POSITIVELY ASSERTED.
     *
     * Every other test here asserts `Live from DeFiLlama` is ABSENT (it must
     * be, while the network fee sits on reference values — GAS-1). So when the
     * four hardcoded `'DeFiLlama'` message values became registry lookups, the
     * `state === 'live'` branch had NO positive coverage at all: had
     * `newestLiveSource` been null there, the surface would have rendered
     * "Live from , ..." — an empty source name — and nothing would have caught
     * it. Reaching the branch needs a LIVE gas stamp, which the shared harness
     * deliberately does not supply.
     */
    render(
      <IntlProvider locale="en" messages={getMessages('en')}>
        <StrategyDetail
          strategy={safeHarbor}
          goalName="Future cushion"
          apys={LIVE}
          histories={[history('skySsr', 30), history('aaveV3', 30), history('compoundV3', 30)]}
          gas={[
            {
              chain: 'Arbitrum',
              typicalFeeUsd: 0.03,
              stamp: observedStamp('defillama', OBSERVED_AT),
            },
          ]}
          usdPriceLocal={1}
          currency="USD"
        />
      </IntlProvider>
    );
    const live = screen.getByText(/^Live from/);
    expect(live.textContent).toContain('DeFiLlama');
    // The precise failure the registry lookup could introduce: an empty name.
    expect(live.textContent).not.toMatch(/Live from\s*,/);
  });

  it('should draw the axed chart over real history with switchable timeframes', () => {
    renderDetail();
    fireEvent.click(screen.getByText('Detailed'));
    // The chart describes itself for non-visual readers (dates + range).
    expect(screen.getByText(/Pool rate from .* ranging/)).toBeTruthy();
    const tf90 = screen.getByRole('button', { name: '90D' });
    expect(tf90.getAttribute('aria-pressed')).toBe('true'); // default
    fireEvent.click(screen.getByRole('button', { name: '7D' }));
    expect(screen.getByRole('button', { name: '7D' }).getAttribute('aria-pressed')).toBe('true');
  });

  it('should say so plainly when there is not enough history to chart', () => {
    renderDetail(LIVE, []);
    fireEvent.click(screen.getByText('Detailed'));
    expect(screen.getByText('Not enough history to draw a chart yet.')).toBeTruthy();
  });

  it('should DISABLE the CTA and say why when there is no handler (never a fake control)', () => {
    renderDetail(); // no onPutToWork → the parent has nothing valid to commit
    const cta = screen.getByRole('button', { name: 'Put money to work' }) as HTMLButtonElement;
    expect(cta.disabled).toBe(true);
    expect(screen.getByText('Enter an amount above to put money to work.')).toBeTruthy();
  });

  it('should fire the entry seam from "Put money to work"', () => {
    const onPutToWork = vi.fn();
    renderDetail(
      LIVE,
      [history('skySsr', 30), history('aaveV3', 30), history('compoundV3', 30)],
      onPutToWork
    );
    fireEvent.click(screen.getByText('Put money to work'));
    expect(onPutToWork).toHaveBeenCalledOnce();
  });

  /**
   * `5.402`. The harness supplies three LIVE rates and a FIXTURE Arbitrum gas
   * quote — exactly what the app ships today — and the APY label used to read
   * "includes documented reference values" about rates that were all live.
   * No test covered this label in the mixed-gas state, which is why the false
   * claim shipped.
   */
  it('should state the APY label from the APY legs ONLY, never from the gas quote', () => {
    renderDetail(LIVE);
    expect(screen.getByText(/\(real, variable\)/)).toBeTruthy();
    expect(screen.queryByText(/includes documented reference values/)).toBeNull();
    // The fee's provenance is still stated — by the gas sentence, not the label.
    expect(screen.getByText(/Partly live from DeFiLlama/).textContent).toContain(
      'network fee (gas) used in this simulation'
    );
  });

  it('should not describe a reference fee it never rendered', () => {
    // No quote for safeHarbor's Arbitrum entry → no fee row, so the
    // reference-fee sentence must be absent rather than describing nothing.
    render(
      <IntlProvider locale="en" messages={getMessages('en')}>
        <StrategyDetail
          strategy={safeHarbor}
          goalName="Future cushion"
          apys={LIVE}
          histories={[history('skySsr', 120), history('aaveV3', 120), history('compoundV3', 120)]}
          gas={[]}
          usdPriceLocal={1}
          currency="USD"
        />
      </IntlProvider>
    );
    expect(screen.queryByText(/Reference network cost: about/)).toBeNull();
    expect(screen.queryByText(/network fee \(gas\) used in this simulation/)).toBeNull();
    // and it still must not claim to be fully live
    expect(screen.queryByText(/^Live from DeFiLlama/)).toBeNull();

    /* `5.348` (Execution Rulings §17): the row is NOT omitted — the approved
       string REPLACES the figure, because `amount unavailable != zero !=
       waived != free network`. Asserting only the absence above could not tell
       a replaced row from a missing one, which is exactly why reverting this
       change passed its first sabotage. */
    expect(screen.getByText('Network fee: amount unavailable')).toBeTruthy();

    /* `5.347` (§16): the refusal explanation must be ADJACENT to the blocked
       action, and must be the RIGHT reason — an unpriceable entry previously
       rendered "Enter an amount above", naming a cause that was not the cause. */
    expect(
      screen.getByText(
        "The required cost information isn't available, so this move can't proceed; nothing moved."
      )
    ).toBeTruthy();
    expect(screen.queryByText('Enter an amount above to put money to work.')).toBeNull();
  });

  it('should keep the amount hint when the fee IS priceable and only the amount is missing', () => {
    // The other side of the same selection: with a priceable fee, the reason
    // stays the amount hint. Without this, a branch that always showed the
    // refusal string would pass the test above.
    renderDetail(); // fixture Arbitrum gas + FX 1 → fee is priceable, no handler
    expect(screen.getByText('Enter an amount above to put money to work.')).toBeTruthy();
    expect(
      screen.queryByText(
        "The required cost information isn't available, so this move can't proceed; nothing moved."
      )
    ).toBeNull();
    // and the fee row shows the figure, not the unavailable label
    expect(screen.getByText(/Reference network cost: about/)).toBeTruthy();
    expect(screen.queryByText('Network fee: amount unavailable')).toBeNull();
  });
});

/**
 * `5.406` §4/§5/§6 · what a multi-network Candidate renders on the pre-commit
 * money surface.
 *
 * Five of ten catalogue strategies hold `skySsr` — an ARBITRUM lending leg —
 * while declaring `entryChain: 'Solana'`. The legacy path showed Solana's gas
 * as the whole-Candidate cost: `0.001 x FX` renders "about $0.00" for a
 * composition up to 70% Arbitrum, where that leg's own quote is `0.03`.
 *
 * ⚑ GAS QUOTES BOTH CHAINS ON PURPOSE. The file's own `renderDetail` supplies
 * an Arbitrum quote only, so a Solana-entry strategy could not price before
 * this change either — a test built on it would pass for the wrong reason.
 * Quoting both means the legacy code priced this confidently, and only the
 * containment refuses it.
 *
 * ⚑ REAL CATALOGUE + REAL MESSAGES. `getMessages('en')` rather than this file's
 * hand-rolled map, per `5.408`: a missing key in a stub renders as EMPTY TEXT,
 * so assertions on it pass while asserting nothing — measured in this very
 * file's `M` map earlier today.
 */
describe('5.406 — the multi-network Candidate on the pre-commit surface', () => {
  const messages = getMessages('en');
  const fullThrottle = getStrategy('fullThrottle')!; // 15% Arbitrum + 85% Solana
  const singleNetwork = getStrategy('safeHarbor')!; // 100% Arbitrum

  const GAS_BOTH = [
    { chain: 'Arbitrum' as const, typicalFeeUsd: 0.03, stamp: FIXTURE_STAMP },
    { chain: 'Solana' as const, typicalFeeUsd: 0.001, stamp: FIXTURE_STAMP },
  ];

  const apysFor = (strategy: typeof fullThrottle): ProtocolApy[] =>
    strategy.allocation.map((leg) => ({
      protocolId: leg.protocolId,
      apyPercent: 5,
      tvlUsd: null,
      chain: CURRENT_CATALOG_PROTOCOL_NETWORK[leg.protocolId],
      /* Same coherence fix as OBSERVED_AT above: this read 2026-09-17, which
         is also in the future relative to this file's pinned clock. */
      stamp: observedStamp('defillama', OBSERVED_AT),
    }));

  function renderFor(strategy: typeof fullThrottle, onPutToWork?: () => void) {
    return render(
      <IntlProvider locale="en" messages={messages} onError={() => {}}>
        <StrategyDetail
          strategy={strategy}
          goalName="Future cushion"
          apys={apysFor(strategy)}
          histories={strategy.allocation.map((leg) => history(leg.protocolId, 120))}
          gas={GAS_BOTH}
          usdPriceLocal={1}
          currency="USD"
          onPutToWork={onPutToWork}
        />
      </IntlProvider>
    );
  }

  it('should render the approved UNAVAILABLE network-fee row, never an amount (5.348, §5)', () => {
    renderFor(fullThrottle);
    expect(screen.getByText('Network fee: amount unavailable')).toBeTruthy();
    // The row is REPLACED, not omitted, and never shows a figure.
    expect(screen.queryByText(/Reference network cost/)).toBeNull();
    expect(screen.queryByText(/about \$0\.00/)).toBeNull();
    // §4: no per-leg summing — 0.03 + 0.001 must not appear anywhere.
    expect(screen.queryByText(/0\.031/)).toBeNull();
  });

  it('should SUPPRESS the false single-network Path claim (§6)', () => {
    renderFor(fullThrottle);
    // "…real protocols on Solana" named 1 of 2 networks as if it were all.
    expect(screen.queryByText(/real protocols on/)).toBeNull();
    // Composition stays visible: the heading and the weighted legs remain.
    expect(screen.getByText('Path')).toBeTruthy();
    expect(screen.getAllByText(/%/).length).toBeGreaterThan(0);
  });

  it('should fail closed on entry with the approved reason (5.347, §5)', () => {
    renderFor(fullThrottle); // no onPutToWork → CTA disabled, reason rendered
    const cta = screen.getByRole('button', { name: 'Put money to work' }) as HTMLButtonElement;
    expect(cta.disabled).toBe(true);
    expect(screen.getByText(/The required cost information isn't available/)).toBeTruthy();
    // The RIGHT reason: not the amount hint, which would name a false cause.
    expect(screen.queryByText(/Enter an amount above/)).toBeNull();
  });

  it('should leave a single-network Candidate fully operable under the SAME gas (§7)', () => {
    renderFor(singleNetwork, () => {});
    expect(screen.getByText(/Reference network cost: about/)).toBeTruthy();
    expect(screen.queryByText('Network fee: amount unavailable')).toBeNull();
    expect(screen.getByText(/real protocols on/)).toBeTruthy();
    const cta = screen.getByRole('button', { name: 'Put money to work' }) as HTMLButtonElement;
    expect(cta.disabled).toBe(false);
  });
});

describe('5.421 — the entry-side reference cost is qualified, never presented as a charge', () => {
  /**
   * Brand + Legal + Product/UIUX resolved. `5.420` closed this on the EXIT path;
   * this is the ENTRY path — the G6 pre-commit read, which a user meets BEFORE
   * committing. The settled boundary: a Practice reference cost may be shown as
   * clearly qualified information, and may never be described or presented as a
   * charge or deduction reducing the Practice outcome.
   *
   * ⚑ The `costLine` assertion below is a SINGLE-QUOTED LITERAL on purpose. It is
   * the `5.418` render-coverage addition, and `testCopyDrift` only sees literals
   * in `getByText`-family calls — a regex would leave the string as uncovered as
   * it was, which is precisely what `5.418` records.
   */
  const QUALIFIER =
    'For information only. These reference costs are not charged or deducted in Practice and do not reduce the Practice outcome.';

  it('5.418 · should RENDER the ratified costLine in the Simple view (literal, drift-guarded)', () => {
    renderDetail();
    expect(
      screen.getByText(
        'Practice has no diBoaS entry fee. For reference, the diBoaS exit fee is 0.39% or $0.25 per exited position, whichever is greater. It is not charged or deducted in Practice.'
      )
    ).toBeTruthy();
  });

  it('should head the Simple group "Reference costs" and qualify it before the first row', () => {
    renderDetail();
    const heading = screen.getByText('Reference costs');
    const qualifier = screen.getByText(QUALIFIER);
    expect(heading).toBeTruthy();
    expect(qualifier).toBeTruthy();
    // Reading order: heading BEFORE qualifier BEFORE the first governed row.
    const firstRow = screen.getByText('Entering: free');
    expect(
      heading.compareDocumentPosition(qualifier) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(
      qualifier.compareDocumentPosition(firstRow) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it('should associate the qualifier with the group it governs (aria, reinforcing DOM order)', () => {
    renderDetail();
    const group = screen.getByText('Reference costs').closest('section');
    expect(group).toBeTruthy();
    expect(group?.getAttribute('aria-labelledby')).toBe('cost-group-title');
    expect(group?.getAttribute('aria-describedby')).toBe('cost-group-qualifier');
    // The qualifier is the element the association points at, and it is visible.
    const described = group?.querySelector('#cost-group-qualifier');
    expect(described?.textContent).toBe(QUALIFIER);
    expect(described?.className).not.toMatch(/srOnly/);
  });

  it('should render the ratified exit and network rows as REFERENCE costs', () => {
    renderDetail();
    expect(
      screen.getByText(
        'Reference diBoaS exit fee: 0.39% or $0.25 per exited position, whichever is greater.'
      )
    ).toBeTruthy();
    expect(screen.getByText('Reference network cost: about $0.03')).toBeTruthy();
  });

  it('should keep the Detailed view independently complete, with its own qualifier', () => {
    renderDetail();
    fireEvent.click(screen.getByText('Detailed'));
    expect(screen.getByText('Reference diBoaS exit fee')).toBeTruthy();
    expect(screen.getByText('Minimum $0.25 per exited position')).toBeTruthy();
    expect(screen.getByText(/0\.39%/)).toBeTruthy();
    /* TWO reference-cost groups render in Detailed — the exit-fee group and the
       compact itemization — so the qualifier appears twice. One KEY, two governed
       groups; neither may be left unqualified. */
    expect(screen.getAllByText(QUALIFIER).length).toBe(2);
  });

  it('should associate the Detailed exit group with the same reusable qualifier', () => {
    renderDetail();
    fireEvent.click(screen.getByText('Detailed'));
    const group = screen.getByText('Reference diBoaS exit fee').closest('section');
    expect(group?.getAttribute('aria-labelledby')).toBe('exit-fee-label');
    expect(group?.getAttribute('aria-describedby')).toBe('exit-fee-qualifier');
    expect(group?.querySelector('#exit-fee-qualifier')?.textContent).toBe(QUALIFIER);
  });

  it('should no longer render ANY retired charge framing on this surface', () => {
    renderDetail();
    // The pre-5.421 constructions, in both views.
    expect(screen.queryByText(/passed through at cost/)).toBeNull();
    expect(screen.queryByText(/Leaving later/)).toBeNull();
    expect(screen.queryByText(/A small 0\.39%/)).toBeNull();
    expect(screen.queryByText(/no cap/)).toBeNull();
    fireEvent.click(screen.getByText('Detailed'));
    expect(screen.queryByText(/passed through at cost/)).toBeNull();
    expect(screen.queryByText(/at least \$0\.25/)).toBeNull();
  });
});

/**
 * ⛑ STAGE H · THE AGE CONTRACT ON THE PRODUCT SURFACE (`5.309`, option A3).
 *
 * The sibling suites above pin the clock INSIDE the fixture window so their own
 * subjects stay testable. This block does the opposite on purpose: it supplies
 * an over-age clock and proves the refusal actually reaches the screen. Without
 * it, pinning the clock everywhere else would have hidden the enforcement
 * rather than isolated it.
 *
 * M&E / Data ruling §4 and §6: evidence past the acceptable current-facing
 * vintage makes the current-facing answer UNAVAILABLE — never 0, never FREE,
 * never a silently carried-forward figure. The shipped fixture is 66 days old,
 * so this is the state the live Practice app is in until `5.110` refreshes it.
 */
describe('5.309 · evidence outside the current-facing vintage cannot price a move', () => {
  beforeEach(() => {
    /* 2026-09-22 — the ruling date. FIXTURE_STAMP is 2026-07-18, i.e. 66 days:
       past the default 14-day bound, and past it by enough that a boundary
       rounding argument cannot explain the result. */
    vi.setSystemTime(new Date('2026-09-22T00:00:00Z'));
  });

  /**
   * ⚑ FRESH RATES, STALE GAS — deliberately, and it is the LIVE PRODUCTION
   * SHAPE. `/api/market` returns DeFiLlama APYs stamped today alongside gas
   * still stamped `FIXTURE_AS_OF`, so this block isolates the COST refusal from
   * the rate refusal (`5.436`) instead of letting one mask the other. Without
   * it, both would be unavailable at this clock and these tests would pass for
   * the wrong reason.
   */
  const FRESH = ['skySsr', 'aaveV3', 'compoundV3'].map((id) => ({
    protocolId: id as ProtocolId,
    apyPercent: 4,
    tvlUsd: null,
    chain: 'Arbitrum' as const,
    stamp: observedStamp('defillama', '2026-09-20T00:00:00Z'),
  }));

  it('should NOT render a network cost row it can no longer stand behind', () => {
    renderDetail(FRESH);
    expect(screen.queryByText(/Reference network cost: about/)).toBeNull();
  });

  it('should refuse the move with the approved unavailable sentence, not the amount hint', () => {
    /* The RIGHT reason beside the blocked action (`5.347`, Execution Rulings
       §16). "Enter an amount above" would name a cause that is not the cause —
       the same defect that ruling was raised to close. */
    renderDetail(FRESH);
    expect(
      screen.getByText(
        "The required cost information isn't available, so this move can't proceed; nothing moved."
      )
    ).toBeTruthy();
    expect(screen.queryByText('Enter an amount above to put money to work.')).toBeNull();
  });

  it('should keep the CTA disabled rather than offer a control it cannot honour', () => {
    renderDetail(FRESH);
    const cta = screen.getByRole('button', { name: 'Put money to work' }) as HTMLButtonElement;
    expect(cta.disabled).toBe(true);
  });

  it('should state the NETWORK row as unavailable, never as zero or free', () => {
    /**
     * `MISSING != 0` / `UNAVAILABLE != FREE`, asserted on the RENDERED text so
     * it covers presentation and not only the helper's return value.
     *
     * ⚑ Scoped to the NETWORK row on purpose. The same panel truthfully reads
     * "Entering: free" — that is the diBoaS ENTRY fee, a different cost
     * category, and Practice genuinely has none. An assertion sweeping the
     * whole panel for "free" would conflate two categories, which is the very
     * confusion `presentedCategory` exists to prevent; a first draft of this
     * test did exactly that and was wrong, not the surface.
     */
    renderDetail(FRESH);
    expect(screen.getByText('Network fee: amount unavailable')).toBeTruthy();
    const body = document.body.textContent ?? '';
    for (const forbidden of ['Network fee: $0.00', 'Network fee: free', 'about $0.00']) {
      expect(body, `${forbidden} would be a fabricated network cost`).not.toContain(forbidden);
    }
  });
});

/**
 * `5.436` · CANDIDATE_UNAVAILABLE on the pre-commit read — Product ruling
 * 2026-09-22.
 *
 * The clock sits past the rate window. What must survive is everything the
 * strategy independently IS; what must go is the number and the ability to
 * commit. `CANDIDATE_UNAVAILABLE != deleted != invalid != error != loss`.
 */
describe('5.436 — an unavailable rate blocks the commit, not the reading', () => {
  beforeEach(() => {
    vi.setSystemTime(new Date('2026-09-22T00:00:00Z'));
  });

  it('should replace the numeric rate with the approved generic copy', () => {
    /**
     * ⚑ It renders TWICE, deliberately: once as the rate's state near the top
     * of a long surface, and once beside the blocked CTA at the bottom, where
     * `5.347` requires the refusal to stay adjacent to the action it refuses.
     * They are far apart and answer different questions, so this is not the
     * repeated-data anti-pattern — but it IS why the matcher is plural.
     */
    renderDetail();
    expect(screen.getAllByText('This option is not available right now').length).toBe(2);
    expect(screen.queryByText(/Current pool rate/)).toBeNull();
    expect(screen.queryByText(/Reference pool rate/)).toBeNull();
  });

  it('should withhold the PROVENANCE QUALIFIER wherever it withholds the number', () => {
    /**
     * ⛑ ADDED IN S2 AFTER A SABOTAGE FAILED TO FAIL (`5.444`).
     *
     * Mutating the qualifier's condition to render unconditionally broke
     * nothing — nothing asserted that the sentence goes with the number it
     * explains. A provenance line rendered beside an absent rate is prose
     * describing something that is not on screen: it would say "Current pool
     * rate: …%/yr (real, variable)" about a rate the surface refuses to state.
     *
     * Sabotage: make the qualifier unconditional and this fails.
     */
    renderDetail();
    /**
     * ⚑ THE QUALIFIER LIVES IN THE *DETAILED* VIEW. A first version of this
     * test asserted against the default `simple` view, where that element never
     * renders at all — so the sabotage (making the qualifier unconditional)
     * passed, and the guard asserted nothing. Switch views first, then look.
     */
    fireEvent.click(screen.getByText('Detailed'));
    /* Non-vacuity: the detailed view must actually be showing. */
    expect(screen.getByText('Current APY')).toBeTruthy();
    for (const qualifier of [/Current pool rate:/, /Blended pool rate:/, /Reference pool rate:/]) {
      expect(screen.queryByText(qualifier), String(qualifier)).toBeNull();
    }
  });

  it('should show no 0%, no stale figure, no fabricated estimate', () => {
    renderDetail();
    const body = document.body.textContent ?? '';
    expect(body).not.toMatch(/\b0(\.00)?%\/yr/);
    expect(body).not.toMatch(/4(\.00)?%\/yr/);
  });

  it('should keep the candidate INSPECTABLE — identity, path and risk survive', () => {
    /* Ruling §5: preserve still-true candidate information. */
    renderDetail();
    expect(screen.getByText('What it is')).toBeTruthy();
    expect(screen.getByText(/real protocols on/)).toBeTruthy();
    expect(screen.getByText(/Sky SSR/)).toBeTruthy();
    expect(screen.getByText(/Stable strategies aim to hold their value/)).toBeTruthy();
  });

  it('should block continuation even when a handler IS supplied', () => {
    /**
     * The gate is applied in the component as well as the parent: blocking in
     * one place only is how "cannot commit" becomes "committed anyway" two
     * refactors later.
     */
    renderDetail(LIVE, undefined, () => {});
    const cta = screen.getByRole('button', { name: 'Put money to work' }) as HTMLButtonElement;
    expect(cta.disabled).toBe(true);
  });

  it('should give the CANDIDATE reason, not the cost reason', () => {
    /* An unavailable rate is a broader statement than "this cost cannot be
       priced", and must not be described as a cost problem. One reason. */
    renderDetail();
    expect(screen.getAllByText('This option is not available right now').length).toBeGreaterThan(0);
    expect(screen.queryByText(/Enter an amount above/)).toBeNull();
  });
});
