# Data Vintage Policy — What dates and windows every diBoaS number must obey

> **Status: RATIFIED by founder 2026-07-05.** Canonical standing policy. Origin record deleted (delete-after-execution) — this file is the complete policy. Enforcement rides `docs/audit/PROTOCOLS_STRATEGIES_DATA_VINTAGE_PLAN_2026-07-05.md` (tasks 0–6, incl. the `validate:market-data` vintage gate).
> **Pointers to add (delegated to the data-batch PR):** one reference line in `CLAUDE.md` (data rules) and one in `docs/tech/financial-calculations.md`, per §4.4.

## 1. The Policy

**P-1 — Return/rate figures are multi-year averages.** Any figure presented as a return, yield, growth rate, depreciation rate, or scenario rate (on `/strategies`, `/tools`, `/learn`, PreDream, comparison tables) is derived from a multi-year historical window — never the current month, never an isolated last month. Trailing windows saturate at the full available series.

**P-2 — The window ends at the last COMPLETE month.** The current (in-progress) month never enters any average.

**P-3 — Size figures are dated snapshots, not averages.** Protocol TVL and similar "how big is X" figures are point-in-time snapshots carrying **one** honest verification date and a confirmed methodology (which metric, which source, which scope). Snapshots are taken **as of the end of the last completed month** — the month-end value from the source's historical series where available — and labeled "as of <Month Year>". Where a source offers no historical series, a spot fetch is used and dated with its **actual fetch date**, never re-labeled. Every figure on the site dates to the last closed month.

**P-4 — Never post-date unverified data.** A figure keeps its old date until it is re-verified on the confirmed methodology. Freshness is never simulated by re-stamping.

**P-5 — `/market` is exempt.** The BTC Macro Regime Dashboard runs on the diboas-analytics live pipeline with its own cadence, staleness gates, and data-status honesty rules.

**P-6 — Every constant knows its provenance.** Market constants carry `lastVerified` metadata (source + date + window/methodology). A figure without provenance is a bug. This extends the `constants.ts` metadata convention to all data-fed surfaces, including `protocols.json`.

## 2. Scope notes (founder-resolved 2026-07-05)

- Investor-room market-size/TAM figures follow **P-4/P-6** (dated + sourced), not P-1 — they are research numbers, not return series.
- Monthly data series in scope: `apps/web/src/lib/market-data/data/monthlyPrices.json` (8 series; total-return series carry `closePriceOnly` per month) **and** `monthlyFx.json` (all currencies) — both must end on the same last-complete month (enforced by the vintage gate).
- Bar-signed anchor test vectors (per `docs/tech/TOOLS_VALIDATION.md`) are re-validated on every monthly append; **any shifted anchor returns to the founder for explicit re-sign — never silent drift.** Forward calibration constants (EUR 0.55%, BRL 6.21% — FX-16 D1) are deliberate constants and are never recomputed by an append.

## 3. Enforcement

1. **Monthly append step:** month-boundary task in the weekly runbook — append the just-completed month to both series files, re-run `pnpm validate:market-data` + the tools stress harness, re-validate anchors. Owner: Data Ops (5.54).
2. **Vintage gate in `validate:market-data`:** (a) each series' last `ym` = last complete month or a logged exception; (b) no series contains the current month; (c) `monthlyPrices.json` and `monthlyFx.json` end on the same month across all series/currencies; (d) every TR-series month row carries `closePriceOnly`. Build fails on violation.
3. **Provenance completion:** `lastVerified` + methodology fields on `protocols.json` TVL entries.
