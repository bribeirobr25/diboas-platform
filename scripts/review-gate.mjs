#!/usr/bin/env node
/**
 * Review Gate — the executable half of the two review gates.
 *
 * WHY THIS EXISTS: `docs/tech/increment-review-gate.md` and
 * `docs/tech/system-review-gate.md` mark some rows with ⚙ — mechanisable, and
 * therefore not things a human or an agent should be trusted to remember. Each
 * check below exists because the defect it catches ALREADY SHIPPED here:
 *
 *   register    a register id was double-claimed; the marker said it was free
 *   counts      a test count (774/74) was carried, never re-measured, and was
 *               wrong in five documents at once
 *   authorities an audit referenced 8 of 27 authorities and looked complete
 *   staged      `git add` with an unquoted variable staged NOTHING, and the
 *               commit then reported success over an empty change
 *   exports     two built screens shipped linked from nowhere
 *   port        killing by process group off a port's pid list took down
 *               Docker Desktop — a port's pids include its CLIENTS
 *   battery     the gate printed "Mechanical rows green" and exited 0 without
 *               ever running type-check, lint, format:check or the suites
 *
 *   pnpm review:increment     mechanical rows + the increment manual checklist
 *   pnpm review:system        mechanical rows + the system manual checklist
 *   pnpm review:register      just the id verifier (run BEFORE claiming ids)
 *   pnpm review:doc1          DOC-1 layer 1 — committed references (same verdict in every clone)
 *   pnpm review:doc1-local    DOC-1 layer 2 — private references, where their area exists here
 *   pnpm review:port 3002     identify the listener; add --kill to stop it
 *
 * DELIBERATELY NOT MECHANISED, and the script says so every run rather than
 * leaving you to assume coverage: duplicate-derivation search (X1) is too
 * heuristic to avoid noise, and locale parity (C8) already has real tests —
 * a worse reimplementation here would be a liability, not a gate.
 */
import { execFileSync, execSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  realpathSync,
  writeFileSync,
} from 'node:fs';
import { availableParallelism, cpus, freemem, homedir, loadavg, tmpdir, totalmem } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import {
  displayPath,
  docsRootProblem,
  isPrivateDocsPath,
  makeDirReader,
  makeDocsResolver,
  resolveDocsRoot,
} from './lib/docs-root.mjs';

/* Colours, unless NO_COLOR is set (https://no-color.org; the docs CI sets it). */
const C = process.env.NO_COLOR
  ? { g: '', r: '', y: '', b: '', d: '', x: '' }
  : { g: '\x1b[32m', r: '\x1b[31m', y: '\x1b[33m', b: '\x1b[1m', d: '\x1b[2m', x: '\x1b[0m' };
/**
 * ⛑ THE REPOSITORY ROOT IS WHERE THIS SCRIPT LIVES, NOT WHERE IT WAS RUN FROM
 * (P0 review, PB-5). `process.cwd()` made every check depend on the caller's
 * directory: run from `apps/sandbox`, files resolved against the wrong tree and
 * checks skipped or failed for reasons unrelated to the repository.
 */
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sh = (cmd) => execSync(cmd, { cwd: ROOT, stdio: 'pipe' }).toString();
/**
 * ⛑ NO SHELL FOR DATA (R4-1, independent review 2026-10-16). `sh()` takes a
 * command STRING, so a file name or document text interpolated into it is
 * parsed as shell syntax: a staged file named `docs/$(cmd).md` ran `cmd`, and
 * git prints `$(…)` and backticks unescaped. `sh()` is now for constant
 * commands only; anything carrying a value goes through `run()`, which passes
 * an argument array and never starts a shell.
 */
const run = (file, argv) => execFileSync(file, argv, { cwd: ROOT, stdio: 'pipe' }).toString();
/**
 * ⛑ NAME LISTS ARE NUL-SEPARATED (R4-1). On a newline list git C-quotes any
 * unusual name (`"docs/\303\234.md"` for `docs/Ü.md`, with
 * `core.quotePath` at its default); that quoted string names no file, so
 * `git diff -- <it>` returned nothing and the staged row scanned 0 lines of
 * that file and PASSED. `-z` prints names raw, NUL-terminated.
 */
const gitNames = (argv) => run('git', argv).split('\0').filter(Boolean);
/**
 * ⚑ PRIVATE DOCS ARE READ FROM THE DOCS ROOT (register `5.653`, brain program). Paths stay
 * LOGICAL (`docs/audit/PENDING_ALL.md`) everywhere in this file — they are what records
 * cite. `at()` maps a private one to where it physically lives (`DIBOAS_DOCS_DIR`, the
 * legacy in-repo tree, or the sibling `diboas-docs` checkout); `ls()` lists a logical
 * folder, merging the public and private halves of `docs/`. `scripts/lib/docs-root.mjs`.
 */
const DOCS_ROOT = resolveDocsRoot(ROOT);
/**
 * An unusable docs root (a wrong `DIBOAS_DOCS_DIR`, or two registers: two answers to "what
 * is current") stops every mode that reads docs, never a silent pick (`5.697`, `5.698`).
 * `port` reads no docs, so it is not blocked.
 */
const DOCS_PROBLEM = docsRootProblem(ROOT, DOCS_ROOT);
if (DOCS_PROBLEM && process.argv[2] !== 'port') {
  console.error(`${DOCS_PROBLEM}. Nothing was checked.`);
  process.exit(2);
}
/**
 * No private docs on this machine (a public clone, CI). The resolver then maps every
 * private path to a folder that never exists, so every row sees them as absent; the rows
 * that only make sense with private docs also SKIP explicitly (`5.696`: a failed battery
 * created `docs/audit/` for its log, and PROSE-1 then reported a PASS over nothing).
 */
const NO_PRIVATE = DOCS_ROOT.via === 'none';
/**
 * The header's "read from" line: the folder relative to this checkout (`displayPath`, never
 * a machine path: gate output gets pasted into public PRs), and, when the docs root is a
 * git checkout of its own, whether it is on main and at which commit. The branch NAME is
 * not printed: private branch names do not belong in public PRs (`5.697`, `5.698`).
 */
function describeDocsRoot() {
  if (DOCS_ROOT.via === 'none') return 'nowhere (absent here, as on a fresh clone)';
  if (DOCS_ROOT.via === 'legacy') return 'docs/ in this checkout';
  const where = `${DOCS_ROOT.via === 'sibling' ? 'the sibling diboas-docs checkout' : 'DIBOAS_DOCS_DIR'} (${displayPath(ROOT, DOCS_ROOT.dir)})`;
  const head = docsGit(['rev-parse', '--abbrev-ref', 'HEAD']);
  const sha = docsGit(['rev-parse', '--short', 'HEAD']);
  if (!head || !sha) return where;
  return `${where} · ${head === 'main' ? 'on main' : 'NOT on main'} @ ${sha}`;
}
/**
 * A read-only git query in the private docs checkout; null when the docs root is not the
 * top of a git checkout of its own. Git otherwise walks UP to any repository above the
 * folder, or obeys an inherited `GIT_DIR` (as inside a hook), and would report the wrong
 * repository's branch and commit. Never fetches.
 */
function docsGit(argv) {
  const env = { ...process.env };
  for (const k of ['GIT_DIR', 'GIT_WORK_TREE', 'GIT_INDEX_FILE', 'GIT_COMMON_DIR']) delete env[k];
  const git = (a) =>
    execFileSync('git', ['-C', DOCS_ROOT.dir, ...a], { stdio: 'pipe', env })
      .toString()
      .trim();
  try {
    if (realpathSync(git(['rev-parse', '--show-toplevel'])) !== realpathSync(DOCS_ROOT.dir))
      return null;
    return git(argv);
  } catch {
    return null;
  }
}
/** Commits on the last-fetched origin/main that the docs checkout lacks; 0 when unknown or
    when the docs root is not a git checkout of its own (the legacy in-repo tree never is). */
function docsCheckoutBehind() {
  const n = Number(docsGit(['rev-list', '--count', 'HEAD..origin/main']));
  return Number.isFinite(n) ? n : 0;
}
/**
 * Private-area folders left inside this checkout's `docs/` (a market worktree keeps
 * `docs/cc-sync/`) are NOT read when the private docs live elsewhere. Say so, never silently.
 */
function ignoredInRepoAreas() {
  if (DOCS_ROOT.via === 'legacy' || !existsSync(join(ROOT, 'docs'))) return [];
  return readdirSync(join(ROOT, 'docs'), { withFileTypes: true })
    .filter(
      (e) => e.isDirectory() && isPrivateDocsPath(`docs/${e.name}`) && !e.name.startsWith('.')
    )
    .map((e) => e.name);
}
/**
 * Error text from a thrown row or a failed write can carry machine paths. Printed output
 * names them by role instead: the docs root, this checkout, the temp folder, the home.
 */
function scrubPaths(text) {
  const swaps = [
    [DOCS_ROOT.dir, '<docs-root>'],
    [ROOT, '<repo>'],
    [tmpdir(), '<tmp>'],
    [homedir(), '~'],
  ].filter(([from]) => from);
  /* every spelling (macOS: /var vs /private/var), longest first so a prefix never wins */
  const pairs = swaps
    .flatMap(([from, to]) => [...new Set([from, safeRealpath(from)])].map((f) => [f, to]))
    .sort((x, y) => y[0].length - x[0].length);
  let out = String(text);
  for (const [f, to] of pairs) out = out.split(f).join(to);
  return out;
}
function safeRealpath(p) {
  try {
    return realpathSync(p);
  } catch {
    return p;
  }
}
const NO_PRIVATE_SKIP = {
  ok: true,
  skip: true,
  detail: 'private docs absent here (no diboas-docs checkout) — nothing was checked',
};
const at = makeDocsResolver(ROOT, DOCS_ROOT.dir);
const ls = makeDirReader(ROOT, DOCS_ROOT.dir);
const rd = (p) => readFileSync(at(p), 'utf8');

const REGISTER = 'docs/audit/PENDING_ALL.md';
const GATES = ['docs/tech/increment-review-gate.md', 'docs/tech/system-review-gate.md'];

/**
 * THE CORPUS BOUNDARY (AUTH-1, 2026-09-17) — stated because it was implicit and
 * that caused a regression the same day.
 *
 * `CANON` holds the current authority packages. They are **searched as
 * authority** and must NEVER be scanned as repository claims: a figure inside a
 * Brand or M&E document is that workstream's statement, not ours.
 *
 * Why this is not theoretical: the packages shipped as `.zip`, so no text search
 * reached them and `checkCounts` walked 334 docs. Extracting them (727 markdown
 * files) took that walk to 1,062 — 69 % canon — and it still passed only because
 * canon happens to contain no `N tests / N files` strings. Luck of vocabulary is
 * not a boundary, so `walk()` now takes an exclusion and every doc-walking row
 * states which corpus it read.
 */
const CANON = 'docs/full-view/canon';
/**
 * HIDDEN ADJUDICATION CONTROLS — excluded permanently (founder disposition §5,
 * 2026-09-17).
 *
 * These paths must not participate in authority search, citation resolution,
 * implementation-claim scans or count scans. The extracted working copies were
 * deleted; this exclusion is what stops a future re-extraction quietly
 * reintroducing them. The ORIGINAL archives are preserved byte-for-byte and are
 * never modified — only working copies are excluded, never the source.
 *
 * Contents are NOT read. The filename declares intent and that is sufficient.
 */
const HIDDEN_CONTROL_DIR = 'hidden_controls_DO_NOT_UPLOAD';
const HIDDEN_CONTROL_FILE = /_hidden_adjudication_control\.md$/;
const isHiddenControl = (p) =>
  p.includes(`/${HIDDEN_CONTROL_DIR}/`) ||
  p.endsWith(`/${HIDDEN_CONTROL_DIR}`) ||
  p.includes(HIDDEN_CONTROL_DIR) ||
  HIDDEN_CONTROL_FILE.test(p);

/**
 * DATED RECORD vs LIVING DOCUMENT — the document-context rule (`5.419`).
 *
 * A record is a document in a RECOGNISED RECORD LOCATION whose filename carries
 * a full ISO date. Its figures are evidence of a past measurement and are never
 * live claims. **BOTH halves are required**, and the reason is a measured one.
 *
 * ⚑ THE FIRST IMPLEMENTATION USED THE DATE ALONE, AND THAT WAS TOO BROAD.
 * `HISTORICAL MEASUREMENT != CURRENT CLAIM` is the requirement, but so is
 * `DATED DOCUMENT != AUTOMATICALLY HISTORICAL`. With the date alone, a dated
 * file anywhere in the walked corpus could publish a competing LIVE total and be
 * silently excluded — including under `docs/tech`, the tracked current-authority
 * reference. Proven by CASE F, which planted a dated document in `docs/tech`
 * publishing a different workspace count: the row stayed GREEN at 0 claims
 * added. That is the failure this gate exists to prevent, so the location is
 * part of the predicate, not commentary.
 *
 * MEASURED CONVENTION (2026-09-21) — a filename heuristic with no convention
 * proof is exactly the class of guess this runner exists to catch:
 *
 *   docs/audit    92 files — 87 dated   (the record location)
 *   docs/tech     30 files —  0 dated   (the current authority reference)
 *   ROOT           3 files —  0 dated   (CLAUDE.md, README.md, SECURITY.md)
 *   tracked  md   34 files —  0 dated   (git archive HEAD)
 *   elsewhere    226 files — 11 dated   (none carrying a governed count)
 *
 * WHY THE NAME CANNOT CARRY THIS ALONE. Date-at-end-of-basename is 99 % inside
 * `docs/audit` (86 of 87) and 100 % outside it (11 of 11) — the two groups share
 * the shape, so no naming convention can separate a record from a living
 * document. Only the location distinguishes them.
 *
 * WHY AN ALLOW-LIST, NOT AN EXCLUSION LIST. Listing record locations FAILS SAFE:
 * a dated document in an unrecognised location has its counts read as live
 * claims, so the gate fails LOUDLY and a human decides. Excluding `docs/tech`
 * and ROOT instead would fail OPEN for every location added later — the same
 * defect in a new costume (`guard-filters-are-part-of-the-threat-model`).
 *
 * WHY NOT A BLANKET DIRECTORY RULE. `5.419` floated treating everything under
 * `docs/audit/` as historical. The date is still required: a count planted in an
 * UNDATED `docs/audit` fixture must keep FAILING, and it does (the gate's own
 * spec asserts it). Location alone would be a hole; date alone was too broad.
 *
 * REGRESSION-FREE, MEASURED: adding the location requirement changed the class
 * of **0** of 60 occurrences in the corpus — `marker 43 · quoted 14 · dated 1 ·
 * claim 2`, identical before and after, still one claim key.
 *
 * STATED SCOPE LIMITS — the date must be in the FILENAME, so `USABILITY_REPORT.md`
 * (dated only in its body, `Report date: 2026-06-23`) is NOT recognised; it
 * carries no count today. A month-only stamp is deliberately not a date:
 * `SECURITY_FINDINGS_2026-05.md` is a living ledger and keeps being judged as
 * one. And a genuine dated record OUTSIDE `docs/audit/` is not recognised either
 * — it must use the sentence marker (the 43-instance convention) or earn an
 * evidenced entry in `RECORD_LOCATIONS`, never a silent widening.
 */
const DATED_RECORD = /\d{4}-\d{2}-\d{2}/;
/* Allow-list, deliberately minimal: only what the corpus proves. */
const RECORD_LOCATIONS = ['docs/audit/'];
const isDatedRecord = (p) =>
  RECORD_LOCATIONS.some((dir) => p.startsWith(dir)) && DATED_RECORD.test(p.split('/').pop());
const CANON_INDEX = `${CANON}/extracted`;
/** Authorities cited by tracked docs. Absence is CITED · NOT REACHABLE, never "no authority". */
const CITED_AUTHORITIES = [
  'CONFLICT_REGISTER.md',
  'PRACTICE_UI_LEGAL_STRINGS.md',
  'PRACTICE_LEGAL_RELEASE_CHECKLIST.md',
  'SANDBOX_ARCHITECTURE_AND_FLOWS.md',
  'INSTRUMENTATION_CONTRACT.md',
  'DATA_VINTAGE_POLICY.md',
];

/**
 * basename → [repo paths], built ONCE per run.
 *
 * ⚑ A first version of `checkCitations` shelled out to `find .` for EVERY
 * citation — 130+ full-tree walks per run, which blew a 120 s timeout. A gate
 * that slow gets `--fast`-skipped or deleted, so the walk happens once and the
 * lookups are in memory. Canon is excluded: authority filenames are not ours to
 * resolve citations against.
 */
let FILE_INDEX = null;
function fileIndex() {
  if (FILE_INDEX) return FILE_INDEX;
  FILE_INDEX = new Map();
  const SKIP = new Set([
    'node_modules',
    '.git',
    '.next',
    '.turbo',
    'dist',
    'coverage',
    'extracted',
  ]);
  const walk = (d) => {
    let entries;
    try {
      entries = ls(d === '' ? '.' : d, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (SKIP.has(e.name) || e.name === HIDDEN_CONTROL_DIR) continue;
      const q = d === '' ? e.name : `${d}/${e.name}`;
      if (HIDDEN_CONTROL_FILE.test(e.name)) continue; // §5: not citation-resolvable
      if (e.isDirectory()) walk(q);
      else {
        const arr = FILE_INDEX.get(e.name);
        if (arr) arr.push(q);
        else FILE_INDEX.set(e.name, [q]);
      }
    }
  };
  walk('');
  return FILE_INDEX;
}

/** Markdown under `dir`, excluding any path segment in `skip`. */
function mdUnder(dir, skip = []) {
  const out = [];
  const walk = (d) => {
    if (!existsSync(at(d))) return;
    if (skip.some((x) => d === x || d.startsWith(`${x}/`))) return;
    for (const e of ls(d, { withFileTypes: true })) {
      const q = `${d}/${e.name}`;
      if (isHiddenControl(q)) continue; // §5: never in any corpus
      if (e.isDirectory()) walk(q);
      else if (e.name.endsWith('.md')) out.push(q);
    }
  };
  walk(dir);
  return out;
}

/* ---------------------------------------------------------------- register */
/**
 * Where the ledger actually is (register 5.382).
 *
 * Repo-relative FIRST and unchanged — that is how the platform checkout
 * resolves it, and nothing about that lane changes. The market session works
 * from a git WORKTREE where `docs/` is gitignored and the ledger only exists in
 * the platform checkout, so the path did not resolve and this check printed
 * SKIP. In a green run a SKIP reads as a pass, which is how a silent hole hides.
 *
 * That matters because the ledger is a concurrent-write zone and the collision
 * it guards has happened twice: 5.308 was consumed by the other lane mid-flight,
 * and 5.332-5.335 collided and had to be renumbered. The guard was inert in the
 * one lane that writes from a worktree.
 *
 * So: env var as the second resolution, then FAIL rather than skip. Failing is
 * safe — this runner is invoked only from package.json scripts and by no CI
 * workflow (verified 2026-09-16), so a fresh clone without the local-only
 * ledger gets a loud, actionable message instead of a broken pipeline.
 */
function resolveRegister() {
  const repoRelative = at(REGISTER);
  if (existsSync(repoRelative)) return { path: repoRelative, via: `docs root (${DOCS_ROOT.via})` };
  const fromEnv = process.env.REVIEW_REGISTER_PATH;
  if (fromEnv) {
    if (existsSync(fromEnv)) return { path: fromEnv, via: 'REVIEW_REGISTER_PATH' };
    return { path: null, via: 'REVIEW_REGISTER_PATH', bad: fromEnv };
  }
  return { path: null, via: null };
}

/** The marker is a CLAIM. The maximum existing id is the EVIDENCE. */
function checkRegister() {
  const found = resolveRegister();
  if (!found.path) {
    const why = found.bad
      ? `REVIEW_REGISTER_PATH points at ${scrubPaths(found.bad)}, which does not exist`
      : `${REGISTER} not found here, and REVIEW_REGISTER_PATH is unset`;
    return {
      ok: false,
      detail:
        `${why}. The id-collision guard CANNOT RUN — do not claim a register id ` +
        `on trust. Set REVIEW_REGISTER_PATH to the ledger (it is local-only and ` +
        `lives in the platform checkout, not in a worktree). Register 5.382.`,
    };
  }
  const s = readFileSync(found.path, 'utf8');
  /**
   * ⚑ WIDENED 2026-09-15. The pattern required the id to CLOSE its bold span
   * (`**5.347**`), so every row written as `> **5.347 — title**` — id and title
   * inside ONE span — was invisible to this check. Measured: 302 ids seen, 321
   * present, so NINETEEN were unguarded (5.77-5.86 historical, 5.347-5.355 from
   * the Pre-I2 pass). The marker's own instructions already say a claim-scan
   * "must cover both formats, file-wide"; this check did not. Verified safe
   * before widening: zero duplicate definitions under the wide pattern.
   *
   * ⚑ KEPT THROUGH THE 2026-09-16 MERGE of `origin/main`, whose own resolution of
   * this function narrowed the pattern back to a closed bold span. Dropping the
   * alternation silently un-guards those same nineteen ids, so the merge took
   * origin/main's `resolveRegister` + FAIL-never-SKIP prelude AND this pattern.
   * `checkRegister` is the MARKET lane's function per their implementation-notes
   * entry, so this edit is announced in `docs/cc-sync/market-sandbox.md` rather
   * than made silently.
   */
  const ids = [...s.matchAll(/^(?:\||>) \*\*(\d+\.\d+)(?:\*\*|\s|—)/gm)].map((m) => m[1]);
  if (ids.length === 0)
    return { ok: false, detail: 'no ids matched — the instrument, not the file' };
  const counts = new Map();
  for (const id of ids) counts.set(id, (counts.get(id) ?? 0) + 1);
  const dups = [...counts].filter(([, n]) => n > 1).map(([id]) => id);
  const nums = ids.map((i) => Number(i.split('.')[1]));
  const max = Math.max(...nums);
  const mk = s.match(/NEXT FREE ID: (\d+)\.(\d+)/);
  const marker = mk ? Number(mk[2]) : null;
  const lines = [
    `ids: ${ids.length} occurrences, ${counts.size} distinct, max 5.${max}`,
    `marker: ${marker === null ? 'NOT FOUND' : `5.${marker}`}`,
  ];
  let ok = true;
  if (dups.length) {
    ok = false;
    lines.push(`DUPLICATE ids: ${dups.join(', ')}`);
  }
  if (marker === null) {
    ok = false;
    lines.push('marker missing');
  } else if (marker <= max) {
    ok = false;
    lines.push(`marker 5.${marker} is NOT free — max is 5.${max}`);
  }

  /**
   * ⚙ BLOCK-A · EVERY CLAIM CARRIES A MACHINE-READABLE STATUS, AND THE INDEX
   * CANNOT DRIFT FROM THE ROWS.
   *
   * Why this row exists: 354 claims shared one `STATUS = …` convention between
   * EIGHT of them. The other 346 stated status in prose, which is how `5.404`
   * was referenced by `5.118` while carrying no claim row at all, and how
   * `5.205` stayed marked `P1 · LIVE` for weeks after it was fixed. A register
   * whose status is unreadable by a machine cannot support a completeness
   * claim — and this lane makes completeness claims constantly.
   *
   * Two independent things are asserted, because an index that agrees with
   * itself proves nothing:
   *   1. COVERAGE  — every claim indexed exactly once, every indexed id real.
   *   2. AGREEMENT — a row whose own text says CLOSED while the index says
   *      otherwise (or the reverse) fails. The index is DERIVED from the rows,
   *      so disagreement means one of them moved without the other.
   *
   * ⚑ Vocabulary is a CLOSED SET on purpose. A free-text status is prose with
   * extra steps, and prose is what this row exists to replace.
   */
  const VOCAB = new Set([
    'OPEN',
    'CLOSED',
    'PARTIAL',
    'SCHEDULED',
    'FOUNDER',
    'BLOCKED',
    'SPLIT',
    'REGISTER-ONLY',
    'OBSERVING',
    'PREPARED',
    'NOT-STARTED',
    'DEFERRED',
  ]);
  const idxPairs = [...s.matchAll(/^>\s+(?:(\d+\.\d+)\s+([A-Z][A-Z-]*)\s*)+$/gm)].flatMap((m) =>
    [...m[0].matchAll(/(\d+\.\d+)\s+([A-Z][A-Z-]*)/g)].map((x) => [x[1], x[2]])
  );
  const idx = new Map(idxPairs);
  /* ⛑ "Every claim indexed exactly once" is now checked (PB-5): duplicate
     entries used to merge silently in the Map. */
  const dupIdx = [...new Set(idxPairs.map(([k]) => k).filter((k, i, a) => a.indexOf(k) !== i))];
  if (dupIdx.length) {
    ok = false;
    lines.push(`CLAIM INDEXED MORE THAN ONCE: ${dupIdx.slice(0, 8).join(', ')}`);
  }
  /* ⛑ THE PUBLISHED TOTALS ARE CHECKED (PB-5): "TOTAL 413" stood over an index
     of 443 entries while this gate reported PASS. */
  const totalLine = s.match(/^>\s*TOTAL\s+(\d+)\s+·\s+(.+)$/m);
  if (totalLine) {
    const counted = new Map();
    for (const v of idx.values()) counted.set(v, (counted.get(v) ?? 0) + 1);
    const stated = new Map(
      [...totalLine[2].matchAll(/([A-Z][A-Z-]*)\s+(\d+)/g)].map((x) => [x[1], Number(x[2])])
    );
    const wrong = [];
    if (Number(totalLine[1]) !== idx.size) wrong.push(`TOTAL ${totalLine[1]}≠${idx.size}`);
    for (const k of new Set([...counted.keys(), ...stated.keys()]))
      if ((counted.get(k) ?? 0) !== (stated.get(k) ?? 0))
        wrong.push(`${k} ${stated.get(k) ?? 0}≠${counted.get(k) ?? 0}`);
    if (wrong.length) {
      ok = false;
      lines.push(`STATUS INDEX TOTALS WRONG (stated≠counted): ${wrong.slice(0, 6).join(', ')}`);
    }
  } else if (idx.size > 0) {
    ok = false;
    lines.push('STATUS INDEX TOTAL line not found');
  }
  if (idx.size === 0) {
    ok = false;
    lines.push('BLOCK-A STATUS INDEX not found — the instrument, not the file');
  } else {
    lines.push(`status index: ${idx.size} entries`);
    const claims = new Set(counts.keys());
    const missing = [...claims].filter((id) => !idx.has(id));
    const ghosts = [...idx.keys()].filter((id) => !claims.has(id));
    const badVocab = [...idx].filter(([, v]) => !VOCAB.has(v)).map(([id]) => id);
    if (missing.length) {
      ok = false;
      lines.push(`NOT INDEXED (${missing.length}): ${missing.slice(0, 8).join(', ')}`);
    }
    if (ghosts.length) {
      ok = false;
      lines.push(`INDEXED BUT NOT A CLAIM (${ghosts.length}): ${ghosts.slice(0, 8).join(', ')}`);
    }
    if (badVocab.length) {
      ok = false;
      lines.push(`STATUS OUTSIDE VOCABULARY: ${badVocab.slice(0, 8).join(', ')}`);
    }
    /**
     * AGREEMENT: a row that declares its own status must match the index.
     *
     * ⛑ REWRITTEN AFTER A SABOTAGE PASSED. The first version bounded the row
     * with `[\s\S]{0,300}?` plus a lookahead for the NEXT claim — so for any
     * row longer than 300 characters the lookahead could not be satisfied and
     * the match failed silently. `declared` was therefore almost empty and this
     * half of the gate asserted NOTHING: flipping `5.309` from CLOSED to OPEN
     * in the index produced a PASS. Read the row head directly instead; no
     * lazy quantifier, no lookahead, nothing that can fail closed into silence.
     */
    const disagree = [];
    for (const [id, want] of idx) {
      const at = s.search(
        new RegExp(`^(?:\\||>) \\*\\*${id.replace('.', '\\.')}(?:\\*\\*|\\s|—)`, 'm')
      );
      if (at < 0) continue;
      const head = s.slice(at, at + 170);
      /**
       * ⛑ MENTION vs ASSERTION. A first cut matched closure VOCABULARY anywhere
       * in the head and produced two false positives: `5.278` says *"a CLOSED
       * Product disposition is unexecuted"* and `5.325` says *"reviewed under
       * the SUPERSEDED protocol"* — in both, the closed thing is the OBJECT of
       * the sentence, not the row. This repository has paid for that exact
       * defect repeatedly, and this gate rebuilt it.
       *
       * The discriminator is the row's own leading STATUS MARKER, which this
       * register uses consistently: `✅` asserts closure; `🔴 🟠 🟡 🟢 📋 ⏳`
       * assert the row is still live, whatever words follow. A row carrying an
       * open-family marker is not claiming to be closed even when it discusses
       * something that is.
       */
      /**
       * ⛑ THE `u` FLAG IS LOAD-BEARING, ADDED 2026-09-25 (retro-audit of Block A).
       *
       * Without it a JS character class is a class of UTF-16 CODE UNITS, not
       * code points — so `[🔴🟠🟡🟢📋]` contains the high surrogate `0xD83D`
       * that all five share, and matched **any** emoji in `U+1F400–U+1F7FF`:
       * 🔧 🚀 🔒 📌 among them. Measured: `5.151`'s head carries only `🔧` and
       * was read as carrying an OPEN marker.
       *
       * It corrupts BOTH directions — a stray 🔧 early in a genuinely closed
       * row would also push `openMarker.index` below `closeMarker.index` and
       * make the row read as not asserting closure, silently disarming the
       * forward check. Lone surrogates are exactly the class of filter defect
       * this registry has paid for before.
       */
      const openMarker = /[🔴🟠🟡🟢📋⏳]/u.exec(head);
      const closeMarker = /✅/u.exec(head);
      const assertsClosed =
        closeMarker !== null && (openMarker === null || closeMarker.index < openMarker.index);
      const boldClosed = /^\s*\|?\s*\*\*(CLOSED|RESOLVED|WITHDRAWN|SUPERSEDED)\b/.test(
        head.replace(/^(?:\||>) \*\*\d+\.\d+(?:\*\*|\s|—)\s*\|?\s*/, '')
      );
      const saysClosed = assertsClosed || boldClosed;
      /* ⚑ A ✅ does not always mark CLOSURE. `5.220`/`5.221` read
       *    `✅ **SCOPED … INCLUDE IN I-2 AT DOMAIN LEVEL**` — the tick marks the
       *    SCOPING DECISION while the work is deferred into a later increment.
       *    `DEFERRED` is therefore a legitimate pairing with a ✅ row, exactly
       *    as `PARTIAL` and `SPLIT` are. */
      if (saysClosed && !['CLOSED', 'SPLIT', 'PARTIAL', 'DEFERRED'].includes(want)) {
        disagree.push(`${id}(row=CLOSED,index=${want})`);
      }
      /**
       * ⛑ THE REVERSE DIRECTION, ADDED 2026-09-25 (retro-audit of Block A).
       *
       * The check above only fired `row=CLOSED, index=other`. The OPPOSITE —
       * the index claiming CLOSED over a row that is still live — passed
       * silently, and **that is the dangerous direction**: it is precisely how
       * open work disappears from the open set, which is the disappearance this
       * whole index exists to prevent. Proven by flipping `5.103` (a live
       * `🔴 P1` fee-copy defect) to `CLOSED` in the index and watching the gate
       * report PASS.
       *
       * Block A sabotaged this check one way only (`SB-A4`), and a one-way
       * sabotage proves one way. Same discriminator, same marker-position rule.
       */
      if (want === 'CLOSED' && !saysClosed && openMarker !== null) {
        disagree.push(`${id}(row=LIVE[${openMarker[0]}],index=CLOSED)`);
      }
      /**
       * ⛑ A CLOSURE STATED LATER IN THE ROW (P0 review, PB-5). Only the first
       * 170 characters were read, so a row that appends `✅ **CLOSED …**` to its
       * end while its head still says open agreed with an OPEN index —
       * `5.401`, `5.274`, `5.298`, `5.215` all did. Rows are written
       * current-state-first; one that is not is reported so its head can be
       * restated, rather than either reading winning silently.
       */
      if (!saysClosed && want !== 'CLOSED') {
        /* The row's own extent: a TABLE row is one line; a NOTE row (`> **5.x**`)
           runs until a blank line or the next claim — never into neighbours. */
        const rest = s.slice(at);
        let end;
        if (rest.startsWith('|')) end = rest.indexOf('\n');
        else {
          const blank = rest.search(/\n\s*\n/);
          const next = rest.slice(1).search(/^(?:\||>) \*\*\d+\.\d+(?:\*\*|\s|—)/m);
          end = Math.min(blank < 0 ? rest.length : blank, next < 0 ? rest.length : next + 1);
        }
        const row = rest.slice(0, end < 0 ? rest.length : end);
        /* A QUOTED marker is a mention, not this row's status — `5.291` quotes
           another row's `("✅ FIXED …")` while being open itself. */
        if (/(?<!["“'`(]\s?)✅\s*\**\s*(?:CLOSED|FIXED)\b/u.test(row.slice(169))) {
          disagree.push(`${id}(closure stated late in the row; index=${want})`);
        }
      }
    }
    if (disagree.length) {
      ok = false;
      lines.push(
        `INDEX DISAGREES WITH ROW (${disagree.length}): ${disagree.slice(0, 6).join(', ')}`
      );
    }
  }

  const kinds = checkKindIndex(s, idx);
  if (!kinds.ok) ok = false;
  lines.push(...kinds.lines);
  return { ok, detail: lines.join(' · ') };
}

/**
 * ⚑ EVERY REGISTER ITEM DECLARES A KIND (founder decision 4, 2026-10-28; `5.653`).
 *
 * A status says how far an item is; a kind says what it IS, so the open list reads at a
 * glance: a `defect` to fix, `work` to build, a `decision` someone must take, an
 * `owner-action` someone must do outside the code, or an `obsolete` item kept as history.
 * The kind index is its own machine-readable block (BLOCK-K), in lowercase so the status
 * index's uppercase pattern can never read it (and the reverse). Same rules as the status
 * index: every indexed claim has exactly one kind, every kind names a real claim, the
 * vocabulary is closed, and the published totals agree with the entries.
 */
const KIND_VOCAB = ['defect', 'work', 'decision', 'owner-action', 'obsolete'];

function checkKindIndex(s, idx) {
  const start = s.indexOf('BLOCK-K KIND INDEX');
  if (start < 0)
    return {
      ok: false,
      lines: ['KIND INDEX not found — every register item declares a kind (founder decision 4)'],
    };
  /* The block runs to its first blank line: every line inside it is a `>` quote line. */
  const end = s.indexOf('\n\n', start);
  const block = s.slice(start, end < 0 ? undefined : end);
  /* Any letter case is READ, so a capitalised kind is reported as outside the vocabulary;
     a lowercase-only pattern dropped its whole line and blamed six ids for "no kind". */
  const pairs = [...block.matchAll(/^>\s+(?:(\d+\.\d+)\s+([A-Za-z][A-Za-z-]*)\s*)+$/gm)].flatMap(
    (m) => [...m[0].matchAll(/(\d+\.\d+)\s+([A-Za-z][A-Za-z-]*)/g)].map((x) => [x[1], x[2]])
  );
  const kinds = new Map(pairs);
  const lines = [];
  let ok = true;
  const dup = [...new Set(pairs.map(([k]) => k).filter((k, i, a) => a.indexOf(k) !== i))];
  const noKind = [...idx.keys()].filter((id) => !kinds.has(id));
  const ghost = [...kinds.keys()].filter((id) => !idx.has(id));
  const bad = [...kinds].filter(([, k]) => !KIND_VOCAB.includes(k)).map(([id, k]) => `${id}=${k}`);
  const counted = new Map(KIND_VOCAB.map((k) => [k, 0]));
  for (const k of kinds.values()) counted.set(k, (counted.get(k) ?? 0) + 1);
  const totals = block.match(/^>\s*KINDS\s+(\d+)\s+·\s+(.+)$/m);
  const wrong = [];
  if (!totals) wrong.push('KINDS total line not found');
  else {
    const stated = new Map(
      [...totals[2].matchAll(/([a-z][a-z-]*)\s+(\d+)/g)].map((x) => [x[1], Number(x[2])])
    );
    if (Number(totals[1]) !== kinds.size) wrong.push(`KINDS ${totals[1]}≠${kinds.size}`);
    for (const k of new Set([...counted.keys(), ...stated.keys()]))
      if ((counted.get(k) ?? 0) !== (stated.get(k) ?? 0))
        wrong.push(`${k} ${stated.get(k) ?? 0}≠${counted.get(k) ?? 0}`);
  }
  const fail = (label, list) => {
    if (!list.length) return;
    ok = false;
    lines.push(`${label} (${list.length}): ${list.slice(0, 8).join(', ')}`);
  };
  fail('KIND DECLARED MORE THAN ONCE', dup);
  fail('NO KIND DECLARED', noKind);
  fail('KIND FOR AN ID THAT IS NOT A CLAIM', ghost);
  fail('KIND OUTSIDE VOCABULARY', bad);
  fail('KIND TOTALS WRONG (stated≠counted)', wrong);
  if (ok) lines.push(`kinds: ${KIND_VOCAB.map((k) => `${k} ${counted.get(k)}`).join(' · ')}`);
  return { ok, lines };
}

/* ------------------------------------------------------------------ counts */
/**
 * A test count is evidence only where it was measured. This finds every
 * CURRENT claim and fails when two documents disagree.
 *
 * HONEST LIMIT: it is a DRIFT detector, not a proof of correctness. With zero
 * current claims it passes vacuously, and it cannot tell a right number from a
 * wrong one — only two claims apart. It also filters at LINE level, so a claim
 * sharing a line with the word "withdrawn" is treated as historical. Both are
 * stated here because a green `counts` must not be read as "the numbers are
 * right" (X6: say what a filter drops).
 *
 * Superseded docstring below, kept for the shape of the original intent:
 * CURRENT claim of the form `N / M files` and fails when two documents
 * disagree. Historical mentions are excluded — and the filter names what it
 * drops, because whatever a filter excludes can never be found (X6).
 */
/**
 * Do the counts this repository PUBLISHES agree with each other?
 *
 * ⚑ REBUILT 2026-09-16, taking `5.323` (market lane's finding) and `5.387`
 * (mine). Four separate defects, each of which made the row report something
 * other than what the corpus says:
 *
 * 1. **`README.md` was not in scope at all** (`5.323`). The walk was
 *    `docs/**` + `CLAUDE.md`, so the most public place a stale number can sit
 *    was the one place the check could not reach — it read "~1,388 automated
 *    tests" while the workspace had 2,441, and the row said PASS. Now every
 *    ROOT `*.md` is walked, README included.
 * 2. **No thousands separator, and no `tests` between the two numbers.**
 *    `(\d{3,4})\s*\/\s*(\d{2,3})\s*files` cannot match `2,611 tests / 224
 *    files` at all, and on `2,610 / 224 files` it captured `610` — a figure
 *    published nowhere, then reported as a distinct claim. So the row was
 *    blind to the corpus's most common phrasing while inventing numbers from
 *    its second. Measured both ways before and after.
 * 3. **`HISTORICAL` was tested against the WHOLE LINE** (`5.323`), so a live
 *    claim sharing a line with the word *prior* or *baseline* was dropped with
 *    it. It is now tested against the SENTENCE the match sits in.
 * 4. **The `quoted` test was not same-span** (`5.387`). It was
 *    `new RegExp('["’`][^"’`]*<digits>')`, which can open its quote
 *    region anywhere earlier on a backtick-dense line — which is why a replica
 *    of this function reported 1 claim where the gate reported 3 on an
 *    identical tree. It now asks a positional question: is THIS match's offset
 *    inside an open quote? Single quotes are deliberately NOT delimiters —
 *    prose is full of apostrophes, and counting them made "lane's" open a
 *    string. A quoted count is now EXCLUDED rather than counted: it is someone
 *    else's sentence being discussed, and the old code let a backticked,
 *    non-historical count through as this repository's own claim.
 *
 * 5. **The classifier had no notion of the DOCUMENT it was reading** (`5.419`).
 * Every rule above decides from ONE LINE, so a dated increment-gate record
 * stating what it measured at the time was indistinguishable from `CLAUDE.md`
 * publishing the live total. It passed only while the two happened to agree:
 * adding one test in `5.409` moved the workspace total 2,866 → 2,867, and the
 * row failed with 2 distinct current claims — the second a record whose figure
 * was RIGHT for the increment it records. `isDatedRecord` supplies the missing
 * context — a dated filename IN A RECOGNISED RECORD LOCATION; a date outside one
 * is not context and is not excluded (CASE F) — and it is ordered LAST, after the
 * ambiguity and marker tests, so the change is strictly ADDITIVE: it can only
 * intercept an occurrence that would otherwise have become a live CLAIM, and can
 * never turn a FAIL into a pass.
 *
 * It intercepted **0** occurrences of the PRE-EXISTING corpus, because every dated
 * record carrying a count already carried a marker word. A rule that excludes
 * nothing cannot be proven by the corpus, so it is proven by planted fixtures
 * (cases A–E in `apps/sandbox/src/lib/__tests__/authGate.test.ts`). Its first
 * real interception is this change's own increment record,
 * `PRE_I2_5419_COUNT_DOCUMENT_CONTEXT_INCREMENT_GATE_2026-09-21.md` (deleted local-only 2026-10-29), which states
 * the workspace total in plain prose and is excluded by document context alone.
 * The bucket is PRINTED every run — at 0 when idle — rather than assumed.
 *
 * What this filter DROPS, stated as `guard-filters-are-part-of-the-threat-model`
 * requires: counts inside quotes or backticks; counts in a sentence carrying a
 * historical marker; counts in a DATED RECORD, meaning a dated filename under a
 * recognised record location. A sentence carrying a historical
 * marker AND the word "current" is neither dropped nor counted — it FAILS as
 * ambiguous, because ambiguity in a published figure is the defect.
 */
function checkCounts() {
  /* AUTH-1: canon is EXCLUDED. These are OUR published figures; an authority
     package's numbers are its workstream's, not a repository claim. Before this
     exclusion the walk was 69 % canon and passed only because canon contains no
     `N tests / N files` strings. */
  const docs = mdUnder('docs', [CANON]);
  // 5.323: every ROOT markdown file, not just CLAUDE.md.
  for (const e of readdirSync(ROOT, { withFileTypes: true }))
    if (e.isFile() && e.name.endsWith('.md')) docs.push(e.name);

  const HISTORICAL =
    /\bwas\b|withdrawn|prior|baseline|historical|superseded|corrected|never re-measured|earlier/i;
  // `2,724 tests / 230 files`, `872 / 83 files`, `998/99 files`.
  const COUNT = /(\d{1,3}(?:,\d{3})+|\d{3,4})\s*(?:tests?)?\s*\/\s*(\d{2,3})\s*files/g;

  /** Is offset `i` inside an open `…` or "…" region on this line? */
  const insideQuotes = (line, i) => {
    let bt = 0,
      dq = 0;
    for (let k = 0; k < i; k++) {
      const c = line[k];
      if (c === '`') bt += 1;
      else if (c === '"' || c === '“' || c === '”') dq += 1;
    }
    return bt % 2 === 1 || dq % 2 === 1;
  };

  /** The sentence containing offset `i` — not the whole line (5.323). */
  const sentenceAt = (line, i) => {
    const starts = [0];
    for (const m of line.matchAll(/[.!?]\s+/g)) starts.push(m.index + m[0].length);
    let a = 0;
    let b = line.length;
    for (const st of starts) if (st <= i) a = st;
    for (const st of starts)
      if (st > i) {
        b = st;
        break;
      }
    return line.slice(a, b);
  };

  const claims = new Map();
  const ambiguous = [];
  /* Counted SEPARATELY so the printed instrument names the rule that did the
     work. One `excluded` total cannot distinguish a live document-context rule
     from an inert one, and this rule is currently idle by design. */
  let exQuoted = 0;
  let exMarker = 0;
  let exDated = 0;
  for (const d of docs) {
    for (const line of rd(d).split('\n')) {
      for (const m of line.matchAll(COUNT)) {
        if (insideQuotes(line, m.index)) {
          exQuoted += 1;
          continue;
        }
        const scope = sentenceAt(line, m.index);
        if (HISTORICAL.test(scope) && /\bcurrent\b/i.test(scope)) {
          ambiguous.push(`${d}: ${scope.trim().slice(0, 90)}`);
          continue;
        }
        if (HISTORICAL.test(scope)) {
          exMarker += 1;
          continue;
        }
        /* `5.419` — DOCUMENT CONTEXT, deliberately LAST. Every sentence rule
           above is untouched; this can only catch what would otherwise have
           been published as a live claim. */
        if (isDatedRecord(d)) {
          exDated += 1;
          continue;
        }
        const key = `${m[1].replace(/,/g, '')}/${m[2]}`;
        if (!claims.has(key)) claims.set(key, new Set());
        claims.get(key).add(d);
      }
    }
  }
  /**
   * `5.415` — A HEADLINE MUST AGREE WITH ITS OWN BREAKDOWN.
   *
   * Everything above compares one published headline to ANOTHER published
   * headline. It never looked inside a single sentence, so a per-package
   * breakdown could contradict the total printed beside it and stay invisible:
   * `README.md` published `2,860 tests / 237 files (web 1,606 · sandbox 943 ·
   * banking 118 · investing 86 · defi 65 …)` — components summing to 2,818, a
   * gap of 42 — in a sentence whose own closing clause claimed they sum. It
   * survived every green run because no summation existed anywhere in this file.
   *
   * ⚑ NARROW BY SHAPE, NOT BY PROSE. The governed form is a parenthesised chain
   * of at least TWO `name TESTS/FILES` entries joined by `·`. A bare numeric
   * regex is the failure class this repo has already paid for (`5.323` invented
   * `610` from `2,610 / 224 files`; a `5.[0-9]{2,3}` pattern produced a false
   * maximum of `5.878` from prose). Dates, ratios, ranges, version strings and
   * the older slash-free breakdown cannot match this, because each entry must
   * carry a NAME and BOTH counts.
   *
   * The pairs deliberately omit the word `files` so `COUNT` above cannot read
   * them as headline claims — otherwise publishing a breakdown would invent five
   * competing totals and fail the very check it is meant to support.
   */
  const BREAKDOWN =
    /\(\s*([a-z][a-z0-9-]*\s+\d[\d,]*\/\d+(?:\s*·\s*[a-z][a-z0-9-]*\s+\d[\d,]*\/\d+)+)/gi;
  const PAIR = /([a-z][a-z0-9-]*)\s+(\d[\d,]*)\/(\d+)/gi;
  const num = (t) => Number(String(t).replace(/,/g, ''));

  const mismatches = [];
  const verified = [];
  for (const d of docs) {
    for (const line of rd(d).split('\n')) {
      /* The headline(s) on this line, under the same exclusions as above. */
      const heads = [];
      for (const m of line.matchAll(COUNT)) {
        if (insideQuotes(line, m.index)) continue;
        const scope = sentenceAt(line, m.index);
        if (HISTORICAL.test(scope)) continue;
        /* The SAME exclusions as the classifier, so a headline and its own
           breakdown are never judged by two different rules. Measured
           2026-09-21: governed breakdowns 2 before and 2 after — the one dated
           document carrying a breakdown already had a marker-excluded
           headline, so this costs no coverage. */
        if (isDatedRecord(d)) continue;
        heads.push({ tests: num(m[1]), files: num(m[2]), at: m.index });
      }
      if (heads.length === 0) continue;
      for (const b of line.matchAll(BREAKDOWN)) {
        const pairs = [...b[1].matchAll(PAIR)];
        if (pairs.length < 2) continue;
        /* A breakdown belongs to the nearest headline BEFORE it; one line can
           carry several governed sentences. */
        const head = [...heads].reverse().find((h) => h.at < b.index) ?? heads[0];
        const sumTests = pairs.reduce((a, x) => a + num(x[2]), 0);
        const sumFiles = pairs.reduce((a, x) => a + num(x[3]), 0);
        const where = d.split('/').pop();
        if (sumTests !== head.tests || sumFiles !== head.files)
          mismatches.push(
            `${where}: headline ${head.tests}/${head.files} vs ` +
              `components ${sumTests}/${sumFiles} across ${pairs.length} package(s)`
          );
        else verified.push(`${where}: ${pairs.length} components sum to ${sumTests}/${sumFiles}`);
      }
    }
  }

  const excluded = exQuoted + exMarker + exDated;
  const livingDocs = new Set([...claims.values()].flatMap((s) => [...s]));
  const detail = [
    `${docs.length} doc(s) walked; ${claims.size} distinct CURRENT claim(s) ` +
      `from ${livingDocs.size} living doc(s); ${excluded} mention(s) excluded ` +
      `(${exDated} dated record \u00b7 ${exMarker} sentence marker \u00b7 ${exQuoted} quoted)`,
  ];
  for (const [k, where] of claims)
    detail.push(`  ${k} — ${[...where].map((w) => w.split('/').pop()).join(', ')}`);
  for (const a of ambiguous) detail.push(`  AMBIGUOUS (historical marker + "current"): ${a}`);
  /* Stated every run, PASS or FAIL: a breakdown check that silently verifies
     nothing is indistinguishable from one that works (system gate X6). */
  detail.push(`  breakdowns verified: ${verified.length}`);
  for (const v of verified) detail.push(`    ${v}`);
  for (const mm of mismatches) detail.push(`  COMPONENTS DO NOT SUM — ${mm}`);
  /**
   * NON-VACUITY FLOOR (`5.419`), added WITH the rule that makes it necessary.
   *
   * The verdict was `claims.size <= 1`, which passes on ZERO — so a classifier
   * that excluded everything would report green, and a document-context rule is
   * exactly the change that could do that silently. At least one LIVING document
   * must still publish a current count. The two that do, `CLAUDE.md` and
   * `README.md`, are TRACKED: measured against `git archive HEAD`, 34 markdown
   * files survive a fresh clone and both are among them, so the floor holds on
   * CI and in a clean checkout rather than only on a maintainer's machine.
   *
   * Reaching 0 means the published figure became unverifiable — removed, or its
   * phrasing drifted out of `COUNT`'s reach, which is the `5.323` class.
   */
  if (claims.size === 0)
    detail.push(
      '  NO LIVING DOCUMENT PUBLISHES A CURRENT COUNT — the figure is unverifiable, ' +
        'not agreed. It was removed, or its phrasing drifted out of the COUNT pattern.'
    );
  return {
    ok: claims.size === 1 && ambiguous.length === 0 && mismatches.length === 0,
    detail: detail.join('\n      '),
  };
}

/* -------------------------------------------------------------- prose-1 */
/**
 * ⚙ `PROSE-1` · A RECORD MAY NOT SILENTLY SKIP A REQUIREMENT ITS OWN PLAN ASSERTS.
 *
 * Three of this lane's five defects were the same shape — **prose contradicting
 * the implementation or the controlling plan** — and no instrument here could
 * see any of them:
 *
 *   · the `5.444` system review declared "observability unchanged" while its
 *     controlling plan's §16 REQUIRED exactly that observability. Strategy
 *     found it, not a gate.
 *   · `implementation-notes.md` instructed future Engineering to "preserve the
 *     controlled-unavailable behaviour" that `5.444` had superseded.
 *   · a closure contract required `5.206` while the block's own section never
 *     mentioned it.
 *
 * A gate cannot judge whether prose is TRUE. It can prove a record did not
 * leave a requirement UNMENTIONED, which is how all three began.
 *
 * ⚑ THE RULE IS DELIBERATELY NARROW. Only a section whose HEADING asserts a
 * requirement counts — `required` / `must` / `mandatory` / `minimum`. Measured
 * across every plan in `docs/audit`: EIGHT such headings in five plans, of which
 * `## 16 · Minimum required observability` is one. Matching bare REQUIRED/MUST
 * anywhere in a plan's body would flag 19 of 25 sections and be noise; a rule
 * that fires constantly is a rule people learn to ignore.
 *
 * A record satisfies the rule by citing the section — `§16`, `## 16`, or the
 * heading's own distinctive words. Citing it is not proof it was honoured; it is
 * proof it was not skipped in silence, which is the failure that actually shipped.
 */
function checkProse() {
  if (NO_PRIVATE) return NO_PRIVATE_SKIP;
  const dir = at('docs/audit');
  if (!existsSync(dir))
    return { ok: true, skip: true, detail: 'docs/audit absent in the private docs' };
  const files = readdirSync(dir).filter((f) => f.endsWith('.md'));
  const pairs = [];
  const unresolved = [];
  for (const f of files) {
    const body = rd(join('docs/audit', f));
    /**
     * ⛑ ANY SPELLING OF THE CITATION (P0 review, PB-5). The capture accepted a
     * bare filename only, so a path-prefixed citation (`docs/audit/X.md`) and a
     * revision-only one were skipped — 10 of 19 plan-citing records, silently.
     * A record that names a controlling plan this check cannot resolve is now a
     * FAILURE, never a skip.
     */
    const line = body.match(/\*\*Controlling plan:\*\*([^\n]*)/);
    if (!line) continue;
    const path = line[1].match(/([A-Za-z0-9_./\-]+\.md)/)?.[1];
    if (!path) {
      unresolved.push(`${f}: names a controlling plan but gives no resolvable file`);
      continue;
    }
    /* ⛑ A path is resolved AS GIVEN, from the repo root; only a bare name means
       `docs/audit` (independent review: the directory used to be dropped, so a
       plan cited under another folder read NOT FOUND or matched a namesake). */
    pairs.push([f, path.includes('/') ? path : `docs/audit/${path}`, body]);
  }
  /**
   * ⛑ ZERO RECORDS IS PROVEN, NEVER ASSUMED (register 5.653, the 2026-10-29 docs move).
   * This row used to fail outright when no record named a controlling plan — correct while
   * the Pre-I2 records lived in docs/audit, but the founder moved those full records to a
   * local snapshot until closure (documentation-lifecycle.md §6). An empty corpus now
   * passes ONLY if the same evaluator, run on a planted plan/record pair, catches a planted
   * gap and accepts a planted citation — so a broken instrument still fails here.
   */
  if (pairs.length === 0 && unresolved.length === 0) return proveProseInstrument();
  return evaluateProse(pairs, unresolved, (p) => (existsSync(at(p)) ? rd(p) : null));
}

/** PROSE-1's evaluator over [record, planPath, recordBody] pairs; `readPlan` returns null when unreachable. */
function evaluateProse(pairs, unresolved, readPlan) {
  const lines = [`${pairs.length} record(s) name a controlling plan`];
  let ok = true;
  if (unresolved.length) {
    ok = false;
    lines.push(
      `CONTROLLING PLAN UNRESOLVABLE (${unresolved.length}): ${unresolved.join(' · ')}` /* full list (R4-9) */
    );
  }
  let checked = 0;
  const gaps = [];
  /** ⛑ R4-6: a record checked against ZERO headings is reported with its PROVEN reason, never passed silently. */
  const notApplicable = [];
  for (const [rec, planName, body] of pairs) {
    let recChecked = 0;
    const plan = readPlan(planName);
    if (plan === null) {
      lines.push(`${rec}: plan ${planName} NOT FOUND — cited but not reachable`);
      ok = false;
      continue;
    }
    /**
     * ⛑ A HEADING'S BLOCK IS INHERITED, NOT READ OFF THE HEADING ITSELF.
     *
     * The first version derived the block from the heading's own text, so a
     * SUB-heading inside a block section — `### CI-N4 must detect CLAIMS, not
     * TOKENS`, which lives under `### G · LEGAL-REQUIRED GATES` — carried no
     * block and was treated as plan-level, making EVERY record answer for it.
     * Block B's record was failed for not citing a Block G requirement.
     *
     * This is the same defect class Block A found in the gate registry, where
     * 31 gates inherited their status from a section heading and no machine
     * could see it. Walk the headings IN ORDER and carry the current block:
     * a `##` starts a plan-level section and clears it; a `### X · …` sets it;
     * any other `###` inherits it.
     */
    const headBlocks = new Map();
    let current = null;
    for (const h of plan.match(/^#{2,3} .+$/gm) || []) {
      if (/^## /.test(h)) current = null;
      else {
        const own = h.match(/^###\s*([A-G])\s*·/)?.[1];
        if (own) current = own;
      }
      if (!headBlocks.has(h)) headBlocks.set(h, current);
    }
    const heads = (plan.match(/^#{2,3} .+$/gm) || []).filter((h) =>
      /\brequired\b|\bmust\b|\bmandatory\b|\bminimum\b/i.test(h)
    );
    /**
     * ⚑ A BLOCK RECORD ANSWERS FOR ITS OWN BLOCK. A multi-block plan carries a
     * requirement heading per block (`### B · … MUST CLOSE`), and Block A's
     * record has no business citing Block B's. Measured on the first run: that
     * was 1 of the 2 reported gaps, i.e. a 50% false-positive rate — and this
     * check's own docstring warns that a rule which fires wrongly is one people
     * learn to ignore. Plan-level sections (`## 16 · …`) still apply to every
     * record, because they apply to the whole lane.
     */
    /* ⛑ R4-6: a multi-block record (`…BLOCKS_EFG_RECORD…`) answers for EACH of its blocks;
       it used to match no block and was excused from every block requirement. */
    const recBlocks = new Set(
      /* Exact and case-sensitive (R4 correction): `BLOCK_E_` or `BLOCKS_EFG_` — with `/i`,
         `BLOCK_FEED_` read as blocks F, E, D. */
      (
        rec
          .match(/BLOCK_([A-G])_|BLOCKS_([A-G]{2,7})_/)
          ?.slice(1)
          .find(Boolean) ??
        rec.match(/\bBlocks? ([A-G]{1,7})\b/)?.[1] ??
        ''
      ).split('')
    );
    /* ⛑ R4-6: a record's OWN numbered heading is not a citation of the plan's section —
       its `## 16` used to satisfy "§16" by numeric coincidence. The NUMBER form is matched
       with heading lines removed; the full PHRASE and register ids still count anywhere
       (a record heading that repeats the plan's whole section title does cite it). */
    const prose = body.replace(/^#{1,6} .*$/gm, '');
    for (const h of heads) {
      const hBlock = headBlocks.get(h) ?? h.match(/^###\s*([A-G])\s*·/)?.[1];
      /**
       * ⛑ A BLOCK REQUIREMENT BINDS ONLY THAT BLOCK'S RECORD — including when the
       * record is not a block record at all. Found 2026-09-25: a LANE-level record
       * (the documentation-lifecycle pass) has no block letter, so the old condition
       * `recBlock && …` never skipped and it was failed for not citing **Block B's**
       * `5.345 MUST CLOSE`. Plan-level headings (`## 16 · …`, no block) still bind
       * every record, which is what keeps this non-vacuous.
       */
      if (hBlock && !recBlocks.has(hBlock)) continue;
      checked += 1;
      recChecked += 1;
      const num = h.match(/^#{2,3}\s*([0-9]+[a-z]?)\s*·/);
      /**
       * ⛑ THE WHOLE PHRASE, NOT ANY ONE WORD (P0 review, PB-5). Matching any
       * single distinctive word let "observability unchanged" satisfy
       * "Minimum required observability", and "block" satisfy a Block G
       * requirement. A record now cites the section NUMBER (`§16`, `## 16`)
       * or the heading's full phrase (markup and number removed,
       * whitespace-normalised, case-insensitive).
       */
      const norm = (t) =>
        t
          .replace(/[`*_·—–]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .toLowerCase();
      /* The heading's TITLE — its text before an em/en dash qualifier — is the
         phrase a record must carry; a lettered block heading has no number. */
      const titleText = h
        .replace(/^#{2,3}\s*/, '')
        .replace(/^[0-9]+[a-z]?\s*·\s*/, '')
        .replace(/^[A-G]\s*·\s*/, '')
        .split(/\s[—–]\s/)[0];
      const phrase = norm(titleText);
      /* A heading that names register ids is cited when the record names them all. */
      const ids = [...h.matchAll(/\b5\.\d{2,3}\b/g)].map((x) => x[0]);
      /* ⛑ R4-6: an id is matched as a whole number — `5.12` no longer matches inside `5.123`. */
      const hasId = (id) => new RegExp(`(?<![\\d.])${id.replace('.', '\\.')}(?![\\d])`).test(body);
      const cited =
        (num && new RegExp(`§\\s?${num[1]}\\b|##\\s*${num[1]}\\b`).test(prose)) ||
        (phrase.length >= 8 && norm(body).includes(phrase)) ||
        (ids.length > 0 && ids.every(hasId));
      if (!cited) gaps.push(`${rec} ↛ "${h.replace(/^#{2,3}\s*/, '').slice(0, 44)}"`);
    }
    if (recChecked === 0) {
      const blockOf = (h) => headBlocks.get(h) ?? h.match(/^###\s*([A-G])\s*·/)?.[1];
      const bound = [...new Set(heads.map(blockOf).filter(Boolean))];
      if (heads.length === 0)
        notApplicable.push(`${rec}: N/A — its plan has no requirement heading`);
      else if (heads.every(blockOf))
        notApplicable.push(
          `${rec}: N/A — every requirement heading binds block(s) ${bound.join(', ')}; the record is ${recBlocks.size && [...recBlocks][0] ? `block ${[...recBlocks].join('')}` : 'lane-level'}`
        );
      else {
        /* Unreachable by construction (a plan-level heading binds every record) — kept as a fail-closed guard. */
        ok = false;
        gaps.push(`${rec}: checked against 0 headings with no proven reason`);
      }
    }
  }
  lines.push(`${checked} requirement heading(s) checked`);
  /* Every N/A is listed with its measured reason — a count alone would hide which records it covers. */
  if (notApplicable.length)
    lines.push(`N/A, PROVEN (${notApplicable.length}): ${notApplicable.join(' · ')}`);
  if (gaps.length) {
    ok = false;
    /* ⛑ R4-9: the full list — a truncated failure list hides exactly the entry a reader or a test looks for. */
    lines.push(`UNCITED REQUIREMENT (${gaps.length}): ${gaps.join(' · ')}`);
  }
  return { ok, detail: lines.join(' · ') };
}

/** The planted pair behind an empty corpus: one record cites the plan's requirement, one does not. */
function proveProseInstrument() {
  const PLAN = 'fixture/PROSE_SELFTEST_PLAN.md';
  const plan = '# Plan\n\n## 16 · Minimum required observability\n\nEvery flow emits two events.\n';
  const readPlan = (p) => (p === PLAN ? plan : null);
  const cites = ['PROSE_SELFTEST_CITES.md', PLAN, '# Record\n\n§16 is met by the two events.\n'];
  const silent = ['PROSE_SELFTEST_SILENT.md', PLAN, '# Record\n\nWork done.\n'];
  const accepted = evaluateProse([cites], [], readPlan);
  const caught = evaluateProse([silent], [], readPlan);
  const works = accepted.ok && !caught.ok && caught.detail.includes('PROSE_SELFTEST_SILENT.md');
  return {
    ok: works,
    detail: works
      ? '0 record(s) name a controlling plan in docs/audit · instrument self-test PASS (planted citation accepted, planted gap caught)'
      : `0 record(s) name a controlling plan, and the instrument self-test FAILED — accepted: ${accepted.detail} · caught: ${caught.detail}`,
  };
}

/* ------------------------------------------------------------------- doc-1 */
/**
 * ⚙ `DOC-1` · A REFERENCE PRESENTED AS AUTHORITY MUST RESOLVE — OR SAY IT CANNOT.
 *
 * `5.458`: `CLAUDE.md` instructed every session to *"consult it before writing any compliance
 * copy or claim"* and pointed at a Legal register whose entire directory had been deleted.
 * Measured repo-wide at the time: **870 references across 212 documents, 114 missing
 * targets**, reaching committed living authority (`architecture-decisions.md`,
 * `engineering-gates.md`, `implementation-notes.md`).
 *
 * ## The bounded, enforceable subset — and what is deliberately NOT enforced
 *
 * SCOPE: the COMMITTED surface only — `CLAUDE.md`, `README.md`, `docs/tech/**`. Those ship in
 * a fresh clone, so a broken reference there is broken for everyone. `docs/audit`,
 * `docs/full-view` and `docs/sandbox-app` are gitignored and absent from a clone, so gating
 * them would fail for reasons a contributor cannot fix. Their ~107 remaining dangling
 * references are a NAMED REVIEW FRONT (`5.459`), not a silent pass.
 *
 * RULE: a reference in an AUTHORITY sentence must resolve, OR carry `⚠ NOT REACHABLE`.
 * The annotation is the `AUTH-1` pattern — a missing file must never read as "no authority
 * exists" — so an honest unreachable marker satisfies this gate and silence does not.
 *
 * ⚑ **A ratchet guards the remainder.** Non-authority dangling references in the same surface
 * are counted and may only FALL. That stops the 15 that exist today from becoming 40 while
 * keeping the gate adoptable.
 *
 * ⚑ **EVERY AUTHORITY PHRASE CARRIES ITS OWN CONTROL** — the `\bkyc\b` lesson: a combined
 * pattern hides a member that cannot match its own defect, and only a per-member control
 * exposes it.
 */
const DOC1_AUTHORITY =
  /consult (?:it|them)|read .{0,14}first|is the reference|the authority for|must (?:read|consult)|before writing|governs\b|per its |read it before|read the matching entry/i;
/**
 * ⛑ WIDENED (R4-5, independent review 2026-10-16). Only `.md` / `.mjs` / `.ts(x)`
 * references were seen, and only bare ones: `docs/x.md#anchor`, `file.ts:13`,
 * `.js` / `.json` / `.yaml` / `.sh` / `.py` / `.css` targets and directories were
 * never checked — `docs/tech/internationalization.md:13` pointed at a `.js` file
 * that does not exist where it says. Group 1 is the path; an `#anchor` or a
 * `:line` suffix is accepted and dropped before resolution.
 */
const DOC1_REF =
  /`((?:docs|scripts|apps|packages)\/[^`\s#:]*?(?:\.(?:md|mjs|cjs|js|ts|tsx|mts|cts|json|ya?ml|sh|py|css)|\/))(?:#[^`\s]*|:\d+(?:[-–]\d+)?)?`/g;
const DOC1_REF_BARE = /`(?:docs|scripts|apps|packages)\/[^`\s]+?`/g;
/** Ratchet: non-authority dangling references in the committed surface. Falling-only. */
const DOC1_SLACK = 0; /* lowered 15 → 0 on 2026-10-15: measured 0 once gitignored targets were classified by policy */

function doc1Surface() {
  const files = ['CLAUDE.md', 'README.md'].filter((f) => existsSync(at(f)));
  return files.concat(mdUnder('docs/tech', []));
}

/**
 * ⛑ RESOLVES ONLY AGAINST WHAT A CLONE CONTAINS (P0 review, PB-5). The scope is
 * the committed surface "because a broken reference there is broken for
 * everyone" — yet resolution used `existsSync`, so a reference into a gitignored
 * folder (`docs/audit`, `docs/full-view`, …) resolved on the maintainer's
 * machine and dangled in every clone: ~51 such references passed locally. A
 * target now resolves only if it is part of what a commit of this tree would
 * contain: TRACKED, or NEW and not ignored (`--others --exclude-standard` — a
 * file added in the same change must not read as dangling until it is staged),
 * AND still present on disk (`git ls-files` keeps listing a tracked file that
 * the working tree has deleted). Whether a new file was actually staged is the
 * `staged` row's question (gate D6), not this one's.
 */
let trackedFiles = null;
function loadTracked() {
  if (trackedFiles === null) {
    try {
      trackedFiles = new Set(
        gitNames(['ls-files', '--cached', '--others', '--exclude-standard', '-z'])
      );
    } catch {
      trackedFiles = new Set();
    }
  }
  return trackedFiles;
}
function isTracked(target) {
  const tracked = loadTracked();
  /* A directory resolves when it holds at least one tracked file and exists. */
  if (target.endsWith('/'))
    return [...tracked].some((f) => f.startsWith(target)) && existsSync(at(target));
  return tracked.has(target) && existsSync(at(target));
}

/**
 * Gitignored BY POLICY (`.gitignore` keeps `docs/*` local except docs/tech and
 * docs/integrations). Decided by git's own rule, so the answer is identical in
 * every clone and on every machine — unlike `existsSync`, which is what made
 * this gate's result depend on the maintainer's disk.
 */
const ignoredCache = new Map();
function isIgnoredByPolicy(target) {
  if (!ignoredCache.has(target)) {
    let ignored = false;
    try {
      /* No shell: the target is document text, and `$(…)` survives the
         `[*{}<>]` filter (independent review). */
      execFileSync('git', ['check-ignore', '-q', target], { cwd: ROOT, stdio: 'pipe' });
      ignored = true;
    } catch {
      ignored = false;
    }
    ignoredCache.set(target, ignored);
  }
  return ignoredCache.get(target);
}

/** Exported shape so the gate's own tests can drive it. */
function doc1Scan() {
  const authority = [];
  const slack = [];
  const localOnly = [];
  /** Every reference into a gitignored-by-policy area that is NOT marked unreachable — Layer 2's input. */
  const privateRefs = [];
  let refs = 0;
  for (const f of doc1Surface()) {
    const text = rd(f);
    for (const line of text.split('\n')) {
      const spans = [...line.matchAll(DOC1_REF_BARE)].map((b) => b.index);
      for (const m of line.matchAll(DOC1_REF)) {
        const target = m[1];
        if (/[*{}<>]/.test(target)) continue;
        refs += 1;
        if (isTracked(target)) continue;
        /**
         * ⛑ A MARKER BELONGS TO THE REFERENCE IT FOLLOWS (R4-5). It was tested
         * against the WHOLE line, so `Read \`docs/tech/MISSING.md\` first;
         * \`docs/audit/OLD.md\` is ⚠ NOT REACHABLE` excused the first reference
         * too. A marker now counts only between this reference and the next one.
         * An honest marker satisfies the rule: `⚠ NOT REACHABLE` for a target that
         * is gone, `local-only` for one gitignored by design. `local-only` excuses
         * ONLY a target that IS gitignored by policy.
         */
        const end = m.index + m[0].length;
        const next = spans.find((at) => at >= end) ?? line.length;
        const own = line.slice(end, next);
        if (/NOT REACHABLE/i.test(own)) continue;
        const ignored = isIgnoredByPolicy(target);
        if (ignored) privateRefs.push({ doc: f, target });
        if (/local-only/i.test(own) && ignored) continue;
        const bareLine = line.replace(DOC1_REF_BARE, ' ');
        /* A reference INTO a gitignored-by-policy area is local-only by design:
           counted and reported, not a failure — unless it sits in an AUTHORITY
           sentence, which must then say so, because "read X first" dangles for
           every reader of a clone. */
        if (ignored) {
          if (DOC1_AUTHORITY.test(bareLine))
            authority.push(`${f} → ${target} (local-only, unannotated)`);
          else localOnly.push(`${f} → ${target}`);
          continue;
        }
        /**
         * ⛑ THE REFERENCE ITSELF SITS BETWEEN THE AUTHORITY WORDS, so the phrase is
         * matched against the line with every backticked path COLLAPSED to one space.
         * Found by this gate's own sabotage: `Read \`docs/x/GONE.md\` first` did not
         * match `read .{0,14}first` — the 38-character path blew the gap — so the very
         * first probe PASSED and the near-namesake probe passed for the same wrong
         * reason. A detector that reports green while proving almost nothing is the
         * named failure this row exists to avoid.
         */
        (DOC1_AUTHORITY.test(bareLine) ? authority : slack).push(`${f} → ${target}`);
      }
    }
  }
  return { refs, authority, slack, localOnly, privateRefs };
}

/**
 * ⚙ `DOC-1` LAYER 2 · THE PRIVATE CORPUS — a separate, machine-dependent report
 * (R4-5, founder correction 2026-10-16).
 *
 * Layer 1 (`checkDoc1`) classifies a reference into a gitignored area by git's
 * policy, so its verdict is identical in every clone: a correctly annotated
 * private reference is valid even where the file is absent. That leaves one
 * hole — a TYPO in a private path passes everywhere. This layer closes it only
 * where it can be closed: for each private reference whose AREA folder
 * (`docs/full-view/`, `docs/audit/`, …) exists on THIS machine, the target must
 * exist. With NO private area present the row is a SKIP (`NOT VERIFIED HERE`) —
 * never a pass. With a private corpus present, a reference into an area this
 * machine lacks FAILS (a typo, or an area that is gone here — annotate it
 * `⚠ NOT REACHABLE`). A file directly under `docs/` is judged against the corpus
 * as a whole. References marked `NOT REACHABLE` are honest by definition and are
 * not re-judged.
 *
 * ⚑ REJECTED: a TRACKED index of private file names. It would publish private
 * paths into a public repository, which the PB-1 rule forbids.
 */
function checkDoc1Local() {
  const { privateRefs } = doc1Scan();
  /* ⛑ No private docs here: nothing can be verified, whatever folders exist (`5.696`). */
  if (NO_PRIVATE)
    return {
      ok: true,
      skip: true,
      detail: `${privateRefs.length} private reference(s) · NOT VERIFIED HERE — no private area present on this machine`,
    };
  /* `docs/full-view/x.md` → `docs/full-view/`; a file directly under `docs/` has no area folder
     of its own and is judged against the private corpus as a whole (R4 correction). */
  const area = (t) => {
    const parts = t.replace(/\/$/, '').split('/');
    return parts.length >= 3 || t.endsWith('/') ? `${parts.slice(0, 2).join('/')}/` : null;
  };
  const present = new Set(
    privateRefs.map((r) => area(r.target)).filter((a) => a !== null && existsSync(at(a)))
  );
  if (!present.size)
    /* ⛑ Nothing here can be verified — that is a SKIP, never a pass (R4 correction). */
    return {
      ok: true,
      skip: true,
      detail: `${privateRefs.length} private reference(s) · NOT VERIFIED HERE — no private area present on this machine`,
    };
  const missing = [];
  const unknownArea = [];
  let verified = 0;
  for (const { doc, target } of privateRefs) {
    const a = area(target);
    if (a !== null && !present.has(a)) unknownArea.push(`${doc} → ${target}`);
    else if (existsSync(at(target))) verified += 1;
    else missing.push(`${doc} → ${target}`);
  }
  const lines = [
    `${privateRefs.length} private reference(s) · ${verified} verified on this machine`,
  ];
  /* ⛑ With a private corpus present, an area this machine does not hold FAILS (R4 correction):
     it is a typo (`docs/full-veiw/…`) or a reference to an area that is gone here. Mark a
     reference that is knowingly absent `⚠ NOT REACHABLE`, as Layer 1 requires. */
  if (unknownArea.length)
    lines.push(
      `UNKNOWN PRIVATE AREA — a typo, or an area absent here (${unknownArea.length}): ${unknownArea.join(' · ')}`
    );
  if (missing.length)
    lines.push(`PRIVATE TARGET MISSING (${missing.length}): ${missing.join(' · ')}`);
  return { ok: missing.length === 0 && unknownArea.length === 0, detail: lines.join(' · ') };
}

/**
 * ⚙ The SECOND recurrence vector: `CLAUDE.md` drifting back into an archive.
 *
 * Measured on the pre-ruling file: **14** dated execution-history entries and **11**
 * `docs/audit/` references — the shape the Founder ruling names as *"large dated
 * execution-history sections"* and *"historical audit records becoming load-bearing
 * authority"*. After the reduction: **0** and **1** (the history pointer itself).
 *
 * ⚑ NOT a line-count gate — that was explicitly rejected. It counts STRUCTURE: dated
 * status markers, and how many disposable audit artifacts bootstrap leans on.
 */
/**
 * Dated execution-history entries: a marker-led date, or a date paired with a
 * commit hash — `(2026-09-16, \`43626076\`)` — which the marker-only form missed
 * (P0 review, PB-5). A bare "since 2026-08-22" is a fact, not history, and is
 * not matched.
 */
const DOC1_DATED = /[⭐⛑]\s*\**\s*20\d\d-\d\d-\d\d|\(20\d\d-\d\d-\d\d,\s*`[0-9a-f]{7,40}`\)/g;
const DOC1_AUDIT_REF = /`docs\/audit\/[^`]+\.md`/g;
/**
 * Bootstrap may point at the history ledger and at the REGISTER, and at nothing else in
 * docs/audit. Named, not counted: `documentation-lifecycle.md` §4 makes the register the
 * place every session resolves current work, so CLAUDE.md must name it, and a count of 1
 * failed DOC-1 on main from the day the market bootstrap line named it (#748, 2026-10-21).
 */
const DOC1_AUDIT_ALLOWED = ['docs/audit/AUDIT_HISTORY.md', 'docs/audit/PENDING_ALL.md'];

function checkDoc1() {
  const { refs, authority, slack, localOnly } = doc1Scan();
  /* Layer 2 is reported by its own mode (`doc1-local`); Layer 1's verdict below never depends on this machine. */
  const lines = [
    `${doc1Surface().length} committed doc(s) · ${refs} reference(s) · ${localOnly.length} into gitignored local-only areas (reported, by design)`,
  ];
  let ok = true;

  if (existsSync(at('CLAUDE.md'))) {
    const boot = rd('CLAUDE.md');
    const dated = boot.match(DOC1_DATED) || [];
    const auditRefs = [...new Set(boot.match(DOC1_AUDIT_REF) || [])];
    const leaned = auditRefs.filter((r) => !DOC1_AUDIT_ALLOWED.includes(r.replace(/`/g, '')));
    if (dated.length) {
      ok = false;
      lines.push(
        `CLAUDE.md carries ${dated.length} DATED execution-history entr(ies) — bootstrap is not an archive (documentation-lifecycle.md §2)`
      );
    }
    if (leaned.length) {
      ok = false;
      lines.push(
        `CLAUDE.md leans on ${leaned.length} disposable docs/audit artifact(s) (only the history ledger and the register are allowed): ${leaned.slice(0, 3).join(' ')}`
      );
    }
    lines.push(`bootstrap: ${dated.length} dated entr(ies) · ${auditRefs.length} audit ref(s)`);
  }
  /* Non-vacuity: a scan that found nothing proves nothing. */
  if (refs < 100) {
    return {
      ok: false,
      detail: `only ${refs} references found — the scan is not seeing the corpus`,
    };
  }
  if (authority.length) {
    ok = false;
    lines.push(
      /* Every one is listed: this is a failure list, and a truncated one hides
         exactly the entry a reader (or a regression test) is looking for. */
      `UNREACHABLE AUTHORITY REFERENCE (${authority.length}): ${authority.join(' · ')}`
    );
  }
  if (slack.length > DOC1_SLACK) {
    ok = false;
    lines.push(
      `dangling references ROSE to ${slack.length} (ratchet ${DOC1_SLACK}) — annotate or fix: ${slack.join(' · ')}`
    );
  } else {
    lines.push(`non-authority dangling ${slack.length}/${DOC1_SLACK} (falling-only)`);
  }
  return { ok, detail: lines.join(' · ') };
}

/* ------------------------------------------------------------- authorities */
/** A new authority in docs/tech must be routed or dispositioned, or it rots. */
function checkAuthorities() {
  const text = GATES.filter((g) => existsSync(at(g)))
    .map(rd)
    .join('');
  if (!text) return { ok: false, detail: 'gate documents not found' };
  const files = [];
  for (const dir of ['docs/tech', 'docs/tech/ux-governance']) {
    if (!existsSync(at(dir))) continue;
    for (const f of ls(dir)) if (f.endsWith('.md') && !f.includes('review-gate')) files.push(f);
  }
  const missing = files.filter((f) => !text.includes(f));
  const lines = [`${files.length - missing.length}/${files.length} routed or dispositioned`];
  let ok = missing.length === 0;
  if (missing.length) lines.push(`NOT ROUTED: ${missing.join(', ')}`);

  /**
   * ⚙ BLOCK-A · EVERY GATE CARRIES A MACHINE-READABLE STATUS.
   *
   * A gate is an open item with NO `5.xxx` id, so every register sweep this
   * lane runs is structurally blind to it. That is how five Legal-required
   * gates (`CI-N1`..`CI-N4`, `O-7`) sat `PLANNED` from 2026-08-29 while
   * repeated "complete open-item" reviews never named them: status lived in
   * prose, some row-level and some inherited from a section heading.
   *
   * The index makes gate status readable the same way the register's is, and
   * this row fails if the two drift: a gate present in the registry but absent
   * from the index, an indexed gate that is not in the registry, or a status
   * outside the closed set.
   */
  const GATES_DOC = 'docs/tech/engineering-gates.md';
  if (existsSync(at(GATES_DOC))) {
    /* `rd` resolves against ROOT itself — passing an absolute path doubles it. */
    const g = rd(GATES_DOC);
    const VOCAB = new Set(['LIVE', 'PLANNED', 'PARTIAL']);
    /**
     * ⛑ GATE IDS MAY CARRY LOWERCASE AFTER A HYPHEN (P0 review, PB-5): `AUTH-1a`,
     * `AUTH-1b`, `AUTH-1c` and `AT-set` are gates, and the uppercase-only pattern
     * made them invisible — unindexed, and passing. Domain rows ("Accessibility",
     * "Security & vulnerabilities") stay excluded because they are words, not ids.
     *
     * ⛑ THE VOCABULARY CHECK CAN NOW FIRE: the index line used to admit only
     * LIVE/PLANNED/PARTIAL, so a bad status dropped the whole line and was
     * reported as "not indexed". Any uppercase status token is read, then judged.
     */
    const GATE_ID = '[A-Z][A-Z0-9]*(?:-[A-Za-z0-9]+)*';
    const idxPairs = [
      ...g.matchAll(new RegExp(`^>\\s+(?:${GATE_ID}\\s+[A-Z][A-Z-]*\\s*)+$`, 'gm')),
    ].flatMap((m) =>
      [...m[0].matchAll(new RegExp(`(${GATE_ID})\\s+([A-Z][A-Z-]*)`, 'g'))].map((x) => [x[1], x[2]])
    );
    const idx = new Map(idxPairs);
    const dupIdx = idxPairs.map(([k]) => k).filter((k, i, a) => a.indexOf(k) !== i);
    const rows = new Set(
      [...g.matchAll(new RegExp(`^\\|\\s*\\*\\*(${GATE_ID})\\*\\*`, 'gm'))].map((m) => m[1])
    );
    rows.delete('SEO'); /* a quality DOMAIN row, not a gate id */
    if (dupIdx.length) {
      ok = false;
      lines.push(`GATE INDEXED MORE THAN ONCE: ${[...new Set(dupIdx)].join(', ')}`);
    }
    /* ⛑ THE PUBLISHED TOTALS ARE CHECKED (PB-5): "TOTAL 75 · LIVE 53 · PLANNED 22"
       stood over an index holding 80 entries, and nothing noticed. */
    const totalLine = g.match(/^>\s*TOTAL\s+(\d+)\s+·\s+(.+)$/m);
    if (totalLine) {
      const counted = new Map();
      for (const v of idx.values()) counted.set(v, (counted.get(v) ?? 0) + 1);
      const stated = new Map(
        [...totalLine[2].matchAll(/([A-Z][A-Z-]*)\s+(\d+)/g)].map((x) => [x[1], Number(x[2])])
      );
      const wrong = [];
      if (Number(totalLine[1]) !== idx.size) wrong.push(`TOTAL ${totalLine[1]}≠${idx.size}`);
      for (const k of new Set([...counted.keys(), ...stated.keys()]))
        if ((counted.get(k) ?? 0) !== (stated.get(k) ?? 0))
          wrong.push(`${k} ${stated.get(k) ?? 0}≠${counted.get(k) ?? 0}`);
      if (wrong.length) {
        ok = false;
        lines.push(`GATE INDEX TOTALS WRONG (stated≠counted): ${wrong.join(', ')}`);
      }
    } else {
      ok = false;
      lines.push('GATE INDEX TOTAL line not found');
    }
    if (idx.size === 0) {
      ok = false;
      lines.push('BLOCK-A GATE STATUS INDEX not found — the instrument, not the file');
    } else {
      lines.push(`gate index: ${idx.size} entries`);
      const notIdx = [...rows].filter((r) => !idx.has(r));
      const ghosts = [...idx.keys()].filter((r) => !rows.has(r));
      const bad = [...idx].filter(([, v]) => !VOCAB.has(v)).map(([r]) => r);
      if (notIdx.length) {
        ok = false;
        lines.push(`GATE NOT INDEXED (${notIdx.length}): ${notIdx.slice(0, 8).join(', ')}`);
      }
      if (ghosts.length) {
        ok = false;
        lines.push(`INDEXED BUT NOT A GATE (${ghosts.length}): ${ghosts.slice(0, 8).join(', ')}`);
      }
      if (bad.length) {
        ok = false;
        lines.push(`GATE STATUS OUTSIDE VOCABULARY: ${bad.slice(0, 6).join(', ')}`);
      }
    }

    /**
     * ⛑ GATE-STATE-1 · A GATE ROW NEVER STATES A DELIVERY STATE (2026-10-21).
     *
     * Eight market rows and one section heading said "IMPLEMENTED ON BRANCH, not yet
     * merged" on `main` (`LOW-REASON-1` first, then #742–#744). Written inside the PR that
     * merged the work, each was false the moment it merged, and the index check above
     * could not see it: the index carried the right status while the row contradicted it.
     *
     * Read only where a status is stated, the row's first cell and a section heading, so a
     * row that explains this very rule in its description is not mistaken for one that
     * asserts it.
     */
    const DELIVERY_STATE =
      /IMPLEMENTED ON BRANCH|\bNOT (?:YET )?MERGED\b|\bUNMERGED\b|MERGED TO MAIN\s*=\s*(?:NO|PENDING)/i;
    const stated = [];
    for (const line of g.split('\n')) {
      const row = line.match(new RegExp(`^\\|\\s*\\*\\*(${GATE_ID})\\*\\*([^|]*)\\|`));
      if (row) {
        if (DELIVERY_STATE.test(row[2])) stated.push(row[1]);
        continue;
      }
      const heading = line.match(/^#{1,6}\s+(.+)$/);
      if (heading && DELIVERY_STATE.test(heading[1]))
        stated.push(`heading "${heading[1].slice(0, 60)}"`);
    }
    if (stated.length) {
      ok = false;
      lines.push(
        `GATE STATUS STATES A DELIVERY STATE (${stated.length}), false once merged: ${stated.slice(0, 8).join(', ')}`
      );
    }
  }
  return { ok, detail: lines.join(' · ') };
}

/* ------------------------------------------------------------------ AUTH-1 */
/**
 * AUTH-1 row 1 — the authority corpus is SEARCHABLE, and what is cited but
 * absent is named as such.
 *
 * Why: for weeks every Canon-First search ran over derived records (`FEES.md`,
 * `implementation-notes.md`, the plan, the register) while the primary authority
 * sat on disk as `.zip`. `5.410` is the measured consequence — canon specified
 * the fee mechanism in detail and the implementation invented its own, because
 * "canon is silent" was concluded from a corpus that had never been read.
 *
 * A gate cannot judge authority. It CAN prove the corpus is reachable, which is
 * the precondition for every other AUTH-1 claim, and distinguish NOT FOUND from
 * NOT REACHABLE so a missing file never reads as "no authority exists".
 */
/**
 * ⚙ `DOC-2` · CURRENT AUTHORITY OUTSIDE `extracted/` MUST BE INDEXED.
 *
 * `5.461`: `AUTH-1` indexed only the canon's `extracted/` snapshot, while two dozen
 * current-authority documents sat beside it — targeted reconciliations issued after the
 * snapshot, plus one multi-file package. `review:canon-index` reported PASS throughout,
 * because its only real assertion was `indexed.length > 0`.
 *
 * **The consequence was not theoretical.** An older ruling still governed a Pre-I2 conclusion
 * after a newer targeted reconciliation had superseded it — a decision taken on superseded
 * authority, which no gate could see.
 *
 * ⚑ **AUTHORITY IS NOT "EVERY FILE UNDER canon/".** Class is derived from each document's own
 * declared `**Status:**`, never from its filename or date — a naive recursive rule would
 * promote drafts, research and `history/` into authority. An outbound draft
 * (`READY TO SEND`) is explicitly NOT a ruling.
 */
const CANON_CURRENT_STATUS =
  /\*\*Status:\*\*.*(FOUNDER-RATIFIED|CONTROLLING|ACTIVE|CURRENT|ACCEPTED|\bPASS\b|CANON UPDATE)/i;
const CANON_NOT_AUTHORITY = /\*\*Status:\*\*.*(READY TO SEND|DRAFT|SUPERSEDED)/i;

/**
 * Canon documents outside `extracted/`, classified by their OWN declared status.
 *
 * ⛑ THE FIRST VERSION OF THIS WALKER RETURNED ZERO AND THE GATE STILL PASSED.
 * It called `statSync`, which this module never imported, inside a `try/catch`
 * that swallowed the `ReferenceError` and `continue`d past every entry — so the
 * detector built to find 25 invisible documents was itself blind, and its
 * non-vacuity check could not fire because it keyed off the same zero.
 * `readdirSync(..., { withFileTypes: true })` removes the dependency, and the
 * floor below is absolute rather than relative.
 */
/** The class the canon README's own table gives a document, if it lists it. */
let canonReadmeRows = null;
function canonIndexClass(fileName, pkgName) {
  if (canonReadmeRows === null) {
    const readmePath = `${CANON}/README.md`;
    canonReadmeRows = existsSync(at(readmePath))
      ? rd(readmePath)
          .split('\n')
          .filter((l) => l.startsWith('|'))
      : [];
  }
  /* A file's own row wins; otherwise a package member inherits its package's row. */
  const row =
    canonReadmeRows.find((l) => l.includes(fileName)) ??
    (pkgName && pkgName !== 'canon' ? canonReadmeRows.find((l) => l.includes(pkgName)) : undefined);
  if (!row) return null;
  if (/NOT-AUTHORITY|\bHISTORY\b|\bREFERENCE\b|SUPERSEDED/.test(row)) return 'NOT-AUTHORITY';
  if (/\*\*CURRENT\*\*|\bCURRENT\b/.test(row)) return 'CURRENT';
  return null;
}

function canonRootDocs() {
  const out = [];
  const walk = (rel, depth) => {
    if (!existsSync(at(rel))) return;
    for (const e of ls(rel, { withFileTypes: true })) {
      const r = `${rel}/${e.name}`;
      if (r.includes('/extracted')) continue;
      if (e.isDirectory()) {
        /* `history/` is preserved audit history by the package's own rule. */
        if (e.name === 'history') continue;
        if (depth < 2) walk(r, depth + 1);
      } else if (e.name.endsWith('.md') && e.name !== 'README.md') {
        const head = rd(r).slice(0, 1200);
        /**
         * ⛑ THE INDEX'S OWN CLASSIFICATION WINS (P0 review, PB-5). Keyword
         * matching on the status line misread documents both ways: a status of
         * "TARGETED RECONCILIATION" (current authority) matched nothing and was
         * UNCLASSIFIED — so never checked — and "FOR CURRENT FINAL SET" read as
         * CURRENT by accident. The canon README classifies each document; its
         * row decides, and the status keywords are only the fallback.
         */
        /* A member's OWN draft status still wins over its package's class. */
        const fromIndex = CANON_NOT_AUTHORITY.test(head)
          ? 'NOT-AUTHORITY'
          : canonIndexClass(e.name, rel.split('/').pop());
        const cls =
          fromIndex ??
          (CANON_NOT_AUTHORITY.test(head)
            ? 'NOT-AUTHORITY'
            : CANON_CURRENT_STATUS.test(head)
              ? 'CURRENT'
              : 'UNCLASSIFIED');
        out.push({ path: r, cls });
      }
    }
  };
  walk(CANON, 0);
  return out;
}

function checkCanonIndex() {
  if (NO_PRIVATE) return NO_PRIVATE_SKIP;
  if (!existsSync(at(CANON)))
    return {
      ok: true,
      skip: true,
      detail: `${CANON} absent (fresh clone / local-only) — authority search cannot run here`,
    };
  const indexed = mdUnder(CANON_INDEX); // already excludes §5 hidden-control paths
  const hidden = sh(
    `find ${CANON_INDEX} -name '${HIDDEN_CONTROL_DIR}' -o -name '*_hidden_adjudication_control.md' 2>/dev/null | wc -l`
  ).trim();
  const archives = existsSync(at(CANON)) ? ls(CANON).filter((f) => f.endsWith('.zip')) : [];
  /* Residual archives are REPORTED, not chased. The packages contain their own
     prior releases (`95_ORIGINAL_ARCHIVES` recursing into archived Growth
     releases), so extracting to zero is unbounded and would index historical
     material nothing cites. Indexing the current-authority tier is the goal;
     this number is visibility, not a failure condition. */
  /* Through `at()` and no shell: a relative `find` ran in this checkout and missed the
     private root once the docs moved out (5.653, caught by the sibling rehearsal). */
  const nested = indexed.length
    ? String(
        run('find', [at(CANON_INDEX), '-name', '*.zip'])
          .split('\n')
          .filter(Boolean).length
      )
    : '0';
  const unreachable = CITED_AUTHORITIES.filter(
    (f) => !mdUnder('docs', [CANON]).some((p) => p.endsWith(`/${f}`))
  ).filter((f) => !indexed.some((p) => p.endsWith(`/${f}`)));
  const detail = [
    `${indexed.length} authority markdown file(s) searchable from ${archives.length} package(s)` +
      `; ${nested} nested archive(s) NOT indexed`,
    unreachable.length
      ? `CITED · NOT REACHABLE (never read as "no authority"): ${unreachable.join(', ')}`
      : 'every cited authority resolves',
    `hidden adjudication controls excluded from every corpus (§5); ${hidden} residual path(s) present`,
  ];
  /* Indexed == 0 with archives present is the failure this row exists for: the
     authority is on disk and unsearchable, which is how `5.410` happened. */
  let ok = indexed.length > 0 || archives.length === 0;

  /* ── DOC-2 · current authority OUTSIDE extracted/ must be in the canon index ── */
  const readme = existsSync(at(`${CANON}/README.md`)) ? rd(`${CANON}/README.md`) : '';
  const rootDocs = canonRootDocs();
  const current = rootDocs.filter((d) => d.cls === 'CURRENT');
  const notAuth = rootDocs.filter((d) => d.cls === 'NOT-AUTHORITY');

  /**
   * ⛑ AN ABSOLUTE FLOOR, NOT A RELATIVE ONE. The earlier guard read
   * `rootDocs.length > 0 && current.length === 0`, so when the walker returned
   * ZERO it proved nothing and the row went green — the exact failure this row
   * exists to stop. This corpus is KNOWN to hold current authority outside
   * `extracted/`; a scan that cannot see it is broken, not clean.
   */
  if (rootDocs.length < 6 || current.length < 5) {
    ok = false;
    detail.push(
      `DOC-2: the canon-root scan found ${rootDocs.length} doc(s) / ${current.length} CURRENT — ` +
        'below the known floor, so this scan is BROKEN, not clean'
    );
  }
  /** A package is indexed by its directory name; a loose file by its own name. */
  const indexedIn = (rel) => {
    const file = rel.split('/').pop();
    const pkg = rel.split('/').slice(-2, -1)[0];
    return readme.includes(file) || (pkg && pkg !== 'canon' && readme.includes(pkg));
  };
  const missing = current.filter((d) => !indexedIn(d.path));
  if (missing.length) {
    ok = false;
    detail.push(
      `DOC-2: CURRENT AUTHORITY NOT IN THE CANON INDEX (${missing.length}): ` +
        missing
          .slice(0, 4)
          .map((d) => d.path.split('/').pop())
          .join(' · ')
    );
  }
  /* ⛑ AN UNCLASSIFIED DOCUMENT FAILS (PB-5): it is neither checked as current nor
     excluded as a draft, so it used to pass without being looked at. */
  const unclassified = rootDocs.filter((d) => d.cls === 'UNCLASSIFIED');
  if (unclassified.length) {
    ok = false;
    detail.push(
      `DOC-2: UNCLASSIFIED canon document(s) — classify in the canon README (${unclassified.length}): ` +
        unclassified
          .slice(0, 3)
          .map((d) => d.path.split('/').pop())
          .join(' · ')
    );
  }
  /* A draft must not be claimed as current. */
  const claimed = notAuth.filter((d) => {
    const i = readme.indexOf(d.path.split('/').pop());
    return i > -1 && !/NOT-AUTHORITY/.test(readme.slice(Math.max(0, i - 400), i + 400));
  });
  if (claimed.length) {
    ok = false;
    detail.push(`DOC-2: a NON-AUTHORITY draft is indexed as current: ${claimed[0].path}`);
  }
  /* A current PACKAGE must carry its internal precedence, not be flattened. */
  const pkgs = [...new Set(current.map((d) => d.path.split('/').slice(-2, -1)[0]))].filter(
    (d) => d && d !== 'canon'
  );
  for (const pkg of pkgs) {
    const at = readme.indexOf(pkg);
    if (
      at > -1 &&
      !/internal precedence|precedence, preserved|AUTHORITY_AND_SUPERSESSION/i.test(readme)
    ) {
      ok = false;
      detail.push(`DOC-2: package ${pkg} indexed WITHOUT its internal precedence`);
    }
  }
  /**
   * ⛑ TWO CURRENT AUTHORITIES ON ONE SUBJECT, WITH NO STATED PRECEDENCE, IS A STOP.
   * The canon's own rule is that a conflict between two CURRENT authorities is not
   * reconciled by preference. Mechanically: every CURRENT index row must carry a
   * non-empty Precedence cell, and no two may declare an identical Scope.
   */
  const indexRows = readme
    .split('\n')
    .filter((l) => /^\| \d+ \| `/.test(l))
    .map((l) => l.split(' | ').map((c) => c.trim()));
  const noPrec = indexRows.filter((r) => r.length > 7 && (!r[6] || r[6] === '—'));
  if (indexRows.length && noPrec.length) {
    ok = false;
    detail.push(
      `DOC-2: ${noPrec.length} CURRENT authorit(ies) indexed with NO stated precedence — a conflict cannot be resolved by preference`
    );
  }
  const scopes = indexRows.map((r) => (r.length > 9 ? r[9] : '')).filter(Boolean);
  const dupScope = scopes.find((v, i) => scopes.indexOf(v) !== i);
  if (dupScope) {
    ok = false;
    detail.push(
      `DOC-2: two CURRENT authorities claim the SAME scope — STOP: ${dupScope.slice(0, 60)}`
    );
  }

  detail.push(
    `DOC-2: ${rootDocs.length} doc(s) outside extracted/ — ${current.length} CURRENT (all indexed)` +
      `, ${notAuth.length} NOT-AUTHORITY, ${rootDocs.length - current.length - notAuth.length} unclassified`
  );

  return { ok, detail: detail.join('\n      ') };
}

/**
 * AUTH-1 row 2 — a `file:line` citation must still resolve.
 *
 * 347 distinct ones exist across the register and the records. A citation is how
 * an engineering claim is checkable, and it decays silently: the file is renamed,
 * the line moves, the row keeps asserting. Measured cost in this batch: a `5.229`
 * closure claim written from a row read only in truncation, withdrawn the same
 * day; and `5.230` citing `GoalDetailScreen.tsx:707-737`, lines that no longer
 * describe what the row says.
 *
 * Only the FILE half is mechanised. Whether line N still says what the row
 * claims is semantic, and this row does not pretend otherwise.
 */
function checkCitations() {
  const corpus = [REGISTER, ...mdUnder('docs/tech', []), ...mdUnder('docs/audit', [])].filter((p) =>
    existsSync(at(p))
  );
  if (!corpus.length) return { ok: false, detail: 'no engineering records found to check' };
  const CITE = /`([A-Za-z0-9_./-]+\.(?:md|ts|tsx|css|json|mjs)):(\d+)(?:-\d+)?`/g;
  const seen = new Map();
  for (const doc of corpus) {
    for (const m of rd(doc).matchAll(CITE)) {
      const [, file, line] = m;
      if (!seen.has(`${file}:${line}`)) seen.set(`${file}:${line}`, doc);
    }
  }
  /**
   * THREE-TIER resolution, and the middle tier is the whole reason this row is
   * usable. A first version treated "has a slash" as "is repo-rooted" and
   * reported 68 of 133 citations DEAD — a 51 % false-alarm rate. 65 of those
   * were PROSE SHORTHAND (`projection/core.ts:106`, `hooks/useMarket.ts:6`),
   * which resolve perfectly by basename. A guard that cries wolf at that rate is
   * ignored within a week, which is worse than no guard.
   *
   *   1. root-relative path exists            → resolves
   *   2. basename exists EXACTLY ONCE in repo → resolves (shorthand)
   *   3. otherwise                            → DEAD
   *
   * Tier 2 requires UNIQUENESS: one shorthand resolved by basename to a
   * different file entirely (`app/api/market/route.ts` → a waitlist route), so a
   * non-unique basename proves nothing and is not treated as resolution.
   */
  /**
   * THREE OUTCOMES, and the middle one is why this row is usable.
   *
   *   RESOLVES  — root-relative path exists, or the basename is unique in-repo
   *   AMBIGUOUS — basename exists but matches N>1 files (prose shorthand)
   *   DEAD      — the basename exists nowhere
   *
   * Only DEAD fails. Two earlier versions of this row were wrong in opposite
   * directions and both would have made the gate ignorable: treating "has a
   * slash" as repo-rooted reported 68 of 133 dead (65 were shorthand like
   * `projection/core.ts:106`); then requiring a UNIQUE basename turned ambiguity
   * into death and still reported 26. Measured truth: 107 resolve, 23 are
   * ambiguous (`unavailable/page.tsx` matches 61 files, `app/api/market/route.ts`
   * matches 16), and 3 are genuinely dead. A 23-to-3 noise ratio is how a guard
   * gets ignored, so ambiguity is REPORTED, never failed.
   *
   * Line-content agreement stays semantic and is not claimed here.
   */
  /**
   * A citation the record itself marks HISTORICAL is not a live claim.
   *
   * Same precedent as `checkCounts`, which excludes a superseded figure when its
   * own line marks it as such: docs legitimately cite material that the
   * delete-after-execution policy has since removed, and the honest fix is to
   * annotate the citation, not to resurrect the file. Without this the row could
   * never reach green while any spent citation existed — a permanently-red gate
   * is an ignored gate.
   *
   * The marker must sit on the SAME line as the citation, because that is the
   * only placement a reader and this check agree on (the counts row learned the
   * same lesson the hard way).
   */
  const HISTORICAL_MARK =
    /historical citation|no longer present|deleted local-only|spent citation/i;
  const marked = new Set();
  for (const doc of corpus) {
    for (const line of rd(doc).split('\n')) {
      if (!HISTORICAL_MARK.test(line)) continue;
      for (const m of line.matchAll(CITE)) marked.add(`${m[1]}:${m[2]}`);
    }
  }

  const index = fileIndex();
  const classify = (file) => {
    if (existsSync(at(file))) return 'resolves';
    const hits = index.get(file.split('/').pop()) ?? [];
    if (hits.length === 1) return 'resolves';
    return hits.length > 1 ? 'ambiguous' : 'dead';
  };
  const dead = [];
  let resolves = 0,
    ambiguous = 0,
    historical = 0;
  for (const [cite, doc] of seen) {
    const file = cite.split(':')[0];
    if (!file.includes('/')) continue; // a bare filename in prose is not a resolvable citation
    const verdict = classify(file);
    if (verdict === 'resolves') resolves += 1;
    else if (verdict === 'ambiguous') ambiguous += 1;
    else if (marked.has(cite)) historical += 1;
    else dead.push(`${cite} (in ${doc.replace('docs/', '')})`);
  }
  return {
    ok: dead.length === 0,
    detail:
      `${seen.size} citation(s): ${resolves} resolve, ${ambiguous} ambiguous (shorthand), ` +
      `${historical} marked historical on their own line` +
      (dead.length ? ` · ${dead.length} DEAD: ${dead.join('; ')}` : ' · 0 dead') +
      `\n      line-content agreement is SEMANTIC and not claimed by this row`,
  };
}

/**
 * AUTH-1 row 3 — no escalation without a completed Canon-First search.
 *
 * The gate document's §18/§25: *"any external escalation without a completed
 * AUTH-1 block → SYSTEM REVIEW = INCOMPLETE"*. Measured today: escalation
 * vocabulary appears in 16+ documents while `CANON-FIRST` appears in 3, and the
 * register admits six times over to reporting a blocker the authority set had
 * already resolved.
 */
function checkEscalations() {
  /**
   * QUOTE THE CONTEXT — a mention is not an assertion.
   *
   * A first version matched the escalation vocabulary anywhere in the document
   * and flagged an increment record whose only hit was inside a `CORRECTIONS`
   * field: *"I carried 5.356 as blocked on Brand/Legal; §4 had already supplied
   * the four strings"* — an honest retrospective about a past mistake. Flagging
   * self-correction is precisely backwards, so the escalation must be the
   * record's OWN status claim: a `KEY = VALUE` status line or a heading, never
   * narrative prose.
   */
  const STATUS_LINE =
    /^\s*(?:[A-Z0-9_ ]{3,40}\s*=\s*|#{1,6}\s*|[-*]\s+\*\*)?[^\n]*?(EXTERNAL AUTHORITY BLOCKER|BLOCKED ON (?:PRODUCT|LEGAL|M&E|BRAND|TOKEN|STRATEGY|FOUNDER))/i;
  const NARRATIVE = /CORRECTION|WITHDRAWN|I carried|earlier|previously|was wrong|retrospect/i;
  const SEARCHED = /CANON-FIRST SEARCH\s*(?:=|:)?\s*COMPLETED/i;
  /**
   * TWO CORPORA, and the exclusion is STATED — because the first version's was
   * silent and wrong.
   *
   * It filtered by `/PRE_I2|REVIEW|GATE|RETURN/` and scanned **40 of 76** files.
   * The 36 it skipped included **`PENDING_ALL.md`, the register itself** — so the
   * row printed "40 engineering record(s) scanned · every escalation carries a
   * completed Canon-First block" while never reading the most important document
   * in the corpus. Both hand-run sabotage proofs had passed only because that
   * fixture's filename happened to contain "GATE". The automated spec caught it
   * on its first run, which is the argument for automating a standing gate.
   *
   * ⚑ AND THE FIX HAD ITS OWN FICTION, corrected here. I first "widened" the
   * name pattern to `…|ANALYSIS|EVIDENCE|AUDIT|HANDOFF|…` and wrote a comment
   * claiming it deliberately excluded usability reports and copy packages.
   * Measured: `AUDIT` matches **all 76** files, because the pattern tests the
   * full PATH and every path contains the directory `docs/audit`. The exclusion
   * was zero files and the comment was false — a prose-versus-behaviour gap of
   * exactly the kind this gate exists to catch, in the gate itself.
   *
   * So the filter is GONE rather than tuned until the number looks right. The
   * corpus is EVERY record under `docs/audit`, which is also the stronger design:
   * the row fires only on a status-CLAIM line, so an inert document stays inert,
   * and no filter can hide a record from the gate (the `5.134`-class lesson that
   * whatever a filter drops can never be found).
   *
   * The REGISTER is scanned under its OWN rule. It legitimately narrates blocked
   * states inside closures and founder dispositions — measured: 3 hits, two
   * `✅ CLOSED` rows and one disposition block, none a live escalation. Judging it
   * by the record rule would flag all three on day one, and a gate that flags the
   * register immediately is a gate that gets switched off.
   */
  const REGISTER_CONTEXT = /✅|CLOSED|FIXED|WITHDRAWN|DISPOSITION|SUPERSEDED|historical/i;
  if (NO_PRIVATE) return NO_PRIVATE_SKIP;
  const auditDocs = mdUnder('docs/audit', []);
  const isRegister = (q) => q.endsWith('PENDING_ALL.md');
  /* EVERY engineering record, with NO name filter. The register is separated
     because it needs a different rule, not because it is excluded. */
  const corpus = auditDocs.filter((q) => !isRegister(q));
  /* ⚑ NON-VACUITY (5.653). With no private docs here (a fresh clone, CI) there is nothing
     to scan, and "0 records · every escalation carries a block" read as a pass. It is
     INCOMPLETE: nothing was checked. */
  if (corpus.length === 0 && !auditDocs.some(isRegister))
    return {
      ok: true,
      skip: true,
      detail:
        'no engineering record and no register here (private docs absent) — nothing was checked',
    };
  const offenders = [];
  for (const doc of corpus) {
    const text = rd(doc);
    if (SEARCHED.test(text)) continue;
    const claims = text.split('\n').filter((l) => STATUS_LINE.test(l) && !NARRATIVE.test(l));
    if (claims.length)
      offenders.push(`${doc.replace('docs/audit/', '')} (${claims.length} claim line[s])`);
  }
  /* The register, under its own rule: a closure or disposition narrating a
     blocked state is a record of history, not a live Engineering escalation. */
  const regPath = auditDocs.find(isRegister);
  if (regPath) {
    const live = rd(regPath)
      .split('\n')
      .filter((l) => STATUS_LINE.test(l) && !NARRATIVE.test(l) && !REGISTER_CONTEXT.test(l));
    if (live.length) offenders.push(`PENDING_ALL.md (${live.length} live escalation line[s])`);
  }
  return {
    ok: offenders.length === 0,
    detail:
      `${corpus.length} engineering record(s)${regPath ? ' + the register' : ''} scanned` +
      (offenders.length
        ? ` · ${offenders.length} escalate WITHOUT a completed Canon-First block: ${offenders.join(', ')}`
        : ' · every escalation carries a completed Canon-First block') +
      `\n      corpus: EVERY record under docs/audit, no name filter (a filter can hide a record ` +
      `from its own gate); the register is judged by its own rule (closure / disposition ≠ live escalation)`,
  };
}

/* ------------------------------------------------------------------ staged */
/** An empty stage makes a commit report success over nothing. */
function checkStaged() {
  const files = gitNames(['diff', '--cached', '--name-only', '-z']);
  if (!files.length)
    return { ok: true, skip: true, detail: 'nothing staged — run again after `git add`' };

  /**
   * NARROW, NAMED EXCEPTION — this file DEFINES the patterns below, so scanning
   * its own diff matches its own pattern table: a detector cannot tell its
   * definition from a violation. (It blocked its own first commit exactly this
   * way — the same family as "a grep cannot distinguish a quoted retraction
   * from an assertion".) Excluded from the PATTERN sweep only: it is still
   * counted, still listed, and the exclusion is PRINTED every run, because a
   * guard must state what its filter drops (system gate X6). Secrets are
   * covered here by `secrets:scan-staged`, which has no such exception.
   */
  const SELF = 'scripts/review-gate.mjs';
  const scanned = files.filter((f) => f !== SELF);
  const added = scanned.flatMap((f) =>
    run('git', ['diff', '--cached', '-U0', '--', f])
      .split('\n')
      .filter((l) => l.startsWith('+') && !l.startsWith('+++'))
  );

  const NEVER = [
    ['canon / legal-source path', /docs\/full-view\/canon|legal-current/],
    ['credential-shaped literal', /(api[_-]?key|secret|password|token)\s*[:=]\s*['"][^'"]{12,}/i],
  ];
  const WARN = [
    ['percentage figure', /\d+(\.\d+)?\s*%/],
    ['currency amount', /[€$]\s?\d|R\$\s?\d/],
    ['regulator name', /\bMiCA\b|\bBCB\b|SPSAV|\bCVM\b/],
  ];
  const hard = [];
  const soft = [];
  /**
   * ⚑ FIXED 2026-09-14 (AUD-G02). The patterns were tested against ADDED LINES
   * only, so staging `docs/full-view/canon/probe.txt` with neutral contents
   * PASSED — while this check printed that very path in its own output. A
   * protected-path rule is about WHERE a file lives, not what it says. The
   * filename sweep uses the FULL list (not the self-excluded one): a path rule
   * has no legitimate exception, and this file's own path is not a canon path.
   */
  /**
   * ⚑ NARROWED 2026-09-14, the same day the filename sweep was added — because
   * the sweep then refused this very batch over two lines that merely NAME
   * `docs/sandbox-app/legal-current/` while explaining why approved strings are
   * embedded rather than read at runtime. A path RULE is about where a file
   * lives; a path MENTION inside prose is a reference, not a leak. So:
   *
   *   - protected path as a staged FILENAME  -> always a refusal (this is the
   *     half that caught the independent audit's canon probe, and it does not
   *     move);
   *   - protected path inside an added LINE  -> only when it is NOT being
   *     discussed, i.e. not wrapped in backticks or quotes.
   *
   * Same shape as the `counts` narrowing above, and the same lesson for the
   * third time in one day: a detector that cannot tell a mention from an
   * assertion will eventually refuse its own documentation.
   */
  const mentioned = (line, re) => {
    const m = line.match(re);
    if (!m) return false;
    const quoted = new RegExp(
      '["\'\u201c\u201d`][^"\'\u201c\u201d`]*' + m[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    );
    return !quoted.test(line);
  };
  for (const [label, re] of NEVER) {
    if (files.some((f) => re.test(f))) {
      hard.push(`${label} (staged FILE)`);
      continue;
    }
    if (added.some((l) => mentioned(l, re))) hard.push(`${label} (unquoted in an added line)`);
  }
  // WARN stays line-only: a filename containing % or $ is not a disclosure risk.
  for (const [label, re] of WARN) if (added.some((l) => re.test(l))) soft.push(label);

  const detail = [`${files.length} file(s) staged: ${files.join(', ')}`];
  if (files.includes(SELF))
    detail.push(`${SELF} counted but EXCLUDED from the pattern sweep (it defines the patterns)`);
  detail.push(`${added.length} added line(s) scanned across ${scanned.length} file(s)`);
  if (soft.length) detail.push(`needs human sign-off (public repo): ${soft.join(', ')}`);
  if (hard.length) detail.push(`MUST NOT COMMIT: ${hard.join(', ')}`);
  return { ok: hard.length === 0, detail: detail.join(' · ') };
}

/* ----------------------------------------------------------------- exports */
/** An exported function with no consumer is dead, or a screen nobody links. */
/**
 * ⛑ BY THE PARSER, NOT BY REGEX (R4 correction, independent review 2026-10-16) —
 * the same defect the sandbox guards' `stripComments` shed: `//.*$` deleted the
 * rest of a line after a URL in a string (`"https://x.dev"; selectGoal(s);`), so
 * a real consumer read as NONE. Comment ranges come from the TypeScript parser
 * (a root devDependency, loaded only when this row runs).
 */
let tsLib = null;
const stripComments = (t, fileName = 'x.tsx') => {
  tsLib ??= createRequire(import.meta.url)('typescript');
  const ts = tsLib;
  const sf = ts.createSourceFile(fileName, t, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const ranges = new Map();
  const jsxText = [];
  const visit = (node) => {
    if (node.kind >= ts.SyntaxKind.FirstJSDocNode && node.kind <= ts.SyntaxKind.LastJSDocNode)
      return;
    if (ts.isJsxText(node)) jsxText.push([node.pos, node.end]);
    for (const r of ts.getLeadingCommentRanges(t, node.getFullStart()) ?? [])
      ranges.set(r.pos, r.end);
    for (const r of ts.getTrailingCommentRanges(t, node.getEnd()) ?? []) ranges.set(r.pos, r.end);
    node.getChildren(sf).forEach(visit);
  };
  visit(sf);
  const chars = t.split('');
  for (const [pos, end] of ranges) {
    if (jsxText.some(([from, to]) => pos >= from && pos < to)) continue;
    for (let i = pos; i < end; i += 1) if (chars[i] !== '\n') chars[i] = ' ';
  }
  return chars.join('');
};

/**
 * Files this change actually touches — worktree, index, and branch commits
 * (register 5.383). Best-effort: if git cannot answer, return null and let the
 * caller scan rather than claim an N/A it cannot prove.
 */
function changedFiles() {
  const out = new Set();
  let answered = false;
  for (const range of ['HEAD', 'origin/main...HEAD']) {
    try {
      for (const f of gitNames(['diff', '--name-only', '-z', range])) out.add(f);
      answered = true;
    } catch {
      /* no upstream, detached head, or not a repo — fall through */
    }
  }
  return answered ? out : null;
}

/**
 * An exported function with no consumer is dead, or a screen nobody links.
 *
 * The target is NAMED in the result and checked against the diff (5.383). It
 * used to default silently to the sandbox view directory, so reviewing a change
 * under `apps/web/src/lib/market-data/` produced the line "17 exported
 * function(s) checked in apps/sandbox/src/view · all consumed" — true, and
 * about code the increment never touched. A green row for an unexamined change
 * is false comfort, and it is the 5.305 shape: a guard cited as covering
 * something it cannot see. It now says N/A instead of PASS when the path it
 * would scan has nothing to do with the change.
 */
function checkExports(target = 'apps/sandbox/src/view', scope = 'apps/sandbox/src') {
  if (!existsSync(at(target)))
    return { ok: true, skip: true, detail: `${target} absent — skipped` };
  const changed = changedFiles();
  if (changed && ![...changed].some((f) => f.startsWith(target)))
    return {
      ok: true,
      skip: true,
      detail:
        `N/A — this change touches no file under ${target} ` +
        `(${changed.size} changed file(s)); nothing scanned, so this row asserts nothing`,
    };
  const mods = ls(target).filter((f) => f.endsWith('.ts') || f.endsWith('.tsx'));
  const dead = [];
  const internalOnly = [];
  let checked = 0;
  for (const m of mods) {
    const src = rd(`${target}/${m}`);
    /**
     * ⚑ FIXED 2026-09-14 (AUD-G02). Only `export function` was matched, so a
     * selector written `export const x = …` was invisible and `checked` stayed
     * 0 — which then printed "all consumed" and PASSED.
     */
    const decls = [
      ...src.matchAll(/^export (?:async )?function (\w+)/gm),
      ...src.matchAll(/^export const (\w+)\s*[:=]/gm),
    ];
    for (const mt of decls) {
      const name = mt[1];
      checked += 1;
      let hits = '';
      try {
        hits = run('grep', ['-rl', `\\b${name}\\b`, scope, '--include=*.ts', '--include=*.tsx']);
      } catch {
        /* grep found nothing */
      }
      /**
       * ⚑ FIXED 2026-09-14 (AUD-G02): a name appearing only in a COMMENT counted
       * as a consumer — the same "a grep cannot tell a mention from a use"
       * class this runner exists to catch. Comments are stripped before the
       * name is credited.
       */
      /**
       * ⚑ SCOPED 2026-09-14. Excluding `__tests__` is right for the defect this
       * check was born from — two SCREENS shipped linked from nowhere, where a
       * test proves nothing about reachability. It is wrong for a PURE
       * FUNCTION: a selector's direct unit test is its legitimate consumer, and
       * treating it as none reported `selectGoalProgress` (used by two sibling
       * selectors and covered by 62 tests) as unnecessary. `testsCount` is
       * therefore true for pure-function targets and false for reachable
       * surfaces, and the detail line states which applied.
       */
      const testsCount = target.includes('/view');
      const consumers = hits
        .split('\n')
        .filter(Boolean)
        .filter((f) => (testsCount ? true : !f.includes('__tests__')))
        .filter((f) => !f.endsWith(`${target}/${m}`))
        .filter((f) =>
          new RegExp(`\\b${name}\\b`).test(stripComments(readFileSync(at(f), 'utf8')))
        );
      /**
       * TWO different findings, and collapsing them was hiding one (AUD-C03).
       * A symbol with no use ANYWHERE is dead. A symbol used only inside its own
       * module is not dead — it is EXPORTED UNNECESSARILY, which is a weaker but
       * real finding: the export widens the seam's public surface and invites a
       * second caller to bypass the intended entry point. Both are reported,
       * separately, so neither is filed as the other.
       */
      if (consumers.length === 0) {
        const selfBody = stripComments(src);
        const usedInternally = (selfBody.match(new RegExp(`\\b${name}\\b`, 'g')) ?? []).length > 1;
        if (usedInternally) internalOnly.push(name);
        else dead.push(name);
      }
    }
  }
  // ⚑ FIXED 2026-09-14 (AUD-G02): `checked === 0` printed "all consumed" and
  // PASSED. A count floor of zero is never a pass — it means the scan found
  // nothing to scan, which is the instrument failing, not the code being clean.
  if (checked === 0)
    return {
      ok: false,
      detail: `${target} exists but the scan matched NO exported symbol — instrument failure, not a clean result`,
    };
  const notes = [];
  if (dead.length) notes.push(`NO CONSUMER ANYWHERE: ${dead.join(', ')}`);
  if (internalOnly.length)
    notes.push(
      `EXPORTED UNNECESSARILY (used only within its own module, plus its test): ${internalOnly.join(', ')}`
    );
  return {
    ok: dead.length === 0 && internalOnly.length === 0,
    detail:
      `${checked} exported symbol(s) checked in ${target}` +
      (target.includes('/view')
        ? ' (pure-function target: a direct unit test counts as a consumer)'
        : ' (reachable-surface target: tests do NOT count as consumers)') +
      (notes.length ? ` · ${notes.join(' · ')}` : ' · all consumed'),
  };
}

/* -------------------------------------------------------------------- port */
/** A port's pid list contains its CLIENTS. Select the listener, verify, kill one. */
function checkPort(port, doKill) {
  if (!port) return { ok: false, detail: 'usage: pnpm review:port <port> [--kill]' };
  /* ⛑ R4-2: the port is operator input, so it is validated, never interpolated. */
  if (!/^\d{1,5}$/.test(port) || Number(port) < 1 || Number(port) > 65535)
    return { ok: false, detail: `'${port}' is not a port number (1–65535) — refusing` };
  const listeners = () => {
    try {
      return run('lsof', [`-ti:${port}`, '-sTCP:LISTEN']).trim();
    } catch {
      return ''; /* lsof exits 1 when nothing listens */
    }
  };
  const pids = listeners();
  if (!pids) return { ok: true, detail: `port ${port}: no listener` };
  const list = pids.split('\n').filter(Boolean);
  if (list.length !== 1)
    return {
      ok: false,
      detail: `port ${port}: ${list.length} listeners (${list.join(', ')}) — refusing to act`,
    };
  const pid = list[0];
  if (!/^\d+$/.test(pid)) return { ok: false, detail: `unexpected pid '${pid}' — refusing` };
  const cmd = run('ps', ['-o', 'comm=', '-p', pid]).trim();
  const expected = /node|next-server/.test(cmd);
  if (!expected)
    return {
      ok: false,
      detail: `port ${port}: pid ${pid} is '${cmd}' — not a dev server, refusing`,
    };
  if (!doKill)
    return {
      ok: true,
      detail: `port ${port}: listener pid ${pid} ('${cmd}') — pass --kill to stop it`,
    };
  process.kill(Number(pid), 'SIGTERM');
  const still = listeners();
  return {
    ok: !still,
    detail: still ? `killed ${pid} but ${still} still listening` : `stopped pid ${pid} ('${cmd}')`,
  };
}

/* -------------------------------------------------------------------- main */
const MANUAL = {
  increment: [
    'Part B — name the source plan and its ref; verdict its conditions VERBATIM.',
    'Part C — do-not-regress proven by a grep over the diff; reachability at the MOUNT site; no fake control.',
    'Part C8 — locale parity: every new string in all four locales, and actually translated (see the i18n tests).',
    'Part D — sabotage-prove every load-bearing test; re-measure every number you republish; D7 every fixed defect leaves a guard and a similar-cases search.',
    'Part E — Docker MCP: A/B against the pre-change reading · light AND dark × 375 AND 1440 × EN AND the longest locale · a11y as measured ratios · console 0 errors · state provenance.',
    'Part F/G — fix-vs-register with owners; what you did NOT check; no waiver without a founder-recorded decision.',
  ],
};

/**
 * THE TEN AUTHORITATIVE FRONTS of `docs/tech/system-review-gate.md`.
 *
 * ⚑ ADDED 2026-09-21 (`5.431`). This list used to hold SIX entries — the fronts
 * nobody had mechanised — and printed them under "MANUAL". Fronts 3, 4 and 10
 * were therefore never surfaced in any state, and Front 5 was surfaced only by
 * its mechanical row, which SKIPs for any change that touches nothing under
 * `apps/sandbox/src/view`. A reviewer who worked from this output believed they
 * had enumerated the gate; they had enumerated a subset of it. That is the
 * `5.305` shape — a guard credited with coverage it does not have.
 *
 * `mechanisedBy` names the row that can DISCHARGE a front. It is not a promise
 * that the row is sufficient: the row supplies evidence, the reviewer still
 * dispositions the front. When that row does not PASS — SKIP, N/A or FAIL —
 * the front falls back to MANUAL ADJUDICATION, because a front adjudicated by
 * nobody is exactly what this change exists to make impossible.
 *
 * ⚑ DO NOT shorten this list to "the ones that need work". Its completeness IS
 * the guard, and `reviewGateFronts` in the regression net fails if the numbers
 * here stop matching the `## Front N` headings in the gate document.
 */
const SYSTEM_FRONTS = [
  {
    n: 1,
    mechanisedBy: null,
    what: 'Architecture principles and code standards — all 12 principles, one verdict each; ADR triggers-to-reconsider.',
  },
  {
    n: 2,
    mechanisedBy: null,
    what: 'CLO · Brand · UX · Voice · Storytelling — five separate verdicts, never averaged; veto rows 10–17 and Q3 block.',
  },
  {
    n: 3,
    mechanisedBy: null,
    what: 'Other gates and playbooks — every LIVE gate run and pasted, each with its stated scope limit.',
  },
  {
    n: 4,
    mechanisedBy: null,
    what: "Completeness against the source — the plan's conditions verdicted VERBATIM, not paraphrased.",
  },
  {
    n: 5,
    mechanisedBy: 'exports',
    what: 'Dead and legacy code — orphaned exports, unreachable surfaces, legacy left behind.',
  },
  {
    n: 6,
    mechanisedBy: null,
    what: 'Mathematics and formulas, line by line; identities proven FROM AN INDEPENDENT TERM.',
  },
  {
    n: 7,
    mechanisedBy: null,
    what: 'Real-time data readiness — per source: live path · TTL · stamp · fallback; then today / swap-ready / real-time.',
  },
  { n: 8, mechanisedBy: null, what: 'The data lifecycle at its SEAMS, not per stage.' },
  {
    n: 9,
    mechanisedBy: null,
    what: 'Cross-increment coherence — X1 duplicate derivations and X6 guard filters are MANUAL: no script here claims them.',
  },
  {
    n: 10,
    mechanisedBy: null,
    what: 'FAIL, waiver and escalation — no waiver without a founder-recorded decision.',
  },
];

/** The only four dispositions a front may close with. Printed so it is not remembered. */
const FRONT_DISPOSITIONS = [
  'PASS',
  'N/A · WITH MEASURED PROOF',
  'NON-BLOCKING FINDING · REGISTERED',
  'BLOCKING FINDING · STOP',
];

const mode = process.argv[2] ?? 'increment';
const args = process.argv.slice(3);
/* ----------------------------------------------------------------- battery */
/**
 * ⚑ ADDED 2026-09-14 (AUD-G01). Every check above is a TEXT or REGISTRY check.
 * None of them ran type-check, lint, format:check or the suites — and yet a
 * clean run printed "Mechanical rows green" and exited 0, which any reader
 * takes as "the gate passed". An increment that does not COMPILE cannot have
 * passed a review gate, so the claim was broader than the evidence.
 *
 * This row runs the battery for real. `--fast` skips it, and the run then
 * reports INCOMPLETE (exit 2) rather than green — a skipped row is not a pass.
 * It is deliberately the WHOLE workspace, not just the sandbox: scoping a gate
 * to one package is the exact defect that let a `packages/banking` break sit red
 * at the root for a day while `screen-check` reported PASS every time.
 */
function checkBattery() {
  if (process.argv.includes('--fast'))
    return {
      skip: true,
      detail: '--fast given: battery NOT run. The exit code reports INCOMPLETE, not green.',
    };
  const steps = [
    ['type-check', 'pnpm type-check'],
    ['lint', 'pnpm lint'],
    ['format:check', 'pnpm format:check'],
    ['test', 'pnpm test'],
  ];
  const started = Date.now();
  const before = batteryContext();
  const results = steps.map(([name, cmd]) => runBatteryStep(name, cmd));
  const failures = results.filter((s) => s.kind !== 'passed');
  if (!failures.length)
    return {
      ok: true,
      detail: `${steps.map((s) => s[0]).join(' · ')} all green (whole workspace)`,
    };
  const what = failures.map(
    (s) =>
      `${s.name} (${s.kind}${s.error ? '' : s.signal ? `, ${s.signal}` : `, exit ${s.status}`})`
  );
  let where;
  try {
    where = writeBatteryEvidence(started, before, results);
  } catch (e) {
    /* Evidence is a by-product: failing to write it never changes the verdict. */
    return {
      ok: false,
      detail: `FAILED: ${what.join(', ')} — evidence NOT saved (${e.code ?? 'error'}: ${scrubPaths(e.message)}); run each directly for its output`,
    };
  }
  return { ok: false, detail: `FAILED: ${what.join(', ')} — evidence: ${where}` };
}

/**
 * ⚑ ADDED 2026-10-21 (`5.590`). The battery threw its output away, so a red
 * `test` row on 2026-10-20 could never be explained: the failing test was lost,
 * and a later green re-run explains nothing. A failing battery now leaves one
 * run directory under the private docs (`docs/audit/REVIEW_GATE_RUNS/`, git-ignored in
 * diboas-docs), or under the git-ignored `.review-gate-runs/` when there are no private docs,
 * and the row prints its path.
 *
 * Deliberately UNCHANGED: the four commands and their order, the shell, the
 * 1 MiB output limit (`execSync`'s default, so a flood of output still fails
 * the row exactly as before; it is now named `buffer-limit`), the verdict, the
 * exit code and the PASS text. A passing battery writes nothing. Each run gets
 * its own directory and every file is opened exclusive (`wx`), so a later run
 * can never overwrite an earlier failure. Only `.json` / `.log` files are
 * written, and every doc-walking row reads `.md` only.
 */
/* With no private docs here the log must not create `docs/audit/` (that folder is how other
   tools used to infer private docs, `5.696`): it goes to a git-ignored repo-root folder. */
const BATTERY_RUNS_DIR = NO_PRIVATE ? '.review-gate-runs' : 'docs/audit/REVIEW_GATE_RUNS';
const BATTERY_MAX_BUFFER = 1024 * 1024;
/* Masked before anything is saved, even in a private file: the staged sweep's
   credential-literal pattern, credentials inside a URL (`postgres://u:p@host`),
   and any assignment to a sensitive variable name (an env dump in test output). */
const CREDENTIAL = /((?:api[_-]?key|secret|password|token)\s*[:=]\s*['"])[^'"]{12,}/gi;
/* Every part of these two patterns is BOUNDED: unbounded runs backtrack
   quadratically on one long word (measured: 20 KB of letters took 1.1 s, and
   a 1 MiB log hung the gate). Stress-tested on 1 MiB adversarial inputs. */
const URL_CREDENTIAL = /([a-z][a-z0-9+.-]{0,31}:\/\/[^:/\s@]{1,256}:)[^@\s]{1,512}@/gi;
const SENSITIVE_ASSIGNMENT =
  /\b([A-Z0-9_]{0,64}(?:SECRET|TOKEN|PASSWORD|PASSWD|API_KEY|PRIVATE_KEY|ENCRYPTION_KEY|HMAC|DATABASE_URL)[A-Z0-9_]{0,64}[ \t]{0,8}[=:][ \t]{0,8})\S+/g;
const redact = (s) =>
  s
    .replace(CREDENTIAL, '$1[REDACTED]')
    .replace(URL_CREDENTIAL, '$1[REDACTED]@')
    .replace(SENSITIVE_ASSIGNMENT, '$1[REDACTED]');
const stripAnsi = (s) => s.replace(/\x1b\[[0-9;]*m/g, '');

function runBatteryStep(name, cmd) {
  const startedAt = new Date().toISOString();
  const t0 = Date.now();
  const r = spawnSync(cmd, {
    cwd: ROOT,
    shell: true,
    stdio: 'pipe',
    encoding: 'utf8',
    maxBuffer: BATTERY_MAX_BUFFER,
  });
  const err = r.error;
  const kind =
    err?.code === 'ENOBUFS'
      ? 'buffer-limit'
      : err?.code === 'ETIMEDOUT'
        ? 'timeout'
        : err
          ? 'launch-failure'
          : r.signal
            ? 'killed-by-signal'
            : r.status === 127
              ? 'command-not-found'
              : r.status !== 0
                ? 'command-failed'
                : 'passed';
  return {
    name,
    cmd,
    startedAt,
    ms: Date.now() - t0,
    kind,
    status: r.status,
    signal: r.signal,
    error: err ? { code: err.code ?? null, message: err.message } : null,
    stdout: r.stdout ?? '',
    stderr: r.stderr ?? '',
  };
}

/** Candidate identity + machine state. Never throws: a missing git is recorded. */
function batteryContext() {
  const at = new Date().toISOString();
  let candidate;
  try {
    const head = run('git', ['rev-parse', 'HEAD']).trim();
    /* With -z a rename or copy is TWO tokens, `XY new` then `old`: the second is
       consumed here, never read as an entry, and recorded as `old -> new` the
       way plain `git status --porcelain` prints it. */
    const tokens = run('git', ['status', '--porcelain', '-uall', '-z']).split('\0');
    const lines = [];
    for (let i = 0; i < tokens.length; i++) {
      const e = tokens[i];
      if (!e) continue;
      const xy = e.slice(0, 2);
      const p = e.slice(3);
      const shown = /[RC]/.test(xy[0]) ? `${tokens[++i]} -> ${p}` : p;
      let h = '(unreadable)';
      try {
        h = createHash('sha256')
          .update(readFileSync(at(p)))
          .digest('hex')
          .slice(0, 16);
      } catch {
        /* deleted, or a directory: recorded as unreadable */
      }
      lines.push(`${xy}|${shown}|${h}`);
    }
    /* The hand-kept FULL-BATCH manifests' line format, so this digest can be
       compared with `shasum -a 256` of a manifest file. */
    const manifest = lines.length ? `${lines.join('\n')}\n` : '';
    candidate = {
      head,
      entries: lines.length,
      manifestSha256: createHash('sha256').update(manifest).digest('hex'),
    };
  } catch (e) {
    candidate = { error: e.message };
  }
  return {
    at,
    candidate,
    machine: {
      cpus: cpus().length,
      availableParallelism: availableParallelism(),
      loadavg: loadavg(),
      totalMemMB: Math.round(totalmem() / 2 ** 20),
      freeMemMB: Math.round(freemem() / 2 ** 20),
      node: process.version,
      platform: process.platform,
    },
  };
}

/** The lines that name what failed, so `run.json` answers "which test" on its own. */
function failureLines(text) {
  return stripAnsi(text)
    .split('\n')
    .filter((l) => /^\s*(FAIL\s|×\s)|Test timed out in|\bFailed:\s|error TS\d+|ERR_PNPM/.test(l))
    .map((l) => l.trim())
    .slice(0, 200);
}

function writeBatteryEvidence(started, before, results) {
  const id = `${new Date(started).toISOString().replace(/[:.]/g, '-')}-pid${process.pid}`;
  const rel = `${BATTERY_RUNS_DIR}/${id}`;
  const dir = at(rel);
  mkdirSync(dir, { recursive: true });
  const write = (name, text) => writeFileSync(join(dir, name), text, { flag: 'wx' });
  for (const s of results) {
    const base = s.name.replace(/[^a-z0-9-]/gi, '_');
    write(`${base}.stdout.log`, redact(s.stdout));
    write(`${base}.stderr.log`, redact(s.stderr));
  }
  const record = {
    gate: `review-gate ${process.argv.slice(2).join(' ')}`.trim(),
    run: id,
    startedAt: new Date(started).toISOString(),
    startedAtLocal: new Date(started).toString(),
    totalMs: Date.now() - started,
    before,
    after: batteryContext(),
    steps: results.map(({ stdout, stderr, ...s }) => ({
      ...s,
      stdoutBytes: Buffer.byteLength(stdout),
      stderrBytes: Buffer.byteLength(stderr),
      failureLines: s.kind === 'passed' ? [] : failureLines(redact(`${stdout}\n${stderr}`)),
    })),
  };
  write('run.json', `${JSON.stringify(record, null, 2)}\n`);
  return `${rel}/run.json`;
}

/**
 * ⚙ GUARD-1 · EVERY FIXED DEFECT NAMES ITS GUARD (founder-directed 2026-10-21).
 *
 * The rule (`coding-standards.md` § "Every defect leaves a guard"): a confirmed
 * defect is closed only with an automated guard that fails while the defect is
 * present, plus a search for the same mistake elsewhere. Before this row it was
 * done most of the time and owed nowhere: on 2026-10-21 five closures left two
 * guards missing and one recorded only in a session memory.
 *
 * What a machine CAN check, and all this row claims: every register entry from
 * `5.601` on whose status is CLOSED carries a `**Guard:**` field and a
 * `**Similar cases:**` field; a guard that names files names files that exist;
 * a guard of `none` / `n/a` carries its reason. Whether the guard really catches
 * the defect is the sabotage proof's job (increment gate D3), not this row's.
 * Entries before `5.601` are history and are not retro-required.
 */
const GUARD_FROM = 601;
function checkGuards() {
  const found = resolveRegister();
  if (!found.path)
    return {
      ok: false,
      detail: `${REGISTER} not found and REVIEW_REGISTER_PATH unset — the guard check CANNOT RUN.`,
    };
  const s = readFileSync(found.path, 'utf8');
  const status = new Map(
    [...s.matchAll(/^>\s+(?:(\d+\.\d+)\s+([A-Z][A-Z-]*)\s*)+$/gm)].flatMap((m) =>
      [...m[0].matchAll(/(\d+\.\d+)\s+([A-Z][A-Z-]*)/g)].map((x) => [x[1], x[2]])
    )
  );
  /* An entry runs from its id line to the next blank line; the first definition wins. */
  const entries = new Map();
  const rows = s.split('\n');
  for (let i = 0; i < rows.length; i += 1) {
    const m = rows[i].match(/^(?:\||>) \*\*(\d+\.\d+)(?:\*\*|\s|—)/);
    if (!m || entries.has(m[1])) continue;
    let j = i + 1;
    while (j < rows.length && rows[j].trim() !== '' && !/^(?:\||>) \*\*\d+\.\d+/.test(rows[j]))
      j += 1;
    entries.set(m[1], rows.slice(i, j).join('\n'));
  }
  const scope = [...status]
    .filter(([id, st]) => st === 'CLOSED' && Number(id.split('.')[1]) >= GUARD_FROM)
    .map(([id]) => id);
  const problems = [];
  const declaredNone = [];
  let named = 0;
  for (const id of scope) {
    const text = entries.get(id) ?? '';
    const guard = text.match(/\*\*Guard:\*\*\s*([\s\S]*?)(?=\*\*Similar cases:\*\*|$)/);
    const similar = text.match(
      /\*\*Similar cases:\*\*\s*([\s\S]*?)(?=\s\|\s\*\*|\*\*Guard:\*\*|$)/
    );
    if (!guard) problems.push(`NO GUARD: ${id}`);
    else if (/^(none|n\/a)\b/i.test(guard[1].trim())) {
      if (guard[1].trim().length < 40) problems.push(`GUARD "none" WITHOUT A REASON: ${id}`);
      else declaredNone.push(id);
    } else {
      const paths = [...guard[1].matchAll(/`([^`\s]*\/[^`\s]*?\.[A-Za-z]{2,5})(?::\d+)?`/g)].map(
        (p) => p[1]
      );
      if (!paths.length) problems.push(`GUARD NAMES NO FILE: ${id}`);
      const gone = paths.filter((p) => !existsSync(at(p)));
      if (gone.length) problems.push(`GUARD FILE MISSING: ${id} → ${gone.join(', ')}`);
      if (paths.length && !gone.length) named += 1;
    }
    if (!similar) problems.push(`NO SIMILAR-CASES SEARCH: ${id}`);
    else if (similar[1].trim().length < 20) problems.push(`SIMILAR-CASES TOO THIN: ${id}`);
  }
  const lines = [
    `${scope.length} closed entr${scope.length === 1 ? 'y' : 'ies'} from 5.${GUARD_FROM} on · ${named} name an existing guard file · ${declaredNone.length} declare none${declaredNone.length ? ` (${declaredNone.join(', ')}: reasons stated, reviewer judges)` : ''}`,
    ...problems.slice(0, 10),
  ];
  return { ok: problems.length === 0, detail: lines.join(' · ') };
}

/**
 * ⚙ CI-PARITY · A LOCAL REHEARSAL NAMES EVERY CI JOB IT DID AND DID NOT RUN (`5.604`).
 *
 * PR #746 failed `sandbox-harness` after a local "CI-equivalent" that had run the
 * steps of ONE job (`quality`, and not even all of them) was reported as "passed
 * every CI step". This row derives the jobs from `.github/workflows/*.yml` — every
 * job a pull request to `main` triggers — and prints each job's own `run:` steps as
 * the rehearsal checklist, so the list can never be shorter than CI's.
 *
 * It FAILS when a CI job has no declaration below (a new job cannot slip outside
 * the rehearsal) or a declaration names a job that no longer exists. It cannot see
 * whether a rehearsal actually ran a step: the system gate's CI-parity row requires
 * each job's result pasted, or the job named NOT CHECKED.
 */
const CI_REHEARSAL = {
  'accessibility.yml#pa11y': 'local',
  'ci.yml#quality': 'local',
  'e2e.yml#e2e': 'local',
  'e2e.yml#sandbox-harness': 'local',
  'lighthouse.yml#lighthouse': 'local',
  'security.yml#secrets':
    'remote-only: gitleaks-action scans the pushed history; scripts/secrets-scan-staged.sh covers staged files only',
  'security.yml#audit': 'local',
};
function workflowJobs(file) {
  const rows = readFileSync(at(join('.github/workflows', file)), 'utf8').split('\n');
  const onAt = rows.findIndex((r) => /^on:/.test(r));
  const inline = onAt >= 0 ? rows[onAt].slice(3) : '';
  let pr = /pull_request\b/.test(inline);
  for (
    let i = onAt + 1;
    onAt >= 0 && !inline.trim() && i < rows.length && !/^\S/.test(rows[i]);
    i += 1
  )
    if (/^\s+pull_request\b/.test(rows[i])) pr = true;
  const jobsAt = rows.findIndex((r) => /^jobs:/.test(r));
  const jobs = [];
  if (!pr || jobsAt < 0) return jobs;
  for (let i = jobsAt + 1; i < rows.length; i += 1) {
    const id = rows[i].match(/^ {2}([A-Za-z0-9_-]+):\s*$/);
    if (id) jobs.push({ id: id[1], steps: [] });
    const run = rows[i].match(/^\s+(?:- )?run:\s*(.*)$/);
    const uses = rows[i].match(/^\s+- uses:\s*(\S+)/);
    if (jobs.length && uses && !/checkout|setup-node|action-setup|upload-artifact/.test(uses[1]))
      jobs.at(-1).steps.push(`uses ${uses[1]}`);
    if (jobs.length && run) {
      let cmd = run[1].trim();
      if (cmd === '|' || cmd === '>') {
        const indent = rows[i].match(/^\s*/)[0].length;
        const body = [];
        for (
          let k = i + 1;
          k < rows.length && (rows[k].trim() === '' || rows[k].match(/^\s*/)[0].length > indent);
          k += 1
        )
          if (rows[k].trim() && !rows[k].trim().startsWith('#')) body.push(rows[k].trim());
        cmd = `${body[0] ?? ''} … (a ${body.length}-line script)`;
      }
      jobs.at(-1).steps.push(cmd);
    }
  }
  return jobs;
}
function checkCiParity() {
  const dir = at('.github/workflows');
  if (!existsSync(dir))
    return { ok: false, detail: '.github/workflows not found — the instrument, not the repo' };
  const files = readdirSync(dir)
    .filter((f) => /\.ya?ml$/.test(f))
    .sort();
  const seen = new Map();
  for (const f of files) for (const j of workflowJobs(f)) seen.set(`${f}#${j.id}`, j.steps);
  if (seen.size === 0)
    return { ok: false, detail: 'no pull-request job found — the parser, not CI' };
  const undeclared = [...seen.keys()].filter((k) => !(k in CI_REHEARSAL));
  const stale = Object.keys(CI_REHEARSAL).filter((k) => !seen.has(k));
  const bad = Object.entries(CI_REHEARSAL)
    .filter(([, v]) => v !== 'local' && !/^remote-only: .{20,}/.test(v))
    .map(([k]) => k);
  const lines = [
    `${seen.size} job(s) run on every pull request to main — rehearse each, or name it NOT CHECKED:`,
  ];
  for (const [k, steps] of seen)
    lines.push(`  ${k} [${CI_REHEARSAL[k] ?? 'UNDECLARED'}] ${steps.join(' ; ')}`);
  if (undeclared.length) lines.push(`CI JOB WITH NO REHEARSAL DECLARED: ${undeclared.join(', ')}`);
  if (stale.length) lines.push(`DECLARED JOB NOT IN CI: ${stale.join(', ')}`);
  if (bad.length)
    lines.push(`DECLARATION NEITHER 'local' NOR 'remote-only: <reason>': ${bad.join(', ')}`);
  return { ok: !undeclared.length && !stale.length && !bad.length, detail: lines.join('\n      ') };
}

/* ---------------------------------------------------------------- indexes */
/**
 * ⚙ INDEX-PATHS · EVERY PATH AN INDEX PAGE NAMES RESOLVES (`5.706`, brain-program audit).
 *
 * The private docs are entered through three index pages: `BRAIN.md` (the first page of
 * every session), the playbook registry and the decision-record index. After the docs move
 * six playbook rows pointed at folders that no longer existed, and a session told "generate
 * social images" followed them to nothing. Citations (`file:line`) were checked; these plain
 * path references were not.
 *
 * A backticked token is a path when it has a `/`, a file extension, or is a bare `DR-…` record
 * name. It resolves against, in order: its own page's folder, the private docs root, the
 * platform (`docs/tech/…`, `scripts/…`). A line that says the target is gone (`NOT REACHABLE`,
 * deleted, removed) is honest and exempt, the `AUTH-1` pattern. A proposed `DR-…` name stands
 * beside the file it renames, so it passes when the same line names a file that resolves.
 * Placeholders (`docs/<area>/X`), routes (`/market`), commands and home paths are not paths.
 */
const INDEX_PAGES = ['docs/BRAIN.md', 'docs/playbooks/README.md', 'docs/decisions/README.md'];
const INDEX_GONE = /NOT REACHABLE|deleted|removed|does not exist|no longer exists|not carried/i;
const isIndexPath = (t) =>
  !/[<>*~ ()[\]]/.test(t) &&
  !/^[/\d]/.test(t) &&
  !/^[a-z]+:/.test(t) &&
  (/\//.test(t) || /\.(md|mjs|ts|tsx|yml|json|sh|py)(:\d+(-\d+)?)?$/.test(t) || /^DR-/.test(t));

function checkIndexes() {
  if (NO_PRIVATE) return NO_PRIVATE_SKIP;
  const misses = [];
  let checked = 0;
  for (const page of INDEX_PAGES) {
    if (!existsSync(at(page))) {
      misses.push(`${page} itself is missing`);
      continue;
    }
    const dir = dirname(page);
    const resolves = (t) => {
      const p = t.replace(/:\d+(?:-\d+)?$/, '').replace(/\/$/, '');
      if (/^DR-[\w-]+$/.test(p)) return existsSync(at(`docs/decisions/${p}.md`));
      if (p.startsWith('docs/')) return existsSync(at(p));
      return [`${dir}/${p}`, `docs/${p}`, p].some((q) => existsSync(at(q)));
    };
    rd(page)
      .split('\n')
      .forEach((line, i) => {
        if (INDEX_GONE.test(line)) return;
        const toks = [...line.matchAll(/`([^`\n]+)`/g)].map((m) => m[1]).filter(isIndexPath);
        const besideAFile = toks.some((t) => !/^DR-[\w-]+$/.test(t) && resolves(t));
        for (const t of toks) {
          checked += 1;
          if (resolves(t) || (/^DR-[\w-]+$/.test(t) && besideAFile)) continue;
          misses.push(`${page}:${i + 1} → ${t}`);
        }
      });
  }
  if (!checked && !misses.length)
    return { ok: false, detail: 'no path found on any index page — the scan is broken, not clean' };
  return {
    ok: !misses.length,
    detail: misses.length
      ? `${misses.length} path(s) named by an index page resolve nowhere (fix, or mark ⚠ NOT REACHABLE): ${misses.slice(0, 8).join(' · ')}`
      : `${checked} path(s) on ${INDEX_PAGES.length} index page(s) all resolve`,
  };
}

/** Rows that read private docs when present but still check the public docs without them. */
const PUBLIC_HALF_ROWS = new Set(['counts', 'citations']);
const CHECKS = {
  battery: ['the mechanical battery actually ran', checkBattery],
  register: ['register id integrity', checkRegister],
  guards: ['GUARD-1 · every fixed defect names its guard', checkGuards],
  'ci-parity': ['CI-PARITY · every pull-request CI job is listed for the rehearsal', checkCiParity],
  counts: ['republished test counts agree', checkCounts],
  authorities: ['authority coverage of the gates', checkAuthorities],
  prose: ['PROSE-1 · a record cites every requirement its plan asserts', checkProse],
  doc1: ['DOC-1 · a reference presented as authority resolves', checkDoc1],
  'doc1-local': [
    'DOC-1 layer 2 · private references resolve where the private area exists',
    checkDoc1Local,
  ],
  staged: ['staged files + public-repo sweep', checkStaged],
  exports: ['exported functions have consumers', checkExports],
  'canon-index': ['AUTH-1 · authority corpus is searchable', checkCanonIndex],
  citations: ['AUTH-1 · file:line citations still resolve', checkCitations],
  escalations: ['AUTH-1 · no escalation without a canon search', checkEscalations],
  indexes: ['INDEX-PATHS · every path an index page names resolves', checkIndexes],
};
const PLAN = {
  /* `battery` runs FIRST in both: if it does not compile, nothing downstream is
     worth reading. AUTH-1's three rows run BEFORE the register rows, because an
     unsearchable corpus or a dead citation makes every register claim downstream
     of it unverifiable. */
  increment: [
    'battery',
    'canon-index',
    'citations',
    'escalations',
    'register',
    'guards',
    'counts',
    'authorities',
    'prose',
    'staged',
    'exports',
  ],
  system: [
    'battery',
    'canon-index',
    'citations',
    'escalations',
    'authorities',
    'prose',
    'counts',
    'register',
    'guards',
    'ci-parity',
    'exports',
    'staged',
  ],
  /* AUTH-1 standalone, for the §21 invocation "before external escalation". */
  auth: ['canon-index', 'citations', 'escalations'],
};

console.log(`\n${C.b}Review Gate — ${mode}${C.x}`);

if (mode === 'port') {
  const r = checkPort(args[0], args.includes('--kill'));
  console.log(`  ${r.ok ? C.g + 'OK' : C.r + 'REFUSED'}${C.x}  ${r.detail}\n`);
  process.exit(r.ok ? 0 : 1);
}

const plan = PLAN[mode] ?? (CHECKS[mode] ? [mode] : null);
if (!plan) {
  console.log(
    `  unknown mode '${mode}'. Use: increment | system | ${Object.keys(CHECKS).join(' | ')} | port\n`
  );
  process.exit(2);
}

console.log(
  `${C.d}Mechanical (⚙ rows). Each exists because its defect already shipped here.${C.x}`
);
/* Which private docs tree the rows below read: evidence, never assumed (5.653). */
console.log(`${C.d}Private docs read from: ${describeDocsRoot()}${C.x}`);
const ignoredAreas = ignoredInRepoAreas();
if (ignoredAreas.length)
  console.log(
    `${C.d}Not read: private folder(s) inside this checkout's docs/ (${ignoredAreas.join(', ')}); only the private docs root named above is read.${C.x}`
  );
const behind = docsCheckoutBehind();
if (behind)
  console.log(
    `${C.y}⚠ the private docs checkout is ${behind} commit(s) behind its last-fetched origin/main — pull it before trusting the register (5.698)${C.x}`
  );
let failed = 0;
/**
 * ⚑ ADDED 2026-09-14 (AUD-G02). A skipped row was summarised as "Mechanical
 * rows green" with exit 0 — an absent PENDING_ALL, or an empty stage, read as
 * a pass. A row that could not run is INCOMPLETE, and the exit code says so.
 */
let skipped = 0;
/** Row key -> PASS | FAIL | SKIP. Front 5's fallback reads this, nothing else does. */
const outcomes = {};
for (const key of plan) {
  const [label, fn] = CHECKS[key];
  process.stdout.write(`  ${label} … `);
  let r;
  try {
    r = fn();
  } catch (e) {
    r = { ok: false, detail: `check threw: ${scrubPaths(e.message)}` };
  }
  /* Rows that still run without private docs walk only the public half; say so (5.696). */
  if (NO_PRIVATE && !r.skip && PUBLIC_HALF_ROWS.has(key))
    r.detail = `${r.detail}\n      private docs absent here: only the public docs were walked`;
  if (r.skip) {
    console.log(`${C.y}SKIP${C.x}\n      ${C.d}${r.detail}${C.x}`);
    outcomes[key] = 'SKIP';
    skipped += 1;
  } else {
    console.log(r.ok ? `${C.g}PASS${C.x}` : `${C.r}FAIL${C.x}`);
    console.log(`      ${C.d}${r.detail}${C.x}`);
    outcomes[key] = r.ok ? 'PASS' : 'FAIL';
    if (!r.ok) failed += 1;
  }
}

if (mode === 'system') {
  /**
   * EVERY authoritative front, every run (`5.431`).
   *
   * The mechanical/manual distinction is preserved rather than blurred: a front
   * whose row PASSED is shown as MECHANICAL EVIDENCE and still needs the
   * reviewer's disposition; every other front is shown as MANUAL ADJUDICATION
   * REQUIRED. No front is ever omitted, so "the gate printed six" can no longer
   * be mistaken for "the gate has six".
   */
  console.log(
    `\n${C.y}${C.b}SYSTEM REVIEW · MANUAL FRONTS — all ${SYSTEM_FRONTS.length} require an explicit disposition:${C.x}`
  );
  for (const f of SYSTEM_FRONTS) {
    const row = f.mechanisedBy ? outcomes[f.mechanisedBy] : undefined;
    const discharged = row === 'PASS';
    const tag = discharged
      ? `${C.g}MECHANICAL EVIDENCE${C.x} ${C.d}(${f.mechanisedBy} PASS — record it, then disposition)${C.x}`
      : `${C.y}MANUAL ADJUDICATION REQUIRED${C.x}${
          f.mechanisedBy
            ? ` ${C.d}(${f.mechanisedBy} ${row ?? 'did not run'} — the row cannot discharge it)${C.x}`
            : ''
        }`;
    console.log(`  ${C.b}FRONT ${String(f.n).padStart(2)}${C.x} ${tag}`);
    console.log(`          ${C.d}${f.what}${C.x}`);
  }
  console.log(
    `\n${C.d}Close each front with exactly one of: ${FRONT_DISPOSITIONS.join(' | ')}${C.x}`
  );
  console.log(
    `${C.d}Mechanical rows alone are NOT a system review. The block is RECONCILED only when every${C.x}`
  );
  console.log(
    `${C.d}runnable row AND all ${SYSTEM_FRONTS.length} fronts carry a disposition. Gate: docs/tech/system-review-gate.md${C.x}`
  );
} else {
  const list = MANUAL[mode] ?? [];
  if (list.length) {
    console.log(`\n${C.y}${C.b}MANUAL — not mechanisable; complete and cite in the record:${C.x}`);
    for (const l of list) console.log(`  ${C.d}·${C.x} ${l}`);
    console.log(
      `\n${C.d}Gate: docs/tech/${mode}-review-gate.md — a PASS names its instrument; N/A needs proof.${C.x}`
    );
  }
}

console.log(
  failed
    ? `\n${C.r}${C.b}${failed} mechanical check(s) FAILED.${C.x}\n`
    : skipped
      ? `\n${C.y}${C.b}INCOMPLETE — ${skipped} row(s) could not run.${C.x} ${C.d}A skipped row is not a pass. The manual half is still yours.${C.x}\n`
      : `\n${C.g}${C.b}Mechanical rows green.${C.x} ${C.d}The manual half is still yours.${C.x}\n`
);
process.exit(failed ? 1 : skipped ? 2 : 0);
