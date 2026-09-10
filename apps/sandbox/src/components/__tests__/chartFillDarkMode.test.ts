import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * The chart-fill dark-mode rule, made mechanical after the THIRD instance.
 *
 * `--sb-accent-tint` and `--sb-card-tint` are the same `teal-50` in light mode,
 * so substituting one for the other is invisible in every light screenshot.
 * Only `--sb-card-tint` carries a dark-theme override. A large surface filled
 * with `accent-tint` therefore stays near-white and paints a pale blob across
 * the dark card — legible in dark mode only.
 *
 * That defect has now been found and fixed three times:
 *
 *   1. `Sparkline.module.css`  — fixed in the §4.12 pass
 *   2. `ApyChart.module.css`   — fixed in the same pass
 *   3. `ValueChart.module.css` — MISSED by that pass; found on 2026-09-10 by
 *      the dark-mode leg of the `5.199` visual verification, on the very
 *      screen being remediated
 *
 * Both earlier fixes left an explanatory comment in their own file, and the
 * third surface still shipped the defect — a comment in file A cannot protect
 * file C. So the rule is a test now.
 *
 * **Scope, deliberately narrow.** `accent-tint` is CORRECT for small icon
 * badges and stays light on purpose (see `SimulatedEventScreen.module.css`).
 * This asserts only the large-surface case: an SVG `fill`, which is a large
 * surface by definition. Backgrounds are not in scope and are not policed here.
 */

const COMPONENTS = join(process.cwd(), 'src', 'components');

describe('chart area fills survive dark mode', () => {
  it('should never fill an SVG surface with the light-only accent tint', () => {
    const offenders: string[] = [];

    for (const file of readdirSync(COMPONENTS).filter((f) => f.endsWith('.module.css'))) {
      const css = readFileSync(join(COMPONENTS, file), 'utf8');
      for (const [index, line] of css.split('\n').entries()) {
        // A declaration, not a comment: comments in Sparkline/ApyChart/
        // SimulatedEvent explain the rule and must not trip it.
        const declaration = line.split('/*')[0];
        if (/\bfill\s*:\s*var\(\s*--sb-accent-tint\s*\)/.test(declaration)) {
          offenders.push(`${file}:${index + 1}`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });

  it('should keep the dark override on the token the charts DO use', () => {
    // The fix only works because `--sb-card-tint` is redefined for dark. If
    // that override is ever dropped, every chart regresses at once and this
    // test is the only thing that would say so.
    const globals = readFileSync(join(process.cwd(), 'src', 'styles', 'globals.css'), 'utf8');
    const darkBlocks = globals
      .split('\n')
      .filter((l) => /--sb-card-tint\s*:/.test(l) && !/teal-50/.test(l));
    expect(darkBlocks.length).toBeGreaterThanOrEqual(1);
  });
});
