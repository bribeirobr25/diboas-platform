/**
 * Removed routes keep a permanent redirect (register `5.708`).
 *
 * The investor vertical was removed on 2026-10-30 (founder): `/investors`, the
 * `/investor-room` and every document under it. Links already sent to investors, and
 * bookmarks, must land on the business page instead of a 404, sub-paths included (`5.723`). This reads the
 * REAL `next.config.js` (the compiled matcher is checked on a production build in the PR),
 * so a rule deleted or pointed elsewhere fails here.
 */

import { existsSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

interface Redirect {
  source: string;
  destination: string;
  permanent: boolean;
}

const require = createRequire(import.meta.url);
const nextConfig = require(join(__dirname, '../../../next.config.js')) as {
  redirects: () => Promise<Redirect[]>;
};

describe('removed investor routes redirect permanently (5.708)', () => {
  it.each([
    ['/:locale(en|pt-BR|es|de)/investors/:path*', '/:locale/business'],
    ['/:locale(en|pt-BR|es|de)/investor-room/:path*', '/:locale/business'],
    ['/investors/:path*', '/business'],
    ['/investor-room/:path*', '/business'],
  ])(
    'should send %s to %s permanently when the route is requested',
    async (source, destination) => {
      const rules = await nextConfig.redirects();
      const rule = rules.find((r) => r.source === source);
      expect(rule, `no redirect for ${source}`).toBeDefined();
      expect(rule).toEqual({ source, destination, permanent: true });
    }
  );

  it('should keep no route under the removed paths when the app is built', () => {
    const appDir = join(__dirname, '../../app/[locale]');
    expect(existsSync(join(appDir, '(landing)/investors'))).toBe(false);
    expect(existsSync(join(appDir, '(investor-room)'))).toBe(false);
  });
});

/**
 * The interactive demo was retired on 2026-11-19 (plan P13, `5.112`). Its redirect lives in
 * `middleware.ts`, not here (Next's `redirects()` would copy the query into Practice), and is
 * tested in `src/__tests__/middleware.test.ts`. What this file pins: no page is left behind to
 * answer the address instead, and `next.config.js` holds no rule for it.
 */
describe('the retired demo and Dream Mode keep no page and no config redirect (P13)', () => {
  /** Every route group under `app/[locale]`, so a page moved into another group is still found. */
  const appDir = join(__dirname, '../../app/[locale]');
  const groups = ['', ...readdirSync(appDir).filter((d) => /^\(.*\)$/.test(d))];

  it.each(['demo', 'dream-mode'])('should keep no %s page under any route group', (route) => {
    expect(groups.length).toBeGreaterThan(1);
    for (const group of groups)
      expect(existsSync(join(appDir, group, route)), `${group}/${route}`).toBe(false);
  });

  it('should hold no next.config.js redirect for either', async () => {
    const rules = await nextConfig.redirects();
    expect(rules.filter((r) => /(^|\/)(demo|dream-mode)(\/|$|\()/i.test(r.source))).toEqual([]);
  });
});
