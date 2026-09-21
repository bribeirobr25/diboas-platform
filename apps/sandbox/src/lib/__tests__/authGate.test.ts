import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, rmdirSync, writeFileSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

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
  const abs = join(ROOT, relPath);
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
    // SKIP is legitimate on a fresh clone where canon is absent; assert the
    // shape rather than a count, which drifts as packages are added.
    if (r.out.includes('absent (fresh clone')) {
      expect(r.code).toBe(2);
      return;
    }
    /* The searchable-corpus SHAPE is this test's subject. The row's overall exit
       code is not: it fails when a CITED authority becomes unreachable, which is
       a different condition owned by a different assertion — so asserting 0 here
       would couple this case to unrelated corpus state. */
    expect(r.out).toMatch(/\d+ authority markdown file\(s\) searchable from \d+ package\(s\)/);
  });

  it('should name what is CITED but NOT REACHABLE, never read it as "no authority"', () => {
    const r = gate('canon-index');
    if (r.out.includes('absent (fresh clone')) return;
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
    plant('docs/full-view/canon/extracted/00_PACKAGE_GUIDE/AUTH1_SPEC_INSIDE.md', claim);
    const inside = gate('counts');
    expect(inside.code, 'a figure inside canon must not count as our claim').toBe(0);
    expect(inside.out).not.toContain('9999/999');

    plant('docs/audit/AUTH1_SPEC_OUTSIDE.md', claim);
    const outside = gate('counts');
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
    rmSync(join(ROOT, dir), { recursive: true, force: true });
    const without = gate('escalations');
    const sizeWithout = Number(/(\d+) engineering record\(s\)/.exec(without.out)?.[1] ?? '-2');
    expect(sizeWith, 'a hidden-control file must not enlarge the record corpus').toBe(sizeWithout);

    // 3 · the row says so out loud, so the exclusion is visible to a reader.
    const index = gate('canon-index');
    if (!index.out.includes('absent (fresh clone')) {
      expect(index.out).toContain('hidden adjudication controls excluded from every corpus');
    }
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

describe('5.419 · counts — the classifier reads DOCUMENT CONTEXT, not only the sentence', () => {
  it('A · should PASS when another LIVING document states the same published count', () => {
    const base = gate('counts');
    const before = buckets(base.out);
    const { tests, files } = publishedKey(base.out);

    plant(
      'docs/audit/COUNTS_SPEC_LIVING_AGREES.md',
      `# spec fixture\n\nThis lane publishes ${withCommas(tests)} tests / ${files} files workspace-wide.\n`
    );
    const r = gate('counts');
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
    const base = gate('counts');
    const before = buckets(base.out);
    const { tests, files } = publishedKey(base.out);
    const other = { tests: tests + 7, files: files + 1 };

    plant(
      'docs/audit/COUNTS_SPEC_LIVING_CONFLICTS.md',
      `# spec fixture\n\nThis lane publishes ${withCommas(other.tests)} tests / ${other.files} files workspace-wide.\n`
    );
    const r = gate('counts');
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
    const base = gate('counts');
    const before = buckets(base.out);
    const { tests, files } = publishedKey(base.out);
    const older = tests - 6;

    plant(
      'docs/audit/COUNTS_SPEC_RECORD_2026-09-18.md',
      '# spec fixture · Increment Review Gate record\n\n' +
        '| field | value |\n| --- | --- |\n' +
        `| measured total | ${withCommas(older)} tests / ${files} files — unchanged as expected for a comment-only edit |\n`
    );
    const r = gate('counts');
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
    const base = gate('counts');
    const before = buckets(base.out);
    const { tests, files } = publishedKey(base.out);
    const older = tests - 11;

    plant(
      'docs/audit/COUNTS_SPEC_MARKER.md',
      `# spec fixture\n\nThe suite was ${withCommas(older)} tests / ${files} files at an earlier baseline.\n`
    );
    const r = gate('counts');
    const after = buckets(r.out);

    expect(r.code).toBe(0);
    expect(after.marker, 'the sentence marker rule is untouched').toBe(before.marker + 1);
    expect(after.dated, 'document context must not claim this exclusion').toBe(before.dated);
    expect(r.out).not.toContain(`${older}/${files}`);
  }, 20_000);

  it('E · should still exclude a BACKTICKED count in an undated document', () => {
    const base = gate('counts');
    const before = buckets(base.out);
    const { tests, files } = publishedKey(base.out);
    const older = tests - 13;

    plant(
      'docs/audit/COUNTS_SPEC_QUOTED.md',
      `# spec fixture\n\nThe other lane published \`${withCommas(older)} tests / ${files} files\` last cycle.\n`
    );
    const r = gate('counts');
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
    const base = gate('counts');
    const before = buckets(base.out);
    const { tests, files } = publishedKey(base.out);
    const other = { tests: tests + 23, files: files + 2 };

    plant(
      'docs/tech/COUNTS_SPEC_LIVING_AUTHORITY_2026-09-21.md',
      `# spec fixture · living authority note\n\nThis workspace publishes ${withCommas(other.tests)} tests / ${other.files} files.\n`
    );
    const r = gate('counts');
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

  it('should keep FRONT 5 visible, as MANUAL, when its mechanical row cannot run', () => {
    const r = gate('system', '--fast');
    /* The precondition this test depends on — stated, not assumed: the exports
       row skips here because nothing under apps/sandbox/src/view changed. */
    expect(r.out, 'precondition: the exports row must be the skipped one').toMatch(
      /exported functions have consumers … SKIP/
    );
    const front5 = r.out.split('\n').find((l) => /^ *FRONT +5\b/.test(l)) ?? '';
    expect(front5, 'FRONT 5 must still be printed').not.toBe('');
    expect(front5).toContain('MANUAL ADJUDICATION REQUIRED');
    expect(front5, 'it must say WHICH row failed to discharge it').toContain('exports');
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
    /* A skipped row must not be summarised as green, and the exit code says so
       (2 = INCOMPLETE). This is the row that made `5.431` findable at all. */
    expect(r.out).toMatch(/INCOMPLETE — \d+ row\(s\) could not run/);
    expect(r.out).toContain('A skipped row is not a pass');
    expect(r.code, 'INCOMPLETE must not exit 0').toBe(2);
  }, 120_000);

  it('should leave the increment gate on its own manual list, not the fronts', () => {
    /* Scope limit, asserted: this change is system-mode only. The increment
       gate still prints Parts B–G and must not grow FRONT lines. */
    const r = gate('increment', '--fast');
    expect(emittedFronts(r.out)).toEqual([]);
    expect(r.out).toContain('MANUAL — not mechanisable');
  }, 120_000);
});
