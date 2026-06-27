# Adelaide Daily — Editorial Handoff Guide

> **Scope:** The editorial JSON-update workflow for `/market` only (cadence, per-field rules, PR flow). Host-side integration wiring lives in `diboas-analytics.md`; the canonical analytics product spec + drift log lives in `docs/mvp/integration/13_host_integration_guides/diboas_platform.md`. Do not duplicate either here.

> **Audience:** the editorial owner of `/market` (Adelaide Daily). The macro analyst, content owner, or designated curator who keeps the regime score, signal states, and commentary fresh.
> **Goal:** ship a regime-score / signals / commentary update in under 30 minutes, end-to-end, without engineering hand-holding.
> **Last updated:** 2026-05-14 (iteration 3 of `docs/audit/MARKET_INTEGRATION_PLAN_2026-05-13.md`).

---

## 1. What this doc is for (and what it isn't)

**It covers:** weekly / daily editorial updates to the live data shown on `/market`. Editing JSON, opening a PR, getting it merged, and confirming the change is live.

**It does NOT cover:**

- Adding new fields, new endpoints, or new signal types. Those are engineering changes (the SDK contract). Request them via the standard product channel; iteration 5 may also reshape this via the real SDK from `@analytics-platform/client`.
- Anything inside `apps/web/src/` (engineering-owned code).
- The other `docs/integrations/diboas-analytics.md` file — that one covers the analytics-platform integration itself, not the editorial workflow on this host.

If the answer to your question isn't in this doc, escalate to engineering.

---

## 2. Directory layout

All editorially-owned data lives under one path:

```
apps/web/data/market/
  regime.json                 # Current regime score + label + summary + signal groups
  historical.json             # 52-week time series of past regime scores
  signals.json                # Detailed per-signal data (used by the expandable cards)
  data-status.json            # Per-upstream-source freshness pills (CoinGecko, FRED:M2SL, etc.)
  methodology.json            # Canonical methodology metadata (version, bands, URL)
  product-disclaimer.json     # Educational-framing disclaimer text (legal-driven; rare edits)
```

**Reproducible compute helper:** `apps/web/scripts/data-fetchers/compute-regime.mjs` is the engineering-owned, doc-02-conformant compute path for the 11-signal registry. It pulls the underlying data (FRED, Yahoo, in-repo BTC monthlies), applies the strict-Friday weekly resampling convention (locked — never use intra-week values as "the latest weekly close"), enforces the §5.1 confirmed-candle rule on BTC monthly signals, and prints per-signal state + group totals + score. Run it before every refresh and copy the resulting state/points into `regime.json` + `signals.json`. ETF-01 is the only signal it does NOT auto-compute (manual feed per spec §8.3 — see §8 troubleshooting below).

### What each file drives on the rendered page

| File                      | UI element it powers on `/market`                                                                                                                                                                         |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `regime.json`             | Big "10 / 14" score badge, "Constructive" / "High confidence" pills, detailed summary paragraph, the 4 signal-group cards (BTC Structure / Macro Environment / Institutional Demand / Relative Strength). |
| `historical.json`         | The "Score over time" line chart.                                                                                                                                                                         |
| `signals.json`            | The per-card sub-signal list that appears when a user clicks "Show signals" on a card (BTC vs. long-term MA, etc.).                                                                                       |
| `data-status.json`        | The "Data sources" pill row (CoinGecko · FRESH, FRED:M2SL · DELAYED, etc.).                                                                                                                               |
| `methodology.json`        | "Read the methodology" link target metadata + score-band ranges.                                                                                                                                          |
| `product-disclaimer.json` | The educational-disclaimer note above the host's regulatory disclaimer.                                                                                                                                   |

### Intentional divergence from `apps/web/src/lib/analytics-sdk/fixtures/` (L5 round-3)

The iter-2 fixtures at `apps/web/src/lib/analytics-sdk/fixtures/` (including `regime-constructive.json`) are **engineering-owned** Storybook + drift-test reference data. They started byte-identical to your editorial copies on day 1 and will intentionally diverge as you update the live copy.

**You should NOT edit anything inside `apps/web/src/`** to "keep parity" with your editorial changes. That directory is engineering's, serves a different purpose (testing component shape), and editing it bypasses the CODEOWNERS review chain. The two-location split is intentional per the iter-3 plan §6.3.

---

## 3. Editorial cadence guidance

| File                      | Cadence                                        | Trigger                                                                                                       |
| ------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `regime.json`             | Weekly (or as the macro environment shifts)    | Tuesday before close is the default rhythm. Update whenever you'd say the environment has materially changed. |
| `historical.json`         | Append-only weekly                             | Add one new snapshot per week. If the array exceeds 52 entries, prune the oldest.                             |
| `signals.json`            | Weekly                                         | Per-signal `state` + `last_updated_at`. Some sub-signals will be stale faster than others.                    |
| `data-status.json`        | Daily (or whenever upstream freshness changes) | Flip a source from `FRESH` → `DELAYED` → `STALE` based on the upstream age.                                   |
| `methodology.json`        | Rare                                           | Only on methodology version bump.                                                                             |
| `product-disclaimer.json` | Very rare                                      | Only on legal-driven copy change.                                                                             |

**Hard floor:** `regime.json#last_updated_at` MUST be within **14 days** of every CI run. The fixture-drift Vitest test (`pnpm validate:market-data`) fails if it's older — this catches the "we forgot for a month" failure mode.

---

## 4. Per-field rules

### `regime.json`

| Field              | Constraint                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `score`            | Integer 0–14                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `max_score`        | Always `14` (don't change)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `regime_code`      | One of: `VERY_FAVORABLE`, `CONSTRUCTIVE`, `NEUTRAL_MIXED`, `DEFENSIVE`, `HOSTILE`. The score-to-band mapping table lives in `methodology.json#score_bands` — keep these aligned.                                                                                                                                                                                                                                                                                                                                                        |
| `regime_label`     | Free string. Editorial doesn't need to translate this — the page reads localized regime labels from the host's translation files (`packages/i18n/translations/*/market.json`). Keep the English string here aligned with the host's `dashboard.regimeLabels.*` for SDK-shape consistency.                                                                                                                                                                                                                                               |
| `environment_bias` | One of: `STRONG_ALIGNMENT`, `CONSTRUCTIVE`, `MIXED`, `DEFENSIVE`, `HOSTILE`. Editorial judgment call.                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `summary`          | Object keyed by locale (`en`, `pt-BR`, `es`, `de`) — see §5 below for the translation workflow. Each locale has `short`, `detailed`, `confidence_level` (`HIGH` / `MODERATE` / `LOW`), `mixed_signals` (boolean), `key_supportive_factors` (array of strings), `key_headwinds` (array of strings).                                                                                                                                                                                                                                      |
| `signal_groups`    | Array of 4 objects: BTC Structure (6 max pts), Macro Environment (3 max pts), Institutional Demand (2 max pts), Relative Strength (3 max pts) = 14 total. Each group has localized `title` + localized `summary`.                                                                                                                                                                                                                                                                                                                       |
| `data_status`      | Per-source freshness — MUST mirror `data-status.json` exactly (same source set, same per-source entries, same `overall_confidence` / `last_successful_update_at` / `delayed_sources` / `unavailable_sources`). This is an audit gate: the embedded inline copy and the standalone file are the same contract surface served two ways. The only legal divergence is the `_comment` metadata key in `data-status.json` (no runtime presence). After editing, sanity-check with a JSON diff that the per-source arrays are byte-identical. |
| `last_updated_at`  | ISO-8601 UTC timestamp. Must be within 14 days of every CI run (staleness gate).                                                                                                                                                                                                                                                                                                                                                                                                                                                        |

### `historical.json`

| Field            | Constraint                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `range`          | Always `"1y"` for now                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `snapshots`      | Array of 50+ entries, each with `date` (ISO date), `score` (integer 0–14), `regime_code` (the 5-band enum)                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `synthetic_seed` | Optional boolean. When `true`, the snapshots are illustrative seed data (pre-canonical-engine), and the trend-chart section on `/market` is suppressed via the page conditional `!historical.synthetic_seed`. Set this true when real engine snapshots haven't accumulated yet — avoids a card-vs-chart contradiction (the current regime card showing the real value while the chart still renders the synthetic tail). Remove (or flip to `false`) once enough real snapshots are appended. Tracked in PENDING_ALL.md 5.27. |

### `signals.json`

Same shape as `regime.json#signal_groups` but with the full per-signal array populated (the per-card sub-signals). Each signal under `signals[*].signals[*]` has a localized `title` + localized `summary`.

### `data-status.json`

| Field                | Constraint                                                                                                                                                                   |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `overall_confidence` | `HIGH` / `MODERATE` / `LOW`                                                                                                                                                  |
| `sources[*]`         | Each source has `source` (string), `status` (`FRESH` / `STALE` / `DELAYED` / `UNAVAILABLE`), `last_updated_at`, `expected_next_update_at`, `stale_after`, optional `message` |

**Mirror audit gate:** this file and `regime.json#data_status` MUST list the same source set with byte-identical per-source entries (same `overall_confidence`, `last_successful_update_at`, `sources[]`, `delayed_sources`, `unavailable_sources`). The only legal divergence is this file's `_comment` metadata key (no runtime presence). See the corresponding `regime.json#data_status` field rule above. Quick check: `node -e "const r=require('./regime.json').data_status; const s=require('./data-status.json'); console.log(r.sources.map(x=>JSON.stringify(x)).sort().join('\n')===s.sources.map(x=>JSON.stringify(x)).sort().join('\n'))"` should print `true`.

### `methodology.json`

Versioned schema metadata. Edit only on methodology version bump. The `methodology_url` field must start with `https://diboas-analytics.com`.

### `product-disclaimer.json`

Object keyed by locale. Legal-driven. Edit only on disclaimer copy change.

---

## 5. Translation workflow (4 locales mandatory)

Every locale-keyed string field MUST carry all 4 locales: `en`, `pt-BR`, `es`, `de`. The drift-guard tests fail if any locale key is missing or empty.

**Recommended flow:**

1. Draft the English text first.
2. Send the new English copy to your translator (or use your TMS).
3. Paste the translations back into the `pt-BR`, `es`, `de` slots.
4. Run `pnpm validate:market-data` locally — this catches missing locale keys and Phase 7 jargon hits before you push.

**Don't push English-only edits and plan to translate later.** CI will reject the PR.

---

## 6. Phase 7 jargon ban (digital-dollar policy)

The following terms are **banned in editorial body copy**:

```
USDC, stablecoin, DeFi, tokenized, yield farming, liquidity pool, blockchain
```

Use **"digital dollar"** / **"dólar digital"** / **"Digital-Dollar"** / **"dólar digital"** instead. The ban also applies to "APY" in body copy (TILA Reg DD compliance text in `disclosure` / `disclaimer` keys is exempt).

The `pnpm validate:market-data` check enforces this gate via `scripts/check-market-data-jargon.mjs`. Matches inside keys with `disclosure`, `disclaimer`, or `regulatoryFootnote` in the path are exempted as the regulatory-carveout.

Reference: `CLAUDE.md` §"Digital dollar terminology + jargon ban (Phase 7 Q2a/Q4/2026-05-13)".

---

## 7. Step-by-step PR workflow

```bash
# 1. Get the latest main
git checkout main
git pull

# 2. Create your editorial branch (date in name for easy tracking)
git checkout -b editorial/regime-update-2026-05-21

# 3. Edit the JSON files in apps/web/data/market/

# 4. Validate locally BEFORE pushing
pnpm validate:market-data

# 5. Commit (clear message describing the editorial action)
git add apps/web/data/market/
git commit -m "editorial: regime drop 11→10 — macro slips to mixed after FRED:M2SL print"

# 6. Push and open a PR
git push -u origin editorial/regime-update-2026-05-21

# 7. PR auto-routes to the editorial CODEOWNERS reviewer.
#    CI runs validate:all + the visual-loop checks.
#    Once approved + green, merge to main.
```

On merge, Vercel auto-deploys `main`. The new build inlines your updated JSON into the bundle. The fresh `/market` page goes live typically within **3–10 minutes**.

---

## 8. What to do when things go wrong

### `pnpm validate:market-data` fails locally

| Error pattern                                         | Fix                                                                                                     |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `Phase 7 jargon gate FAILED — banned terms found`     | Search-replace the flagged term with the digital-dollar phrasing.                                       |
| `INVALID_JSON`                                        | Open the file in an editor with JSON syntax highlighting; fix the trailing comma / missing quote / etc. |
| Vitest test fails on locale-key check                 | One of your locale slots is missing or empty. Restore all 4 locale keys with non-empty strings.         |
| Vitest test fails on `score within [0, 14]`           | You set the score outside the valid range.                                                              |
| Vitest test fails on `last_updated_at within 14 days` | Update the timestamp to today (UTC).                                                                    |

### The PR's CI is red on a check you don't recognize

Don't fix engineering checks yourself — escalate to engineering. The CI tests cover schema parity, translation parity, bundle budget, etc. Editorial concerns are limited to the `validate:market-data` gate above.

### You merged the PR but `/market` still shows the old data after 15 minutes (NF7 round-3.6)

Editorial updates reach production via **Vercel auto-deploy**, not via ISR re-reading files. If you don't see your change after ~10 minutes:

1. **Check the Vercel dashboard first** — has the new deploy gone live? If not:
   - CI may have failed silently (look at the GitHub Actions tab for a red X).
   - The Vercel project may be paused.
   - The PR may have merged into a branch other than `main`.
2. **Don't wait the full hour** expecting ISR to catch up. ISR's `revalidate: 3600` is the upper bound for stale-cache flush after a new deploy is already live — it's not the delivery mechanism.
3. If Vercel shows a successful deploy but the page still looks old, flag engineering. Don't keep refreshing — it's likely a CDN cache issue they'll need to look at.

### You need to revert an editorial change

```bash
git checkout main
git pull
git revert <SHA-of-editorial-merge-commit>
git push origin main
```

This opens an inverse PR that, once merged, restores the previous state. Vercel auto-deploys the revert.

### You see a Sentry alert for `/market`

You don't need to act on Sentry alerts — those route to engineering. They cover SSR render errors, hydration mismatches, etc., which aren't editorial concerns.

### ETF-01 cannot strictly invoke §4.5 partial-data because too few trailing weeks are visible

ETF-01 (Institutional Demand, 2 pts) requires **≥3 of the trailing 4 weekly aggregates positive**, evaluated against the most recent confirmed Friday close. The default CoinGlass `/etf/bitcoin` page only renders the trailing ~10 trading days — typically 1 fully-confirmed prior week plus the current in-progress week — so you often cannot directly observe 3 of the 4 trailing weeks anchored at the confirmed Friday close.

Two valid paths to a 0-pt verdict, both producing identical scoring:

| Path                       | When to use                                                                                                 | State to write | Message framing                                                                                                             |
| -------------------------- | ----------------------------------------------------------------------------------------------------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------- |
| §4.5 partial-data INACTIVE | ≥2 of trailing 4 weeks are confirmed net-negative AND you can observe that data directly                    | `INACTIVE`     | "INACTIVE per §4.5 — N of trailing 4 weeks confirmed net-negative"                                                          |
| §10.1 UNAVAILABLE          | <2 of trailing 4 weeks are confirmable from your source(s), even if the visible direction supports INACTIVE | `UNAVAILABLE`  | "UNAVAILABLE per §10.1 — insufficient data for full trailing-4 evaluation; visible direction would otherwise read INACTIVE" |

Default to the more conservative §10.1 path when in doubt — overclaiming "confirmed net-negative" weeks that you can't actually see on the source is the methodology error to avoid. Both paths award 0 pts so the score outcome is invariant; only the messaging surfaces (signal-card summary + `data-status.json` source message) differ.

**CoinGlass route currently dead (as of 2026-06-26):** the CoinGlass spot-ETF routes (`/bitcoin-etf`, `/etf/bitcoin`, `/bitcoin-spot-etf`, plus the `/en/` and `/pro/i/` variants) all now return **HTTP 404** — the site's data-route structure changed and the page described above is no longer reachable. With no observable source, ETF-01 cannot confirm any trailing week, so it **defaults to the §10.1 UNAVAILABLE path** until a working source is wired. The real fix is the canonical Farside manual feed below.

The deeper fix is the canonical Farside manual feed, tracked in PENDING_ALL.md 5.28 — once acquired, the full trailing-4 window is auditable and §4.5 invocation becomes deterministic.

---

## 9. What this doc deliberately does NOT cover

- **Adding a new signal** (e.g., a sixth BTC structure indicator) — this is an engineering change (SDK contract extension). Request via product channel.
- **Adding a new locale** beyond the 4 supported (`en`, `pt-BR`, `es`, `de`) — engineering change (touches translation infrastructure).
- **Changing the score band cutoffs** (e.g., making CONSTRUCTIVE 8–11 instead of 9–11) — methodology change; requires methodology version bump in `methodology.json` and editorial review of all historical snapshots.
- **Changing the page layout or the order of sections on `/market`** — engineering change.
- **Configuring CODEOWNERS** to add additional editorial reviewers — engineering change; requires `.github/CODEOWNERS` edit + access verification.

If you're unsure whether a change is editorial or engineering, default to engineering — they can route the work or hand it back if it's editorial.

---

## 10. Reference links

- iteration-3 plan: `docs/audit/MARKET_INTEGRATION_ITERATION_3_PLAN_2026-05-14.md`
- iteration-2 plan (mock-SDK shape + dashboard composition): `docs/audit/MARKET_INTEGRATION_ITERATION_2_PLAN_2026-05-14.md`
- canonical methodology reference: https://diboas-analytics.com/methodology
- Phase 7 jargon ban policy: `CLAUDE.md` (search for "digital dollar")
- i18n locale list + naming conventions: `docs/tech/internationalization.md`
- ETF-01 net-flow sourcing + source fetchability / headless-browser policy: `docs/researches/MoneyTools_LiveData_Consolidated.md` §4.5
- canonical-vs-live drift log (signal-taxonomy + score-band decisions, D1/D2): `docs/mvp/integration/13_host_integration_guides/diboas_platform.md` §23
- reproducible compute helper (strict-Friday weekly resampling locked, §5.1 candle-lock for BTC monthlies, evaluates 10 of 11 signals — ETF-01 manual per §8.3): `apps/web/scripts/data-fetchers/compute-regime.mjs`
- standing pre-launch carry-forwards (chart strategy, Farside acquisition, LBMA replacement): `docs/audit/PENDING_ALL.md` items 5.27 / 5.28 / 5.29
