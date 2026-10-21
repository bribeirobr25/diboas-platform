import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * ⚙ `EVID-15` · A PROVIDER'S FORECAST MAY NOT REACH A PRODUCT DECISION SURFACE.
 *
 * DeFiLlama ships `predictions.predictedClass` on every pool — today reading
 * `"Down"` for `sanctumInf`, `jito` and `aaveV3`. It is a **provider opinion
 * about the future**, and the Voice Rubric's Q3 (never selling, promising or
 * advising) plus the claims lexicon make it unusable on a money surface without
 * new explicit authority. Current posture: **PROHIBITED**.
 *
 * ⚑ THIS IS PREVENTIVE, NOT REMEDIAL. Measured when written: zero references
 * anywhere in `packages/defi` or `apps/sandbox`. Nothing is being removed — the
 * point is that the next adapter edit cannot quietly add one, the same reason
 * `CI-N3` exists for a behaviour that is already correct.
 *
 * ⚑ IT GUARDS THE SHAPE, NOT A STRING. The adapter's `LlamaPool` interface is
 * the doorway: a field that is never declared cannot be read downstream, so the
 * interface is asserted as well as the call sites.
 */

const SRC = join(__dirname, '..');
/**
 * ⛑ BOTH ROOTS THE HEADER CLAIMS (P0 review, PB-3). The scan covered
 * `packages/defi` only while the header promised `apps/sandbox` too — and the
 * sandbox is where a Product decision surface actually renders. `.tsx` is in
 * scope for the same reason.
 */
const SANDBOX_SRC = join(__dirname, '../../../../apps/sandbox/src');
const ROOTS = [SRC, SANDBOX_SRC];

function productionFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry !== '__tests__' && entry !== 'test') productionFiles(full, acc);
      continue;
    }
    if (/\.tsx?$/.test(entry) && entry !== 'testing.ts') acc.push(full);
  }
  return acc;
}
const allProductionFiles = (): string[] => ROOTS.flatMap((root) => productionFiles(root));

/**
 * Provider fields that are FORECASTS rather than observations — and their
 * PARENT object (`predictions`), because passing the whole object along
 * (`x: pool.predictions`) carries the forecast without naming a child field.
 */
const FORECAST_FIELDS = [
  'predictedClass',
  'predictedProbability',
  'binnedConfidence',
  'predictions',
];

describe('EVID-15 · a provider forecast never reaches a Product decision surface', () => {
  it('should find production files to scan (the instrument is not vacuous)', () => {
    /* A guard whose corpus is empty passes while asserting nothing. Prove the
       scan reaches the adapter before trusting any zero it reports. */
    for (const root of ROOTS) {
      expect(productionFiles(root).length, `no production files under ${root}`).toBeGreaterThan(10);
    }
    const files = allProductionFiles();
    expect(files.some((f) => f.endsWith('providers/defillama.ts'))).toBe(true);
    expect(files.some((f) => f.endsWith('components/StrategyDetail.tsx'))).toBe(true);
  });

  it('should have NO production read of a provider forecast field', () => {
    const offenders: string[] = [];
    for (const f of allProductionFiles()) {
      const code = readFileSync(f, 'utf8');
      for (const field of FORECAST_FIELDS) {
        if (new RegExp(`\\b${field}\\b`).test(code)) offenders.push(`${f}:${field}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('should NOT declare a forecast field on the provider payload interface', () => {
    /**
     * The doorway, not just the room. `LlamaPool` is the adapter's view of a
     * pool; a field it does not declare cannot be read by anything downstream
     * without first being added here, which is what this assertion blocks.
     */
    const code = readFileSync(join(SRC, 'providers/defillama.ts'), 'utf8');
    const iface = code.slice(code.indexOf('interface LlamaPool'));
    const body = iface.slice(0, iface.indexOf('\n}'));
    expect(body.length).toBeGreaterThan(40); /* non-vacuity: the interface was found */
    for (const field of FORECAST_FIELDS) {
      expect(body, field).not.toMatch(new RegExp(`\\b${field}\\b`));
    }
  });

  it('should still permit OBSERVED fields — the ban is on forecasts, not on payload reads', () => {
    /* The other direction. A guard that banned every provider field would be
       trivially satisfiable by reading nothing, and would also be wrong. */
    const code = readFileSync(join(SRC, 'providers/defillama.ts'), 'utf8');
    for (const observed of ['apyBase', 'apyReward', 'tvlUsd']) {
      expect(code, observed).toMatch(new RegExp(`\\b${observed}\\b`));
    }
  });
});
