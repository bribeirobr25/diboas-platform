/**
 * PR-RECORD (register 5.727) — a pull request body carries the increment-review record.
 *
 * The check reads its required fields from `docs/tech/increment-review-gate.md` § Return block,
 * so these tests prove three things: the fields really come from that document, a body missing
 * or leaving any of them as the template fails, and the two automated PR sources stay exempt.
 */
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  EXEMPT_HEADS,
  isExempt,
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

const SAME_REPO = { PR_HEAD_REPO: 'o/r', PR_BASE_REPO: 'o/r' };

function cli(
  text: string,
  head = 'feat/x',
  extra: Record<string, string> = {}
): { code: number; out: string } {
  try {
    const out = execFileSync('node', [join(REPO, 'scripts/check-pr-record.mjs')], {
      env: { ...process.env, PR_BODY: text, PR_HEAD: head, ...extra },
      encoding: 'utf8',
      stdio: 'pipe',
    });
    return { code: 0, out };
  } catch (e) {
    const err = e as { status: number; stderr: string; stdout: string };
    return { code: err.status, out: `${err.stdout}${err.stderr}` };
  }
}

/** A line whose whole value is one expression under an UPPER_CASE env name. */
const ENV_VALUE_LINE = /^\s+[A-Z][A-Z0-9_]*:\s*\$\{\{[^}]*\}\}\s*$/;
/** Contexts a PR author, commenter or committer controls (GitHub's security-hardening list). */
const UNTRUSTED =
  /github\.(?:head_ref\b|event\.(?:issue|pull_request|comment|review|review_comment|pages|commits|head_commit|discussion|workflow_run)\b)/;

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
    expect(cli('no record', 'editorial/market-refresh-auto', SAME_REPO).code).toBe(0);
    expect(
      cli('no record', 'dependabot/npm_and_yarn/next-16.5.0', {
        ...SAME_REPO,
        PR_AUTHOR: 'dependabot[bot]',
      }).code
    ).toBe(0);
    expect(cli('no record', 'editorial/market-refresh-manual', SAME_REPO).code).toBe(1);
    expect(EXEMPT_HEADS).toHaveLength(2);
  });

  /** 5.835 — a branch NAME alone never exempts. */
  describe('5.835 · an exemption needs the right author and a same-repository head', () => {
    const dep = 'dependabot/npm_and_yarn/next-16.5.0';
    it('should check the record when a person names a branch dependabot/…', () => {
      expect(isExempt({ head: dep, author: 'someone', headRepo: 'o/r', baseRepo: 'o/r' })).toBe(
        false
      );
      expect(cli('no record', dep, { ...SAME_REPO, PR_AUTHOR: 'someone' }).code).toBe(1);
    });
    it('should check the record when an exempt branch comes from a fork', () => {
      expect(
        isExempt({ head: dep, author: 'dependabot[bot]', headRepo: 'fork/r', baseRepo: 'o/r' })
      ).toBe(false);
      expect(
        isExempt({ head: 'editorial/market-refresh-auto', headRepo: 'fork/r', baseRepo: 'o/r' })
      ).toBe(false);
    });
    it('should fail closed when the repository values are missing', () => {
      expect(isExempt({ head: dep, author: 'dependabot[bot]' })).toBe(false);
      expect(cli('no record', 'editorial/market-refresh-auto').code).toBe(1);
    });
    it('should exempt the market branch from this repository whoever opened it', () => {
      expect(
        isExempt({
          head: 'editorial/market-refresh-auto',
          author: 'a-person',
          headRepo: 'o/r',
          baseRepo: 'o/r',
        })
      ).toBe(true);
    });
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
    /** Every shell line: a single-line `run:` and each continuation line of a `run: |` block (5.835). */
    const runLines = (() => {
      const lines = wf.split('\n');
      const out: string[] = [];
      lines.forEach((l, i) => {
        const m = l.match(/^(\s*)(?:- )?run:\s*(.*)$/);
        if (!m) return;
        out.push(l);
        if (!/^[|>]/.test(m[2])) return;
        const indent = m[1].length;
        for (let j = i + 1; j < lines.length; j += 1) {
          const next = lines[j];
          if (next.trim() === '') continue;
          if (next.length - next.trimStart().length <= indent) break;
          out.push(next);
        }
      });
      return out;
    })();

    it('should have no concurrency group when a cancelled run would block a required check', () => {
      /* Twelfth audit (agent E): `^concurrency:` saw only a workflow-level block; a job-level
       * one (indented) cancels pending runs just the same. */
      expect(wf).not.toMatch(/^\s*concurrency:/m);
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

    /* Twelfth audit (agent C, LOW-2): the run-line reader missed a quoted `"run":` key, a
     * multi-line quoted or plain scalar and `actions/github-script`'s `script:`. Whatever the
     * YAML shape, here an expression may only be an environment variable's whole value. */
    it('should hold every expression as a whole env value, never anywhere a shell can read it', () => {
      const exprLines = wf.split('\n').filter((l) => l.includes('${{'));
      expect(exprLines.length).toBeGreaterThanOrEqual(4);
      for (const l of exprLines) expect(l, l).toMatch(ENV_VALUE_LINE);
    });

    /* Agent C LOW-3: a tag can be moved to other code; this required check pins every action. */
    it('should pin every action it uses to a full commit SHA', () => {
      const uses = wf.split('\n').filter((l) => /^\s*(?:- )?uses:/.test(l));
      expect(uses.length).toBeGreaterThanOrEqual(2);
      for (const l of uses) expect(l, l).toMatch(/uses:\s*[\w.-]+\/[\w.-]+@[0-9a-f]{40}\b/);
    });
  });

  /**
   * Twelfth audit (agent C, LOW-2) · EVERY workflow: an expression reading data a PR author or
   * commenter controls (title, body, branch name, commit messages, comments, …) may appear only
   * as an environment variable's whole value, where the shell receives it as data. Pasted into a
   * `run:` script, a `script:` or any other field, it is code a stranger wrote.
   */
  describe('workflow injection · untrusted event data reaches a step only through env', () => {
    const WORKFLOWS = join(REPO, '.github/workflows');
    const files = readdirSync(WORKFLOWS).filter((f) => /\.ya?ml$/.test(f));

    it('should read every workflow file (non-vacuity)', () => {
      expect(files.length).toBeGreaterThanOrEqual(5);
      expect(files).toContain('pr-record.yml');
    });

    it('should hold untrusted event data only as a whole env value in every workflow', () => {
      const offenders = files.flatMap((f) =>
        readFileSync(join(WORKFLOWS, f), 'utf8')
          .split('\n')
          .map((l, i) => ({ l, at: `${f}:${i + 1}` }))
          .filter(({ l }) => UNTRUSTED.test(l) && !ENV_VALUE_LINE.test(l))
          .map(({ at }) => at)
      );
      expect(offenders).toEqual([]);
    });

    it('should tell an env value from every other place an expression can sit (detector self-test)', () => {
      expect(
        ENV_VALUE_LINE.test('          PR_HEAD: ${{ github.event.pull_request.head.ref }}')
      ).toBe(true);
      for (const bad of [
        '        run: echo "${{ github.event.pull_request.title }}"',
        '        "run": echo ${{ github.head_ref }}',
        '          script: core.info("${{ github.event.pull_request.body }}")',
        '          echo ${{ github.event.issue.title }}',
        '          PR_HEAD: x${{ github.event.pull_request.head.ref }}',
      ]) {
        expect(UNTRUSTED.test(bad), bad).toBe(true);
        expect(ENV_VALUE_LINE.test(bad), bad).toBe(false);
      }
      expect(UNTRUSTED.test('${{ github.event.pull_request.number }}')).toBe(true);
      expect(UNTRUSTED.test('${{ github.repository }}')).toBe(false);
    });
  });
});
