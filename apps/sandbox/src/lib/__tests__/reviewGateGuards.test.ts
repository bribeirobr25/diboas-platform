import { execFileSync } from 'node:child_process';
import {
  copyFileSync,
  cpSync,
  existsSync,
  symlinkSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterAll, afterEach, describe, expect, it } from 'vitest';
import { makeFixtureParent } from '../../test/fixtureParent';

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

/**
 * Every throwaway repository lives under ONE empty parent, so the sibling it would resolve
 * (`<parent>/diboas-docs`) can never exist; a stray `diboas-docs` in the system temp folder
 * once leaked into these fixtures (`5.699`).
 */
const FIXTURES = makeFixtureParent('review-gate-guards-parent-');
const FIXTURE_PARENT = FIXTURES.dir;
afterAll(FIXTURES.remove);

const made: string[] = [];
afterEach(() => {
  while (made.length) rmSync(made.pop()!, { recursive: true, force: true });
});

function repo() {
  const dir = mkdtempSync(join(FIXTURE_PARENT, 'review-gate-guards-'));
  made.push(dir);
  mkdirSync(join(dir, 'scripts/lib'), { recursive: true });
  copyFileSync(join(ROOT, 'scripts/review-gate.mjs'), join(dir, 'scripts/review-gate.mjs'));
  // the runner imports this module (5.653); a fixture without it cannot start
  copyFileSync(join(ROOT, 'scripts/lib/docs-root.mjs'), join(dir, 'scripts/lib/docs-root.mjs'));
  const put = (rel: string, body: string) => {
    mkdirSync(join(dir, rel, '..'), { recursive: true });
    writeFileSync(join(dir, rel), body, 'utf8');
  };
  const run = (mode: string, extraEnv: Record<string, string> = {}) => {
    try {
      const out = execFileSync('node', ['scripts/review-gate.mjs', mode], {
        cwd: dir,
        encoding: 'utf8',
        env: { ...process.env, REVIEW_REGISTER_PATH: '', DIBOAS_DOCS_DIR: '', ...extraEnv },
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

/** The legacy in-repo layout: a register makes `docs/` this fixture's private docs root. */
const STUB_REGISTER = '# fixture register\n';

describe('PROSE-1 · an empty record corpus is proven, never assumed (5.653)', () => {
  it('should PASS through the instrument self-test when no record names a controlling plan', () => {
    const r = repo();
    r.put('docs/audit/PENDING_ALL.md', STUB_REGISTER);
    r.put('docs/audit/SOME_NOTE.md', '# A note\n\nNo controlling plan here.\n');
    const out = r.run('prose');
    expect(out.code, out.out).toBe(0);
    expect(out.out).toMatch(
      /0 record\(s\) name a controlling plan in docs\/audit · instrument self-test PASS/
    );
  }, 20_000);

  it('should still FAIL a real record that does not cite its plan requirement', () => {
    const r = repo();
    r.put('docs/audit/PENDING_ALL.md', STUB_REGISTER);
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

  /**
   * 5.696, reproduced end to end. With no private docs, a failing battery used to create
   * `docs/audit/` for its log, and PROSE-1 then read that folder as a record corpus and
   * PASSED over nothing. The battery here fails fast (every step is `exit 1`).
   */
  it('should stay SKIP, never PASS, when a failing battery ran on a checkout without private docs', () => {
    const r = repo();
    const failing = 'node -e "process.exit(1)"';
    r.put(
      'package.json',
      JSON.stringify({
        name: 'fixture',
        private: true,
        scripts: { 'type-check': failing, lint: failing, 'format:check': failing, test: failing },
      })
    );
    const battery = r.run('battery');
    expect(battery.code, battery.out).toBe(1);
    // the fixture's own scripts ran (not a missing pnpm, which also fails the battery)
    expect(battery.out).toMatch(/type-check \(command-failed, exit 1\)/);
    expect(battery.out).toMatch(/evidence: \.review-gate-runs\//);
    expect(existsSync(join(r.dir, 'docs/audit'))).toBe(false);
    r.put('docs/audit/LEFTOVER/log.json', '{}'); // even a leftover folder must not count
    const prose = r.run('prose');
    expect(prose.code, prose.out).toBe(2);
    expect(prose.out).toMatch(/SKIP[\s\S]*private docs absent here/);
  }, 60_000);
});

describe('REGISTER-KIND · every register item declares a kind (founder decision 4, 5.653)', () => {
  const STATUS = { '5.700': 'OPEN', '5.701': 'CLOSED' } as const;
  function kindRegister(kindLines: string[], totals: string): string {
    const rows = Object.entries(STATUS)
      .map(([id, st]) => `> **${id}** — **${st} 2026-10-30 · fixture** an item. | Owner: CC`)
      .join('\n\n');
    return [
      '# fixture register',
      '',
      '> **NEXT FREE ID: 5.702**',
      '',
      '<!-- BLOCK-A STATUS INDEX · machine-readable · asserted by `pnpm review:register` -->',
      '> TOTAL 2   ·   OPEN 1 · CLOSED 1',
      '>   5.700   OPEN           5.701   CLOSED',
      '',
      '<!-- BLOCK-K KIND INDEX · machine-readable · asserted by `pnpm review:register` -->',
      `> ${totals}`,
      ...kindLines.map((l) => `>   ${l}`),
      '',
      rows,
      '',
    ].join('\n');
  }
  function check(kindLines: string[], totals = 'KINDS 2   ·   defect 1 · work 1') {
    const r = repo();
    r.put('docs/audit/PENDING_ALL.md', kindRegister(kindLines, totals));
    return r.run('register');
  }

  it('should PASS when every indexed item has exactly one kind and the totals agree', () => {
    const r = check(['5.700   defect         5.701   work']);
    expect(r.code, r.out).toBe(0);
    expect(r.out).toMatch(/kinds: defect 1 · work 1 · decision 0 · owner-action 0 · obsolete 0/);
  }, 20_000);

  it('should FAIL when the kind index is missing', () => {
    const r = repo();
    r.put(
      'docs/audit/PENDING_ALL.md',
      kindRegister([], 'KINDS 0').replace(/<!-- BLOCK-K[\s\S]*?\n\n/, '')
    );
    const out = r.run('register');
    expect(out.code).toBe(1);
    expect(out.out).toMatch(/KIND INDEX not found/);
  }, 20_000);

  it('should FAIL when an indexed item declares no kind', () => {
    const r = check(['5.700   defect'], 'KINDS 1   ·   defect 1');
    expect(r.code).toBe(1);
    expect(r.out).toMatch(/NO KIND DECLARED \(1\): 5\.701/);
  }, 20_000);

  it('should FAIL a kind outside the vocabulary', () => {
    const r = check(['5.700   defect         5.701   chore'], 'KINDS 2   ·   defect 1 · chore 1');
    expect(r.code).toBe(1);
    expect(r.out).toMatch(/KIND OUTSIDE VOCABULARY \(1\): 5\.701=chore/);
  }, 20_000);

  it('should FAIL a kind for an id that is not a claim, and a kind declared twice', () => {
    const r = check(
      ['5.700   defect         5.701   work           5.799   work', '5.700   decision'],
      'KINDS 3   ·   defect 0 · work 2 · decision 1'
    );
    expect(r.code).toBe(1);
    expect(r.out).toMatch(/KIND DECLARED MORE THAN ONCE \(1\): 5\.700/);
    expect(r.out).toMatch(/KIND FOR AN ID THAT IS NOT A CLAIM \(1\): 5\.799/);
  }, 20_000);

  /* 5.711: a capitalised kind dropped its whole index line and blamed every id on it. */
  it('should FAIL a capitalised kind as outside the vocabulary when it is the only defect on its line', () => {
    const r = check(['5.700   defect         5.701   Work'], 'KINDS 2   ·   defect 1 · work 1');
    expect(r.code).toBe(1);
    expect(r.out).toMatch(/KIND OUTSIDE VOCABULARY \(1\): 5\.701=Work/);
    expect(r.out).not.toMatch(/NO KIND DECLARED/);
  }, 20_000);

  it('should FAIL when the published kind totals disagree with the entries', () => {
    const r = check(['5.700   defect         5.701   work'], 'KINDS 2   ·   defect 2 · work 0');
    expect(r.code).toBe(1);
    expect(r.out).toMatch(/KIND TOTALS WRONG \(stated≠counted\) \(2\): defect 2≠1, work 0≠1/);
  }, 20_000);
});

/**
 * DOCS-ROOT · which private docs the gate reads (5.696–5.698, second audit 2026-10-30).
 *
 * Each case builds a WORKSPACE under its own folder: `<ws>/diboas-platform` (the runner and
 * the module it imports) and, when the case needs one, `<ws>/diboas-docs` (the sibling).
 * The unit test of the resolver lives in apps/web; these cases prove what the RUNNER does
 * with each answer, because an earlier version decided "absent" per row and four rows
 * still read a stray tree.
 */
describe('DOCS-ROOT · the gate reads the private docs it names, and only those', () => {
  const STUB = '# fixture register\n';
  /* git without the caller's repository context, signing or hooks */
  const gitEnv: NodeJS.ProcessEnv = { ...process.env };
  for (const k of Object.keys(gitEnv)) if (k.startsWith('GIT_')) delete gitEnv[k];
  const git = (cwd: string, ...a: string[]) =>
    execFileSync(
      'git',
      [
        '-c',
        'user.email=fixture@example.invalid',
        '-c',
        'user.name=fixture',
        '-c',
        'commit.gpgsign=false',
        ...a,
      ],
      { cwd, env: gitEnv, stdio: 'pipe' }
    ).toString();
  function workspace() {
    const ws = mkdtempSync(join(FIXTURE_PARENT, 'docs-root-ws-'));
    const plat = join(ws, 'diboas-platform');
    const docs = join(ws, 'diboas-docs');
    mkdirSync(join(plat, 'scripts/lib'), { recursive: true });
    mkdirSync(join(plat, 'docs/tech'), { recursive: true });
    writeFileSync(join(plat, 'docs/tech/README.md'), '# public engineering docs\n');
    copyFileSync(join(ROOT, 'scripts/review-gate.mjs'), join(plat, 'scripts/review-gate.mjs'));
    copyFileSync(join(ROOT, 'scripts/lib/docs-root.mjs'), join(plat, 'scripts/lib/docs-root.mjs'));
    const put = (root: string, rel: string, body: string) => {
      mkdirSync(join(root, rel, '..'), { recursive: true });
      writeFileSync(join(root, rel), body, 'utf8');
    };
    const run = (mode: string, env: Record<string, string> = {}) => {
      try {
        const out = execFileSync('node', ['scripts/review-gate.mjs', mode], {
          cwd: plat,
          encoding: 'utf8',
          env: {
            ...process.env,
            REVIEW_REGISTER_PATH: '',
            DIBOAS_DOCS_DIR: '',
            NO_COLOR: '1',
            ...env,
          },
        });
        return { code: 0, out: plain(out) };
      } catch (error) {
        const e = error as { status?: number; stdout?: string; stderr?: string };
        return { code: e.status ?? 1, out: plain(`${e.stdout ?? ''}${e.stderr ?? ''}`) };
      }
    };
    /** the sibling as a git checkout on main, one commit behind its origin/main */
    const gitSibling = () => {
      put(docs, 'audit/PENDING_ALL.md', STUB);
      git(docs, 'init', '-q', '-b', 'main');
      git(docs, 'add', '-A');
      git(docs, 'commit', '-q', '-m', 'one');
      git(docs, 'commit', '-q', '--allow-empty', '-m', 'two');
      git(docs, 'update-ref', 'refs/remotes/origin/main', 'HEAD');
      git(docs, 'reset', '-q', '--hard', 'HEAD~1');
      return git(docs, 'rev-parse', '--short', 'HEAD').trim();
    };
    return { ws, plat, docs, put, run, gitSibling };
  }
  const header = (out: string) =>
    out.split('\n').find((l) => l.startsWith('Private docs read from:')) ?? '';

  it('should read nothing private when DIBOAS_DOCS_DIR is none, even beside a legacy register', () => {
    const w = workspace();
    w.put(w.plat, 'docs/audit/PENDING_ALL.md', STUB);
    w.put(w.plat, 'docs/audit/OLD.md', '# old\n\nSee `apps/gone/yy.ts:7`.\n');
    const none = { DIBOAS_DOCS_DIR: 'none' };
    const reg = w.run('register', none);
    expect(header(reg.out)).toBe(
      'Private docs read from: nowhere (absent here, as on a fresh clone)'
    );
    expect(reg.code, 'the in-repo register must not be read').toBe(1);
    expect(reg.out).toMatch(/not found/);
    const cites = w.run('citations', none);
    expect(cites.out).not.toMatch(/DEAD|yy\.ts/);
    expect(cites.out).toMatch(/private docs absent here: only the public docs were walked/);
    for (const row of ['prose', 'doc1-local', 'canon-index', 'escalations']) {
      const r = w.run(row, none);
      expect(r.code, `${row}: ${r.out}`).toBe(2);
      expect(r.out).toMatch(/SKIP/);
    }
  }, 60_000);

  it('should ignore stray private folders in docs/ when no docs root exists', () => {
    const w = workspace();
    w.put(w.plat, 'docs/audit/OLD.md', '# old\n\nSee `apps/gone/yy.ts:7`.\n');
    w.put(w.plat, 'docs/cc-sync/STRAY.md', '# stray\n\nThe suite is 9,999 tests / 99 files.\n');
    const cites = w.run('citations');
    expect(cites.code, cites.out).toBe(0);
    expect(cites.out).not.toMatch(/DEAD|yy\.ts/);
    const counts = w.run('counts');
    expect(counts.out).not.toMatch(/9999\/99|STRAY/);
  }, 30_000);

  it('should stop with exit 2 and print no machine path when DIBOAS_DOCS_DIR holds no register', () => {
    const w = workspace();
    mkdirSync(join(w.ws, 'empty-docs'));
    const r = w.run('citations', { DIBOAS_DOCS_DIR: join(w.ws, 'empty-docs') });
    expect(r.code).toBe(2);
    expect(r.out).toMatch(/DIBOAS_DOCS_DIR \(\.\.\/empty-docs\) is not a private docs checkout/);
    expect(r.out).not.toContain(w.ws);
  }, 20_000);

  it('should stop with exit 2 when the legacy tree and the sibling both hold a register', () => {
    const w = workspace();
    w.put(w.plat, 'docs/audit/PENDING_ALL.md', STUB);
    w.put(w.docs, 'audit/PENDING_ALL.md', STUB);
    const r = w.run('citations');
    expect(r.code, r.out).toBe(2);
    expect(r.out).toMatch(
      /two private docs trees hold a register: docs\/ in this checkout and \.\.\/diboas-docs/
    );
  }, 20_000);

  it('should print on-main and the commit, and warn, when the sibling is behind its origin/main', () => {
    const w = workspace();
    const sha = w.gitSibling();
    const r = w.run('citations');
    expect(header(r.out)).toBe(
      `Private docs read from: the sibling diboas-docs checkout (../diboas-docs) · on main @ ${sha}`
    );
    expect(r.out).toMatch(/1 commit\(s\) behind its last-fetched origin\/main/);
  }, 30_000);

  it('should show no branch when the docs root is not a git checkout, whatever git sits above it or in GIT_DIR', () => {
    const w = workspace();
    git(w.plat, 'init', '-q', '-b', 'main');
    git(w.plat, 'commit', '-q', '--allow-empty', '-m', 'platform');
    w.put(w.plat, 'plain-docs/audit/PENDING_ALL.md', STUB); // a copy INSIDE the platform repo
    const inside = w.run('citations', { DIBOAS_DOCS_DIR: 'plain-docs' });
    expect(header(inside.out)).toBe('Private docs read from: DIBOAS_DOCS_DIR (plain-docs)');
    w.put(w.docs, 'audit/PENDING_ALL.md', STUB); // a plain sibling, with GIT_DIR inherited
    const hooked = w.run('citations', { GIT_DIR: join(w.plat, '.git') });
    expect(header(hooked.out)).toBe(
      'Private docs read from: the sibling diboas-docs checkout (../diboas-docs)'
    );
  }, 30_000);

  it('should not warn about being behind when the docs root is the legacy in-repo tree', () => {
    const w = workspace();
    w.put(w.plat, 'docs/audit/PENDING_ALL.md', STUB);
    git(w.plat, 'init', '-q', '-b', 'main');
    git(w.plat, 'commit', '-q', '--allow-empty', '-m', 'one');
    git(w.plat, 'commit', '-q', '--allow-empty', '-m', 'two');
    git(w.plat, 'update-ref', 'refs/remotes/origin/main', 'HEAD');
    git(w.plat, 'reset', '-q', '--hard', 'HEAD~1');
    const r = w.run('citations');
    expect(header(r.out)).toBe('Private docs read from: docs/ in this checkout');
    expect(r.out).not.toMatch(/behind/);
  }, 30_000);

  it('should name the in-repo private folders it does not read when the sibling is the docs root', () => {
    const w = workspace();
    w.put(w.docs, 'audit/PENDING_ALL.md', STUB);
    w.put(w.plat, 'docs/cc-sync/NOTE.md', '# a market-lane note\n');
    const r = w.run('citations');
    expect(r.out).toMatch(
      /Not read: private folder\(s\) inside this checkout's docs\/ \(cc-sync\)/
    );
  }, 20_000);

  it('should name the docs root by role, not by machine path, when a row throws', () => {
    const w = workspace();
    w.put(w.docs, 'audit/PENDING_ALL.md', STUB);
    symlinkSync(join(w.docs, 'audit/GONE.md'), join(w.docs, 'audit/ZZ_DANGLING.md'));
    const r = w.run('escalations');
    expect(r.out).toMatch(/check threw: .*<docs-root>\/audit\/ZZ_DANGLING\.md/);
    expect(r.out).not.toContain(w.ws);
  }, 20_000);
});

/**
 * validate:ux-canon reads the same docs root (5.696–5.698). Run against a fixture root
 * (`UXCANON_ROOT`) holding the tracked governance files, so the private half varies alone.
 */
describe('UX-CANON · the validator reads the private docs it names, and only those', () => {
  function uxRoot() {
    const ws = mkdtempSync(join(FIXTURE_PARENT, 'ux-canon-ws-'));
    const plat = join(ws, 'diboas-platform');
    // every tracked public doc: the governance files link into the rest of docs/tech
    cpSync(join(ROOT, 'docs/tech'), join(plat, 'docs/tech'), { recursive: true });
    const put = (rel: string, body: string) => {
      mkdirSync(join(ws, rel, '..'), { recursive: true });
      writeFileSync(join(ws, rel), body, 'utf8');
    };
    const run = () => {
      try {
        const out = execFileSync('node', [join(ROOT, 'scripts/validate-ux-canon.mjs')], {
          encoding: 'utf8',
          env: { ...process.env, UXCANON_ROOT: plat, DIBOAS_DOCS_DIR: '' },
        });
        return { code: 0, out };
      } catch (error) {
        const e = error as { status?: number; stdout?: string; stderr?: string };
        return { code: e.status ?? 1, out: `${e.stdout ?? ''}${e.stderr ?? ''}` };
      }
    };
    return { put, run };
  }

  it('should pass and read no stray audit record when no docs root exists', () => {
    const u = uxRoot();
    u.put('diboas-platform/docs/audit/UX_AUDIT_STRAY.md', '# stray\n\nSee `docs/audit/GONE.md`.\n');
    const r = u.run();
    expect(r.code, r.out).toBe(0);
    expect(r.out).toMatch(/0 UX audit record\(s\) read \(docs root: none\)/);
  }, 20_000);

  it('should stop when the legacy tree and the sibling both hold a register', () => {
    const u = uxRoot();
    u.put('diboas-platform/docs/audit/PENDING_ALL.md', '# r\n');
    u.put('diboas-docs/audit/PENDING_ALL.md', '# r\n');
    const r = u.run();
    expect(r.code).toBe(1);
    expect(r.out).toMatch(/validate:ux-canon: two private docs trees hold a register/);
  }, 20_000);

  it('should FAIL when private docs exist but BRAND_POSITIONING is missing from them', () => {
    const u = uxRoot();
    u.put('diboas-docs/audit/PENDING_ALL.md', '# r\n');
    const r = u.run();
    expect(r.code).toBe(1);
    expect(r.out).toMatch(
      /\(h\) docs\/full-view\/BRAND_POSITIONING\.md is missing from the private docs/
    );
  }, 20_000);
});
