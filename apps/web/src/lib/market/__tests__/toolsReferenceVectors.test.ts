/**
 * TOOLS-VEC-1 · every Money Tools reference result is compared in CI (post-merge audit,
 * 2026-11-11; founder answer 8: "a CI comparison of every reference result").
 *
 * Requirement: each of the reference vectors in `docs/tech/audit-bundle/TEST_VECTORS.json`
 * (`scenarios`, 11 tools) equals what the stress harness computes for the same input, within the
 * vector's own tolerance (numbers) or exactly (text). The harness computes with the product's
 * rates (TOOLS-PT-1 checks that copy field by field), and the asset-history vectors carry an end
 * month, so a monthly append never moves them (the 5.478 rule). Before this, the vectors were
 * compared by nobody and 88 of their numeric fields had silently gone stale.
 *
 * It reads `monthlyPrices.json` through the harness, not directly (like TOOLS-PT-1): safe only
 * because every asset-history vector is pinned, which this test asserts. Outside the weekly-gate
 * directories.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { computeScenarios, sanitize } from '../../../../scripts/tools-stress-test.mjs';

type Vector = {
  id: string;
  input: unknown;
  expectedOutput?: Record<string, unknown>;
  tolerance?: Record<string, { absolute?: number }>;
  endYm?: string;
};
const VECTORS = JSON.parse(
  readFileSync(
    join(__dirname, '../../../../../../docs/tech/audit-bundle/TEST_VECTORS.json'),
    'utf8'
  )
).scenarios as Record<string, Vector[]>;

const pins = [...new Set(VECTORS.assetHistory.map((v) => v.endYm))];
const scenarios = sanitize(
  computeScenarios({ assetHistoryEndYm: pins[0] ?? null })
) as unknown as Record<string, { input: unknown; output: Record<string, unknown> }[]>;

describe('TOOLS-VEC-1: every reference vector equals the harness', () => {
  it('should pin every asset-history vector to one end month', () => {
    expect(pins).toHaveLength(1);
    expect(pins[0]).toMatch(/^\d{4}-\d{2}-01$/);
  });

  it('should cover every tool and keep the vector count (none dropped silently)', () => {
    const count = Object.values(VECTORS).reduce((n, v) => n + v.length, 0);
    expect(Object.keys(VECTORS)).toHaveLength(11);
    expect(count).toBe(140);
  });

  for (const [tool, vectors] of Object.entries(VECTORS)) {
    it(`should match ${tool} (${vectors.length} vectors) within each vector's tolerance`, () => {
      const got = scenarios[tool];
      expect(got, tool).toBeDefined();
      const wrong: string[] = [];
      vectors.forEach((v, i) => {
        const s = got[i];
        if (!s) return wrong.push(`${v.id}: no harness scenario`);
        if (JSON.stringify(s.input) !== JSON.stringify(v.input))
          return wrong.push(`${v.id}: input differs`);
        for (const [k, exp] of Object.entries(v.expectedOutput ?? {})) {
          const val = s.output?.[k];
          const tol = v.tolerance?.[k]?.absolute ?? 0;
          const ok =
            typeof exp === 'number' && typeof val === 'number'
              ? Math.abs(val - exp) <= tol + 1e-9
              : JSON.stringify(val) === JSON.stringify(exp);
          if (!ok)
            wrong.push(`${v.id}.${k}: expected ${JSON.stringify(exp)}, got ${JSON.stringify(val)}`);
        }
      });
      expect(wrong).toEqual([]);
    }, 30_000);
  }
});
