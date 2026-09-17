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
 *   pnpm review:port 3002     identify the listener; add --kill to stop it
 *
 * DELIBERATELY NOT MECHANISED, and the script says so every run rather than
 * leaving you to assume coverage: duplicate-derivation search (X1) is too
 * heuristic to avoid noise, and locale parity (C8) already has real tests —
 * a worse reimplementation here would be a liability, not a gate.
 */
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const C = { g: '\x1b[32m', r: '\x1b[31m', y: '\x1b[33m', b: '\x1b[1m', d: '\x1b[2m', x: '\x1b[0m' };
const ROOT = process.cwd();
const sh = (cmd) => execSync(cmd, { cwd: ROOT, stdio: 'pipe' }).toString();
const rd = (p) => readFileSync(join(ROOT, p), 'utf8');

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
      entries = readdirSync(join(ROOT, d === '' ? '.' : d), { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (SKIP.has(e.name)) continue;
      const q = d === '' ? e.name : `${d}/${e.name}`;
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
    if (!existsSync(join(ROOT, d))) return;
    if (skip.some((x) => d === x || d.startsWith(`${x}/`))) return;
    for (const e of readdirSync(join(ROOT, d), { withFileTypes: true })) {
      const q = `${d}/${e.name}`;
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
  const repoRelative = join(ROOT, REGISTER);
  if (existsSync(repoRelative)) return { path: repoRelative, via: 'repo-relative' };
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
      ? `REVIEW_REGISTER_PATH points at ${found.bad}, which does not exist`
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
  return { ok, detail: lines.join(' · ') };
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
 * What this filter DROPS, stated as `guard-filters-are-part-of-the-threat-model`
 * requires: counts inside quotes or backticks; counts in a sentence carrying a
 * historical marker. A sentence carrying a historical marker AND the word
 * "current" is neither dropped nor counted — it FAILS as ambiguous, because
 * ambiguity in a published figure is the defect.
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
  let excluded = 0;
  for (const d of docs) {
    for (const line of rd(d).split('\n')) {
      for (const m of line.matchAll(COUNT)) {
        if (insideQuotes(line, m.index)) {
          excluded += 1;
          continue;
        }
        const scope = sentenceAt(line, m.index);
        if (HISTORICAL.test(scope) && /\bcurrent\b/i.test(scope)) {
          ambiguous.push(`${d}: ${scope.trim().slice(0, 90)}`);
          continue;
        }
        if (HISTORICAL.test(scope)) {
          excluded += 1;
          continue;
        }
        const key = `${m[1].replace(/,/g, '')}/${m[2]}`;
        if (!claims.has(key)) claims.set(key, new Set());
        claims.get(key).add(d);
      }
    }
  }
  const detail = [
    `${docs.length} doc(s) walked; ${claims.size} distinct CURRENT claim(s); ` +
      `${excluded} quoted-or-historical mention(s) excluded`,
  ];
  for (const [k, where] of claims)
    detail.push(`  ${k} — ${[...where].map((w) => w.split('/').pop()).join(', ')}`);
  for (const a of ambiguous) detail.push(`  AMBIGUOUS (historical marker + "current"): ${a}`);
  return { ok: claims.size <= 1 && ambiguous.length === 0, detail: detail.join('\n      ') };
}

/* ------------------------------------------------------------- authorities */
/** A new authority in docs/tech must be routed or dispositioned, or it rots. */
function checkAuthorities() {
  const text = GATES.filter((g) => existsSync(join(ROOT, g)))
    .map(rd)
    .join('');
  if (!text) return { ok: false, detail: 'gate documents not found' };
  const files = [];
  for (const dir of ['docs/tech', 'docs/tech/ux-governance']) {
    if (!existsSync(join(ROOT, dir))) continue;
    for (const f of readdirSync(join(ROOT, dir)))
      if (f.endsWith('.md') && !f.includes('review-gate')) files.push(f);
  }
  const missing = files.filter((f) => !text.includes(f));
  return {
    ok: missing.length === 0,
    detail:
      `${files.length - missing.length}/${files.length} routed or dispositioned` +
      (missing.length ? ` · NOT ROUTED: ${missing.join(', ')}` : ''),
  };
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
function checkCanonIndex() {
  if (!existsSync(join(ROOT, CANON)))
    return {
      ok: true,
      skip: true,
      detail: `${CANON} absent (fresh clone / local-only) — authority search cannot run here`,
    };
  const indexed = mdUnder(CANON_INDEX);
  const archives = existsSync(join(ROOT, CANON))
    ? readdirSync(join(ROOT, CANON)).filter((f) => f.endsWith('.zip'))
    : [];
  /* Residual archives are REPORTED, not chased. The packages contain their own
     prior releases (`95_ORIGINAL_ARCHIVES` recursing into archived Growth
     releases), so extracting to zero is unbounded and would index historical
     material nothing cites. Indexing the current-authority tier is the goal;
     this number is visibility, not a failure condition. */
  const nested = indexed.length ? sh(`find ${CANON_INDEX} -name '*.zip' | wc -l`).trim() : '0';
  const unreachable = CITED_AUTHORITIES.filter(
    (f) => !mdUnder('docs', [CANON]).some((p) => p.endsWith(`/${f}`))
  ).filter((f) => !indexed.some((p) => p.endsWith(`/${f}`)));
  const detail = [
    `${indexed.length} authority markdown file(s) searchable from ${archives.length} package(s)` +
      `; ${nested} nested archive(s) NOT indexed`,
    unreachable.length
      ? `CITED · NOT REACHABLE (never read as "no authority"): ${unreachable.join(', ')}`
      : 'every cited authority resolves',
  ];
  /* Indexed == 0 with archives present is the failure this row exists for: the
     authority is on disk and unsearchable, which is how `5.410` happened. */
  return { ok: indexed.length > 0 || archives.length === 0, detail: detail.join('\n      ') };
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
    existsSync(join(ROOT, p))
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
    if (existsSync(join(ROOT, file))) return 'resolves';
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
  const corpus = mdUnder('docs/audit', []).filter((p) => /PRE_I2|REVIEW|GATE|RETURN/i.test(p));
  const offenders = [];
  for (const doc of corpus) {
    const text = rd(doc);
    if (SEARCHED.test(text)) continue;
    const claims = text.split('\n').filter((l) => STATUS_LINE.test(l) && !NARRATIVE.test(l));
    if (claims.length)
      offenders.push(`${doc.replace('docs/audit/', '')} (${claims.length} claim line[s])`);
  }
  return {
    ok: offenders.length === 0,
    detail:
      `${corpus.length} engineering record(s) scanned` +
      (offenders.length
        ? ` · ${offenders.length} escalate WITHOUT a completed Canon-First block: ${offenders.join(', ')}`
        : ' · every escalation carries a completed Canon-First block'),
  };
}

/* ------------------------------------------------------------------ staged */
/** An empty stage makes a commit report success over nothing. */
function checkStaged() {
  const names = sh('git diff --cached --name-only').trim();
  if (!names) return { ok: true, skip: true, detail: 'nothing staged — run again after `git add`' };
  const files = names.split('\n');

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
    sh(`git diff --cached -U0 -- "${f}"`)
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
const stripComments = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

/**
 * Files this change actually touches — worktree, index, and branch commits
 * (register 5.383). Best-effort: if git cannot answer, return null and let the
 * caller scan rather than claim an N/A it cannot prove.
 */
function changedFiles() {
  const out = new Set();
  let answered = false;
  for (const cmd of ['git diff --name-only HEAD', 'git diff --name-only origin/main...HEAD']) {
    try {
      for (const f of sh(cmd).split('\n').filter(Boolean)) out.add(f);
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
  if (!existsSync(join(ROOT, target)))
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
  const mods = readdirSync(join(ROOT, target)).filter(
    (f) => f.endsWith('.ts') || f.endsWith('.tsx')
  );
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
        hits = sh(`grep -rl "\\b${name}\\b" ${scope} --include='*.ts' --include='*.tsx' || true`);
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
          new RegExp(`\\b${name}\\b`).test(stripComments(readFileSync(join(ROOT, f), 'utf8')))
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
  let pids = '';
  try {
    pids = sh(`lsof -ti:${port} -sTCP:LISTEN || true`).trim();
  } catch {
    pids = '';
  }
  if (!pids) return { ok: true, detail: `port ${port}: no listener` };
  const list = pids.split('\n').filter(Boolean);
  if (list.length !== 1)
    return {
      ok: false,
      detail: `port ${port}: ${list.length} listeners (${list.join(', ')}) — refusing to act`,
    };
  const pid = list[0];
  const cmd = sh(`ps -o comm= -p ${pid}`).trim();
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
  sh(`kill ${pid}`);
  const still = sh(`lsof -ti:${port} -sTCP:LISTEN || true`).trim();
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
    'Part D — sabotage-prove every load-bearing test; re-measure every number you republish.',
    'Part E — Docker MCP: A/B against the pre-change reading · light AND dark × 375 AND 1440 × EN AND the longest locale · a11y as measured ratios · console 0 errors · state provenance.',
    'Part F/G — fix-vs-register with owners; what you did NOT check; no waiver without a founder-recorded decision.',
  ],
  system: [
    'Front 1 — all 12 principles from the document, one verdict each; ADR triggers-to-reconsider.',
    'Front 2 — five separate verdicts (CLO · Brand · UX · Voice · Storytelling), never averaged; veto rows 10–17 and Q3 block.',
    'Front 6 — every formula line by line; identities proven by sabotage FROM AN INDEPENDENT TERM.',
    'Front 7 — per source: live path · TTL · stamp · fallback; then today / swap-ready / real-time.',
    'Front 8 — the data lifecycle at its SEAMS, not per stage.',
    'Front 9 — X1 duplicate derivations and X6 guard filters are MANUAL: no script here claims them.',
  ],
};

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
  const failures = [];
  for (const [name, cmd] of steps) {
    try {
      sh(cmd);
    } catch {
      failures.push(name);
    }
  }
  return failures.length
    ? { ok: false, detail: `FAILED: ${failures.join(', ')} — run each directly for its output` }
    : {
        ok: true,
        detail: `${steps.map((s) => s[0]).join(' \u00b7 ')} all green (whole workspace)`,
      };
}

const CHECKS = {
  battery: ['the mechanical battery actually ran', checkBattery],
  register: ['register id integrity', checkRegister],
  counts: ['republished test counts agree', checkCounts],
  authorities: ['authority coverage of the gates', checkAuthorities],
  staged: ['staged files + public-repo sweep', checkStaged],
  exports: ['exported functions have consumers', checkExports],
  'canon-index': ['AUTH-1 · authority corpus is searchable', checkCanonIndex],
  citations: ['AUTH-1 · file:line citations still resolve', checkCitations],
  escalations: ['AUTH-1 · no escalation without a canon search', checkEscalations],
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
    'counts',
    'authorities',
    'staged',
    'exports',
  ],
  system: [
    'battery',
    'canon-index',
    'citations',
    'escalations',
    'authorities',
    'counts',
    'register',
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
let failed = 0;
/**
 * ⚑ ADDED 2026-09-14 (AUD-G02). A skipped row was summarised as "Mechanical
 * rows green" with exit 0 — an absent PENDING_ALL, or an empty stage, read as
 * a pass. A row that could not run is INCOMPLETE, and the exit code says so.
 */
let skipped = 0;
for (const key of plan) {
  const [label, fn] = CHECKS[key];
  process.stdout.write(`  ${label} … `);
  let r;
  try {
    r = fn();
  } catch (e) {
    r = { ok: false, detail: `check threw: ${e.message}` };
  }
  if (r.skip) {
    console.log(`${C.y}SKIP${C.x}\n      ${C.d}${r.detail}${C.x}`);
    skipped += 1;
  } else {
    console.log(r.ok ? `${C.g}PASS${C.x}` : `${C.r}FAIL${C.x}`);
    console.log(`      ${C.d}${r.detail}${C.x}`);
    if (!r.ok) failed += 1;
  }
}

const list = MANUAL[mode] ?? [];
if (list.length) {
  console.log(`\n${C.y}${C.b}MANUAL — not mechanisable; complete and cite in the record:${C.x}`);
  for (const l of list) console.log(`  ${C.d}·${C.x} ${l}`);
  console.log(
    `\n${C.d}Gate: docs/tech/${mode}-review-gate.md — a PASS names its instrument; N/A needs proof.${C.x}`
  );
}

console.log(
  failed
    ? `\n${C.r}${C.b}${failed} mechanical check(s) FAILED.${C.x}\n`
    : skipped
      ? `\n${C.y}${C.b}INCOMPLETE — ${skipped} row(s) could not run.${C.x} ${C.d}A skipped row is not a pass. The manual half is still yours.${C.x}\n`
      : `\n${C.g}${C.b}Mechanical rows green.${C.x} ${C.d}The manual half is still yours.${C.x}\n`
);
process.exit(failed ? 1 : skipped ? 2 : 0);
