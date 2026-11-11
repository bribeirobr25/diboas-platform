/**
 * Every internal link written as a literal path resolves to a real page (visual pass 2026-11-11:
 * the waitlist modal's consent line linked the privacy policy at `/privacy`, which answered 404;
 * the page is `/legal/privacy`).
 *
 * The page list is built from the `page.tsx` files under `src/app/[locale]`, route groups removed
 * and `[param]` segments matching any value, so a moved or renamed page fails here too.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import { WAITING_LIST_CONFIG } from '@/lib/waitingList/constants';
import { ROUTES } from '@/config/routes';

const SRC = join(__dirname, '../..');
const APP = join(SRC, 'app', '[locale]');

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      if (name === '__tests__' || name === 'node_modules') continue;
      walk(full, out);
    } else out.push(full);
  }
  return out;
}

/** Every page's segments, route groups dropped (`[x]` segments stay as written). */
const PAGES: string[][] = walk(APP)
  .filter((f) => f.endsWith(`${sep}page.tsx`))
  .map((f) =>
    relative(APP, f)
      .split(sep)
      .slice(0, -1)
      .filter((s) => !/^\(.*\)$/.test(s))
  );

/** A template value (`${slug}`) in a link: it matches any one segment. */
const ANY = '\u0000';

const resolves = (path: string): boolean => {
  const link = path.split(/[?#]/)[0].split('/').filter(Boolean);
  return PAGES.some(
    (page) =>
      page.length === link.length &&
      page.every((seg, i) => /^\[.+\]$/.test(seg) || link[i] === ANY || link[i] === seg)
  );
};

/** Literal internal hrefs in components: `href="/x"` and the static start of `href={`/x/${…}`}`. */
function literalHrefs(): Array<{ at: string; path: string }> {
  const out: Array<{ at: string; path: string }> = [];
  for (const file of walk(join(SRC, 'components')).filter(
    (f) => /\.tsx$/.test(f) && !f.includes('.stories.')
  )) {
    readFileSync(file, 'utf8')
      .split('\n')
      .forEach((line, i) => {
        if (/^\s*(\*|\/\/)/.test(line)) return; // comments and JSDoc examples
        for (const m of line.matchAll(/href=(?:"(\/[^"]*)"|\{`(\/[^`]*)`\})/g)) {
          const raw = m[1] ?? m[2];
          // `/${locale}/…` is the locale prefix, not a page segment; any other value is a wildcard
          const path = raw.replace(/^\/\$\{\s*locale\s*\}/, '').replace(/\$\{[^}]*\}/g, ANY);
          out.push({ at: `${relative(SRC, file)}:${i + 1}`, path });
        }
      });
  }
  return out;
}

describe('internal links resolve to a page', () => {
  it('should link the waitlist consent line to the real privacy policy page', () => {
    expect(WAITING_LIST_CONFIG.privacyPolicyUrl).toBe(ROUTES.LEGAL.PRIVACY);
    expect(resolves(WAITING_LIST_CONFIG.privacyPolicyUrl)).toBe(true);
  });

  it('should find a page for every literal internal href in the components', () => {
    const links = literalHrefs();
    expect(links.length).toBeGreaterThan(5);
    expect(links.filter((l) => !resolves(l.path)).map((l) => `${l.at} ${l.path}`)).toEqual([]);
  });

  it('should tell a real page from a missing one (the reader is not blind)', () => {
    expect(PAGES.length).toBeGreaterThan(20);
    expect(resolves(`/tools/${ANY}`)).toBe(true);
    expect(resolves(`/nope/${ANY}`)).toBe(false);
    for (const ok of [
      '/',
      '/legal/privacy',
      '/tools/emergency-fund',
      '/learn/compound-interest',
      '/protocols',
    ])
      expect(resolves(ok), ok).toBe(true);
    for (const missing of ['/privacy', '/tools/nope/extra', '/legal'])
      expect(resolves(missing), missing).toBe(false);
  });
});
