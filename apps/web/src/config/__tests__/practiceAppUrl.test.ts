/**
 * ⛑ RETIRED-SURFACES-1 guard 4 · one Practice address (plan P13, D2; register `5.120`).
 *
 * Every link that opens Practice reads `PRACTICE_APP_URL`, a fixed literal; the email package
 * pins the same literal as `BRAND.practiceUrl`. `NEXT_PUBLIC_APP_URL` is the WEBSITE's origin:
 * before P13 two config entries fell back to it for the app's address, so on a deployment where
 * it is set (production) they would have sent the reader back to this site. The cases below
 * stub it to a site origin and reload the modules, so a link that still read it would point
 * there and fail.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { stripComments } from '@diboas/test-support';
import { afterEach, describe, expect, it, vi } from 'vitest';

const PRACTICE = 'https://app.diboas.com';
/* A site origin distinct from every fallback, so a re-run module is visible. */
const SITE = 'https://site.test';
const WEB = join(__dirname, '../../..');
const SRC = join(WEB, 'src');
const EMAIL_SRC = join(WEB, '../../packages/email/src');

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

async function withSiteOrigin<T>(load: () => Promise<T>): Promise<T> {
  vi.stubEnv('NEXT_PUBLIC_APP_URL', SITE);
  vi.resetModules();
  return load();
}

describe('one Practice address (P13 · D2)', { timeout: 30_000 }, () => {
  it('should hold the same fixed address in the web app and the email package', async () => {
    const { PRACTICE_APP_URL } = await import('../practiceApp');
    const { BRAND } = await import('@diboas/email');
    expect(PRACTICE_APP_URL).toBe(PRACTICE);
    expect(BRAND.practiceUrl).toBe(PRACTICE);
  });

  it('should keep the email package on its fixed address when the site origin is set', async () => {
    const { BRAND } = await withSiteOrigin(() => import('@diboas/email'));
    // the module was really re-run under the stub: the site address followed it
    expect(BRAND.url).toBe(SITE);
    expect(BRAND.practiceUrl).toBe(PRACTICE);
  });

  it('should resolve every Practice link to the Practice address, never the site origin', async () => {
    const [wedge, footer, hero, carousel, eu, ptbr] = await withSiteOrigin(() =>
      Promise.all([
        import('../wedge'),
        import('../footer'),
        import('../hero'),
        import('../appFeaturesCarousel'),
        import('../landing-b2c-eu'),
        import('../landing-b2c-ptbr'),
      ])
    );
    expect(wedge.WEDGE_CONFIG.en.ctaHref).toBe(PRACTICE);
    const appEntry = footer.FOOTER_CONFIG.sections
      .flatMap((s) => s.links)
      .find((l) => l.id === 'diboasApp');
    expect(appEntry?.href).toBe(PRACTICE);
    expect(hero.DEFAULT_HERO_CONTENT.ctaHref).toBe(PRACTICE);
    const cards = JSON.stringify(carousel);
    expect(cards).toContain(`"ctaHref":"${PRACTICE}"`);
    expect(cards).not.toContain(SITE);
    for (const locale of ['en', 'de', 'es'] as const) {
      const cta = eu
        .makeEuLandingConfig(locale)
        .pictureFuture.cta?.find((c) => c.id === 'practice');
      expect(cta?.href, locale).toBe(PRACTICE);
    }
    expect((ptbr.B2C_PTBR_IMAGINE_CONFIG.cta ?? []).find((c) => c.id === 'practice')?.href).toBe(
      PRACTICE
    );
  });

  it('should point both navigation CTAs at the Practice address', () => {
    const nav = stripComments(
      readFileSync(join(SRC, 'components/Layout/Navigation/MinimalNavigation.tsx'), 'utf8')
    );
    expect(nav.match(/href=\{PRACTICE_APP_URL\}/g)).toHaveLength(2);
    expect(nav).not.toMatch(/ROUTES\.DEMO|\bAPP_URL\b/);
  });

  /*
   * The site-origin variable is read only where the SITE's address is meant: the definition and
   * the CSRF origins (`config/env.ts`), share links, unsubscribe links, the referral base, the
   * delete-confirm link and the email package's own site address. Never in an `href`.
   */
  const READERS = new Set([
    'apps/web/src/config/env.ts',
    'apps/web/src/hooks/useResultShare.ts',
    'apps/web/src/lib/share/utm.ts',
    'apps/web/src/lib/email/unsubscribeUrl.ts',
    'apps/web/src/lib/waitingList/constants.ts',
    'apps/web/src/lib/waitingList/WaitlistApplicationService.ts',
    'packages/email/src/config.ts',
  ]);

  function walk(dir: string, out: string[] = []): string[] {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) {
        if (name === '__tests__' || name === 'node_modules') continue;
        walk(full, out);
      } else if (/\.(ts|tsx)$/.test(name) && !name.includes('.stories.')) out.push(full);
    }
    return out;
  }

  it('should read the site origin only in its named readers, and never in an href', () => {
    const files = [...walk(SRC), join(WEB, 'middleware.ts'), ...walk(EMAIL_SRC)];
    expect(files.some((f) => f.endsWith(`config${sep}env.ts`))).toBe(true);
    const repo = join(WEB, '../..');
    const readers: string[] = [];
    const inHref: string[] = [];
    for (const file of files) {
      const code = stripComments(readFileSync(file, 'utf8'));
      if (
        !/\bAPP_URL\b|NEXT_PUBLIC_APP_URL|\bAPP_DOMAIN\b|NEXT_PUBLIC_APP_DOMAIN/.test(
          code.replace(/PRACTICE_APP_URL/g, '')
        )
      )
        continue;
      const at = relative(repo, file).split(sep).join('/');
      readers.push(at);
      if (
        /href\s*[:=]\s*\{?\s*`?(?:https:\/\/\$\{)?(?:process\.env\.NEXT_PUBLIC_APP_(?:URL|DOMAIN)|APP_URL|APP_DOMAIN)\b/.test(
          code
        )
      )
        inHref.push(at);
    }
    expect(readers.filter((r) => !READERS.has(r))).toEqual([]);
    expect(inHref).toEqual([]);
    // non-vacuity: the scan sees the real readers
    expect(readers).toContain('apps/web/src/lib/share/utm.ts');
    expect(readers).toContain('packages/email/src/config.ts');
  });

  /*
   * The Practice host is written by hand in exactly two places: `config/practiceApp.ts` and the
   * email package's `BRAND.practiceUrl` (pinned equal above). The CSP's `form-action` names the
   * host as an origin, not a link. Any other literal is a Practice link that bypasses the one
   * address (P13 review: a literal with `?ref=` in a new component passed every other guard).
   */
  it('should write the Practice host by hand only in its two homes and the CSP', () => {
    const HOMES = new Set([
      'apps/web/src/config/practiceApp.ts',
      'packages/email/src/config.ts',
      'apps/web/middleware.ts',
    ]);
    const repo = join(WEB, '../..');
    const files = [...walk(SRC), join(WEB, 'middleware.ts'), ...walk(EMAIL_SRC)];
    const hits = files
      .filter((f) => /app\.diboas\.com/.test(stripComments(readFileSync(f, 'utf8'))))
      .map((f) => relative(repo, f).split(sep).join('/'));
    expect(hits.filter((h) => !HOMES.has(h))).toEqual([]);
    expect(hits).toContain('apps/web/src/config/practiceApp.ts');
    const csp = stripComments(readFileSync(join(WEB, 'middleware.ts'), 'utf8'))
      .split('\n')
      .filter((l) => /app\.diboas\.com/.test(l));
    expect(csp.every((l) => /form-action/.test(l))).toBe(true);
  });
});
