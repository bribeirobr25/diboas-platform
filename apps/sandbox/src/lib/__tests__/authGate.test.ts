import { execFileSync } from 'node:child_process';
import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  rmdirSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, posix, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { makeFixtureParent } from '../../test/fixtureParent';

/**
 * `scripts/review-gate.mjs` — the gate runner's own regression net.
 *
 * Covers the AUTH-1 rows (Canon-First Authority Resolution) and, since
 * `5.419`, the counts row's DOCUMENT-CONTEXT rule. The filename still says
 * `authGate`, which is now narrower than the contents; renaming it to
 * `reviewGate.test.ts` is a separate change and was deliberately NOT folded
 * into `5.419`.
 *
 * ## Why this file exists
 *
 * AUTH-1 shipped proven only by MANUAL sabotage. Founder disposition §1
 * (2026-09-17): *"Manual sabotage remains useful evidence but is not sufficient
 * as the only regression protection for a permanent Engineering gate."* Without
 * this, a refactor of `scripts/review-gate.mjs` could break a row and every gate
 * run would still print green — the silently-inert-guard class the gate exists
 * to prevent.
 *
 * ## Why it drives the CLI instead of importing
 *
 * `review-gate.mjs` has **zero exports**, three `process.exit` calls and
 * top-level `console.log`. A bare import would run the whole gate and kill the
 * test process. Driving the CLI is also the stronger contract: it tests what a
 * human and CI actually invoke, and the runner already encodes meaningful exit
 * codes (0 green · 1 failed · 2 INCOMPLETE/unknown-mode).
 *
 * ## Why it lives HERE and not beside the script
 *
 * `scripts/**` is outside every vitest root — all five configs include only
 * `src/**`, and the root `test` script is `turbo run test`, which fans out to
 * the packages. A spec placed next to the runner would NEVER EXECUTE. That hole
 * is the market lane's `5.134(d)`, widened 2026-09-17 to name the root
 * `scripts/` directory; hosting here WORKS AROUND it rather than closing it.
 *
 * ## Three traps this file is built around, each measured
 *
 * 1. **Output carries ANSI colour.** Every assertion strips it first, or it
 *    would match escape sequences rather than content.
 * 2. **A `docs/audit` fixture is NOT inert.** One probe file simultaneously
 *    broke `citations` (dead citation) and `counts` (a `9,999 tests / 999 files`
 *    string read as a live claim). So fixtures are uniquely named, removed in
 *    `afterEach` even when a test throws, and assertions are **delta-based** —
 *    "this exact path appears in the DEAD list", never "there are 3 dead", which
 *    would encode today's register instead of the requirement (`5.114`).
 * 3. **The repo root must be resolved, never assumed.** vitest runs this spec
 *    with `cwd` at `apps/sandbox`; a four-segment climb from `__tests__`
 *    resolves to `/apps` and every spawn would silently run against the wrong
 *    tree. `beforeAll` asserts the root really holds the runner.
 */

const ROOT = resolve(process.cwd(), '..', '..');

/**
 * ⚑ HERMETIC PRIVATE DOCS (register `5.653`, brain program).
 *
 * This file used to plant its private fixtures (`docs/audit/…`, `docs/full-view/canon/…`)
 * into the maintainer's REAL private docs. The private docs now live in their own private
 * repository, so a planted file there would be a stray file in a second repository. Every
 * gate run here reads a THROWAWAY COPY instead, through `DIBOAS_DOCS_DIR`, and private
 * fixtures are planted into that copy. The copy is the real corpus, so the delta-based
 * assertions keep their meaning. On CI there is no private corpus: the copy is then a
 * MINIMAL checkout (a stub register and a one-file canon package), so the gate accepts it as
 * a docs root and the canon-index assertions below run instead of returning early (`5.699`).
 *
 * The private root is found, and a path classified, by the real `scripts/lib/docs-root.mjs`,
 * imported at run time (a static import of that `.mjs` is not type-checked here: `allowJs`
 * is off), so this suite can never disagree with the gate (`5.699`, Principle 4).
 */
interface DocsRootModule {
  resolveDocsRoot(repoRoot: string): { dir: string | null; via: string };
  docsRootProblem(repoRoot: string, root: unknown): string | null;
  isPrivateDocsPath(rel: string): boolean;
  PUBLIC_DOCS_AREAS: string[];
}
let docsRoot: DocsRootModule;
const MEDIA = /\.(png|jpe?g|webp|gif|pdf|mp4|mov)$/i;
/**
 * Every throwaway repository in this file lives under ONE empty parent, so the sibling a
 * fixture repository would resolve (`<parent>/diboas-docs`) can never exist: a stray
 * `diboas-docs` in the system temp folder once leaked into the fixtures (`5.699`).
 */
const FIXTURES = makeFixtureParent('review-gate-fixtures-');
const FIXTURE_PARENT = FIXTURES.dir;
afterAll(FIXTURES.remove);
const PRIVATE_COPY = mkdtempSync(join(FIXTURE_PARENT, 'review-gate-private-docs-'));
/**
 * No private docs here (public CI): the copy becomes a MINIMAL checkout that the gate
 * accepts and that passes canon-index honestly (a register, one extracted package, six
 * CURRENT canon-root documents, all indexed), so the canon assertions run for real.
 */
const STUB_MODE = { on: false };
function writeStubDocs(root: string): void {
  const put = (rel: string, body: string) => {
    mkdirSync(join(root, rel, '..'), { recursive: true });
    writeFileSync(join(root, rel), body);
  };
  put('audit/PENDING_ALL.md', '# register (CI stub)\n');
  put('full-view/canon/extracted/fixture-package/AUTHORITY.md', '# a stub authority file\n');
  const index = ['# canon index (CI stub)'];
  for (let i = 1; i <= 6; i += 1) {
    put(`full-view/canon/STUB_AUTHORITY_${i}.md`, `# Stub ${i}\n\n**Status:** CURRENT\n`);
    index.push(`- \`STUB_AUTHORITY_${i}.md\` — current`);
  }
  put('full-view/canon/README.md', `${index.join('\n')}\n`);
}
beforeAll(async () => {
  docsRoot = (await import(
    /* @vite-ignore */ pathToFileURL(join(ROOT, 'scripts/lib/docs-root.mjs')).href
  )) as DocsRootModule;
  const root = docsRoot.resolveDocsRoot(ROOT);
  const problem = docsRoot.docsRootProblem(ROOT, root);
  if (problem) throw new Error(`private docs root unusable: ${problem}`);
  if (root.dir === null) {
    STUB_MODE.on = true;
    writeStubDocs(PRIVATE_COPY);
    return;
  }
  const source = root.dir;
  /* the docs only: no git metadata, CI folder, installed modules, failed-run logs or media */
  cpSync(source, PRIVATE_COPY, {
    recursive: true,
    filter: (from) => {
      const rel = from.slice(source.length + 1).split(sep);
      return (
        !rel[0]?.startsWith('.') &&
        !docsRoot.PUBLIC_DOCS_AREAS.includes(rel[0]) &&
        !rel.includes('node_modules') &&
        !rel.includes('REVIEW_GATE_RUNS') &&
        !MEDIA.test(from)
      );
    },
  });
});

/** Where a repo-relative path physically goes in this suite. */
const at = (rel: string) =>
  docsRoot.isPrivateDocsPath(rel)
    ? join(PRIVATE_COPY, posix.normalize(rel).slice('docs/'.length))
    : join(ROOT, rel);

/** Gate runs in the real checkout read the private COPY. */
const GATE_ENV = { ...process.env, DIBOAS_DOCS_DIR: PRIVATE_COPY };
/** Gate runs in a throwaway fixture repository read only that fixture (its own `docs/`,
    never a sibling: see FIXTURE_PARENT). */
const FIXTURE_ENV = { ...process.env, DIBOAS_DOCS_DIR: '' };

/** A fixture repository gets the runner AND the module it imports. */
function installGate(dir: string): void {
  mkdirSync(join(dir, 'scripts/lib'), { recursive: true });
  copyFileSync(join(ROOT, 'scripts/review-gate.mjs'), join(dir, 'scripts/review-gate.mjs'));
  copyFileSync(join(ROOT, 'scripts/lib/docs-root.mjs'), join(dir, 'scripts/lib/docs-root.mjs'));
}
const ESC = String.fromCharCode(27);

/** Strip ANSI so assertions match content, not escape sequences. */
function plain(text: string): string {
  return text
    .split(`${ESC}[`)
    .map((part, i) => (i === 0 ? part : part.replace(/^[0-9;]*m/, '')))
    .join('');
}

interface GateRun {
  code: number;
  out: string;
}

/**
 * Run one gate mode as a subprocess. Never throws — the exit code IS the result.
 *
 * Flags are passed as real argv entries because the runner reads them from
 * `process.argv.slice(3)`. An earlier version of this helper took `'increment
 * --fast'` as a single string and split on the space, which silently DROPPED the
 * flag and ran the full battery — whole-workspace type-check, lint, format and
 * the entire suite — from inside a test in that same suite. It blew a 600 s
 * timeout. The flag has to survive as an argument.
 */
function gate(mode: string, ...flags: string[]): GateRun {
  try {
    const out = execFileSync('node', ['scripts/review-gate.mjs', mode, ...flags], {
      cwd: ROOT,
      encoding: 'utf8',
      env: GATE_ENV,
    });
    return { code: 0, out: plain(out) };
  } catch (error) {
    const e = error as { status?: number; stdout?: string; stderr?: string };
    return { code: e.status ?? 1, out: plain(`${e.stdout ?? ''}${e.stderr ?? ''}`) };
  }
}

/** Fixtures created by the current test, removed even if it throws. */
const planted: string[] = [];

/**
 * Directories this test had to CREATE, deepest first — never pre-existing ones.
 *
 * ⚑ WHY THIS EXISTS: leaving them behind broke a LATER STEP OF THE SAME CI JOB.
 *
 * `plant()` creates parents with `mkdirSync(recursive)`, and `afterEach` used to
 * remove only the FILES. So a run left `docs/full-view/canon/extracted/
 * 00_PACKAGE_GUIDE/` and `docs/audit/` behind as empty directories. That is not
 * cosmetic: `scripts/validate-ux-canon.mjs` reports a broken reference only when
 * the referenced file is missing **and its parent directory is present** —
 * "missing file in a PRESENT directory = real break; missing directory =
 * local-only area". Manufacturing the directory therefore turned every
 * governance reference into `docs/full-view/*` into a "real break": CI step 16
 * failed with 11 defects on a tree where step 15 had passed, because step 9 (the
 * suite) had created the directories in between. Measured end to end in a
 * tracked-only tree: validator exit 0 → run this suite → validator exit 1 with
 * exactly those 11 defects.
 *
 * ⚑ WHY `rmdirSync` AND NOT `rmSync(recursive)`: on a maintainer's machine those
 * same paths hold **1,512 local-only files** under `docs/full-view` (1,485 of
 * them the canon corpus) and 92 under `docs/audit` — founder-owned, gitignored,
 * unrecoverable. `rmdirSync` REFUSES a non-empty directory, and that refusal is
 * the safety property: only a directory this test created and left empty can go.
 * A recursive delete here would be catastrophic and is never used.
 */
const plantedDirs: string[] = [];

function plant(relPath: string, body: string): string {
  const abs = at(relPath);
  const parent = join(abs, '..');

  /* Record the ancestors that do not exist YET, so only those are removed.
     Insertion order is deliberately IRRELEVANT here — `afterEach` sorts by
     depth before removing. See the note on `plantedDirs`. */
  for (let dir = parent; !existsSync(dir); dir = join(dir, '..'))
    if (!plantedDirs.includes(dir)) plantedDirs.push(dir);

  mkdirSync(parent, { recursive: true });
  writeFileSync(abs, body, 'utf8');
  planted.push(abs);
  return relPath;
}

afterEach(() => {
  while (planted.length) {
    const p = planted.pop();
    if (p) rmSync(p, { force: true });
  }
  /**
   * Then the directories — DEEPEST FIRST, enforced by sorting rather than by
   * insertion order.
   *
   * ⚑ THE FIRST VERSION OF THIS CLEANUP SHIPPED THE WRONG ORDER AND FIXED
   * NOTHING. It `unshift`ed each missing ancestor while walking child→parent,
   * which reverses the chain into parent-first. `rmdirSync` then refused every
   * parent (still holding its child) and removed only the innermost directory,
   * so `docs/full-view` survived and CI failed again, identically. Measured in
   * isolation: parent-first leaves 4 directories behind; depth-sorted leaves 0.
   *
   * Sorting makes this order-INDEPENDENT, so a future `plant()` call pattern
   * cannot silently reintroduce that bug.
   *
   * `rmdirSync` refuses a non-empty directory and that refusal is the SAFETY
   * PROPERTY, not an inconvenience: on a maintainer's machine these paths hold
   * ~1,500 local-only files. A pre-existing directory is never recorded, and a
   * recorded one that somehow holds other content is left alone.
   */
  plantedDirs.sort((a, b) => b.split(sep).length - a.split(sep).length);
  while (plantedDirs.length) {
    const d = plantedDirs.shift();
    if (!d) continue;
    try {
      rmdirSync(d);
    } catch {
      /* non-empty or already gone — leave it alone */
    }
  }
});

beforeAll(() => {
  // A spec that spawned against the wrong root would pass for the wrong reason.
  expect(existsSync(join(ROOT, 'scripts/review-gate.mjs')), `runner not at ${ROOT}`).toBe(true);
  /**
   * ⚑ THE REGISTER IS NOT ASSERTED HERE, and that is the point.
   *
   * This line used to read:
   *   expect(existsSync(join(ROOT, 'docs/audit/PENDING_ALL.md'))).toBe(true);
   *
   * `docs/audit/PENDING_ALL.md` is LOCAL-ONLY and gitignored by policy — it
   * holds legal-position and pricing-adjacent material that must never be
   * tracked in a public repository. So it exists on a maintainer's machine and
   * CANNOT exist on CI or in any fresh clone. The assertion therefore passed
   * locally for a reason that does not generalise, and failed the first time
   * this branch met CI: the whole suite aborted in `beforeAll`, skipping all 15
   * tests below before one of them ran.
   *
   * The tracked runner asserted above already proves the root, which was this
   * guard's only stated purpose. Reproduced and verified against a tracked-only
   * tree (`git archive HEAD`) — the same technique the CI workflow's own
   * comments cite: 15/15 pass with the register absent.
   */
});

describe('AUTH-1 · the gate runs at all', () => {
  it('should expose the standalone auth mode and report a real verdict', () => {
    const r = gate('auth');
    expect(r.out).toContain('AUTH-1 · authority corpus is searchable');
    expect(r.out).toContain('AUTH-1 · file:line citations still resolve');
    expect(r.out).toContain('AUTH-1 · no escalation without a canon search');
    // 0 green · 1 failed · 2 incomplete. Anything else means the contract moved.
    expect([0, 1, 2]).toContain(r.code);
  }, 30_000); /* walks the whole canon corpus (~1,500 files): 6 s measured under full-suite load, 2026-10-16 */

  /**
   * 5.697 / 5.698: the header names the docs root it read, RELATIVE to the checkout (gate
   * output is pasted into public PRs, so never an absolute path). The copy here is not a git
   * checkout, so this also runs the header's "no git" branch, which must degrade to the bare
   * folder rather than throw (R-13).
   */
  it('should print the docs root as a relative or …/name path when it sits outside the workspace', () => {
    const r = gate('register');
    const line = r.out.split('\n').find((l) => l.startsWith('Private docs read from:')) ?? '';
    // the copy sits in the temp folder, far from the checkout: only its name may show
    expect(line).toMatch(/^Private docs read from: DIBOAS_DOCS_DIR \(…\/review-gate-private-docs-/);
    expect(line).not.toContain(tmpdir());
    expect(line).not.toMatch(/\/(Users|home|var|tmp|private)\//);
  });

  it('should refuse an unknown mode rather than silently pass', () => {
    const r = gate('definitely-not-a-mode');
    expect(r.code).toBe(2);
    expect(r.out).toContain('unknown mode');
  });
});

describe('AUTH-1b · citations', () => {
  it('should FAIL on a citation whose file exists nowhere', () => {
    const rel = plant(
      'docs/audit/AUTH1_SPEC_DEAD_CITATION.md',
      '# spec fixture\n\nSee `apps/sandbox/src/lib/authGateSpecNoSuchFile.ts:42`.\n'
    );
    const r = gate('citations');
    expect(r.code).toBe(1);
    // Delta-based: OUR path must be named. Never assert a total.
    expect(r.out).toContain('authGateSpecNoSuchFile.ts:42');
    expect(r.out).toContain(rel.replace('docs/', ''));
  });

  it('should report an AMBIGUOUS basename rather than calling it DEAD', () => {
    // `page.tsx` exists many times over; shorthand like this is not a defect.
    plant(
      'docs/audit/AUTH1_SPEC_AMBIGUOUS.md',
      '# spec fixture\n\nSee `unavailable/page.tsx:22`.\n'
    );
    const r = gate('citations');
    expect(r.out).toMatch(/\d+ ambiguous \(shorthand\)/);
    // The ambiguous path must NOT appear in the dead list.
    const dead = r.out.slice(r.out.indexOf('DEAD') === -1 ? r.out.length : r.out.indexOf('DEAD'));
    expect(dead).not.toContain('unavailable/page.tsx:22');
  });

  it('should treat a citation marked historical ON ITS OWN LINE as not a live claim', () => {
    plant(
      'docs/audit/AUTH1_SPEC_HISTORICAL.md',
      '# spec fixture\n\nSee `apps/sandbox/src/lib/authGateSpecGone.ts:7` ' +
        '*(historical citation — deleted local-only doc)*.\n'
    );
    const r = gate('citations');
    expect(r.out).not.toContain('authGateSpecGone.ts:7');
    expect(r.out).toMatch(/\d+ marked historical on their own line/);
  });

  it('should state its scope limit instead of claiming line-content agreement', () => {
    // The row resolves PATHS. Whether line N still says what a record claims is
    // semantic, and over-claiming would make the gate dishonest.
    const r = gate('citations');
    expect(r.out).toContain('line-content agreement is SEMANTIC and not claimed by this row');
  });
});

describe('AUTH-1c · escalations', () => {
  it('should FAIL a record whose own status line escalates with no canon search', () => {
    const rel = plant(
      'docs/audit/AUTH1_SPEC_ESCALATION_GATE.md',
      '# spec fixture\n\nSTATUS = BLOCKED ON PRODUCT\n\nNo canon search was recorded.\n'
    );
    const r = gate('escalations');
    expect(r.code).toBe(1);
    expect(r.out).toContain(rel.replace('docs/audit/', ''));
    expect(r.out).toContain('WITHOUT a completed Canon-First block');
  });

  it('should RECOGNISE a complete escalation that carries the search block', () => {
    plant(
      'docs/audit/AUTH1_SPEC_ESCALATION_GATE.md',
      '# spec fixture\n\nSTATUS = EXTERNAL AUTHORITY BLOCKER\n\n' +
        'CANON-FIRST SEARCH = COMPLETED\nSEARCHED SOURCES = FEES.md\n' +
        'CONTROLLING AUTHORITY FOUND = NO\n'
    );
    const r = gate('escalations');
    /* DELTA, not absolute. An earlier version asserted `code === 0`, which
       coupled this case to unrelated repository state: the row is legitimately
       red while a pre-existing offender awaits AUTH-1R disposition, and that has
       nothing to do with whether THIS fixture was recognised. The requirement is
       that a record carrying the search block is not named as an offender. */
    expect(r.out).not.toContain('AUTH1_SPEC_ESCALATION_GATE');
  });

  it('should NOT treat a historical CORRECTIONS retrospective as an active escalation', () => {
    /**
     * The first version of this row flagged an honest increment record whose
     * only hit was inside a CORRECTIONS field — *"I carried 5.356 as blocked on
     * Brand/Legal; §4 had already supplied the four strings"*. Flagging
     * self-correction is exactly backwards, and a gate that punishes honesty
     * teaches people to stop writing corrections down.
     */
    plant(
      'docs/audit/AUTH1_SPEC_CORRECTIONS.md',
      '# spec fixture\n\nCORRECTIONS = I previously carried this as BLOCKED ON LEGAL, ' +
        'which was wrong; the authority already existed.\n'
    );
    const r = gate('escalations');
    // Delta only: the row's overall verdict depends on other records.
    expect(r.out).not.toContain('AUTH1_SPEC_CORRECTIONS');
  });

  it('should still FAIL when narrative sits BESIDE a real status claim', () => {
    // The narrative exclusion must narrow, never become a blanket bypass.
    const rel = plant(
      'docs/audit/AUTH1_SPEC_MIXED.md',
      '# spec fixture\n\nCORRECTIONS = I previously carried this as BLOCKED ON LEGAL.\n\n' +
        'STATUS = EXTERNAL AUTHORITY BLOCKER\n'
    );
    const r = gate('escalations');
    expect(r.code).toBe(1);
    expect(r.out).toContain(rel.replace('docs/audit/', ''));
  });
});

describe('AUTH-1a · the authority corpus and its boundary', () => {
  it('should report the authority corpus as searchable', () => {
    const r = gate('canon-index');
    // Always a real canon here (the copy, or the CI stub), so this never returns early
    // (5.699). Assert the shape rather than a count, which drifts as packages are added.
    /* The searchable-corpus SHAPE is this test's subject. On the real corpus the row's exit
       code is not: it fails when a CITED authority becomes unreachable, a different
       condition owned by a different assertion. On the CI stub the corpus is known, so
       the row must be green there: a stub the gate calls BROKEN would prove nothing. */
    expect(r.out).toMatch(/\d+ authority markdown file\(s\) searchable from \d+ package\(s\)/);
    expect(r.out).not.toMatch(/this scan is BROKEN/);
    if (STUB_MODE.on) expect(r.code, r.out).toBe(0);
  });

  it('should name what is CITED but NOT REACHABLE, never read it as "no authority"', () => {
    const r = gate('canon-index');
    expect(r.out).toMatch(/CITED · NOT REACHABLE|every cited authority resolves/);
  });

  it('should EXCLUDE authority packages from implementation-claim counts', () => {
    /**
     * The measured proof of the corpus boundary: the SAME string is ignored
     * inside canon and fails outside it. Before the boundary was explicit,
     * extracting the archives took this walk from 334 documents to 1,062 (69 %
     * canon) and it passed only because canon happens to contain no
     * `N tests / N files` strings — luck of vocabulary, not a boundary.
     */
    const claim = '# spec fixture\n\nSuite is 9,999 tests / 999 files workspace-wide.\n';
    const repo = countsRepo(); /* hermetic — R4-16b */
    repo.put('docs/full-view/canon/extracted/00_PACKAGE_GUIDE/AUTH1_SPEC_INSIDE.md', claim);
    const inside = repo.run();
    expect(inside.code, 'a figure inside canon must not count as our claim').toBe(0);
    expect(inside.out).not.toContain('9999/999');

    repo.put('docs/audit/AUTH1_SPEC_OUTSIDE.md', claim);
    const outside = repo.run();
    expect(outside.code, 'the same figure outside canon must fail').toBe(1);
    expect(outside.out).toContain('9999/999');
  });

  it('should EXCLUDE hidden adjudication controls from every corpus (§5)', () => {
    /**
     * Founder disposition §5: these paths must not participate in authority
     * search, citation resolution, implementation-claim scans or count scans.
     * Contents are never read — the filename declares intent.
     *
     * ⚑ THE FIRST VERSION OF THIS TEST WAS VACUOUS, and sabotaging the tests is
     * what exposed it. It planted the fixture inside `canon/extracted/` and
     * asserted two absences. But `checkCitations`'s corpus is
     * `REGISTER + docs/tech + docs/audit` — canon appears in it **zero** times —
     * and `checkCounts` already excludes canon wholesale via the corpus
     * boundary. So both assertions held with §5 deleted entirely: removing the
     * exclusion left all 15 tests green.
     *
     * Measured signal, and the reason this version plants OUTSIDE canon:
     *   §5 active  → counts sees `7777/777` 0 times, escalations corpus 75
     *   §5 removed → counts sees it 1 time,        escalations corpus 76
     *
     * §5 is defence-in-depth against a future re-extraction — there are 0
     * hidden-control paths on disk today — so the test must CREATE the condition
     * in a corpus that is genuinely scanned.
     */
    const dir = 'docs/audit/hidden_controls_DO_NOT_UPLOAD';
    /* ⚑ One ORDINARY record beside it (5.653). Without private docs (CI) the corpus was
       empty and this delta compared 0 with 0, a pass that measured nothing; the row now
       SKIPs an empty corpus. The ordinary record keeps the comparison real everywhere. */
    plant('docs/audit/SPEC_PROBE_ORDINARY_RECORD.md', '# Ordinary record\n\nNothing to report.\n');
    plant(
      `${dir}/spec_probe_hidden_adjudication_control.md`,
      '# spec fixture\n\nSuite is 7,777 tests / 777 files. ' +
        'See `apps/sandbox/src/lib/authGateSpecHidden.ts:1`.\n'
    );

    // 1 · its figure must NOT be read as one of our implementation claims.
    const counts = gate('counts');
    expect(counts.out, 'a hidden-control figure must not count as our claim').not.toContain(
      '7777/777'
    );

    // 2 · it must not enter the engineering-record corpus at all. Delta against
    //     a second run with the fixture gone, so no absolute total is encoded.
    const withFixture = gate('escalations');
    const sizeWith = Number(/(\d+) engineering record\(s\)/.exec(withFixture.out)?.[1] ?? '-1');
    rmSync(at(dir), { recursive: true, force: true });
    const without = gate('escalations');
    const sizeWithout = Number(/(\d+) engineering record\(s\)/.exec(without.out)?.[1] ?? '-2');
    expect(sizeWithout, 'the comparison must count at least one real record').toBeGreaterThan(0);
    expect(sizeWith, 'a hidden-control file must not enlarge the record corpus').toBe(sizeWithout);

    // 3 · the row says so out loud, so the exclusion is visible to a reader.
    const index = gate('canon-index');
    expect(index.out).toContain('hidden adjudication controls excluded from every corpus');
  });
});

describe('AUTH-1 · the gate is wired into the process, not just present', () => {
  it('should run AUTH-1 rows inside both the increment and system plans', () => {
    // A gate nobody invokes is not enforcement. `--fast` skips the battery so
    // this stays a plan-composition check rather than a full workspace run.
    for (const mode of ['increment', 'system'] as const) {
      // `--fast` MUST reach the runner: without it the battery runs the whole
      // workspace suite — including this file — from inside this test.
      const r = gate(mode, '--fast');
      expect(r.out, `${mode} plan must include AUTH-1`).toContain('AUTH-1 · authority corpus');
      expect(r.out, `${mode} plan must include citations`).toContain('citations still resolve');
      expect(r.out, `${mode} plan must include escalations`).toContain(
        'no escalation without a canon search'
      );
      // --fast skips the battery, so the run reports INCOMPLETE (exit 2), never green.
      expect(r.out, `${mode} must report INCOMPLETE under --fast`).toContain('INCOMPLETE');
    }
  }, 30_000);
});
/**
 * `5.419` — THE COUNTS ROW MUST KNOW WHAT KIND OF DOCUMENT IT IS READING.
 *
 * ## The defect
 *
 * `checkCounts` decided CURRENT-vs-HISTORICAL from the SENTENCE around each
 * figure and had no notion of the document, so a dated increment-gate record
 * stating what it measured at the time was indistinguishable from `CLAUDE.md`
 * publishing the live total. It passed only while the two happened to agree:
 * adding one test in `5.409` moved the workspace total 2,866 -> 2,867 and the
 * row failed with 2 distinct current claims, the second a record whose figure
 * was RIGHT for the increment it records.
 *
 * ## Why these cases exist instead of a corpus measurement
 *
 * Measured 2026-09-21: the document-context rule intercepts **0** occurrences
 * on the real corpus, because every dated record carrying a count already
 * carries a marker word. A rule that excludes nothing cannot be proven by the
 * corpus — it is indistinguishable from an inert one — so it is proven here by
 * planted fixtures, and by the sabotage leg recorded with this change.
 *
 * ## Why every assertion is a DELTA, and why no figure is hardcoded
 *
 * Absolute totals encode today's register instead of the requirement (`5.114`).
 * Worse, this change itself moves the published total, so a fixture carrying a
 * literal `2,872` would rot immediately. Each case reads the CURRENT published
 * key out of the row's own output and builds its fixture from that, then
 * compares the buckets the row prints with and without the fixture.
 *
 * ## Why it lives in THIS file
 *
 * Test FILES run in parallel (no `fileParallelism` is configured), and the
 * AUTH-1 cases above plant count fixtures into the real `docs/audit/` tree and
 * invoke this same row. A separate spec file could observe the other file's
 * `9,999 tests / 999 files` fixture mid-run, which would make the agreement
 * case flaky and let the conflict case pass for the wrong reason. Tests within
 * one file are sequential, so hosting them here removes the race rather than
 * papering over it.
 *
 * ## Stated limit
 *
 * The non-vacuity floor added with this rule (at least one LIVING document must
 * still publish a current count) is NOT covered here and cannot be: `plant()`
 * can only ADD documents, and reaching zero claims requires neutralising the
 * figure in tracked root files. It is sabotage-proven instead.
 */

interface Buckets {
  claims: number;
  living: number;
  dated: number;
  marker: number;
  quoted: number;
}

/** The row's own instrument line, parsed. Never a hardcoded total. */
function buckets(out: string): Buckets {
  const m =
    /(\d+) distinct CURRENT claim\(s\) from (\d+) living doc\(s\); \d+ mention\(s\) excluded \((\d+) dated record · (\d+) sentence marker · (\d+) quoted\)/.exec(
      out
    );
  expect(m, `the counts row printed no instrument line:\n${out}`).not.toBeNull();
  const [, claims, living, dated, marker, quoted] = m as RegExpExecArray;
  return {
    claims: Number(claims),
    living: Number(living),
    dated: Number(dated),
    marker: Number(marker),
    quoted: Number(quoted),
  };
}

/** The figure the repository publishes RIGHT NOW, read from the gate. */
function publishedKey(out: string): { tests: number; files: number } {
  const m = /(\d+)\/(\d+) — /.exec(out);
  expect(m, `no current claim was printed:\n${out}`).not.toBeNull();
  const [, tests, files] = m as RegExpExecArray;
  return { tests: Number(tests), files: Number(files) };
}

const withCommas = (n: number) => n.toLocaleString('en-US');

/**
 * ⛑ HERMETIC (R4-16b, 2026-10-16). These cases used to run the counts row over
 * the REAL documents and assert an absolute exit code, so any real disagreement
 * failed all of them at once: after the 2026-10-16 reconcile, origin's
 * `README.md` (3,326 / 277) and the local `AUDIT_HISTORY.md` (3,382 / 288)
 * disagreed and five cases here went red for a reason none of them tests. Each
 * case now runs in a throwaway repository whose ONLY living document publishes
 * one known figure; the row and its classifier are the real ones.
 */
function countsRepo(): { put: (rel: string, body: string) => void; run: () => GateRun } {
  const dir = mkdtempSync(join(FIXTURE_PARENT, 'review-gate-counts-'));
  countDirs.push(dir);
  installGate(dir);
  mkdirSync(join(dir, 'docs/audit'), { recursive: true });
  mkdirSync(join(dir, 'docs/tech'), { recursive: true });
  /* The register marks this fixture's docs/ as its private docs root (the legacy layout);
     without it the private areas are absent and their documents are never read (5.696). */
  writeFileSync(join(dir, 'docs/audit/PENDING_ALL.md'), '# fixture register\n');
  writeFileSync(
    join(dir, 'README.md'),
    '# fixture\n\nThe workspace publishes 1,234 tests / 56 files.\n'
  );
  const put = (rel: string, body: string): void => {
    mkdirSync(join(dir, rel, '..'), { recursive: true });
    writeFileSync(join(dir, rel), body, 'utf8');
  };
  const run = (): GateRun => {
    try {
      const out = execFileSync('node', ['scripts/review-gate.mjs', 'counts'], {
        cwd: dir,
        encoding: 'utf8',
        env: FIXTURE_ENV,
      });
      return { code: 0, out: plain(out) };
    } catch (error) {
      const e = error as { status?: number; stdout?: string; stderr?: string };
      return { code: e.status ?? 1, out: plain(`${e.stdout ?? ''}${e.stderr ?? ''}`) };
    }
  };
  return { put, run };
}
const countDirs: string[] = [];
afterEach(() => {
  while (countDirs.length) rmSync(countDirs.pop()!, { recursive: true, force: true });
});

describe('5.419 · counts — the classifier reads DOCUMENT CONTEXT, not only the sentence', () => {
  it('A · should PASS when another LIVING document states the same published count', () => {
    const repo = countsRepo();
    const base = repo.run();
    const before = buckets(base.out);
    const { tests, files } = publishedKey(base.out);

    repo.put(
      'docs/audit/COUNTS_SPEC_LIVING_AGREES.md',
      `# spec fixture\n\nThis lane publishes ${withCommas(tests)} tests / ${files} files workspace-wide.\n`
    );
    const r = repo.run();
    const after = buckets(r.out);

    expect(r.code, 'agreement between living documents must not fail').toBe(0);
    expect(after.claims, 'still ONE distinct figure').toBe(before.claims);
    expect(after.living, 'and one more living document stating it').toBe(before.living + 1);
    expect(r.out).toContain('COUNTS_SPEC_LIVING_AGREES.md');
  }, 20_000);

  it('B · should FAIL when two LIVING documents publish different counts', () => {
    /* This fixture is UNDATED and sits in `docs/audit`, so it also proves the
       new rule is not a blanket directory exclusion — the same property the
       AUTH-1 corpus-boundary case above relies on. */
    const repo = countsRepo();
    const base = repo.run();
    const before = buckets(base.out);
    const { tests, files } = publishedKey(base.out);
    const other = { tests: tests + 7, files: files + 1 };

    repo.put(
      'docs/audit/COUNTS_SPEC_LIVING_CONFLICTS.md',
      `# spec fixture\n\nThis lane publishes ${withCommas(other.tests)} tests / ${other.files} files workspace-wide.\n`
    );
    const r = repo.run();
    const after = buckets(r.out);

    expect(r.code, 'two different live totals is the defect this row exists for').toBe(1);
    expect(after.claims, 'a second distinct figure must be visible').toBe(before.claims + 1);
    expect(r.out).toContain(`${other.tests}/${other.files}`);
  }, 20_000);

  it('C · should EXCLUDE a DATED record carrying an older count, with no marker word', () => {
    /**
     * The `5.419` case itself, modelled on the real prose that exposed it. The
     * `5.416` record published its figure as a table row and was unblocked by
     * ADDING the word "historical":
     *
     *   | measured total | 2,866 tests / 238 files — historical measurement, … |
     *
     * This fixture is that row WITHOUT the marker — a correct record that
     * cooperates with no prose convention. Only document context can classify
     * it, which is why the dated bucket is asserted to move and the other two
     * are asserted NOT to.
     */
    const repo = countsRepo();
    const base = repo.run();
    const before = buckets(base.out);
    const { tests, files } = publishedKey(base.out);
    const older = tests - 6;

    repo.put(
      'docs/audit/COUNTS_SPEC_RECORD_2026-09-18.md',
      '# spec fixture · Increment Review Gate record\n\n' +
        '| field | value |\n| --- | --- |\n' +
        `| measured total | ${withCommas(older)} tests / ${files} files — unchanged as expected for a comment-only edit |\n`
    );
    const r = repo.run();
    const after = buckets(r.out);

    expect(r.code, 'a dated record is not a competing live claim').toBe(0);
    expect(after.dated, 'DOCUMENT CONTEXT did the work').toBe(before.dated + 1);
    expect(after.marker, 'not the sentence marker rule').toBe(before.marker);
    expect(after.quoted, 'not the quoting rule').toBe(before.quoted);
    expect(after.claims).toBe(before.claims);
    expect(r.out, 'the record figure must not be published as a claim').not.toContain(
      `${older}/${files}`
    );
  }, 20_000);

  it('D · should still exclude by SENTENCE MARKER in an undated document', () => {
    // Undated, so only the pre-existing marker rule can exclude it.
    const repo = countsRepo();
    const base = repo.run();
    const before = buckets(base.out);
    const { tests, files } = publishedKey(base.out);
    const older = tests - 11;

    repo.put(
      'docs/audit/COUNTS_SPEC_MARKER.md',
      `# spec fixture\n\nThe suite was ${withCommas(older)} tests / ${files} files at an earlier baseline.\n`
    );
    const r = repo.run();
    const after = buckets(r.out);

    expect(r.code).toBe(0);
    expect(after.marker, 'the sentence marker rule is untouched').toBe(before.marker + 1);
    expect(after.dated, 'document context must not claim this exclusion').toBe(before.dated);
    expect(r.out).not.toContain(`${older}/${files}`);
  }, 20_000);

  it('E · should still exclude a BACKTICKED count in an undated document', () => {
    const repo = countsRepo();
    const base = repo.run();
    const before = buckets(base.out);
    const { tests, files } = publishedKey(base.out);
    const older = tests - 13;

    repo.put(
      'docs/audit/COUNTS_SPEC_QUOTED.md',
      `# spec fixture\n\nThe other lane published \`${withCommas(older)} tests / ${files} files\` last cycle.\n`
    );
    const r = repo.run();
    const after = buckets(r.out);

    expect(r.code).toBe(0);
    expect(after.quoted, 'the quoting rule is untouched').toBe(before.quoted + 1);
    expect(after.dated, 'document context must not claim this exclusion').toBe(before.dated);
    expect(r.out).not.toContain(`${older}/${files}`);
  }, 20_000);

  it('F · should FAIL on a DATED filename that is NOT a record and publishes a conflicting count', () => {
    /**
     * THE BOUNDARY CHALLENGE. The controlling requirement has two halves:
     *
     *   HISTORICAL MEASUREMENT  != CURRENT REPOSITORY CLAIM
     *   DATED DOCUMENT          != AUTOMATICALLY HISTORICAL
     *
     * `docs/tech` is the tracked CURRENT-AUTHORITY reference — measured 0 of 30
     * files dated. A dated document THERE is, by the repository's own
     * convention, a living document that happens to carry a date, not an audit
     * or increment-gate record. If an ISO date in the filename were sufficient
     * on its own to exclude a figure, such a document could publish a competing
     * LIVE total invisibly, which is precisely what the counts row exists to
     * prevent.
     *
     * This case therefore establishes:
     *   ISO DATE IN FILENAME != SUFFICIENT BY ITSELF TO EXCLUDE A CLAIM
     */
    const repo = countsRepo();
    const base = repo.run();
    const before = buckets(base.out);
    const { tests, files } = publishedKey(base.out);
    const other = { tests: tests + 23, files: files + 2 };

    repo.put(
      'docs/tech/COUNTS_SPEC_LIVING_AUTHORITY_2026-09-21.md',
      `# spec fixture · living authority note\n\nThis workspace publishes ${withCommas(other.tests)} tests / ${other.files} files.\n`
    );
    const r = repo.run();
    const after = buckets(r.out);

    expect(r.code, 'a conflicting CURRENT claim must stay visible despite a dated filename').toBe(
      1
    );
    expect(after.claims, 'the competing figure must be counted as a claim').toBe(before.claims + 1);
    expect(r.out).toContain(`${other.tests}/${other.files}`);
    expect(after.dated, 'a living-authority document is not a dated RECORD').toBe(before.dated);
  }, 20_000);
});

/**
 * `5.431` — every authoritative front is emitted, and none can silently vanish.
 *
 * ## The defect this exists to close
 *
 * `docs/tech/system-review-gate.md` defines TEN fronts. The runner printed SIX
 * — the ones nobody had mechanised — so Fronts 3, 4 and 10 were never surfaced
 * in any state, and Front 5 was surfaced only through its mechanical `exports`
 * row. That row SKIPs for any change touching nothing under
 * `apps/sandbox/src/view`, which is most changes; when it skipped, Front 5 was
 * adjudicated by NOBODY — not the runner, not the reviewer reading its output.
 *
 * ## Why the document is the source of truth here
 *
 * The first assertion compares the runner against the GATE DOCUMENT rather than
 * against a hard-coded ten. A test that said "expect 10" would keep passing if
 * someone added Front 11 to the document and forgot the runner — which is the
 * same class of drift, one door further along.
 */
describe('5.431 · system review emits every authoritative front', () => {
  /** The fronts the governing document actually defines, read at run time. */
  function documentFronts(): number[] {
    const md = readFileSync(join(ROOT, 'docs/tech/system-review-gate.md'), 'utf8');
    return [...md.matchAll(/^## Front (\d+)/gm)].map((m) => Number(m[1])).sort((a, b) => a - b);
  }

  function emittedFronts(out: string): number[] {
    return [...out.matchAll(/^ *FRONT +(\d+)/gm)].map((m) => Number(m[1])).sort((a, b) => a - b);
  }

  it('should emit exactly the fronts the gate document defines', () => {
    const r = gate('system', '--fast');
    const doc = documentFronts();
    expect(doc.length, 'the gate document must still define its fronts').toBeGreaterThan(0);
    expect(emittedFronts(r.out)).toEqual(doc);
  }, 120_000);

  it('should keep FRONT 5 visible and tied to its exports row, in EITHER row state', () => {
    /**
     * ⚑ THIS TEST USED TO PIN THE WORKING TREE, and that made it a landmine.
     *
     * It asserted a PRECONDITION — *"the exports row skips here because nothing
     * under apps/sandbox/src/view changed"* — so the moment any branch touched
     * `view/`, the row ran, the precondition failed, and this test went red for
     * a reason having nothing to do with what it protects. It was caught by a
     * `view/` file added for the CoinGecko attribution trigger, and it failed
     * ONLY under the whole-workspace run, because that is when the staged tree
     * the gate reads includes the new file.
     *
     * The invariant it actually protects does not depend on the tree at all:
     * FRONT 5 is always PRINTED, and it always names the state of the `exports`
     * row that speaks to it — MANUAL when the row could not run, MECHANICAL
     * EVIDENCE when it did. Both arms are asserted, so the test now covers MORE
     * than it did and is no longer sensitive to what happens to be changed.
     */
    const r = gate('system', '--fast');
    const front5 = r.out.split('\n').find((l) => /^ *FRONT +5\b/.test(l)) ?? '';
    expect(front5, 'FRONT 5 must still be printed').not.toBe('');
    expect(front5, 'it must name the row that speaks to it').toContain('exports');

    const skipped = /exported functions have consumers … SKIP/.test(r.out);
    if (skipped) {
      // A skipped row discharges nothing, so the front stays the reviewer's.
      expect(front5).toContain('MANUAL ADJUDICATION REQUIRED');
    } else {
      // A row that ran is EVIDENCE, never a disposition — the front is still owed.
      expect(front5).toContain('MECHANICAL EVIDENCE');
      expect(front5).toMatch(/record it, then disposition/);
    }
  }, 120_000);

  it('should print the four closure dispositions rather than leave them remembered', () => {
    const r = gate('system', '--fast');
    for (const d of [
      'PASS',
      'N/A · WITH MEASURED PROOF',
      'NON-BLOCKING FINDING · REGISTERED',
      'BLOCKING FINDING · STOP',
    ]) {
      expect(r.out).toContain(d);
    }
  }, 120_000);

  it('should state that mechanical rows alone are NOT a system review', () => {
    const r = gate('system', '--fast');
    expect(r.out).toMatch(/Mechanical rows alone are NOT a system review/);
    expect(r.out).toMatch(/RECONCILED only when/);
  }, 120_000);

  it('should keep a mechanical N/A distinct from a PASS', () => {
    const r = gate('system', '--fast');
    /**
     * ⚑ The ASSERTION here is deliberately environment-independent, and an
     * earlier version was not — it demanded `INCOMPLETE` and exit 2, which is
     * only the LOCAL shape. On CI the ledger `docs/audit/PENDING_ALL.md` is
     * local-only and absent, so the register row FAILS (by its own design,
     * `5.382`) and the run exits 1 with a FAILED summary instead. CI caught it;
     * the same class as `5.416`.
     *
     * What the row actually protects is the RULE, which holds in both: a run
     * containing a skipped mechanical row is never summarised as green, and it
     * never exits 0.
     */
    expect(r.out, 'precondition: at least one row must have skipped').toMatch(/… SKIP/);
    expect(r.out, 'a skipped row must never be summarised as green').not.toContain(
      'Mechanical rows green'
    );
    expect(r.code, 'a run with a skipped row must not exit 0').not.toBe(0);
  }, 120_000);

  it('should leave the increment gate on its own manual list, not the fronts', () => {
    /* Scope limit, asserted: this change is system-mode only. The increment
       gate still prints Parts B–G and must not grow FRONT lines. */
    const r = gate('increment', '--fast');
    expect(emittedFronts(r.out)).toEqual([]);
    expect(r.out).toContain('MANUAL — not mechanisable');
  }, 120_000);
});

/**
 * PB-5 · the gate's own regression tests for the 2026-10-15 corrections. Same
 * discipline as above: uniquely named fixtures, removed even on failure, and
 * delta assertions ("OUR fixture is named"), never totals.
 *
 * ⚑ SCOPE LIMIT (stated): the register TOTAL check, the late-closure check, the
 * gate-index id/total checks and DOC-2's README classification read single
 * fixed files (`PENDING_ALL.md`, `engineering-gates.md`, the canon README) that
 * a test must not rewrite. Those were sabotage-proven by hand on 2026-10-15 and
 * are recorded as such, not claimed here.
 */
describe('PB-5 · PROSE-1 resolves every citation form and needs the real requirement', () => {
  const PLAN = 'docs/audit/PB5_PROSE_SPEC_PLAN.md';
  const planBody =
    '# Plan fixture\n\n## 9 · Minimum required widget telemetry\n\nThe widget must emit two events.\n';

  it('should FAIL a record citing a PATH-PREFIXED plan that only shares one word', () => {
    plant(PLAN, planBody);
    plant(
      'docs/audit/PB5_PROSE_SPEC_RECORD_ONEWORD.md',
      `# Record\n\n**Controlling plan:** \`${PLAN}\`\n\nThe telemetry is unchanged.\n`
    );
    const r = gate('prose');
    expect(r.code).toBe(1);
    expect(r.out).toContain('PB5_PROSE_SPEC_RECORD_ONEWORD.md');
  });

  it('should READ a plan cited under another folder, not report it NOT FOUND', () => {
    /* The directory used to be dropped and the name looked up in docs/audit. */
    const elsewhere = 'docs/tech/PB5_PROSE_SPEC_PLAN_ELSEWHERE.md';
    plant(elsewhere, planBody);
    plant(
      'docs/audit/PB5_PROSE_SPEC_RECORD_ELSEWHERE.md',
      `# Record\n\n**Controlling plan:** \`${elsewhere}\`\n\nThe telemetry is unchanged.\n`
    );
    const r = gate('prose');
    expect(r.out).not.toMatch(/PB5_PROSE_SPEC_PLAN_ELSEWHERE\.md NOT FOUND/);
    expect(r.out).toContain('PB5_PROSE_SPEC_RECORD_ELSEWHERE.md ↛');
  });

  /**
   * ⛑ `5.577` — a fixture must be COMPLETE on its own, because `docs/audit/` is
   * gitignored and absent from every clone (so from CI). Without a corpus the
   * gate SKIPS (no directory) or reports the instrument vacuous (no record names
   * a plan) before it reaches the branch a test is about. Both tests below passed
   * only on a maintainer's machine, where the private records satisfied that
   * precondition. Each now plants a valid cited record as a WITNESS first, so the
   * branch under test is reached the same way with or without private records.
   */
  const WITNESS = 'docs/audit/PB5_PROSE_SPEC_RECORD_WITNESS.md';
  const plantWitness = () => {
    plant(PLAN, planBody);
    plant(
      WITNESS,
      `# Record\n\n**Controlling plan:** \`${PLAN}\`\n\n§9 is met by the two events.\n`
    );
  };

  it('should ACCEPT the same record once it cites the section number', () => {
    plantWitness();
    const before = counted(gate('prose').out, RECORDS);
    plant(
      'docs/audit/PB5_PROSE_SPEC_RECORD_CITED.md',
      `# Record\n\n**Controlling plan:** \`${PLAN}\`\n\n§9 is satisfied by the two events.\n`
    );
    const r = gate('prose');
    expect(counted(r.out, RECORDS), 'the record must have been read').toBe(before + 1);
    expect(r.out).not.toContain('PB5_PROSE_SPEC_RECORD_CITED.md');
  }, 20_000); /* two gate runs (baseline + fixture) — R4-9 */

  it('should FAIL a record that names a controlling plan it gives no file for', () => {
    plantWitness();
    plant(
      'docs/audit/PB5_PROSE_SPEC_RECORD_REVONLY.md',
      '# Record\n\n**Controlling plan:** Revision 3, Strategy PASS\n'
    );
    const r = gate('prose');
    expect(r.code).toBe(1);
    expect(r.out, 'the instrument must not be vacuous').not.toContain(
      'no record names a controlling plan'
    );
    expect(r.out).toContain('CONTROLLING PLAN UNRESOLVABLE');
    expect(r.out).toContain('PB5_PROSE_SPEC_RECORD_REVONLY.md');
    expect(r.out, 'the witness is valid and must not be flagged').not.toContain(
      'PB5_PROSE_SPEC_RECORD_WITNESS.md'
    );
  });
});

/**
 * ⛑ R4-9 (independent review, 2026-10-16): an ACCEPT case that only asserts
 * `not.toContain(fixture)` also passes when the fixture was never SCANNED, and a
 * summary phrase printed on every run proves nothing. Each accept case now
 * proves its fixture was counted, as a delta against a baseline run.
 */
function counted(out: string, re: RegExp): number {
  const m = re.exec(out);
  expect(m, `instrument line missing (${re}):\n${out}`).not.toBeNull();
  return Number((m as RegExpExecArray)[1]);
}
const REFS = /(\d+) reference\(s\)/;
const LOCAL_ONLY = /(\d+) into gitignored local-only areas/;
const RECORDS = /(\d+) record\(s\) name a controlling plan/;

describe('PB-5 · DOC-1 resolves only against what a clone contains', () => {
  it('should FLAG an authority reference into a gitignored file that exists only locally', () => {
    plant(
      'docs/tech/PB5_DOC1_SPEC_FIXTURE.md',
      '# fixture\n\nRead `docs/audit/PENDING_ALL.md` first before changing a status.\n'
    );
    const r = gate('doc1');
    expect(r.code).toBe(1);
    expect(r.out).toContain('PB5_DOC1_SPEC_FIXTURE.md → docs/audit/PENDING_ALL.md');
  });

  it('should ACCEPT a reference to a NEW, not-yet-staged file in a tracked area', () => {
    const before = counted(gate('doc1').out, REFS);
    plant('docs/tech/PB5_DOC1_SPEC_NEW_TARGET.md', '# a file added in the same change\n');
    plant(
      'docs/tech/PB5_DOC1_SPEC_FIXTURE_NEWFILE.md',
      '# fixture\n\nRead `docs/tech/PB5_DOC1_SPEC_NEW_TARGET.md` first before changing a status.\n'
    );
    const r = gate('doc1');
    expect(counted(r.out, REFS), 'the fixture reference must have been scanned').toBe(before + 1);
    expect(r.out).not.toContain('PB5_DOC1_SPEC_FIXTURE_NEWFILE.md');
  }, 20_000); /* two gate runs (baseline + fixture) — R4-9 */

  it('should NOT let a local-only note excuse a missing file in a TRACKED area on the same line', () => {
    plant(
      'docs/tech/PB5_DOC1_SPEC_FIXTURE_MIXED.md',
      '# fixture\n\nSee `docs/tech/PB5_SPEC_GONE.md` and `docs/audit/PENDING_ALL.md` (local-only).\n'
    );
    const r = gate('doc1');
    expect(r.code).toBe(1);
    expect(r.out).toContain('PB5_DOC1_SPEC_FIXTURE_MIXED.md → docs/tech/PB5_SPEC_GONE.md');
  });

  it('should ACCEPT the same reference when the line says it is local-only', () => {
    const before = counted(gate('doc1').out, REFS);
    plant(
      'docs/tech/PB5_DOC1_SPEC_FIXTURE_ANNOTATED.md',
      '# fixture\n\nRead `docs/audit/PENDING_ALL.md` first (local-only) before changing a status.\n'
    );
    const r = gate('doc1');
    expect(counted(r.out, REFS), 'the fixture reference must have been scanned').toBe(before + 1);
    expect(r.out).not.toContain('PB5_DOC1_SPEC_FIXTURE_ANNOTATED.md');
  }, 20_000); /* two gate runs (baseline + fixture) — R4-9 */
});

describe('PB-5 · DOC-1 classifies by git ignore POLICY, never by local disk', () => {
  it('should REPORT a non-authority reference into a gitignored area without failing on it', () => {
    const base = gate('doc1').out;
    plant(
      'docs/tech/PB5_DOC1_SPEC_LOCALONLY.md',
      '# fixture\n\nBackground lives in `docs/audit/PB5_SPEC_NOWHERE.md`.\n'
    );
    const r = gate('doc1');
    expect(r.out).not.toContain('PB5_DOC1_SPEC_LOCALONLY.md');
    expect(counted(r.out, LOCAL_ONLY), 'the reference must be REPORTED as local-only').toBe(
      counted(base, LOCAL_ONLY) + 1
    );
  }, 20_000); /* two gate runs (baseline + fixture) — R4-9 */

  it('should FAIL a reference to a TRACKED area whose file does not exist', () => {
    plant(
      'docs/tech/PB5_DOC1_SPEC_MISSING_TRACKED.md',
      '# fixture\n\nSee `docs/tech/PB5_SPEC_NO_SUCH_FILE.md`.\n'
    );
    const r = gate('doc1');
    expect(r.code).toBe(1);
    expect(r.out).toContain(
      'PB5_DOC1_SPEC_MISSING_TRACKED.md → docs/tech/PB5_SPEC_NO_SUCH_FILE.md'
    );
  });
});

/**
 * R4-1 / R4-2 (independent review, 2026-10-16) — the staged row and the port
 * input must never hand a file name or an argument to a shell.
 *
 * Reproduced against the previous code before the fix: a staged `docs/Ü.md`
 * holding a credential-shaped line PASSED with "0 added line(s) scanned"
 * (git C-quotes the name on a newline list and the quoted name matches no
 * file), and a staged file named `docs/$(touch MARKER).md` EXECUTED `touch`.
 *
 * ⚑ THESE RUN IN A THROWAWAY REPOSITORY, never the real index: the staged row
 * reads `git diff --cached`, and staging in the maintainer's repository is a
 * founder-only operation. The runner finds its repository from its own file
 * location, so a copy placed in a temporary `git init` judges that repository.
 */
describe('R4-1 · staged row — file names are data, never shell syntax', () => {
  function stagedIn(files: Record<string, string>): { run: GateRun; dir: string } {
    const dir = mkdtempSync(join(FIXTURE_PARENT, 'review-gate-staged-'));
    installGate(dir);
    execFileSync('git', ['init', '-q'], { cwd: dir });
    for (const [rel, body] of Object.entries(files)) {
      mkdirSync(join(dir, rel, '..'), { recursive: true });
      writeFileSync(join(dir, rel), body, 'utf8');
      execFileSync('git', ['add', '--', rel], { cwd: dir });
    }
    let run: GateRun;
    try {
      const out = execFileSync('node', ['scripts/review-gate.mjs', 'staged'], {
        cwd: dir,
        encoding: 'utf8',
        env: FIXTURE_ENV,
      });
      run = { code: 0, out: plain(out) };
    } catch (error) {
      const e = error as { status?: number; stdout?: string; stderr?: string };
      run = { code: e.status ?? 1, out: plain(`${e.stdout ?? ''}${e.stderr ?? ''}`) };
    }
    return { run, dir };
  }
  const scannedLines = (out: string): number =>
    Number(/(\d+) added line\(s\) scanned/.exec(out)?.[1] ?? -1);

  it('should SCAN and REFUSE a credential line in a file whose name is not ASCII', () => {
    /* Assembled at runtime, like ESC above, so this source file holds no credential-shaped
       literal (the publication scan blocks one); the staged file gets the exact line. */
    const credentialLine = `api_key = "${'abcdefghijklmnopqrstuv'}"\n`;
    const { run, dir } = stagedIn({ 'docs/Ü.md': credentialLine });
    try {
      expect(scannedLines(run.out), 'the non-ASCII file must be read, not skipped').toBe(1);
      expect(run.out).toMatch(/MUST NOT COMMIT: credential-shaped literal/);
      expect(run.code).toBe(1);
      expect(run.out, 'the name must be listed raw, not C-quoted').toContain('docs/Ü.md');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('should NOT execute a command embedded in a staged file name, and still scan it', () => {
    const { run, dir } = stagedIn({ 'docs/$(touch MARKER).md': 'neutral line\n' });
    try {
      expect(existsSync(join(dir, 'MARKER')), 'a file name was executed as a command').toBe(false);
      expect(existsSync(join(dir, 'docs', 'MARKER')), 'a file name was executed').toBe(false);
      expect(scannedLines(run.out), 'its added line must be scanned').toBe(1);
      expect(run.code).toBe(0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('R4-2 · review:port — operator input is validated, never interpolated', () => {
  it.each(['1;touch PORT_MARKER', '$(touch PORT_MARKER)', '0', '65536', '-1', 'abc'])(
    'should REFUSE %s as a port, run nothing, and exit 1',
    (bad) => {
      /* ⚑ Run from a THROWAWAY copy: against regressed code this input really
         executes (measured 2026-10-16 — the old code created `PORT_MARKER` and a
         file named `-sTCP:LISTEN` in the repository root). A regression must
         never be able to write into the maintainer's tree. */
      const dir = mkdtempSync(join(FIXTURE_PARENT, 'review-gate-port-'));
      installGate(dir);
      let r: GateRun;
      try {
        r = {
          code: 0,
          out: plain(
            execFileSync('node', ['scripts/review-gate.mjs', 'port', bad], {
              cwd: dir,
              encoding: 'utf8',
              env: FIXTURE_ENV,
            })
          ),
        };
      } catch (error) {
        const e = error as { status?: number; stdout?: string; stderr?: string };
        r = { code: e.status ?? 1, out: plain(`${e.stdout ?? ''}${e.stderr ?? ''}`) };
      }
      try {
        expect(r.code).toBe(1);
        expect(r.out).toMatch(/is not a port number \(1–65535\) — refusing/);
        expect(existsSync(join(dir, 'PORT_MARKER')), 'the input was executed').toBe(false);
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    }
  );
});

/**
 * R4-5 (independent review + founder correction, 2026-10-16) — DOC-1 in two
 * layers. LAYER 1 is the verdict and must be identical on every machine: a
 * private reference is classified by git's ignore POLICY, never by whether the
 * file happens to exist here. LAYER 2 (`doc1-local`) verifies private targets
 * only where their area exists, and says NOT VERIFIED HERE otherwise.
 *
 * Each case runs in a throwaway repository with its own `.gitignore`
 * (`docs/*` local except `docs/tech/`), so "clean clone" and "private corpus
 * present" are two real environments, not two assumptions.
 */
describe('R4-5 · DOC-1 — machine-independent verdict, separate private-corpus layer', () => {
  function repoWith(lines: string[], privateFiles: string[] = []): string {
    const dir = mkdtempSync(join(FIXTURE_PARENT, 'review-gate-doc1-'));
    installGate(dir);
    mkdirSync(join(dir, 'docs/tech'), { recursive: true });
    writeFileSync(join(dir, '.gitignore'), 'docs/*\n!docs/tech/\n');
    writeFileSync(join(dir, 'CLAUDE.md'), '# fixture\n');
    /* DOC-1 refuses a scan of under 100 references: give it 100 that resolve. */
    const filler: string[] = [];
    for (let i = 1; i <= 100; i += 1) {
      writeFileSync(join(dir, `docs/tech/target-${i}.md`), `# ${i}\n`);
      filler.push(`- see \`docs/tech/target-${i}.md\``);
    }
    writeFileSync(join(dir, 'docs/tech/index.md'), [...filler, ...lines].join('\n') + '\n');
    for (const p of privateFiles) {
      mkdirSync(join(dir, p, '..'), { recursive: true });
      writeFileSync(join(dir, p), '# private\n');
    }
    /* A private corpus is present only where a register marks the docs root (5.696). */
    if (privateFiles.length) {
      mkdirSync(join(dir, 'docs/audit'), { recursive: true });
      writeFileSync(join(dir, 'docs/audit/PENDING_ALL.md'), '# fixture register\n');
    }
    execFileSync('git', ['init', '-q'], { cwd: dir });
    execFileSync('git', ['add', '-A'], { cwd: dir });
    return dir;
  }
  function run(dir: string, mode: string): GateRun {
    try {
      const out = execFileSync('node', ['scripts/review-gate.mjs', mode], {
        cwd: dir,
        encoding: 'utf8',
        env: FIXTURE_ENV,
      });
      return { code: 0, out: plain(out) };
    } catch (error) {
      const e = error as { status?: number; stdout?: string; stderr?: string };
      return { code: e.status ?? 1, out: plain(`${e.stdout ?? ''}${e.stderr ?? ''}`) };
    }
  }
  const PRIVATE_REF = 'Read `docs/full-view/canon/README.md` (local-only) first.';
  const dirs: string[] = [];
  afterEach(() => {
    while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true });
  });

  it('CLEAN CLONE: an annotated private reference passes Layer 1; Layer 2 is a SKIP, never a pass', () => {
    const dir = repoWith([PRIVATE_REF]);
    dirs.push(dir);
    expect(existsSync(join(dir, 'docs/full-view')), 'fixture must hold no private files').toBe(
      false
    );
    const l1 = run(dir, 'doc1');
    expect(l1.code, l1.out).toBe(0);
    const l2 = run(dir, 'doc1-local');
    expect(l2.code, 'an unverifiable layer is a SKIP (exit 2), never a pass').toBe(2);
    expect(l2.out).toMatch(/NOT VERIFIED HERE — no private area present on this machine/);
  });

  it('PRIVATE CORPUS PRESENT: a misspelled AREA folder FAILS Layer 2', () => {
    const dir = repoWith(
      [PRIVATE_REF, 'Also `docs/full-veiw/canon/README.md` (local-only).'],
      ['docs/full-view/canon/README.md']
    );
    dirs.push(dir);
    expect(run(dir, 'doc1').code, 'Layer 1 must not depend on this machine').toBe(0);
    const l2 = run(dir, 'doc1-local');
    expect(l2.code).toBe(1);
    expect(l2.out).toMatch(
      /UNKNOWN PRIVATE AREA[^(]*\(1\): docs\/tech\/index\.md → docs\/full-veiw\/canon\/README\.md/
    );
  });

  it('PRIVATE CORPUS PRESENT: a private file directly under docs/ is verified, and its typo FAILS', () => {
    const ok = repoWith(
      [PRIVATE_REF, 'See `docs/PRIVATE_NOTE.md` (local-only).'],
      ['docs/full-view/canon/README.md', 'docs/PRIVATE_NOTE.md']
    );
    dirs.push(ok);
    const verified = run(ok, 'doc1-local');
    expect(verified.code, verified.out).toBe(0);
    expect(verified.out).toMatch(/2 verified on this machine/);
    const typo = repoWith(
      [PRIVATE_REF, 'See `docs/PRIVATE_NOET.md` (local-only).'],
      ['docs/full-view/canon/README.md']
    );
    dirs.push(typo);
    expect(run(typo, 'doc1-local').out).toMatch(
      /PRIVATE TARGET MISSING \(1\): docs\/tech\/index\.md → docs\/PRIVATE_NOET\.md/
    );
  });

  it('NON-ASCII TRACKED TARGET: a tracked file with an accented name resolves (git -z, R4-2)', () => {
    const dir = repoWith(['See `docs/tech/Ü-notes.md`.']);
    dirs.push(dir);
    writeFileSync(join(dir, 'docs/tech/Ü-notes.md'), '# ü\n');
    execFileSync('git', ['add', '--', 'docs/tech/Ü-notes.md'], { cwd: dir });
    const r = run(dir, 'doc1');
    expect(r.code, r.out).toBe(0);
  });

  it('PRIVATE CORPUS PRESENT: an existing target is verified; a typo FAILS Layer 2 but not Layer 1', () => {
    const ok = repoWith([PRIVATE_REF], ['docs/full-view/canon/README.md']);
    dirs.push(ok);
    expect(run(ok, 'doc1').code).toBe(0);
    const verified = run(ok, 'doc1-local');
    expect(verified.code).toBe(0);
    expect(verified.out).toMatch(/1 verified on this machine/);

    const typo = repoWith(
      [PRIVATE_REF, 'Also `docs/full-view/canon/READEM.md` (local-only).'],
      ['docs/full-view/canon/README.md']
    );
    dirs.push(typo);
    expect(run(typo, 'doc1').code, 'Layer 1 must not depend on this machine').toBe(0);
    const l2 = run(typo, 'doc1-local');
    expect(l2.code).toBe(1);
    expect(l2.out).toMatch(
      /PRIVATE TARGET MISSING \(1\): docs\/tech\/index\.md → docs\/full-view\/canon\/READEM\.md/
    );
  });

  it('GENUINELY INVALID: a broken published reference FAILS Layer 1 in BOTH environments', () => {
    for (const privateFiles of [[], ['docs/full-view/canon/README.md']]) {
      const dir = repoWith([PRIVATE_REF, 'Details in `docs/tech/MISSING.md`.'], privateFiles);
      dirs.push(dir);
      const r = run(dir, 'doc1');
      expect(r.code).toBe(1);
      expect(r.out).toMatch(
        /dangling references ROSE to 1 .*docs\/tech\/index\.md → docs\/tech\/MISSING\.md/
      );
    }
  });

  it('MARKER SCOPE: one marker excuses only the reference it follows', () => {
    const dir = repoWith([
      'Read `docs/tech/MISSING2.md` first; `docs/audit/OLD.md` is ⚠ NOT REACHABLE.',
    ]);
    dirs.push(dir);
    const r = run(dir, 'doc1');
    expect(r.code).toBe(1);
    expect(r.out).toMatch(
      /UNREACHABLE AUTHORITY REFERENCE \(1\): docs\/tech\/index\.md → docs\/tech\/MISSING2\.md/
    );
  });

  it('WIDENED: #anchor and :line suffixes, .js targets and directories are checked', () => {
    const good = repoWith([
      'See `docs/tech/target-1.md#top` and `docs/tech/target-2.md:13` and `docs/tech/`.',
    ]);
    dirs.push(good);
    expect(run(good, 'doc1').code).toBe(0);
    const bad = repoWith([
      'See `docs/tech/GONE.md#top`, `scripts/nope.js` and `docs/tech/nodir/`.',
    ]);
    dirs.push(bad);
    const r = run(bad, 'doc1');
    expect(r.code).toBe(1);
    expect(r.out).toMatch(/dangling references ROSE to 3/);
  });
});

/**
 * R4-6 (independent review, 2026-10-16) — PROSE-1 must not pass a record it
 * never checked, and must not count a coincidence as a citation.
 */
describe('R4-6 · PROSE-1 — proven N/A, whole-number ids, own headings, multi-block records', () => {
  it('should LIST a record whose plan has no requirement heading as a PROVEN N/A, never pass it silently', () => {
    plant(
      'docs/audit/R46_PROSE_PLAN_NOREQ.md',
      '# Plan\n\n## 1 · Context\n\nNothing required here.\n'
    );
    plant(
      'docs/audit/R46_PROSE_RECORD_NOREQ.md',
      '# Record\n\n**Controlling plan:** `docs/audit/R46_PROSE_PLAN_NOREQ.md`\n'
    );
    const r = gate('prose');
    expect(r.out).toMatch(/R46_PROSE_RECORD_NOREQ\.md: N\/A — its plan has no requirement heading/);
  });

  it('should NOT read 5.12 as cited by a record that only names 5.123', () => {
    plant('docs/audit/R46_PROSE_PLAN_ID.md', '# Plan\n\n## 3 · Required closure of 5.12\n');
    plant(
      'docs/audit/R46_PROSE_RECORD_ID.md',
      '# Record\n\n**Controlling plan:** `docs/audit/R46_PROSE_PLAN_ID.md`\n\nClosed 5.123 today.\n'
    );
    const r = gate('prose');
    expect(r.code).toBe(1);
    expect(r.out).toMatch(/R46_PROSE_RECORD_ID\.md ↛ "3 · Required closure of 5\.12"/);
  });

  it("should NOT count the record's OWN numbered heading as citing the plan's section", () => {
    plant('docs/audit/R46_PROSE_PLAN_OWN.md', '# Plan\n\n## 16 · Minimum required observability\n');
    plant(
      'docs/audit/R46_PROSE_RECORD_OWN.md',
      '# Record\n\n**Controlling plan:** `docs/audit/R46_PROSE_PLAN_OWN.md`\n\n## 16 · Unrelated section of this record\n\nNothing about it.\n'
    );
    const r = gate('prose');
    expect(r.code).toBe(1);
    expect(r.out).toMatch(/R46_PROSE_RECORD_OWN\.md ↛ "16 · Minimum required observability"/);
  });

  it('should hold a MULTI-BLOCK record to each of its blocks', () => {
    plant(
      'docs/audit/R46_PROSE_PLAN_BLK.md',
      '# Plan\n\n### E · Evidence block\n\n### Evidence must be fresh\n'
    );
    plant(
      'docs/audit/R46_PROSE_BLOCKS_EFG_RECORD.md',
      '# Record\n\n**Controlling plan:** `docs/audit/R46_PROSE_PLAN_BLK.md`\n\nWork done.\n'
    );
    const r = gate('prose');
    expect(r.code).toBe(1);
    expect(r.out).toMatch(/R46_PROSE_BLOCKS_EFG_RECORD\.md ↛ "Evidence must be fresh"/);
  });
});

/**
 * R4 correction (independent review, 2026-10-16) — the exports row read
 * consumers through a REGEX comment stripper: `//.*$` deleted the rest of a line
 * after a URL in a string, so `fetch("https://x.dev"); selectGoal(s);` hid a real
 * consumer and the row reported NO CONSUMER. It now strips by the parser, and its
 * consumer search runs without a shell. Run in a throwaway repository with a
 * changed `view/` file, because the row only runs when one changed.
 */
describe('R4 correction · exports row — a consumer after a URL string is still a consumer', () => {
  it('should find a consumer that follows a URL in a string', () => {
    const dir = mkdtempSync(join(FIXTURE_PARENT, 'review-gate-exports-'));
    try {
      installGate(dir);
      /* the row loads `typescript` (a root devDependency) — link the real install */
      symlinkSync(join(ROOT, 'node_modules'), join(dir, 'node_modules'));
      mkdirSync(join(dir, 'apps/sandbox/src/view'), { recursive: true });
      writeFileSync(
        join(dir, 'apps/sandbox/src/view/goals.ts'),
        'export function selectGoal(s: number) { return s; }\n'
      );
      writeFileSync(
        join(dir, 'apps/sandbox/src/Screen.tsx'),
        /* The ONLY use follows a URL string; a namespace import never names the function, so a
           regex stripper that eats the rest of the line leaves no consumer at all. */
        'import * as goals from \'./view/goals\';\nexport function S() { void fetch("https://x.dev"); return goals.selectGoal(1); }\n'
      );
      const git = (...a: string[]) => execFileSync('git', a, { cwd: dir, stdio: 'pipe' });
      git('init', '-q');
      git('add', '-A');
      git('-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-q', '-m', 'base', '--no-verify');
      writeFileSync(
        join(dir, 'apps/sandbox/src/view/goals.ts'),
        'export function selectGoal(s: number) { return s + 0; }\n'
      );
      let out = '';
      let code = 0;
      try {
        out = plain(
          execFileSync('node', ['scripts/review-gate.mjs', 'exports'], {
            cwd: dir,
            encoding: 'utf8',
            env: FIXTURE_ENV,
          })
        );
      } catch (error) {
        const e = error as { status?: number; stdout?: string; stderr?: string };
        code = e.status ?? 1;
        out = plain(`${e.stdout ?? ''}${e.stderr ?? ''}`);
      }
      expect(out, out).toMatch(/1 exported symbol\(s\) checked/);
      expect(out).not.toMatch(/NO CONSUMER ANYWHERE: selectGoal/);
      expect(code, out).toBe(0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }, 20_000);
});

describe('R4 correction · PROSE-1 — a block label is exact and case-sensitive', () => {
  it('should read BLOCK_FEED_ as a lane-level record, not blocks F, E and D', () => {
    plant(
      'docs/audit/R4C_PROSE_PLAN_BLK.md',
      '# Plan\n\n### E · Evidence block\n\n### Evidence must be fresh\n'
    );
    plant(
      'docs/audit/R4C_PROSE_BLOCK_FEED_RECORD.md',
      '# Record\n\n**Controlling plan:** `docs/audit/R4C_PROSE_PLAN_BLK.md`\n\nWork done.\n'
    );
    const r = gate('prose');
    expect(r.out).toMatch(
      /R4C_PROSE_BLOCK_FEED_RECORD\.md: N\/A — every requirement heading binds block\(s\) E; the record is lane-level/
    );
  }, 20_000);
});
