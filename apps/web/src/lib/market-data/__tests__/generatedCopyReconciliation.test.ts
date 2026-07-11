/**
 * P3 Stage-4 reconciliation (F-M4 extension, 2026-07-11) — the editorial
 * copy the /market page renders MUST match what the template generator
 * produces from `computed.json`. A hand-edited signal sentence, group
 * summary, or plain summary that drifts from the generator fails CI, so
 * weekly copy stays template-sourced (the F-M9 convergence guarantee).
 *
 * This test shells the generator's `--check` mode (the single source of
 * truth for the diff) and asserts a clean exit. Regenerate with:
 *   node apps/web/scripts/market-refresh/generate.mjs
 */

import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';

const GENERATOR = join(__dirname, '../../../../scripts/market-refresh/generate.mjs');

describe('market generated-copy reconciliation (P3 §B Stage 4)', () => {
  it('should render exactly what the template generator produces (generate.mjs --check)', () => {
    let ok = true;
    let output = '';
    try {
      output = execFileSync('node', [GENERATOR, '--check'], { encoding: 'utf8' });
    } catch (err) {
      ok = false;
      output = `${(err as { stdout?: string }).stdout ?? ''}${(err as { stderr?: string }).stderr ?? ''}`;
    }
    expect(ok, `generator reported drift — regenerate via generate.mjs:\n${output}`).toBe(true);
    expect(output).toContain('no drift');
  });
});
