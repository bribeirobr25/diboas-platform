import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * ⚙ A MEDIA CONDITION NEVER READS A CUSTOM PROPERTY (register 5.798).
 *
 * `@media (min-width: var(--breakpoint-desktop))` is invalid CSS: custom properties are not
 * allowed in a media condition, so the browser drops the whole block. Three such rules shipped
 * on diboas.com (the hero button on /about, /business, /help and /security; the /business
 * carousel gap), silently, for months. This scans every stylesheet in the repository — both
 * apps and the shared packages — and fails on any `var(` inside an `@media` or `@container`
 * condition. Breakpoints in conditions are literal px, matching the `--breakpoint-*` tokens.
 */

function repoRoot(): string {
  let dir = __dirname;
  for (let i = 0; i < 10; i += 1) {
    if (existsSync(join(dir, 'pnpm-workspace.yaml'))) return dir;
    dir = dirname(dir);
  }
  throw new Error('Could not locate the repository root');
}
const ROOT = repoRoot();
const SKIP = new Set(['node_modules', '.next', 'dist', 'storybook-static', '.turbo', 'coverage']);

function stylesheets(dir: string, acc: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    if (SKIP.has(e) || e.startsWith('.')) continue;
    const full = join(dir, e);
    if (statSync(full).isDirectory()) stylesheets(full, acc);
    else if (e.endsWith('.css')) acc.push(full);
  }
  return acc;
}

/** Every `@media`/`@container` prelude (the text up to its `{`) that reads a custom property. */
export function varConditions(css: string): string[] {
  const out: string[] = [];
  for (const m of css.matchAll(/@(?:media|container)\b([^{]*)\{/g))
    if (/var\(\s*--/.test(m[1])) out.push(m[0].trim());
  return out;
}

const FILES = ['apps/web/src', 'apps/sandbox/src', 'packages']
  .map((d) => join(ROOT, d))
  .filter(existsSync)
  .flatMap((d) => stylesheets(d));

describe('5.798 · media conditions use literal breakpoints', () => {
  it('should find no custom property inside any @media or @container condition', () => {
    const offenders = FILES.flatMap((f) =>
      varConditions(readFileSync(f, 'utf8')).map((c) => `${relative(ROOT, f)}: ${c}`)
    );
    expect(offenders).toEqual([]);
  });

  it('should recognise the defect in every spelling, and leave valid rules alone (non-vacuity)', () => {
    expect(varConditions('@media (min-width: var(--breakpoint-desktop)) {')).toHaveLength(1);
    expect(varConditions('@media screen and (max-width:var( --bp)) {')).toHaveLength(1);
    expect(varConditions('@container card (min-width: var(--w)) {')).toHaveLength(1);
    expect(varConditions('@media (min-width: 1024px) { .a { gap: var(--g); } }')).toEqual([]);
  });

  it('should have actually read the stylesheets', () => {
    expect(FILES.length).toBeGreaterThan(100);
  });
});
