import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * HISTORICAL REPLAY IS EXEMPT FROM CURRENT-FACING AGE ENFORCEMENT.
 *
 * M&E / Data ruling 2026-09-22 (`5.309`) §5:
 *
 * ```text
 * HISTORICAL REPLAY != CURRENT-FACING FRESHNESS
 * replay uses the historical evidence/version belonging to that historical
 * state, irrespective of whether it is older than 7 or 14 days TODAY
 * ```
 *
 * ⚑ WHY THIS IS A GUARD AND NOT A COMMENT. Stage H introduces a gate that
 * turns over-age evidence UNAVAILABLE. Pointed at the replay path it would
 * delete the product's history: every replayed day is, by definition, older
 * than today, so a >14-day rule applied there refuses *everything* — and it
 * would do so silently, looking like "no data" rather than like a bug. The
 * exemption therefore has to be mechanical.
 *
 * The strongest proof is structural and is asserted first: `@diboas/investing`,
 * which owns accrual replay, declares no dependency on `@diboas/defi` at all,
 * so the gate is not merely unused there — it is unreachable. The scan below
 * covers the sandbox composition layer, where both packages ARE in scope.
 */

const REPLAY_COMPOSITION = [
  '../advancePlanner.ts',
  '../positionSeries.ts',
  '../practiceSeries.ts',
  '../monthReport.ts',
] as const;

/** Source with comments stripped — a symbol named in prose is not a call. */
function codeOf(relative: string): string {
  return readFileSync(new URL(relative, import.meta.url), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');
}

describe('historical replay is exempt from current-facing freshness enforcement', () => {
  it('should keep the accrual-replay engine structurally unable to reach the gate', () => {
    /* `@diboas/investing` holds the replay arithmetic and depends on
       decimal.js alone. No defi edge exists, so no H gate can be imported
       there even by accident. */
    const manifest = JSON.parse(
      readFileSync(
        new URL('../../../../../packages/investing/package.json', import.meta.url),
        'utf8'
      )
    ) as { dependencies?: Record<string, string> };
    expect(Object.keys(manifest.dependencies ?? {})).not.toContain('@diboas/defi');
  });

  it.each(REPLAY_COMPOSITION)('should not apply the current-facing gate in %s', (file) => {
    const code = codeOf(file);
    for (const forbidden of [
      'enforceCurrentFacingAvailability',
      'isRefusedForCurrentFacingUse',
      'dataFreshness',
      'freshnessUnder',
      'FRESHNESS_STALE_MAX_DAYS',
      'FRESHNESS_DELAYED_MAX_DAYS',
    ]) {
      expect(
        code,
        `${forbidden} in ${file} would apply today's age rule to a historical state`
      ).not.toContain(forbidden);
    }
  });

  it('should not rewrite a historical stamp to look current', () => {
    /* The other half of §5: replay must not be made to pass by moving the
       evidence forward. A replay module that writes `asOf` is manufacturing
       currency for old evidence, which is the `5.309` prohibition on a
       "refreshed asOf on old evidence" stated at the composition layer. */
    for (const file of REPLAY_COMPOSITION) {
      expect(codeOf(file), `${file} must not assign asOf`).not.toMatch(/asOf\s*[:=]\s*(?!.*\?)/);
    }
  });
});
