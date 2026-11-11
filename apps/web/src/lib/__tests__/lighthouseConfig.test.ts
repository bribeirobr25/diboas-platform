/**
 * Lighthouse CI measures what its config says (2026-11-11, @lhci/cli 0.16 / Lighthouse 13).
 *
 * Every assertion in `.lighthouserc.json` is a WARNING, so a broken measurement never fails CI.
 * Two breaks were found when moving to Lighthouse 13:
 *   - the root override pinned axe-core to 4.11.1 for everything; Lighthouse 13's accessibility
 *     gatherer needs 4.14 ("unknown rule"), so the accessibility and SEO categories came back
 *     with NO score. Lighthouse now gets its own axe-core (`lighthouse>axe-core` override);
 *   - Lighthouse 13 renamed `uses-http2` to `modern-http-insight`, so the skip silently did
 *     nothing.
 * This fails if Lighthouse's axe-core is not the one it declares, or if the config names an audit
 * the installed Lighthouse does not have.
 */
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const WEB = join(__dirname, '../../..');
const lhci = dirname(require.resolve('@lhci/cli/package.json'));
const lighthouse = dirname(
  createRequire(join(lhci, 'package.json')).resolve('lighthouse/package.json')
);
const lhPkg = JSON.parse(readFileSync(join(lighthouse, 'package.json'), 'utf8')) as {
  version: string;
  dependencies: Record<string, string>;
};
const config = JSON.parse(readFileSync(join(WEB, '.lighthouserc.json'), 'utf8')) as {
  ci: {
    collect: { settings?: { skipAudits?: string[] } };
    assert: { assertions: Record<string, unknown> };
  };
};

/** Does the installed Lighthouse define this audit id (`core/audits/**\/<id>.js`)? */
function auditExists(id: string): boolean {
  const dirs = [
    '',
    'insights',
    'metrics',
    'seo',
    'accessibility',
    'byte-efficiency',
    'dobetterweb',
    'manual',
  ];
  return dirs.some((d) => existsSync(join(lighthouse, 'core', 'audits', d, `${id}.js`)));
}

describe('Lighthouse CI configuration', () => {
  it('should give Lighthouse the axe-core version it declares when an override pins axe-core elsewhere', () => {
    const resolved = (
      createRequire(join(lighthouse, 'package.json'))('axe-core/package.json') as {
        version: string;
      }
    ).version;
    expect(resolved).toBe(lhPkg.dependencies['axe-core'].replace(/^[\^~]/, ''));
  });

  it('should name only audits the installed Lighthouse has when skipping or asserting', () => {
    const skipped = config.ci.collect.settings?.skipAudits ?? [];
    const asserted = Object.keys(config.ci.assert.assertions).filter(
      (k) => !k.startsWith('categories:')
    );
    expect([...skipped, ...asserted].filter((id) => !auditExists(id))).toEqual([]);
  });

  it('should tell an existing audit from a renamed one (the reader is not blind)', () => {
    expect(auditExists('largest-contentful-paint')).toBe(true);
    expect(auditExists('modern-http-insight')).toBe(true);
    expect(auditExists('uses-http2')).toBe(false);
  });
});
