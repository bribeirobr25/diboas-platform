# Data Vintage Policy — What dates and windows every diBoaS number must obey

> **Status: RATIFIED by founder 2026-07-05.** Canonical standing policy. Origin record deleted (delete-after-execution) — this file is the complete policy. Enforcement: §3 below (gate status: register `5.479` / `5.181`). The origin plan `docs/audit/PROTOCOLS_STRATEGIES_DATA_VINTAGE_PLAN_2026-07-05.md` _(⚠ NOT REACHABLE — deleted local-only 2026-10-29 after its durable content was checked against this file)_ held tasks 0–6, incl. the `validate:market-data` vintage gate.
> **Pointers to add (delegated to the data-batch PR):** one reference line in `CLAUDE.md` (data rules) and one in `docs/tech/financial-calculations.md`, per §4.4.

## 1. The Policy

**P-1 — Return/rate figures are multi-year averages.** Any figure presented as a return, yield, growth rate, depreciation rate, or scenario rate (on `/strategies`, `/tools`, `/learn`, PreDream, comparison tables; the Practice app under P-7) is derived from a multi-year historical window — never the current month, never an isolated last month. Trailing windows saturate at the full available series.

**P-2 — The window ends at the last COMPLETE month.** The current (in-progress) month never enters any average.

**P-3 — Size figures are dated snapshots, not averages.** Protocol TVL and similar "how big is X" figures are point-in-time snapshots carrying **one** honest verification date and a confirmed methodology (which metric, which source, which scope). Snapshots are taken **as of the end of the last completed month** — the month-end value from the source's historical series where available — and labeled "as of <Month Year>". Where a source offers no historical series, a spot fetch is used and dated with its **actual fetch date**, never re-labeled. Every figure on the site dates to the last closed month.

**P-4 — Never post-date unverified data.** A figure keeps its old date until it is re-verified on the confirmed methodology. Freshness is never simulated by re-stamping.

**P-5 — `/market` is exempt.** The BTC Macro Regime Dashboard runs on the diboas-analytics live pipeline with its own cadence, staleness gates, and data-status honesty rules.

**P-6 — Every constant knows its provenance.** Market constants carry `lastVerified` metadata (source + date + window/methodology). A figure without provenance is a bug. This extends the `constants.ts` metadata convention to all data-fed surfaces, including `protocols.json`.

**P-7 — The Practice app (`app.diboas.com`) is covered, with two carve-outs** (founder B33, 2026-10-22, register `5.236`; the projection window, founder 2026-11-05). P-1 to P-6 apply to its displayed figures, except:

- **The current spot rate (B33).** The app MAY show a pool's current spot rate, never as an average:
  - with its source stamp (for a multi-leg strategy, the stamp shown is the newest leg's);
  - judged against the Practice reference age bands (`packages/defi/src/freshnessPolicy.ts`, evaluated by `freshness.ts`): up to 7 days old it is DELAYED; over 7 up to 14 days it is STALE; over 14 days, unparseable, or more than a day in the future it is refused for current-facing use (`isRefusedForCurrentFacingUse`, `currentFacing.ts`) and shown as unavailable. A stricter source contract overrides these bands; they never loosen;
  - the age is judged when the screen renders (a screen left open keeps its first judgement);
  - a DELAYED or STALE rate must be shown as such, never as current. **Today a STALE rate is still labelled "Current pool rate" — register `5.814` owes that fix** (it needs new copy ×4).
- **The goal projection window (PR 2, `PROJECTION_POLICY` in `packages/investing/src/projection.ts`).** The projection states a RANGE: the lowest and highest 30-day average of the observed rates within the last 365 days up to today (the latest observation only sets where the data in that window ends), and it needs at least 90 overlapping observed days. That is neither P-1's multi-year average nor P-2's complete-month end; it is an observed recent range, labelled "not a forecast" in the app, and never a spot rate alone.
- **Historical replay** (the time machine, the charts) shows preserved observations; it is history, outside the age bands above.

## 2. Scope notes (founder-resolved 2026-07-05)

- Monthly data series in scope: `apps/web/src/lib/market-data/data/monthlyPrices.json` (8 series; total-return series carry `closePriceOnly` per month) **and** `monthlyFx.json` (all currencies) — both must end on the same last-complete month (enforced by the vintage gate).
- Bar-signed anchor test vectors (per `docs/tech/TOOLS_VALIDATION.md`) are re-validated on every monthly append; **any shifted anchor returns to the founder for explicit re-sign — never silent drift.** Forward calibration constants (EUR 0.55%, BRL 6.21% — FX-16 D1) are deliberate constants and are never recomputed by an append.

## 3. Enforcement

> **STATUS (plan `5.760` increment 2): item 2(c) is enforced for every series `publish.mjs` writes** (the Money Tools prices except BTC, and the eight FX rates): a month is published only when all of them have it (gate `PUBLISH-1`). BTC is still appended by `run.mjs --append-btc` until increment 3. The text below is the 2026-10-06 status, kept as history. **⚠ STATUS 2026-10-06 (PENDING_ALL 5.479, 5.181): item 2(c) below is NOT enforced.** The weekly pipeline appends the monthly PRICE series automatically (`--append-btc`, `tools-monthlies.mjs`), but the FX append (`monthlyFx.json`, ECB/PTAX) is still a manual runbook step. Measured: prices end 2026-09 on the 2026-10-05 refresh while FX ends 2026-07, and no gate failed. The Asset History calculator forward-fills a missing FX month from the latest available one, with no upper bound, so cross-currency results silently use July's rate. Treat 2(c) as a policy target, not a live control, until 5.479 lands.

1. **Monthly append step:** month-boundary task in the weekly runbook — append the just-completed month to both series files, re-run `pnpm validate:market-data` + the tools stress harness, re-validate anchors. Owner: Data Ops (5.54).
2. **Vintage gate in `validate:market-data`:** (a) each series' last `ym` = last complete month or a logged exception; (b) no series contains the current month; (c) `monthlyPrices.json` and `monthlyFx.json` end on the same month across all series/currencies; (d) every TR-series month row carries `closePriceOnly`. Build fails on violation.
3. **Provenance completion:** `lastVerified` + methodology fields on `protocols.json` TVL entries.
