/**
 * WITHDRAW-1 (placements) · every page that can show the cookie banner can reopen it (market
 * clean-up W-D1, D6 + F2; spec §3.8). The banner is mounted by the landing layout, so every
 * `app/[locale]/(landing)/**\/page.tsx` must reach `CookieSettingsButton` along its imports
 * (static, `import()`, barrels), and the landing error page and the four named placements import
 * it by name. Exempt by rule only: a redirect-only page, whose default export renders nothing and
 * calls `redirect` or `permanentRedirect` (today `/share`). A page wrongly exempted fails.
 */
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { stripComments } from '@diboas/test-support';

const WEB = resolve(__dirname, '../..');
const SRC = join(WEB, 'src');
const TARGET = join(SRC, 'components/CookieConsent/CookieSettingsButton.tsx');

function resolveImport(from: string, spec: string): string | null {
  let base: string;
  if (spec.startsWith('@/')) base = join(SRC, spec.slice(2));
  else if (spec.startsWith('.')) base = resolve(dirname(from), spec);
  else return null;
  for (const candidate of [
    base,
    `${base}.tsx`,
    `${base}.ts`,
    join(base, 'index.ts'),
    join(base, 'index.tsx'),
  ])
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  return null;
}

/** Each file's imports, read once (a walk per test timed out under coverage). */
const importCache = new Map<string, string[]>();
const importsOf = (file: string): string[] => {
  const known = importCache.get(file);
  if (known) return known;
  const text = stripComments(readFileSync(file, 'utf8'), file);
  const found = [...text.matchAll(/(?:from|import)\s*\(?\s*['"]([^'"]+)['"]/g)]
    .map((m) => resolveImport(file, m[1]))
    .filter((f): f is string => f !== null);
  importCache.set(file, found);
  return found;
};

const reachCache = new Map<string, boolean>();
function reachesControl(start: string): boolean {
  const known = reachCache.get(start);
  if (known !== undefined) return known;
  const result = walkToControl(start);
  reachCache.set(start, result);
  return result;
}

function walkToControl(start: string): boolean {
  const seen = new Set([start]);
  const queue = [start];
  while (queue.length) {
    const file = queue.shift()!;
    if (file === TARGET) return true;
    for (const next of importsOf(file)) if (!seen.has(next)) (seen.add(next), queue.push(next));
  }
  return false;
}

/** A page whose default export renders nothing and only redirects. */
function isRedirectOnly(file: string): boolean {
  const text = stripComments(readFileSync(file, 'utf8'), file);
  const body = text.slice(text.indexOf('export default'));
  return (
    /\b(?:permanentRedirect|redirect)\(/.test(body) &&
    !/<[A-Za-z]/.test(body) &&
    !/return\s*\(/.test(body)
  );
}

const pages = execSync('git ls-files src/app', { cwd: WEB, encoding: 'utf8' })
  .split('\n')
  .filter((f) => f.includes('(landing)') && /\/page\.tsx$/.test(f))
  .map((f) => join(WEB, f));

describe('WITHDRAW-1: "Cookie settings" on every page with the banner', () => {
  beforeAll(() => {
    for (const page of pages) reachesControl(page);
  }, 120_000);

  it('should find the landing pages (a non-vacuity floor)', () => {
    expect(pages.length).toBeGreaterThanOrEqual(25);
  });

  it.each(pages.map((p) => [p.slice(WEB.length + 1), p]))(
    'should reach the control from %s, unless it only redirects',
    (_name, page) => {
      expect(reachesControl(page) || isRedirectOnly(page)).toBe(true);
    }
  );

  it('should exempt only redirect-only pages, and today exactly /share', () => {
    const exempt = pages.filter((p) => !reachesControl(p)).map((p) => p.slice(WEB.length + 1));
    expect(exempt).toEqual(['src/app/[locale]/(landing)/share/page.tsx']);
    for (const page of pages.filter((p) => !reachesControl(p)))
      expect(isRedirectOnly(page)).toBe(true);
  });

  it.each([
    'src/components/Layout/Footer/MinimalFooter.tsx',
    'src/app/[locale]/(landing)/email-preferences/page.tsx',
    'src/app/[locale]/(landing)/delete-confirm/page.tsx',
    'src/app/[locale]/(landing)/error.tsx',
  ])('should import and render the control by name in %s', (file) => {
    const text = stripComments(readFileSync(join(WEB, file), 'utf8'), file);
    expect(text).toMatch(
      /import \{ CookieSettingsButton \} from '@\/components\/CookieConsent\/CookieSettingsButton';/
    );
    expect(text).toMatch(/<CookieSettingsButton\b/);
  });

  it('should keep the control out of every barrel', () => {
    const barrels = execSync('git ls-files "src/components/**/index.ts"', {
      cwd: WEB,
      encoding: 'utf8',
    })
      .split('\n')
      .filter(Boolean);
    for (const barrel of barrels)
      expect(readFileSync(join(WEB, barrel), 'utf8'), barrel).not.toMatch(/CookieSettingsButton/);
  });
});
