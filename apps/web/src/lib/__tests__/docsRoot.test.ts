/**
 * `scripts/lib/docs-root.mjs` — where the private docs are read from (register `5.653`).
 *
 * The review gate, `validate:ux-canon`, `validate:investor-figures` and the investor
 * generator all resolve private docs through this module, so a wrong answer here points
 * every one of them at the wrong tree at once. Imported cross-boundary like
 * `scripts/lib/investor-figures.mjs` (`scripts/**` is outside every vitest root).
 */

import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  PUBLIC_DOCS_AREAS,
  isPrivateDocsPath,
  makeDirReader,
  makeDocsResolver,
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

  it('should report a missing DIBOAS_DOCS_DIR instead of falling through to another tree', () => {
    const { repo, ws } = workspace({ legacy: true, sibling: true });
    const result = resolveDocsRoot(repo, { DIBOAS_DOCS_DIR: join(ws, 'typo') });
    expect(result.bad).toBe(join(ws, 'typo'));
  });

  it('should keep the legacy in-repo tree while it holds the register', () => {
    const { repo } = workspace({ legacy: true, sibling: true });
    expect(resolveDocsRoot(repo, {})).toEqual({ dir: join(repo, 'docs'), via: 'legacy' });
  });

  it('should use the sibling diboas-docs checkout when the legacy tree is gone', () => {
    const { repo, sibling } = workspace({ sibling: true });
    expect(resolveDocsRoot(repo, {})).toEqual({ dir: sibling, via: 'sibling' });
  });

  it('should fall back to the repository docs folder when no private tree exists', () => {
    const { repo } = workspace({});
    expect(resolveDocsRoot(repo, {})).toEqual({ dir: join(repo, 'docs'), via: 'none' });
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

  it('should classify the private areas and non-docs paths correctly', () => {
    expect(isPrivateDocsPath('docs/audit/PENDING_ALL.md')).toBe(true);
    expect(isPrivateDocsPath('docs/full-view/canon')).toBe(true);
    expect(isPrivateDocsPath('docs/README.md')).toBe(true);
    expect(isPrivateDocsPath('docs/tech/engineering-gates.md')).toBe(false);
    expect(isPrivateDocsPath('docs')).toBe(false);
    expect(isPrivateDocsPath('scripts/review-gate.mjs')).toBe(false);
  });
});

describe('makeDocsResolver', () => {
  it('should map private paths into the docs root and leave everything else in the repo', () => {
    const at = makeDocsResolver('/repo', '/private');
    expect(at('docs/audit/PENDING_ALL.md')).toBe('/private/audit/PENDING_ALL.md');
    expect(at('docs/tech/x.md')).toBe('/repo/docs/tech/x.md');
    expect(at('config/a.json')).toBe('/repo/config/a.json');
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

  it('should list docs from the repository alone when the private root is the legacy tree', () => {
    const { repo } = workspace({ legacy: true });
    const names = (makeDirReader(repo, join(repo, 'docs'))('docs') as string[]).sort();
    expect(names).toEqual(['audit', 'tech']);
  });
});
