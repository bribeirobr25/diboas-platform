import { execFileSync } from 'node:child_process';
import {
  copyFileSync,
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

/**
 * Regression net for three `scripts/review-gate.mjs` rows that had no test of their own:
 *
 * - `guards` (GUARD-1): every fixed register entry from `5.601` on names its guard and
 *   its similar-cases search (the "every defect leaves a guard" rule, `coding-standards.md`).
 * - `ci-parity` (`5.604`): every job a pull request triggers is declared for the local
 *   rehearsal, so a new CI job cannot slip outside it.
 * - `authorities`, its not-indexed branch (`5.603`): a gate row missing from the gate
 *   status index fails. Until now it was proven only on real data, during a merge.
 *
 * Each case runs the real runner in a throwaway repository holding only the files the row
 * reads, the same method as `authGate.test.ts`, so no real ledger or registry is read or
 * changed. Expectations come from each row's stated rule, not from running it first.
 */

const ROOT = resolve(process.cwd(), '..', '..');
const ESC = String.fromCharCode(27);
const plain = (text: string) =>
  text
    .split(`${ESC}[`)
    .map((part, i) => (i === 0 ? part : part.replace(/^[0-9;]*m/, '')))
    .join('');

const made: string[] = [];
afterEach(() => {
  while (made.length) rmSync(made.pop()!, { recursive: true, force: true });
});

function repo() {
  const dir = mkdtempSync(join(tmpdir(), 'review-gate-guards-'));
  made.push(dir);
  mkdirSync(join(dir, 'scripts/lib'), { recursive: true });
  copyFileSync(join(ROOT, 'scripts/review-gate.mjs'), join(dir, 'scripts/review-gate.mjs'));
  // the runner imports this module (5.653); a fixture without it cannot start
  copyFileSync(join(ROOT, 'scripts/lib/docs-root.mjs'), join(dir, 'scripts/lib/docs-root.mjs'));
  const put = (rel: string, body: string) => {
    mkdirSync(join(dir, rel, '..'), { recursive: true });
    writeFileSync(join(dir, rel), body, 'utf8');
  };
  const run = (mode: string) => {
    try {
      const out = execFileSync('node', ['scripts/review-gate.mjs', mode], {
        cwd: dir,
        encoding: 'utf8',
        env: { ...process.env, REVIEW_REGISTER_PATH: '', DIBOAS_DOCS_DIR: '' },
      });
      return { code: 0, out: plain(out) };
    } catch (error) {
      const e = error as { status?: number; stdout?: string; stderr?: string };
      return { code: e.status ?? 1, out: plain(`${e.stdout ?? ''}${e.stderr ?? ''}`) };
    }
  };
  return { dir, put, run };
}

/** A register with a status index and one entry per id. */
function register(entries: Record<string, { status: string; text: string }>): string {
  const index = Object.entries(entries)
    .map(([id, e]) => `${id}   ${e.status}`)
    .join('           ');
  const rows = Object.entries(entries)
    .map(
      ([id, e]) => `> **${id}** — **${e.status} 2026-10-21 · fixture** ${e.text} | **small** | CC`
    )
    .join('\n\n');
  return `# fixture register\n\n>   ${index}\n\n${rows}\n`;
}

const GUARD = '**Guard:** `tests/fixture.test.ts` fails while the defect is present.';
const SIMILAR = '**Similar cases:** searched every sibling component; none found.';

describe('GUARD-1 · every fixed defect from 5.601 on names its guard', () => {
  function guards(entries: Record<string, { status: string; text: string }>) {
    const r = repo();
    r.put('tests/fixture.test.ts', '// the guard file the fixture names\n');
    r.put('docs/audit/PENDING_ALL.md', register(entries));
    return r.run('guards');
  }

  it('should PASS when a closed entry names an existing guard file and its similar-cases search', () => {
    const r = guards({ '5.601': { status: 'CLOSED', text: `${GUARD} ${SIMILAR}` } });
    expect(r.code, r.out).toBe(0);
    expect(r.out).toMatch(/1 closed entry from 5\.601 on · 1 name an existing guard file/);
  }, 20_000);

  it('should FAIL when a closed entry names no guard', () => {
    const r = guards({ '5.601': { status: 'CLOSED', text: SIMILAR } });
    expect(r.code).toBe(1);
    expect(r.out).toMatch(/NO GUARD: 5\.601/);
  }, 20_000);

  it('should FAIL when the guard names a file that does not exist', () => {
    const r = guards({
      '5.601': { status: 'CLOSED', text: `**Guard:** \`tests/gone.test.ts\` ${SIMILAR}` },
    });
    expect(r.code).toBe(1);
    expect(r.out).toMatch(/GUARD FILE MISSING: 5\.601 → tests\/gone\.test\.ts/);
  }, 20_000);

  it('should FAIL a guard of "none" without a reason, and accept one with a stated reason', () => {
    const bare = guards({ '5.601': { status: 'CLOSED', text: `**Guard:** none. ${SIMILAR}` } });
    expect(bare.code).toBe(1);
    expect(bare.out).toMatch(/GUARD "none" WITHOUT A REASON: 5\.601/);

    const reasoned = guards({
      '5.601': {
        status: 'CLOSED',
        text: `**Guard:** none — a founder wording decision, not a code defect, so no test can fail on it. ${SIMILAR}`,
      },
    });
    expect(reasoned.code, reasoned.out).toBe(0);
    expect(reasoned.out).toMatch(/1 declare none \(5\.601: reasons stated, reviewer judges\)/);
  }, 20_000);

  it('should FAIL when the similar-cases search is missing', () => {
    const r = guards({ '5.601': { status: 'CLOSED', text: GUARD } });
    expect(r.code).toBe(1);
    expect(r.out).toMatch(/NO SIMILAR-CASES SEARCH: 5\.601/);
  }, 20_000);

  it('should not retro-require history before 5.601, nor an entry that is still open', () => {
    const r = guards({
      '5.600': { status: 'CLOSED', text: 'closed before the rule' },
      '5.601': { status: 'CLOSED', text: `${GUARD} ${SIMILAR}` },
      '5.602': { status: 'OPEN', text: 'not fixed yet' },
    });
    expect(r.code, r.out).toBe(0);
    expect(r.out).toMatch(/1 closed entry from 5\.601 on/);
  }, 20_000);
});

describe('CI-PARITY · every pull-request job is declared for the local rehearsal (5.604)', () => {
  function withWorkflows(edit?: (dir: string) => void) {
    const r = repo();
    cpSync(join(ROOT, '.github/workflows'), join(r.dir, '.github/workflows'), {
      recursive: true,
    });
    edit?.(join(r.dir, '.github/workflows'));
    return r.run('ci-parity');
  }

  it('should PASS on the real workflows and list each pull-request job, the sandbox harness included', () => {
    const r = withWorkflows();
    expect(r.code, r.out).toBe(0);
    expect(r.out).toMatch(/e2e\.yml#sandbox-harness \[local\]/);
    // A schedule-only workflow is not a pull-request job.
    expect(r.out).not.toMatch(/data-freshness\.yml#/);
  }, 20_000);

  it('should FAIL when a new pull-request job has no rehearsal declared', () => {
    const r = withWorkflows((dir) => {
      const p = join(dir, 'e2e.yml');
      writeFileSync(
        p,
        `${readFileSync(p, 'utf8')}\n  new-job:\n    runs-on: ubuntu-latest\n    steps:\n      - run: echo new\n`
      );
    });
    expect(r.code).toBe(1);
    expect(r.out).toMatch(/CI JOB WITH NO REHEARSAL DECLARED: e2e\.yml#new-job/);
  }, 20_000);

  it('should FAIL when a declared job no longer exists in CI', () => {
    const r = withWorkflows((dir) => rmSync(join(dir, 'lighthouse.yml')));
    expect(r.code).toBe(1);
    expect(r.out).toMatch(/DECLARED JOB NOT IN CI: lighthouse\.yml#lighthouse/);
  }, 20_000);
});

describe('authorities · a gate row missing from the gate status index fails (5.603)', () => {
  function gates(rows: string) {
    const r = repo();
    r.put('docs/tech/increment-review-gate.md', '# fixture gate\n\nRoutes engineering-gates.md.\n');
    r.put(
      'docs/tech/engineering-gates.md',
      [
        '# fixture registry',
        '',
        '> ```text',
        '> TOTAL 1   ·   LIVE 1',
        '> ```',
        '>',
        '> ```text',
        '> AAA-1        LIVE',
        '> ```',
        '',
        '| Gate | What |',
        '| --- | --- |',
        rows,
        '',
      ].join('\n')
    );
    return r.run('authorities');
  }

  it('should PASS when every gate row is indexed', () => {
    const r = gates('| **AAA-1** ✅ **LIVE** | indexed |');
    expect(r.code, r.out).toBe(0);
    expect(r.out).toMatch(/gate index: 1 entries/);
  }, 20_000);

  it('should FAIL and name the row when a gate row arrives unindexed', () => {
    const r = gates('| **AAA-1** ✅ **LIVE** | indexed |\n| **BBB-1** ✅ **LIVE** | not indexed |');
    expect(r.code).toBe(1);
    expect(r.out).toMatch(/GATE NOT INDEXED \(1\): BBB-1/);
  }, 20_000);
});

describe('GATE-STATE-1 · a gate row never states a delivery state', () => {
  function gates(body: string) {
    const r = repo();
    r.put('docs/tech/increment-review-gate.md', '# fixture gate\n\nRoutes engineering-gates.md.\n');
    r.put(
      'docs/tech/engineering-gates.md',
      [
        '# fixture registry',
        '',
        '> ```text',
        '> TOTAL 1   ·   LIVE 1',
        '> ```',
        '>',
        '> ```text',
        '> AAA-1        LIVE',
        '> ```',
        '',
        body,
        '',
      ].join('\n')
    );
    return r.run('authorities');
  }
  const TABLE = '| Gate | What |\n| --- | --- |\n';

  it('should PASS a row whose description mentions the rule, because only the status cell is read', () => {
    const r = gates(
      `${TABLE}| **AAA-1** ✅ **LIVE** | never write "IMPLEMENTED ON BRANCH, not yet merged" here |`
    );
    expect(r.code, r.out).toBe(0);
  }, 20_000);

  it('should FAIL and name the row when its status cell states a delivery state', () => {
    const r = gates(`${TABLE}| **AAA-1** 🟡 **IMPLEMENTED ON BRANCH, not yet merged** | x |`);
    expect(r.code).toBe(1);
    expect(r.out).toMatch(/GATE STATUS STATES A DELIVERY STATE \(1\), false once merged: AAA-1/);
  }, 20_000);

  it('should FAIL when a section heading states a delivery state for the rows it holds', () => {
    const r = gates(
      `### Gates added today (not yet merged)\n\n${TABLE}| **AAA-1** ✅ **LIVE** | x |`
    );
    expect(r.code).toBe(1);
    expect(r.out).toMatch(/GATE STATUS STATES A DELIVERY STATE \(1\).*heading "Gates added today/);
  }, 20_000);
});

describe('GATE-INDEX-CI-1 · the required quality job runs the gate registry check', () => {
  it('should run `pnpm review:authorities` as a step of the `quality` job in ci.yml', () => {
    const ci = readFileSync(join(ROOT, '.github/workflows/ci.yml'), 'utf8');
    const start = ci.indexOf('\n  quality:\n');
    expect(start, 'the quality job').toBeGreaterThan(-1);
    const rest = ci.slice(start + 1);
    const next = rest.slice(1).search(/\n {2}[a-z][\w-]*:\n/);
    const quality = next === -1 ? rest : rest.slice(0, next + 1);
    expect(quality).toMatch(/^\s+- run: pnpm review:authorities$/m);
  });
});

describe('PROSE-1 · an empty record corpus is proven, never assumed (5.653)', () => {
  it('should PASS through the instrument self-test when no record names a controlling plan', () => {
    const r = repo();
    r.put('docs/audit/SOME_NOTE.md', '# A note\n\nNo controlling plan here.\n');
    const out = r.run('prose');
    expect(out.code, out.out).toBe(0);
    expect(out.out).toMatch(
      /0 record\(s\) name a controlling plan in docs\/audit · instrument self-test PASS/
    );
  }, 20_000);

  it('should still FAIL a real record that does not cite its plan requirement', () => {
    const r = repo();
    r.put(
      'docs/audit/FIXTURE_PLAN.md',
      '# Plan\n\n## 16 · Minimum required observability\n\nEvery flow emits two events.\n'
    );
    r.put(
      'docs/audit/FIXTURE_RECORD.md',
      '# Record\n\n**Controlling plan:** `docs/audit/FIXTURE_PLAN.md`\n\nWork done.\n'
    );
    const out = r.run('prose');
    expect(out.code).toBe(1);
    expect(out.out).toMatch(/UNCITED REQUIREMENT \(1\): FIXTURE_RECORD\.md/);
  }, 20_000);
});
