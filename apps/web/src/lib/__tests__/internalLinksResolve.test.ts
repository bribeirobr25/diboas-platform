/**
 * Every internal link written as a literal path resolves to a real page (visual pass 2026-11-11:
 * the waitlist modal's consent line linked the privacy policy at `/privacy`, which answered 404;
 * the page is `/legal/privacy`).
 *
 * The page list is built from the `page.tsx` files under `src/app/[locale]`, route groups removed
 * and `[param]` segments matching any value, so a moved or renamed page fails here too.
 *
 * Plan P13 (RETIRED-SURFACES-1 guard 2) widened the reader from component `href`s to the config
 * files' link fields, the `ROUTES` values and the email package's site links, the places a link
 * to a deleted page (`/demo`) actually lived.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import ts from 'typescript';
import { parseSource } from '@diboas/test-support';
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

/** A link-carrying field in a config object: `href: '/x'`, `ctaHref: '/x'`, `url: '/x'`. */
const LINK_FIELD = /^(href|ctaHref|[a-z]*Href|url|link|path)$/;
/** Not pages: static files and API routes. */
const NOT_A_PAGE = /^\/(assets|api|images|_next)\//;

/** Literal internal paths in `src/config/**` link fields. */
function configLinks(): Array<{ at: string; path: string }> {
  const out: Array<{ at: string; path: string }> = [];
  for (const file of walk(join(SRC, 'config')).filter((f) => /\.ts$/.test(f))) {
    const sf = parseSource(readFileSync(file, 'utf8'), file);
    const visit = (node: ts.Node): void => {
      if (
        ts.isPropertyAssignment(node) &&
        LINK_FIELD.test(node.name.getText(sf)) &&
        ts.isStringLiteralLike(node.initializer) &&
        node.initializer.text.startsWith('/') &&
        !NOT_A_PAGE.test(node.initializer.text)
      ) {
        const line = sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;
        out.push({ at: `${relative(SRC, file)}:${line}`, path: node.initializer.text });
      }
      ts.forEachChild(node, visit);
    };
    visit(sf);
  }
  return out;
}

/** Every `ROUTES` value, nested groups included. */
function routeValues(node: unknown, at = 'ROUTES'): Array<{ at: string; path: string }> {
  if (typeof node === 'string') return [{ at, path: node }];
  if (node && typeof node === 'object')
    return Object.entries(node).flatMap(([k, v]) => routeValues(v, `${at}.${k}`));
  return [];
}

/** The email package's links into the site: `${BRAND.url}/${locale}/x` → `/x`. */
function emailLinks(): Array<{ at: string; path: string }> {
  const dir = join(SRC, '../../../packages/email/src');
  const out: Array<{ at: string; path: string }> = [];
  for (const file of walk(dir).filter((f) => /\.ts$/.test(f))) {
    readFileSync(file, 'utf8')
      .split('\n')
      .forEach((line, i) => {
        for (const m of line.matchAll(/\$\{BRAND\.url\}\/\$\{[^}]*locale[^}]*\}(\/[^`"'?#\s]*)/g))
          out.push({
            at: `email/${relative(dir, file)}:${i + 1}`,
            path: m[1]!.replace(/\$\{[^}]*\}/g, ANY),
          });
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

  it('should find a page for every internal link in the config files, ROUTES and the emails', () => {
    const config = configLinks();
    const routes = routeValues(ROUTES);
    const email = emailLinks();
    // non-vacuity: each reader sees links
    expect(config.length).toBeGreaterThan(10);
    expect(routes.length).toBeGreaterThan(10);
    expect(email.map((l) => l.path)).toContain('/legal/\u0000');
    expect(
      [...config, ...routes, ...email]
        .filter((l) => !resolves(l.path))
        .map((l) => `${l.at} ${l.path}`)
    ).toEqual([]);
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
