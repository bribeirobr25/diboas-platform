import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * The chart-fill dark-mode rule, made mechanical after the THIRD instance.
 *
 * The accent PLATE (`--sb-mode-accent-subtle`) and the accent WASH
 * (`--sb-surface-accent`) are the same step in light mode, so substituting one
 * for the other is invisible in every light screenshot. Only the wash has a
 * dark value: the plate stays light on purpose (it backs small icon badges).
 * A large surface filled with the plate therefore stays near-white and paints
 * a pale blob across the dark card — legible in dark mode only.
 *
 * That defect was found and fixed three times under the pre-I-1d names
 * (`--sb-accent-tint` vs `--sb-card-tint`):
 *
 *   1. `Sparkline.module.css`  — fixed in the §4.12 pass
 *   2. `ApyChart.module.css`   — fixed in the same pass
 *   3. `ValueChart.module.css` — MISSED by that pass; found on 2026-09-10 by
 *      the dark-mode leg of the `5.199` visual verification
 *
 * A comment in file A cannot protect file C, so the rule is a test. I-1d
 * renamed both tokens; the rule carries over unchanged.
 *
 * **Scope, deliberately narrow.** The plate is CORRECT for small icon badges.
 * This asserts only the large-surface case: an SVG `fill`, which is a large
 * surface by definition. `tokenArchitecture.test.ts` owns the wider pairing
 * rules (what may sit on the plate, in every theme).
 */

const COMPONENTS = join(process.cwd(), 'src', 'components');
const TOKENS = join(process.cwd(), 'src', 'styles', 'tokens.css');

describe('chart area fills survive dark mode', () => {
  it('should never fill an SVG surface with the light-only accent plate', () => {
    const offenders: string[] = [];

    for (const file of readdirSync(COMPONENTS).filter((f) => f.endsWith('.module.css'))) {
      const css = readFileSync(join(COMPONENTS, file), 'utf8');
      for (const [index, line] of css.split('\n').entries()) {
        // A declaration, not a comment: comments that explain the rule must
        // not trip it.
        const declaration = line.split('/*')[0];
        if (/\bfill\s*:\s*var\(\s*--sb-mode-accent-subtle\s*\)/.test(declaration)) {
          offenders.push(`${file}:${index + 1}`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });

  it('should keep a dark value on the token the charts DO use', () => {
    // The fix only works because the wash is redefined for dark. If that
    // override is ever dropped, every chart regresses at once and this test is
    // the only thing that would say so.
    const tokens = readFileSync(TOKENS, 'utf8');
    const washes = [...tokens.matchAll(/--sb-surface-accent\s*:\s*([^;]+);/g)].map((m) =>
      m[1].trim()
    );
    const light = 'var(--sb-mode-50)';
    expect(washes).toContain(light);
    // Two dark copies (explicit + system), each different from the light step.
    expect(washes.filter((v) => v !== light).length).toBeGreaterThanOrEqual(2);
  });
});
