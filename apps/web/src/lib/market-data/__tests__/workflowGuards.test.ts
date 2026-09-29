/**
 * The weekly-refresh safety rails live in workflow YAML, which no other test
 * reads — so a later edit could silently undo any of them. Each assertion names
 * the defect it prevents (PENDING_ALL 5.464, 5.465, 5.467, 5.468).
 *
 * Text assertions, deliberately: the web app has no YAML parser dependency and
 * adding one would touch the shared lockfile for a test.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = join(__dirname, '../../../../../..');
const weekly = readFileSync(join(ROOT, '.github/workflows/market-refresh-weekly.yml'), 'utf8');
const ci = readFileSync(join(ROOT, '.github/workflows/ci.yml'), 'utf8');

/** The `run:` block of a named step (up to the next `- name:` / `- uses:` at step depth). */
function stepText(yaml: string, name: string): string {
  const start = yaml.indexOf(`- name: ${name}`);
  expect(start, `step "${name}" not found`).toBeGreaterThan(-1);
  const rest = yaml.slice(start + 1);
  const next = rest.search(/\n {6}- (name|uses):/);
  return next === -1 ? rest : rest.slice(0, next);
}

describe('weekly refresh — never overwrite an unmerged week (5.464)', () => {
  it('should run the open-PR guard as the FIRST step, before checkout or any fetch', () => {
    const steps = weekly.slice(weekly.indexOf('    steps:'));
    const firstStep = steps.match(/\n {6}- (name|uses): ([^\n]+)/);
    expect(firstStep?.[2]).toBe('Refuse to overwrite an open refresh PR (5.464)');
  });

  it('should look only at OPEN refresh PRs and fail the run when one exists', () => {
    const g = stepText(weekly, 'Refuse to overwrite an open refresh PR (5.464)');
    expect(g).toContain('--head editorial/market-refresh-auto');
    expect(g).toContain('--state open');
    expect(g).toMatch(/set -euo pipefail/); // a failed lookup must not read as "none open"
    expect(g).toMatch(/exit 1/);
  });
});

describe('weekly refresh — no silent failure, no racing runs (5.465)', () => {
  it('should queue concurrent runs in one group and never cancel one mid-publish', () => {
    expect(weekly).toMatch(
      /\nconcurrency:\n {2}group: market-refresh\n {2}cancel-in-progress: false\n/
    );
  });

  it('should keep the ETF leg fail-open for the score but report its failure', () => {
    const etf = stepText(weekly, 'ETF-01 weekly snapshot (optional leg)');
    expect(etf).not.toContain('|| true');
    expect(etf).toContain('status=failed');
    expect(etf).toContain('::warning::');
    expect(weekly).toContain("steps.etf.outputs.status }}' = 'failed'"); // repeated in the PR body
  });
});

describe('weekly refresh — the PR lists every stale memo figure (5.467)', () => {
  it('should extract orphans with the tested module, not a colon-limited grep', () => {
    const memo = stepText(weekly, 'Memo figure reconciliation (HUMAN-owned — reported)');
    expect(memo).toContain('scripts/market-refresh/lib/memo-orphans.mjs');
    expect(memo).not.toMatch(/grep -oE 'figures with no engine value/);
  });
});

describe('the 14-day staleness backstop is scoped to market (5.468)', () => {
  it('should enforce in the weekly refresh', () => {
    expect(weekly).toMatch(/MARKET_STALENESS_ENFORCE: '1'/);
  });

  it('should run the scoped backstop in CI with enough history to diff', () => {
    expect(ci).toMatch(/fetch-depth: 2/);
    const step = stepText(ci, '/market staleness backstop (blocks market changes only)');
    expect(step).toContain('git diff --name-only HEAD^1 HEAD');
    expect(step).toContain('scripts/market-refresh/lib/staleness.mjs');
    expect(step).toMatch(/enforce=1\n {10}fi/); // fail-closed when the diff cannot be computed
  });

  it('should classify market paths as market and other lanes as not', () => {
    const m = ci.match(/MARKET_PATHS: '([^']+)'/);
    expect(m, 'MARKET_PATHS not found').not.toBeNull();
    const re = new RegExp(m![1]);
    for (const p of [
      'apps/web/data/market/bitcoin/regime.json',
      'apps/web/scripts/market-refresh/run.mjs',
      'apps/web/src/lib/analytics-sdk/freshness.ts',
      'apps/web/src/lib/market/viewRegistry.ts',
      'apps/web/src/app/[locale]/(landing)/market/page.tsx',
      'apps/web/src/components/Analytics/RegimeScore/RegimeScore.tsx',
      '.github/workflows/market-refresh-weekly.yml',
    ])
      expect(re.test(p), p).toBe(true);
    for (const p of [
      'apps/sandbox/src/lib/market/factory.ts', // the sandbox's own market module
      'apps/web/src/app/[locale]/(landing)/tools/page.tsx',
      'packages/defi/src/fixtures.ts',
      'docs/tech/engineering-gates.md',
      'apps/web/src/components/Sections/HeroSection/HeroSection.tsx',
    ])
      expect(re.test(p), p).toBe(false);
  });
});
