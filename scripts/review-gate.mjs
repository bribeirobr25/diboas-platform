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

/* ---------------------------------------------------------------- register */
/** The marker is a CLAIM. The maximum existing id is the EVIDENCE. */
function checkRegister() {
  if (!existsSync(join(ROOT, REGISTER)))
    return { ok: true, skip: true, detail: `${REGISTER} absent (local-only doc) — skipped` };
  const s = rd(REGISTER);
  const ids = [...s.matchAll(/^(?:\||>) \*\*(\d+\.\d+)\*\*/gm)].map((m) => m[1]);
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
function checkCounts() {
  const docs = [];
  const walk = (dir) => {
    if (!existsSync(join(ROOT, dir))) return;
    for (const e of readdirSync(join(ROOT, dir), { withFileTypes: true })) {
      const p = `${dir}/${e.name}`;
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.md')) docs.push(p);
    }
  };
  walk('docs');
  if (existsSync(join(ROOT, 'CLAUDE.md'))) docs.push('CLAUDE.md');
  const HISTORICAL =
    /\bwas\b|withdrawn|prior|baseline|historical|superseded|corrected|never re-measured|earlier/i;
  const claims = new Map();
  let excluded = 0;
  /**
   * ⚑ FIXED 2026-09-14 (AUD-G02). `HISTORICAL` was tested against the WHOLE
   * line, so `Compared with baseline, current suite: 998 / 99 files` was
   * excluded wholesale and a conflicting CURRENT claim vanished. A line that
   * carries a historical marker AND the word "current" is now a FAILURE:
   * ambiguity in a published count is the defect, not something to filter.
   */
  const ambiguous = [];
  for (const d of docs) {
    for (const line of rd(d).split('\n')) {
      for (const m of line.matchAll(/(\d{3,4})\s*\/\s*(\d{2,3})\s*files/g)) {
        /**
         * ⚑ NARROWED 2026-09-14, same day it was added. The first version fired
         * on any line carrying a historical marker AND "current" — which caught
         * the independent audit's own report QUOTING `"Compared with baseline,
         * current suite: 998 / 99 files"` as a probe description, and a register
         * row DESCRIBING a stale-count finding. A tool cannot tell a quotation
         * from an assertion unless it looks at the quoting, so it looks: a count
         * wrapped in quotes or backticks is someone else's sentence being
         * discussed, not this repository claiming it.
         */
        const quoted = new RegExp(
          `["'\u201c\u201d\`][^"'\u201c\u201d\`]*${m[1]}\\s*/\\s*${m[2]}`
        ).test(line);
        if (!quoted && HISTORICAL.test(line) && /\bcurrent\b/i.test(line)) {
          ambiguous.push(`${d}: ${line.trim().slice(0, 90)}`);
          continue;
        }
        if (HISTORICAL.test(line)) {
          excluded += 1;
          continue;
        }
        const key = `${m[1]}/${m[2]}`;
        if (!claims.has(key)) claims.set(key, new Set());
        claims.get(key).add(d);
      }
    }
  }
  const detail = [
    `${claims.size} distinct CURRENT claim(s); ${excluded} historical mention(s) excluded`,
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
  const pathsAndLines = [...added, ...files];
  for (const [label, re] of NEVER) if (pathsAndLines.some((l) => re.test(l))) hard.push(label);
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

function checkExports(target = 'apps/sandbox/src/view', scope = 'apps/sandbox/src') {
  if (!existsSync(join(ROOT, target)))
    return { ok: true, skip: true, detail: `${target} absent — skipped` };
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
const CHECKS = {
  register: ['register id integrity', checkRegister],
  counts: ['republished test counts agree', checkCounts],
  authorities: ['authority coverage of the gates', checkAuthorities],
  staged: ['staged files + public-repo sweep', checkStaged],
  exports: ['exported functions have consumers', checkExports],
};
const PLAN = {
  increment: ['register', 'counts', 'authorities', 'staged', 'exports'],
  system: ['authorities', 'counts', 'register', 'exports', 'staged'],
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
