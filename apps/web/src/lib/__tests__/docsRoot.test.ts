/**
 * `scripts/lib/docs-root.mjs` — where the private docs are read from (register `5.653`).
 *
 * The review gate and `validate:ux-canon` resolve private docs through this module, so a
 * wrong answer here points both at the wrong tree at once. Imported cross-boundary
 * (`scripts/**` is outside every vitest root).
 */

import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  PUBLIC_DOCS_AREAS,
  displayPath,
  docsRootProblem,
  isPrivateDocsPath,
  makeDirReader,
  makeDocsResolver,
  migrationsDir,
  resolveDocsRoot,
} from '../../../../../scripts/lib/docs-root.mjs';

const REPO = resolve(__dirname, '../../../../..');
const made: string[] = [];
afterEach(() => {
  while (made.length) rmSync(made.pop()!, { recursive: true, force: true });
});

/** A workspace holding `<ws>/diboas-platform` and, optionally, `<ws>/diboas-docs`. */
function workspace(opts: { legacy?: boolean; sibling?: boolean }) {
  const ws = mkdtempSync(join(tmpdir(), 'docs-root-'));
  made.push(ws);
  const repo = join(ws, 'diboas-platform');
  mkdirSync(join(repo, 'docs/tech'), { recursive: true });
  writeFileSync(join(repo, 'docs/tech/public.md'), '# public\n');
  const register = (root: string) => {
    mkdirSync(join(root, 'audit'), { recursive: true });
    writeFileSync(join(root, 'audit/PENDING_ALL.md'), '# register\n');
  };
  if (opts.legacy) register(join(repo, 'docs'));
  if (opts.sibling) {
    register(join(ws, 'diboas-docs'));
    mkdirSync(join(ws, 'diboas-docs/.git'), { recursive: true });
  }
  return { ws, repo, sibling: join(ws, 'diboas-docs') };
}

describe('resolveDocsRoot', () => {
  it('should prefer DIBOAS_DOCS_DIR when it is set and exists', () => {
    const { repo, sibling } = workspace({ legacy: true, sibling: true });
    expect(resolveDocsRoot(repo, { DIBOAS_DOCS_DIR: sibling })).toEqual({
      dir: sibling,
      via: 'DIBOAS_DOCS_DIR',
    });
  });

  it('should report bad instead of falling through to another tree when DIBOAS_DOCS_DIR is missing', () => {
    const { repo, ws } = workspace({ legacy: true, sibling: true });
    const result = resolveDocsRoot(repo, { DIBOAS_DOCS_DIR: join(ws, 'typo') });
    expect(result).toEqual({ dir: join(ws, 'typo'), via: 'DIBOAS_DOCS_DIR', bad: 'missing' });
    expect(docsRootProblem(repo, result)).toBe('DIBOAS_DOCS_DIR (../typo) does not exist');
  });

  /* 5.697: a folder that exists is not yet a private docs checkout. */
  it.each([
    ['a file', (ws: string) => (writeFileSync(join(ws, 'f'), 'x'), join(ws, 'f'))],
    ['an empty folder', (ws: string) => (mkdirSync(join(ws, 'empty')), join(ws, 'empty'))],
    ['the docs checkout one level too deep', (ws: string) => join(ws, 'diboas-docs/audit')],
  ])('should report bad when DIBOAS_DOCS_DIR is set to %s', (_, make) => {
    const { repo, ws } = workspace({ sibling: true });
    const result = resolveDocsRoot(repo, { DIBOAS_DOCS_DIR: make(ws) });
    expect(result.bad).toBe('no-register');
    expect(docsRootProblem(repo, result)).toMatch(
      /^DIBOAS_DOCS_DIR \(\.\.\/[\w/-]+\) is not a private docs checkout: it holds no audit\/PENDING_ALL\.md$/
    );
  });

  it('should resolve no private docs when DIBOAS_DOCS_DIR is none, even beside a sibling', () => {
    const { repo } = workspace({ legacy: true, sibling: true });
    expect(resolveDocsRoot(repo, { DIBOAS_DOCS_DIR: 'none' })).toEqual({ dir: null, via: 'none' });
  });

  it('should keep the legacy in-repo tree while it holds the register', () => {
    const { repo } = workspace({ legacy: true });
    expect(resolveDocsRoot(repo, {})).toEqual({ dir: join(repo, 'docs'), via: 'legacy' });
  });

  /* 5.698: two registers cannot both be current; the caller must stop, not pick one. */
  it('should flag a conflict when the legacy tree and the sibling both hold a register', () => {
    const { repo, sibling } = workspace({ legacy: true, sibling: true });
    const result = resolveDocsRoot(repo, {});
    expect(result).toEqual({ dir: join(repo, 'docs'), via: 'legacy', conflict: sibling });
    expect(docsRootProblem(repo, result)).toMatch(
      /^two private docs trees hold a register: docs\/ in this checkout and \.\.\/diboas-docs;/
    );
  });

  it('should report no problem when the docs root is usable', () => {
    const { repo } = workspace({ sibling: true });
    expect(docsRootProblem(repo, resolveDocsRoot(repo, {}))).toBeNull();
  });

  it('should use the sibling diboas-docs checkout when the legacy tree is gone', () => {
    const { repo, sibling } = workspace({ sibling: true });
    expect(resolveDocsRoot(repo, {})).toEqual({ dir: sibling, via: 'sibling' });
  });

  it('should resolve no private docs when no private tree exists', () => {
    const { repo } = workspace({});
    expect(resolveDocsRoot(repo, {})).toEqual({ dir: null, via: 'none' });
  });

  it('should treat an empty DIBOAS_DOCS_DIR as unset', () => {
    const { repo, sibling } = workspace({ sibling: true });
    expect(resolveDocsRoot(repo, { DIBOAS_DOCS_DIR: '' })).toEqual({
      dir: sibling,
      via: 'sibling',
    });
  });
});

describe('isPrivateDocsPath', () => {
  it('should classify every tracked docs file as public', () => {
    const tracked = execFileSync('git', ['ls-files', '-z', 'docs'], { cwd: REPO, encoding: 'utf8' })
      .split('\0')
      .filter(Boolean);
    expect(tracked.length).toBeGreaterThan(0);
    expect(tracked.filter(isPrivateDocsPath)).toEqual([]);
  });

  it('should match the public areas the .gitignore re-includes under docs/', () => {
    const reincluded = [
      ...readFileSync(join(REPO, '.gitignore'), 'utf8').matchAll(/^!docs\/([^/\s]+)/gm),
    ].map((m) => m[1].replace(/\.md$/, ''));
    expect([...new Set(reincluded)].sort()).toEqual([...PUBLIC_DOCS_AREAS].sort());
  });

  /* 5.700: ux-canon calls this directly on paths that can carry `..` */
  it('should classify by the normalised path when the spelling carries .. or //', () => {
    expect(isPrivateDocsPath('docs/tech/../audit/X.md')).toBe(true);
    expect(isPrivateDocsPath('./docs//full-view/x.md')).toBe(true);
    expect(isPrivateDocsPath('docs/audit/../tech/x.md')).toBe(false);
  });

  it('should classify the private areas and non-docs paths correctly', () => {
    expect(isPrivateDocsPath('docs/audit/PENDING_ALL.md')).toBe(true);
    expect(isPrivateDocsPath('docs/full-view/canon')).toBe(true);
    expect(isPrivateDocsPath('docs/README.md')).toBe(true);
    expect(isPrivateDocsPath('docs/tech/engineering-gates.md')).toBe(false);
    expect(isPrivateDocsPath('docs')).toBe(false);
    expect(isPrivateDocsPath('scripts/review-gate.mjs')).toBe(false);
  });
});

describe('displayPath', () => {
  it('should print a path relative when it is the checkout, inside it or a sibling of it', () => {
    const { repo, sibling } = workspace({ sibling: true });
    expect(displayPath(repo, repo)).toBe('.');
    expect(displayPath(repo, join(repo, 'docs'))).toBe('docs');
    expect(displayPath(repo, sibling)).toBe('../diboas-docs');
  });

  it('should print only …/name when the folder sits further away', () => {
    const { repo } = workspace({});
    expect(displayPath(repo, '/somewhere/far/away/docs-copy')).toBe('…/docs-copy');
  });
});

describe('makeDocsResolver', () => {
  it('should map private paths into the docs root and leave everything else in the repo', () => {
    const at = makeDocsResolver('/repo', '/private');
    expect(at('docs/audit/PENDING_ALL.md')).toBe('/private/audit/PENDING_ALL.md');
    expect(at('docs/tech/x.md')).toBe('/repo/docs/tech/x.md');
    expect(at('config/a.json')).toBe('/repo/config/a.json');
  });

  /* 5.700: one spelling per file, so a citation never resolves in one layout and dies in another. */
  it.each([
    ['./docs//audit/X.md', '/private/audit/X.md'],
    ['docs/../docs/audit/X.md', '/private/audit/X.md'],
    ['docs/tech/../audit/X.md', '/private/audit/X.md'],
    ['docs\\audit\\X.md', '/private/audit/X.md'],
    ['docs/audit/../tech/x.md', '/repo/docs/tech/x.md'],
    ['docs/audit/../../scripts/x.mjs', '/repo/scripts/x.mjs'],
  ])('should map %s to its normalised home when the spelling carries .. or //', (rel, abs) => {
    expect(makeDocsResolver('/repo', '/private')(rel)).toBe(abs);
  });

  /* 5.696: with no private docs, every row must find nothing, whatever sits in docs/ */
  it('should map private paths to a folder that never exists when there is no docs root', () => {
    const at = makeDocsResolver('/repo', null);
    expect(at('docs/audit/PENDING_ALL.md')).toBe(
      '/repo/docs/.private-docs-absent/audit/PENDING_ALL.md'
    );
    expect(at('docs/tech/x.md')).toBe('/repo/docs/tech/x.md');
  });

  it('should pass an absolute path through unchanged', () => {
    expect(makeDocsResolver('/repo', '/private')('/tmp/source/x.md')).toBe('/tmp/source/x.md');
  });
});

describe('makeDirReader', () => {
  it('should list docs as the public areas plus the private root, never its git metadata', () => {
    const { repo, sibling } = workspace({ sibling: true });
    mkdirSync(join(repo, 'docs/learn'), { recursive: true }); // a stale legacy leftover
    const names = (makeDirReader(repo, sibling)('docs') as string[]).sort();
    expect(names).toEqual(['audit', 'tech']);
  });

  /* 5.700: an installed node_modules or any dot-folder in the docs checkout is not docs. */
  it('should leave node_modules and every dot-folder out of the listing when the private root has them', () => {
    const { repo, sibling } = workspace({ sibling: true });
    mkdirSync(join(sibling, 'node_modules/pkg'), { recursive: true });
    mkdirSync(join(sibling, '.github/workflows'), { recursive: true });
    mkdirSync(join(sibling, '.cache'), { recursive: true }); // not `.git`-prefixed
    const names = (makeDirReader(repo, sibling)('docs') as string[]).sort();
    expect(names).toEqual(['audit', 'tech']);
    expect((makeDirReader(repo, sibling)('docs/../docs/') as string[]).sort()).toEqual(names);
  });

  /* 5.696: no docs root = only the public areas, never a stray private folder in docs/ */
  it('should list only the public areas when there is no docs root', () => {
    const { repo } = workspace({});
    mkdirSync(join(repo, 'docs/audit'), { recursive: true });
    mkdirSync(join(repo, 'docs/cc-sync'), { recursive: true });
    expect((makeDirReader(repo, null)('docs') as string[]).sort()).toEqual(['tech']);
  });

  it('should list docs from the repository alone when the private root is the legacy tree', () => {
    const { repo } = workspace({ legacy: true });
    const names = (makeDirReader(repo, join(repo, 'docs'))('docs') as string[]).sort();
    expect(names).toEqual(['audit', 'tech']);
  });
});

/* 5.709: the DB migrations live only in the private docs; a runner that finds none stops. */
describe('migrationsDir', () => {
  it('should return the private folder when it holds a .sql migration', () => {
    const { repo, sibling } = workspace({ sibling: true });
    mkdirSync(join(sibling, 'ops/db-migrations/web'), { recursive: true });
    writeFileSync(join(sibling, 'ops/db-migrations/web/001_a.sql'), 'SELECT 1;\n');
    expect(migrationsDir(repo, 'web', {})).toEqual({
      dir: join(sibling, 'ops/db-migrations/web'),
      problem: null,
    });
  });

  it('should refuse when the folder is missing or holds no .sql file', () => {
    const { repo, sibling } = workspace({ sibling: true });
    expect(migrationsDir(repo, 'web', {})).toEqual({
      dir: null,
      problem: '../diboas-docs/ops/db-migrations/web holds no .sql migration',
    });
    mkdirSync(join(sibling, 'ops/db-migrations/sandbox'), { recursive: true });
    writeFileSync(join(sibling, 'ops/db-migrations/sandbox/README.md'), '# not a migration\n');
    expect(migrationsDir(repo, 'sandbox', {}).problem).toMatch(/holds no \.sql migration$/);
  });

  it('should refuse when there are no private docs or the docs root is unusable', () => {
    const { repo, ws } = workspace({ sibling: true });
    expect(migrationsDir(repo, 'web', { DIBOAS_DOCS_DIR: 'none' }).problem).toMatch(
      /^no private docs checkout \(diboas-docs\)/
    );
    expect(migrationsDir(repo, 'web', { DIBOAS_DOCS_DIR: join(ws, 'typo') }).problem).toBe(
      'DIBOAS_DOCS_DIR (../typo) does not exist'
    );
  });
});
