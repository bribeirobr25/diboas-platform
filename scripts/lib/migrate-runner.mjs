/**
 * migrate-runner.mjs — the ONE database migration runner for both apps (register `5.709`).
 *
 * The website (`apps/web`) and the Practice app (`apps/sandbox`) each have their own Neon
 * database and their own migrations, kept privately in `diboas-docs`
 * (`ops/db-migrations/<app>/`). Each app has a thin CLI that passes in its own Neon driver;
 * everything else lives here, once (Principle 4). It is plain JavaScript run by `node`:
 * the website's earlier TypeScript runner was started with `tsx`, which this repository
 * never installed, so `db:migrate` / `db:status` could not run at all (found 2026-10-30).
 *
 * ⚑ IT GUARDS A PRODUCTION DATABASE, SO IT REFUSES RATHER THAN GUESSES (second audit,
 * 2026-10-30). Before ANY write it:
 * - verifies every file against `SHA256SUMS` (same set of names, same bytes);
 * - names the database it is about to touch (host and database, never credentials) —
 *   a `DATABASE_URL` in the shell silently wins over `.env.local`, and a stale local URL
 *   once pointed at the wrong database (`5.72`);
 * - refuses when the tracking table names a migration the folder does not have (the
 *   names disagree, e.g. a hand backfill without `.sql`): every file would look pending;
 * - refuses a pending file that sorts BEFORE one already applied: website `001`–`014`
 *   were applied by hand, hold several statements each and several are not safe to run
 *   twice (one recreates a table empty), so they must never run again;
 * - refuses a pending file with more than one statement (Neon HTTP is one-shot);
 * - applies nothing without `--yes`: without it, `migrate` prints the plan and stops.
 * `status` only reads: it never creates the tracking table.
 *
 * Rules every NEW migration keeps (from website `015` and Practice `001` on): one
 * statement per file; idempotent (`IF NOT EXISTS` / `IF EXISTS` / guarded `ALTER`), because
 * the statement and its tracking row are two calls and a failure between them re-runs the
 * statement (CTO §14.6, register `5.76`); tracked by FILENAME, so never rename or edit one.
 */

import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { migrationsDir } from './docs-root.mjs';

/** Run a trusted DDL string as one statement through a Neon tagged-template function. */
function rawSql(sql, query) {
  return sql(Object.assign([query], { raw: [query] }));
}

/** Migration filenames in apply order (byte order of the name, as the tracking keys sort). */
export function orderMigrations(names) {
  return names.filter((f) => f.endsWith('.sql')).sort();
}

/**
 * Top-level statements in a SQL text: semicolons outside comments, quotes and
 * dollar-quoted bodies, plus a final statement without one.
 */
export function countStatements(text) {
  let n = 0;
  let pending = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    const rest = text.slice(i);
    if (rest.startsWith('--')) {
      const end = text.indexOf('\n', i);
      i = end < 0 ? text.length : end;
    } else if (rest.startsWith('/*')) {
      const end = text.indexOf('*/', i + 2);
      i = end < 0 ? text.length : end + 1;
    } else if (c === "'" || c === '"') {
      let j = i + 1;
      while (j < text.length && !(text[j] === c && text[j + 1] !== c)) j += text[j] === c ? 2 : 1;
      i = j;
      pending = true;
    } else if (c === '$' && /^\$\w*\$/.test(rest)) {
      const tag = rest.match(/^\$\w*\$/)[0];
      const end = text.indexOf(tag, i + tag.length);
      i = end < 0 ? text.length : end + tag.length - 1;
      pending = true;
    } else if (c === ';') {
      if (pending) n += 1;
      pending = false;
    } else if (!/\s/.test(c)) pending = true;
  }
  return n + (pending ? 1 : 0);
}

/** Every `.sql` file must be listed in `SHA256SUMS` with its exact bytes, and nothing more. */
export function verifyChecksums(dir) {
  let listed;
  try {
    listed = readFileSync(join(dir, 'SHA256SUMS'), 'utf8');
  } catch {
    return ['SHA256SUMS is missing'];
  }
  const sums = new Map();
  const problems = [];
  for (const line of listed.split('\n').filter((l) => l.trim())) {
    const m = line.match(/^([0-9a-f]{64}) [ *](.+)$/);
    if (!m) problems.push(`unreadable SHA256SUMS line: ${line.slice(0, 40)}`);
    else sums.set(m[2], m[1]);
  }
  const files = orderMigrations(readdirSync(dir));
  for (const f of files) {
    const want = sums.get(f);
    if (!want) problems.push(`${f} is not listed in SHA256SUMS`);
    else if (
      createHash('sha256')
        .update(readFileSync(join(dir, f)))
        .digest('hex') !== want
    )
      problems.push(`${f} does not match its SHA256SUMS entry`);
  }
  for (const f of sums.keys()) if (!files.includes(f)) problems.push(`${f} is listed but missing`);
  return problems;
}

/** `host / database` of a connection URL; never the user or the password. */
export function describeTarget(url) {
  try {
    const u = new URL(url);
    return `${u.hostname} / ${u.pathname.replace(/^\//, '') || '(default database)'}`;
  } catch {
    return '(unreadable DATABASE_URL)';
  }
}

/**
 * When the migrations folder is a git checkout: on `main` with no uncommitted change in it?
 * `null` when it is not a git checkout (a test fixture); a reason string when it is not.
 */
function checkoutProblem(dir) {
  const env = { ...process.env };
  for (const k of ['GIT_DIR', 'GIT_WORK_TREE', 'GIT_INDEX_FILE', 'GIT_COMMON_DIR']) delete env[k];
  const git = (a) =>
    execFileSync('git', ['-C', dir, ...a], { stdio: 'pipe', env })
      .toString()
      .trim();
  try {
    git(['rev-parse', '--is-inside-work-tree']);
  } catch {
    return null;
  }
  if (git(['rev-parse', '--abbrev-ref', 'HEAD']) !== 'main')
    return 'the private docs checkout is not on main';
  if (git(['status', '--porcelain', '--', '.']))
    return 'the migrations folder has uncommitted changes';
  return null;
}

async function trackedNames(sql, { create }) {
  if (create)
    await rawSql(
      sql,
      `CREATE TABLE IF NOT EXISTS schema_migrations (
         filename TEXT PRIMARY KEY,
         applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
       )`
    );
  else {
    const [{ present }] = await sql`SELECT to_regclass('schema_migrations') IS NOT NULL AS present`;
    if (!present) return null;
  }
  const rows = await sql`SELECT filename FROM schema_migrations ORDER BY filename`;
  return rows.map((r) => r.filename);
}

/**
 * Compare the folder with the tracking table. Pure: it reads only what it is given.
 * `problems` empty means the plan is safe to apply.
 */
export function planMigrations({ files, applied, statements }) {
  const appliedSet = new Set(applied);
  const pending = files.filter((f) => !appliedSet.has(f));
  const problems = [];
  const unknown = applied.filter((a) => !files.includes(a));
  if (unknown.length)
    problems.push(
      `the tracking table names ${unknown.length} migration(s) this folder does not have (${unknown.slice(0, 3).join(', ')}); the names disagree, so nothing is safe to apply`
    );
  const lastApplied = files.filter((f) => appliedSet.has(f)).at(-1);
  const early = lastApplied ? pending.filter((f) => f < lastApplied) : [];
  if (early.length)
    problems.push(
      `${early.length} pending migration(s) sort before ${lastApplied}, which is already applied (${early.slice(0, 3).join(', ')}); old migrations are never re-run`
    );
  for (const f of pending)
    if (statements(f) !== 1)
      problems.push(`${f} holds ${statements(f)} statements; a migration must hold exactly one`);
  return { applied: files.filter((f) => appliedSet.has(f)), pending, problems };
}

/** What `status` reports; reads only. */
export async function migrationStatus({ sql, dir }) {
  const files = orderMigrations(readdirSync(dir));
  const applied = await trackedNames(sql, { create: false });
  if (applied === null)
    return { applied: [], pending: files, problems: ['no schema_migrations table yet'] };
  return planMigrations({
    files,
    applied,
    statements: (f) => countStatements(readFileSync(join(dir, f), 'utf8')),
  });
}

/** Apply the pending migrations, in order, only when the plan is clean and `confirmed`. */
export async function runMigrations({ sql, dir, confirmed, log = console.log }) {
  const files = orderMigrations(readdirSync(dir));
  const applied = await trackedNames(sql, { create: true });
  const plan = planMigrations({
    files,
    applied,
    statements: (f) => countStatements(readFileSync(join(dir, f), 'utf8')),
  });
  if (plan.problems.length)
    throw new Error(`[migrate] refused, nothing applied:\n  - ${plan.problems.join('\n  - ')}`);
  if (!plan.pending.length) {
    log('[migrate] all migrations already applied');
    return [];
  }
  log(`[migrate] pending, in order: ${plan.pending.join(', ')}`);
  if (!confirmed) {
    log('[migrate] nothing applied: re-run with --yes to apply exactly the list above');
    return [];
  }
  const newly = [];
  for (const file of plan.pending) {
    log(`[migrate] applying: ${file}`);
    try {
      await rawSql(sql, readFileSync(join(dir, file), 'utf-8'));
    } catch (error) {
      const e = /** @type {{ code?: string, detail?: string, hint?: string, message?: string }} */ (
        error
      );
      throw new Error(
        `[migrate] FAILED: ${file} — ${e.message ?? error}${e.code ? ` (code ${e.code})` : ''}${e.detail ? `\n  detail: ${e.detail}` : ''}${e.hint ? `\n  hint: ${e.hint}` : ''}`
      );
    }
    await sql`INSERT INTO schema_migrations (filename) VALUES (${file})`;
    newly.push(file);
    log(`[migrate] applied: ${file}`);
  }
  log(`[migrate] applied ${newly.length} migration(s)`);
  return newly;
}

/**
 * The CLI both apps call: `node --env-file=.env.local <cli> status | migrate [--yes]`.
 * Every refusal happens before the database is touched, in this order: the folder, its
 * checksums, the checkout (for `migrate`), then `DATABASE_URL`.
 *
 * @param {{ app: 'web' | 'sandbox', repoRoot: string, neon: (url: string) => Function,
 *   argv?: string[], env?: Record<string, string | undefined>, log?: (s: string) => void }} options
 */
export async function runCli({
  app,
  repoRoot,
  neon,
  argv = process.argv,
  env = process.env,
  log = console.log,
}) {
  const mode = argv[2] ?? 'status';
  if (mode !== 'migrate' && mode !== 'status')
    throw new Error(`[migrate] unknown mode '${mode}'; use status | migrate [--yes]`);
  const found = migrationsDir(repoRoot, app, env);
  if (!found.dir) throw new Error(`[migrate] cannot run: ${found.problem}`);
  const bad = verifyChecksums(found.dir);
  if (bad.length) throw new Error(`[migrate] cannot run: ${bad.join('; ')}`);
  if (mode === 'migrate') {
    const checkout = checkoutProblem(found.dir);
    if (checkout) throw new Error(`[migrate] cannot run: ${checkout}`);
  }
  if (!env.DATABASE_URL)
    throw new Error(`[migrate] DATABASE_URL is not set (expected in apps/${app}/.env.local)`);
  log(`[migrate] database: ${describeTarget(env.DATABASE_URL)} — check this is the one you mean`);
  const sql = neon(env.DATABASE_URL);
  if (mode === 'migrate')
    return runMigrations({ sql, dir: found.dir, confirmed: argv.includes('--yes'), log });
  const status = await migrationStatus({ sql, dir: found.dir });
  log(JSON.stringify(status, null, 2));
  return status;
}
