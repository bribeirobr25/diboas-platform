/**
 * PR-RECORD (register 5.727) — a pull request body carries the increment-review record.
 *
 * The check reads its required fields from `docs/tech/increment-review-gate.md` § Return block,
 * so these tests prove three things: the fields really come from that document, a body missing
 * or leaving any of them as the template fails, and the two automated PR sources stay exempt.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  EXEMPT_HEADS,
  recordProblems,
  recordSpec,
} from '../../../../../scripts/check-pr-record.mjs';

const REPO = resolve(__dirname, '../../../../..');
const GATE = readFileSync(join(REPO, 'docs/tech/increment-review-gate.md'), 'utf8');
const SPEC = recordSpec(GATE);

/** A body with every field filled; `except` drops one, `blank` leaves one as the template. */
function body({ except = '', blank = '', state = 'IMPLEMENTED ON BRANCH (feat/x)' } = {}) {
  return [
    '**What this changes.** Something.',
    '',
    '```text',
    ...SPEC.fields
      .filter((f) => f !== except)
      .map((f) => `${f} = ${f === blank ? '<…>' : f === 'STATE' ? state : 'filled in'}`),
    '```',
  ].join('\n');
}

function cli(text: string, head = 'feat/x'): { code: number; out: string } {
  try {
    const out = execFileSync('node', [join(REPO, 'scripts/check-pr-record.mjs')], {
      env: { ...process.env, PR_BODY: text, PR_HEAD: head },
      encoding: 'utf8',
      stdio: 'pipe',
    });
    return { code: 0, out };
  } catch (e) {
    const err = e as { status: number; stderr: string; stdout: string };
    return { code: err.status, out: `${err.stdout}${err.stderr}` };
  }
}

describe('PR-RECORD · the increment-review record is in every PR body (5.727)', () => {
  it('should read all fields and the three states from the gate document itself', () => {
    expect(SPEC.fields.length).toBeGreaterThanOrEqual(14);
    expect(SPEC.fields).toEqual(
      expect.arrayContaining(['INCREMENT', 'STATE', 'FIXED / REGISTERED'])
    );
    expect(SPEC.states).toEqual(['IMPLEMENTED ON BRANCH', 'MERGED TO MAIN', 'DEPLOYED·LIVE']);
  });

  it('should PASS a body with every field filled in', () => {
    expect(recordProblems(body(), SPEC)).toEqual([]);
    expect(cli(body()).code).toBe(0);
  });

  it('should FAIL a body with no record, a missing field, a template value or no real state', () => {
    expect(cli('**What this changes.** Evidence only, no record.').code).toBe(1);
    for (const field of SPEC.fields) {
      expect(recordProblems(body({ except: field }), SPEC), field).toEqual([`missing: ${field}`]);
      expect(recordProblems(body({ blank: field }), SPEC), field).toEqual([
        `not filled in: ${field}`,
      ]);
    }
    expect(recordProblems(body({ state: 'done' }), SPEC)).toEqual([
      'STATE names none of: IMPLEMENTED ON BRANCH | MERGED TO MAIN | DEPLOYED·LIVE',
    ]);
  });

  it('should exempt only the weekly market refresh and Dependabot', () => {
    expect(cli('no record', 'editorial/market-refresh-auto').code).toBe(0);
    expect(cli('no record', 'dependabot/npm_and_yarn/next-16.5.0').code).toBe(0);
    expect(cli('no record', 'editorial/market-refresh-manual').code).toBe(1);
    expect(EXEMPT_HEADS).toHaveLength(2);
  });

  it('should fail closed when the gate document loses its return block', () => {
    const spec = recordSpec(GATE.replace('## Return block', '## Something else'));
    expect(recordProblems(body(), spec)[0]).toMatch(/no fields found/);
  });

  /**
   * 5.818 — a push and a body edit in the same second started two runs; the concurrency rule
   * cancelled one, and the cancelled run of this REQUIRED check blocked #840's merge.
   */
  describe('5.818 · the workflow never cancels a run and reads the body when it runs', () => {
    const wf = readFileSync(join(REPO, '.github/workflows/pr-record.yml'), 'utf8');
    const runLines = wf.split('\n').filter((l) => /^\s*(?:- )?run:/.test(l));

    it('should have no concurrency group when a cancelled run would block a required check', () => {
      expect(wf).not.toMatch(/^concurrency:/m);
      expect(wf).not.toMatch(/cancel-in-progress/);
    });

    it('should read the body from the API at run time, never from the triggering event', () => {
      expect(wf).not.toMatch(/github\.event\.pull_request\.body/);
      expect(wf).toMatch(
        /gh api "repos\/\$REPO\/pulls\/\$PR_NUMBER" --jq '\.body \/\/ ""' > "\$RUNNER_TEMP\/pr-body\.md"/
      );
      expect(wf).toMatch(/check-pr-record\.mjs --file "\$RUNNER_TEMP\/pr-body\.md"/);
    });

    it('should interpolate no expression into a shell line (values arrive through env)', () => {
      expect(runLines.length).toBeGreaterThanOrEqual(2);
      for (const line of runLines) expect(line).not.toMatch(/\$\{\{/);
    });
  });
});
