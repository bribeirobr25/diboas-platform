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
 *   1. `DIBOAS_DOCS_DIR` — explicit. If set and missing, that is an error, never a
 *      silent fall-through (a typo must not quietly read another tree).
 *   2. the legacy in-repo tree — `<repo>/docs`, while it still holds the register.
 *   3. the sibling checkout — `<repo>/../diboas-docs`, when it holds the register.
 *   4. none — `<repo>/docs`, as on a fresh public clone or in CI: the private areas are
 *      simply absent, exactly as before this module existed.
 *
 * The register (`audit/PENDING_ALL.md`) is the marker because it is the one private file
 * every maintainer checkout has, and nothing writes it implicitly (the gate's failure
 * logs create `audit/REVIEW_GATE_RUNS/`, never the register).
 *
 * Path logic and directory listing only; no file reads, no writes, no process.exit.
 */

import { existsSync, readdirSync } from 'node:fs';
import { isAbsolute, join, resolve } from 'node:path';

/** The `docs/` areas tracked in the public repository (mirrors `.gitignore`). */
export const PUBLIC_DOCS_AREAS = ['tech', 'integrations', 'testing'];

const MARKER = join('audit', 'PENDING_ALL.md');

/**
 * @param {string} repoRoot absolute path of the diboas-platform checkout
 * @param {Record<string, string | undefined>} [env]
 * @returns {{ dir: string, via: 'DIBOAS_DOCS_DIR' | 'legacy' | 'sibling' | 'none', bad?: string }}
 */
export function resolveDocsRoot(repoRoot, env = process.env) {
  const legacy = join(repoRoot, 'docs');
  const fromEnv = env.DIBOAS_DOCS_DIR;
  if (fromEnv) {
    const dir = resolve(repoRoot, fromEnv);
    return existsSync(dir)
      ? { dir, via: 'DIBOAS_DOCS_DIR' }
      : { dir, via: 'DIBOAS_DOCS_DIR', bad: dir };
  }
  if (existsSync(join(legacy, MARKER))) return { dir: legacy, via: 'legacy' };
  const sibling = resolve(repoRoot, '..', 'diboas-docs');
  if (existsSync(join(sibling, MARKER))) return { dir: sibling, via: 'sibling' };
  return { dir: legacy, via: 'none' };
}

/** True when a repo-relative path names a PRIVATE docs file or folder. */
export function isPrivateDocsPath(rel) {
  const parts = rel.replace(/\\/g, '/').replace(/^\.\//, '').split('/');
  if (parts[0] !== 'docs' || parts.length < 2 || parts[1] === '') return false;
  return !PUBLIC_DOCS_AREAS.includes(parts[1]);
}

/**
 * Map a repo-relative LOGICAL path to the absolute path to read or write.
 * Non-docs paths and the public docs areas resolve inside the repository, unchanged.
 * `docs` itself resolves to the repository folder; LIST it through `makeDirReader`,
 * which merges in the private root.
 */
export function makeDocsResolver(repoRoot, docsRoot) {
  return (rel) =>
    isAbsolute(rel)
      ? rel
      : isPrivateDocsPath(rel)
        ? join(docsRoot, rel.replace(/\\/g, '/').replace(/^\.\//, '').slice('docs/'.length))
        : join(repoRoot, rel);
}

/**
 * `readdirSync` over a LOGICAL folder. For `docs` itself, when the private root is
 * elsewhere, the listing is the repository's public areas plus the private root's
 * entries, so a walk sees one docs tree. Throws like `readdirSync` when absent.
 */
export function makeDirReader(repoRoot, docsRoot) {
  const at = makeDocsResolver(repoRoot, docsRoot);
  const inRepo = resolve(docsRoot) === resolve(repoRoot, 'docs');
  const name = (e) => (typeof e === 'string' ? e : e.name);
  return (rel, options) => {
    const norm = rel.replace(/\\/g, '/').replace(/^\.\//, '').replace(/\/$/, '');
    if (norm !== 'docs' || inRepo) return readdirSync(at(norm), options);
    const pub = existsSync(at('docs')) ? readdirSync(at('docs'), options) : [];
    const priv = existsSync(docsRoot) ? readdirSync(docsRoot, options) : [];
    return [
      ...pub.filter((e) => PUBLIC_DOCS_AREAS.includes(name(e))),
      // the private checkout's own git metadata is never part of the docs tree
      ...priv.filter((e) => !PUBLIC_DOCS_AREAS.includes(name(e)) && !name(e).startsWith('.git')),
    ];
  };
}
