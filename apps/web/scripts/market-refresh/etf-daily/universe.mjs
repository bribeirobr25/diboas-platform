/**
 * universe.mjs — the US spot-Bitcoin ETFs whose flows ETF-01 sums (E1, 2026-10-20).
 *
 * EXPLICIT AND VERSIONED. The universe is this list, never "whatever a
 * provider's directory returns today": a fund missing from a provider's
 * directory or payload makes that provider's window INELIGIBLE, it never makes
 * the fund disappear. A change is a new version with an effective date, and
 * each publication records the version it used.
 *
 * MEMBERSHIP IS BY DATE. A fund is required for a session on or after its
 * listing day and before any delisting day, so a window that straddles a
 * listing is judged on the funds that existed on each day.
 *
 * Verification is recorded per fund. MSBT (owner decision 2026-10-20: include
 * subject to verification) is verified against the trust's SEC Form 10-Q,
 * which states the shares were listed on NYSE Arca on 2026-04-08. The legacy
 * eleven are the same set the share-count route (providers/polygon.mjs) has
 * always used; their listing dates come from the provider directory and all
 * precede any window this route can evaluate, so their exact day cannot change
 * a result.
 */

const LEGACY = 'provider directory (CryptoETF.today), read 2026-10-20';

export const ETF_UNIVERSE = Object.freeze({
  version: '2026-10-20.1',
  funds: Object.freeze(
    [
      { ticker: 'IBIT', listedOn: '2024-01-11', delistedOn: null, verification: LEGACY },
      { ticker: 'FBTC', listedOn: '2024-01-11', delistedOn: null, verification: LEGACY },
      { ticker: 'GBTC', listedOn: '2024-01-11', delistedOn: null, verification: LEGACY },
      { ticker: 'BTC', listedOn: '2024-07-31', delistedOn: null, verification: LEGACY },
      { ticker: 'ARKB', listedOn: '2024-01-11', delistedOn: null, verification: LEGACY },
      { ticker: 'BITB', listedOn: '2024-01-11', delistedOn: null, verification: LEGACY },
      { ticker: 'HODL', listedOn: '2024-01-11', delistedOn: null, verification: LEGACY },
      { ticker: 'BTCO', listedOn: '2024-01-11', delistedOn: null, verification: LEGACY },
      { ticker: 'EZBC', listedOn: '2024-01-11', delistedOn: null, verification: LEGACY },
      { ticker: 'BRRR', listedOn: '2024-01-11', delistedOn: null, verification: LEGACY },
      { ticker: 'BTCW', listedOn: '2024-01-11', delistedOn: null, verification: LEGACY },
      {
        ticker: 'MSBT',
        listedOn: '2026-04-08',
        delistedOn: null,
        verification:
          'SEC Form 10-Q (Morgan Stanley Bitcoin Trust, period ended 2026-06-30): listed on NYSE Arca 2026-04-08',
      },
    ].map((f) => Object.freeze(f))
  ),
  changes: Object.freeze([
    {
      version: '2026-10-20.1',
      effectiveFrom: '2026-04-08',
      change: 'first daily-route universe: the legacy eleven plus MSBT from its listing day',
    },
  ]),
});

/** The tickers a session requires: listed on or before it, not yet delisted. */
export function requiredFunds(session, universe = ETF_UNIVERSE) {
  return universe.funds
    .filter((f) => f.listedOn <= session && (f.delistedOn === null || session < f.delistedOn))
    .map((f) => f.ticker);
}
