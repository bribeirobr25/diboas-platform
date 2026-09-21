import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * STAGE H · ACTIONABILITY HAS NO SUBJECT IN PRACTICE TODAY — MEASURED.
 *
 * M&E / Data ruling 2026-09-22 §12: implement only actionability behaviour that
 * has an actual authorized journey/state subject today, and where none exists,
 * record `N/A / deferred` **with measured proof** rather than fabricating
 * executable machinery to claim H completeness.
 *
 * This file IS that proof, kept mechanical so it cannot go quietly stale the
 * way a sentence in an audit document would. It measures two things:
 *
 * ```text
 * production producers of EXECUTABLE evidence   = 0
 * signing / submission / broadcast surfaces     = 0
 * ```
 *
 * Canon §22 is the reason both must stay 0 for now: F/G/H create no Real
 * execution. When Real execution is authorized (step I-8), this test is
 * EXPECTED to fail — and that failure is the signal that actionability now has
 * a subject and Stage H's deferral must be revisited, not a reason to delete
 * the guard.
 *
 * ⚑ `isExecutable` and `executableEvidence` still exist and are still tested.
 * The contract is built; what does not exist is anything in production that
 * PRODUCES executable evidence. Those are different claims, and collapsing them
 * is how "the mechanism exists" becomes "the behaviour is implemented".
 */

const SRC = new URL('..', import.meta.url).pathname;

/** Every production `.ts` under packages/defi/src — tests and fixtures excluded. */
function productionSources(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      if (entry === '__tests__') continue;
      productionSources(path, out);
    } else if (entry.endsWith('.ts') && entry !== 'testing.ts') {
      out.push(path);
    }
  }
  return out;
}

/** Source with comments stripped — a symbol discussed in prose is not a call. */
const codeOf = (path: string) =>
  readFileSync(path, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');

describe('actionability: no production subject exists, so H defers it', () => {
  it('should find no production CALLER of executableEvidence', () => {
    /* `evidence.ts` DECLARES it; the measurement is about callers. */
    const callers = productionSources(SRC).filter(
      (path) => !path.endsWith('evidence.ts') && /executableEvidence\s*\(/.test(codeOf(path))
    );
    expect(callers, 'an executable producer would give actionability a subject').toEqual([]);
  });

  it('should find no signing, submission or broadcast surface', () => {
    /* Canon §22: authorization, signing, submission and custody are Real-only
       extensions outside this batch. Measured, not assumed. */
    const forbidden = [
      'signTransaction',
      'submitTransaction',
      'broadcastTransaction',
      'custodyKey',
    ];
    for (const path of productionSources(SRC)) {
      const code = codeOf(path);
      for (const symbol of forbidden) {
        expect(code, `${symbol} in ${path} would introduce Real execution`).not.toContain(symbol);
      }
    }
  });

  it('should keep the executable CONTRACT available for when a subject arrives', () => {
    /* The deferral is about behaviour, not about deleting the axis: H must not
       quietly collapse actionability into "everything is REFERENCE". */
    const evidence = codeOf(join(SRC, 'evidence.ts'));
    expect(evidence).toContain("'REFERENCE' | 'EXECUTABLE'");
    expect(evidence).toContain('export function isExecutable');
  });
});
