/**
 * docs-root.mjs — where the PRIVATE documentation physically lives (register `5.653`).
 *
 * diboas-platform is public. Its `docs/` folder tracks only three areas (`tech`,
 * `integrations`, `testing`); every other area — the register, decisions, domain docs,
 * canon packages — is private and moved to the separate private repository
 * `diboas-docs` (founder rulings 2026-10-28). Records, citations and gates keep naming a
 * file by its LOGICAL path (`docs/audit/PENDING_ALL.md`, `docs/full-view/canon/…`); only
 * where that file is READ changes. This module is the one place that decides.
 *
 * Resolution of the private root, first match wins:
 *   1. `DIBOAS_DOCS_DIR` — explicit. It must hold the register; a missing folder, a file,
 *      or a folder without the register is an error, never a silent fall-through (a typo
 *      must not quietly read another tree, `5.697`). The value `none` means "no private
 *      docs" on purpose (hermetic tests, `5.699`).
 *   2. the legacy in-repo tree — `<repo>/docs`, while it still holds the register.
 *   3. the sibling checkout — `<repo>/../diboas-docs`, when it holds the register.
 *   4. none — no private docs (a fresh public clone, CI). `dir` is then `null`, and every
 *      private path maps to a folder that never exists, so EVERY row and tool sees the
 *      private areas as absent, whatever stray folders sit in `<repo>/docs` (`5.696`).
 * When BOTH the legacy tree and the sibling hold a register, the result carries
 * `conflict`: which one is current cannot be told from here, so callers stop (`5.698`).
 * `docsRootProblem` words a `bad` or `conflict` result the same way for every tool.
 *
 * The register (`audit/PENDING_ALL.md`) is the marker because it is the one private file
 * every maintainer checkout has, and nothing writes it implicitly (the gate's failure
 * logs create `audit/REVIEW_GATE_RUNS/`, never the register).
 *
 * Path logic, directory listing and real-path lookups only; no file contents read, no
 * writes, no process.exit.
 */

import { existsSync, readdirSync, realpathSync } from 'node:fs';
import { basename, dirname, isAbsolute, join, posix, relative, resolve } from 'node:path';

/** The `docs/` areas tracked in the public repository (mirrors `.gitignore`). */
export const PUBLIC_DOCS_AREAS = ['tech', 'integrations', 'testing'];

const MARKER = join('audit', 'PENDING_ALL.md');

/**
 * Where private paths map when there are no private docs: a dot-folder no tool creates
 * (the battery's log goes to `.review-gate-runs/` then), so every read finds nothing.
 */
const ABSENT = join('docs', '.private-docs-absent');

/**
 * @param {string} repoRoot absolute path of the diboas-platform checkout
 * @param {Record<string, string | undefined>} [env]
 * @returns {{ dir: string | null, via: 'DIBOAS_DOCS_DIR' | 'legacy' | 'sibling' | 'none',
 *   bad?: 'missing' | 'no-register', conflict?: string }}
 */
export function resolveDocsRoot(repoRoot, env = process.env) {
  const legacy = join(repoRoot, 'docs');
  const fromEnv = env.DIBOAS_DOCS_DIR;
  if (fromEnv === 'none') return { dir: null, via: 'none' };
  if (fromEnv) {
    const dir = resolve(repoRoot, fromEnv);
    if (!existsSync(dir)) return { dir, via: 'DIBOAS_DOCS_DIR', bad: 'missing' };
    if (!existsSync(join(dir, MARKER))) return { dir, via: 'DIBOAS_DOCS_DIR', bad: 'no-register' };
    return { dir, via: 'DIBOAS_DOCS_DIR' };
  }
  const sibling = resolve(repoRoot, '..', 'diboas-docs');
  const siblingOk = existsSync(join(sibling, MARKER));
  if (existsSync(join(legacy, MARKER)))
    return siblingOk
      ? { dir: legacy, via: 'legacy', conflict: sibling }
      : { dir: legacy, via: 'legacy' };
  if (siblingOk) return { dir: sibling, via: 'sibling' };
  return { dir: null, via: 'none' };
}

/**
 * A folder as it may be PRINTED: relative when it is this checkout, inside it or a sibling
 * of it, otherwise only `…/<name>`. Tool output gets pasted into public PRs, so no machine
 * path (`/Users/…`, a temp folder) may appear in it (`5.697`).
 */
export function displayPath(repoRoot, dir) {
  /* real paths, so a symlinked temp folder (macOS: /var → /private/var) compares equal */
  const rel = relative(realOrSelf(repoRoot), realOrSelf(dir)) || '.';
  const ups = rel.split(/[\\/]/).filter((x) => x === '..').length;
  return ups > 1 || isAbsolute(rel) ? `…/${basename(dir)}` : rel;
}

/** The real path, or for a path that does not exist, its nearest existing parent's real path
    plus the rest, so a missing folder still compares against a symlinked checkout. */
function realOrSelf(p) {
  const missing = [];
  let at = resolve(p);
  for (;;) {
    try {
      return join(realpathSync(at), ...missing);
    } catch {
      const up = dirname(at);
      if (up === at) return resolve(p);
      missing.unshift(basename(at));
      at = up;
    }
  }
}

/**
 * The one wording of an unusable docs root (`bad` or `conflict`), or `null` when it is
 * usable. Every tool that resolves the root stops on a non-null answer (`5.697`, `5.698`).
 */
export function docsRootProblem(repoRoot, root) {
  if (root.bad === 'missing')
    return `DIBOAS_DOCS_DIR (${displayPath(repoRoot, root.dir)}) does not exist`;
  if (root.bad === 'no-register')
    return `DIBOAS_DOCS_DIR (${displayPath(repoRoot, root.dir)}) is not a private docs checkout: it holds no ${MARKER}`;
  if (root.conflict)
    return (
      `two private docs trees hold a register: docs/ in this checkout and ` +
      `${displayPath(repoRoot, root.conflict)}; remove the in-repo copy (diboas-docs is the home since 2026-10-30) or set DIBOAS_DOCS_DIR`
    );
  return null;
}

/** A repo-relative path in one spelling: `./docs//audit/../audit/X` → `docs/audit/X`. */
function normalise(rel) {
  return posix.normalize(rel.replace(/\\/g, '/')).replace(/^\.\//, '');
}

/** True when a repo-relative path names a PRIVATE docs file or folder. */
export function isPrivateDocsPath(rel) {
  const parts = normalise(rel).split('/');
  if (parts[0] !== 'docs' || parts.length < 2 || parts[1] === '') return false;
  return !PUBLIC_DOCS_AREAS.includes(parts[1]);
}

/**
 * Map a repo-relative LOGICAL path to the absolute path to read or write.
 * Non-docs paths and the public docs areas resolve inside the repository, unchanged.
 * The path is normalised first (`5.700`): `docs/tech/../audit/X` IS the private
 * `docs/audit/X`, and `docs/audit/../../x` is the plain repository path `x`, so a docs
 * spelling can no longer land in the wrong tree. With `docsRoot === null` (no private
 * docs) a private path maps to a folder that never exists.
 * `docs` itself resolves to the repository folder; LIST it through `makeDirReader`,
 * which merges in the private root.
 */
export function makeDocsResolver(repoRoot, docsRoot) {
  return (rel) => {
    if (isAbsolute(rel)) return rel;
    const norm = normalise(rel);
    if (!isPrivateDocsPath(norm)) return join(repoRoot, norm);
    const inside = norm.slice('docs/'.length);
    return docsRoot === null ? join(repoRoot, ABSENT, inside) : join(docsRoot, inside);
  };
}

/**
 * `readdirSync` over a LOGICAL folder. For `docs` itself, when the private root is
 * elsewhere, the listing is the repository's public areas plus the private root's
 * entries, so a walk sees one docs tree. Throws like `readdirSync` when absent.
 */
export function makeDirReader(repoRoot, docsRoot) {
  const at = makeDocsResolver(repoRoot, docsRoot);
  const inRepo = docsRoot !== null && resolve(docsRoot) === resolve(repoRoot, 'docs');
  const name = (e) => (typeof e === 'string' ? e : e.name);
  return (rel, options) => {
    const norm = normalise(rel).replace(/\/$/, '');
    if (norm !== 'docs' || inRepo) return readdirSync(at(norm), options);
    const pub = existsSync(at('docs')) ? readdirSync(at('docs'), options) : [];
    // no private docs: only the public areas, never a stray private folder in docs/ (5.696)
    const priv = docsRoot !== null && existsSync(docsRoot) ? readdirSync(docsRoot, options) : [];
    return [
      ...pub.filter((e) => PUBLIC_DOCS_AREAS.includes(name(e))),
      // the private checkout's own metadata (`.git`, `.github`, any dot-folder) and an
      // installed `node_modules` are never part of the docs tree (`5.700`)
      ...priv.filter(
        (e) =>
          !PUBLIC_DOCS_AREAS.includes(name(e)) &&
          !name(e).startsWith('.') &&
          name(e) !== 'node_modules'
      ),
    ];
  };
}
