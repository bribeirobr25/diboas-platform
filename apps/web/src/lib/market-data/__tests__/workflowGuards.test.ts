/**
 * The weekly-refresh safety rails live in workflow YAML, which no other test
 * reads — so a later edit could silently undo any of them. Each assertion names
 * the defect it prevents (PENDING_ALL 5.464 as superseded by C1a/5.632, 5.465,
 * 5.467, 5.468).
 *
 * Text assertions, deliberately: the web app has no YAML parser dependency and
 * adding one would touch the shared lockfile for a test.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import {
  ETF_SHARES_ARCHIVE,
  ETF_SNAPSHOT_ATTEMPTS,
} from '../../../../scripts/market-refresh/lib/etf-flows.mjs';
import { describe, expect, it } from 'vitest';
import { WEEKLY_BLOCKING_VITEST_ARGS } from '../../../../scripts/market-refresh/simulate-next-week.mjs';

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

describe('weekly refresh — an open refresh PR is carried, never overwritten (5.464 → C1a, CARRY-PR-1)', () => {
  // C1a (5.632, 2026-10-28) replaced the 5.464 rule "refuse to run while a
  // refresh PR is open" with design P: carry that PR's data onto main. The
  // harm 5.464 named (a rebuild from main destroying an unmerged week) is what
  // these assertions keep closed. The carry logic itself is tested end to end
  // against a git fixture in lib/market/__tests__/carryOpenPr.test.ts.
  const job = weekly.slice(weekly.indexOf('\n  refresh:\n'));
  const at = (name: string) => {
    const i = job.indexOf(`- name: ${name}`);
    expect(i, `step "${name}" not found in the refresh job`).toBeGreaterThan(-1);
    return i;
  };

  it('should no longer refuse to run while a refresh PR is open', () => {
    expect(weekly).not.toContain('Refuse to overwrite an open refresh PR (5.464)');
    expect(weekly).not.toContain('No open refresh PR — safe to run');
  });

  it('should check out main with full history, then decide before anything is collected', () => {
    const checkout = job.slice(
      job.indexOf('- uses: actions/checkout@'),
      at('Carry an open refresh PR, or refuse (5.632)')
    );
    expect(checkout).toMatch(/fetch-depth: 0/);
    expect(at('Carry an open refresh PR, or refuse (5.632)')).toBeLessThan(
      at('ETF-01 weekly snapshot (optional leg)')
    );
    const carry = stepText(weekly, 'Carry an open refresh PR, or refuse (5.632)');
    expect(carry).toContain('id: carry');
    expect(carry).toContain('--head editorial/market-refresh-auto');
    expect(carry).toContain('--state open');
    expect(carry).toContain('--json number,url,title,headRefOid');
    expect(carry).toMatch(/set -euo pipefail/); // a failed lookup must not read as "none open"
    expect(carry).toContain('carry-open-pr.mjs prepare >> "$GITHUB_OUTPUT"');
  });

  it('should act on a refusal only after the ETF leg, so that week is kept, and before any core write', () => {
    const stop = at('Stop on a carry refusal (5.632)');
    expect(stop).toBeGreaterThan(at('ETF-01 weekly snapshot (optional leg)'));
    expect(stop).toBeLessThan(at('Refresh pipeline (fetch → gate → compute → archive)'));
    const step = stepText(weekly, 'Stop on a carry refusal (5.632)');
    expect(step).toContain("if: ${{ steps.carry.outputs.decision == 'refuse' }}");
    expect(step).toMatch(/exit 1/);
    expect(step).toContain('kept as the run artifact');
  });

  it('should re-check the branch immediately before publishing', () => {
    const steps = [...job.matchAll(/\n {6}- (?:name|uses): ([^\n]+)/g)].map((m) => m[1]);
    const publish = steps.indexOf('Open refresh PR');
    expect(steps[publish - 1]).toBe('Re-check the refresh PR before publishing (5.632)');
    const verify = stepText(weekly, 'Re-check the refresh PR before publishing (5.632)');
    expect(verify).toMatch(/set -euo pipefail/);
    expect(verify).toContain('carry-open-pr.mjs verify');
    for (const v of [
      'steps.carry.outputs.decision',
      'steps.carry.outputs.start_head',
      'steps.carry.outputs.pr_number',
    ]) {
      expect(verify).toContain(v);
    }
  });

  it('should state the carried weeks in the PR body', () => {
    const body = stepText(weekly, 'Compose PR body');
    expect(body).toContain('CARRY_DECISION: ${{ steps.carry.outputs.decision }}');
    expect(body).toContain('cat "$RUNNER_TEMP/carry-note.md"');
  });
});

describe('weekly refresh — the ETF leg cannot hold the job, and a missing key is said (P2, P4)', () => {
  it('should bound the ETF step and keep it fail-open', () => {
    const etf = stepText(weekly, 'ETF-01 weekly snapshot (optional leg)');
    expect(etf).toMatch(/timeout-minutes: 8\n/);
    expect(etf).toMatch(/continue-on-error: true\n/);
  });

  it('should report a step that did not finish, and keep what it wrote', () => {
    expect(stepText(weekly, 'Report an ETF-01 step that did not finish (P2)')).toContain(
      "if: ${{ steps.etf.outcome == 'failure' }}"
    );
    expect(
      stepText(weekly, 'Keep the ETF ledger files when the run fails after the ETF leg')
    ).toContain("steps.etf.outcome == 'failure'");
    expect(stepText(weekly, 'Compose PR body')).toContain(
      'ETF_STEP_OUTCOME: ${{ steps.etf.outcome }}'
    );
  });

  it('should announce a missing Polygon key instead of skipping silently', () => {
    const p4 = stepText(weekly, 'Say so when the Polygon key is missing (P4)');
    expect(p4).toContain("if: ${{ env.HAS_POLYGON_API_KEY != 'true' }}");
    expect(p4).toContain('::warning::POLYGON_API_KEY is not set');
    expect(stepText(weekly, 'Compose PR body')).toContain('POLYGON_API_KEY is not set');
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
    // Repeated in the PR body, from the step's own outputs (passed as env).
    expect(weekly).toContain('ETF_STATUS: ${{ steps.etf.outputs.status }}');
    expect(weekly).toContain(`if [ "$ETF_STATUS" = 'failed' ]; then`);
  });

  // 2026-10-19: while ETF-01 is suspended a failed or refused collection must
  // not be reported as "next week's ETF-01 will be gapped" (it is unavailable
  // either way), and no message may assert that a missed week cannot be
  // back-filled: that is not established.
  it('should word the ETF failure by the suspension state, never claiming a week cannot be back-filled', () => {
    const etf = stepText(weekly, 'ETF-01 weekly snapshot (optional leg)');
    expect(etf).toContain('ETF01_SUSPENSION');
    expect(etf).toContain('suspended=$suspended');
    expect(etf).toMatch(/ETF-01 is suspended, so the score and the other signals are unaffected/);
    expect(weekly).toContain('ETF_NOTE: ${{ steps.etf.outputs.note }}');
    expect(weekly).not.toMatch(/cannot be back-?filled|non-backfillable/i);
  });

  it('should never let the suspension lookup abort the fail-open ETF step (bash -e)', () => {
    const etf = stepText(weekly, 'ETF-01 weekly snapshot (optional leg)');
    expect(etf).toMatch(/suspended=\$\(node [^\n]*\) \|\| suspended=unknown/);
    expect(etf).toMatch(/\*\) effect="The suspension state could not be read in this run\./);
  });

  // The workflow guard above scans only the YAML; the same unproven claim also
  // lived in the docs that explain the guard (review 2026-10-19).
  it('should keep every tracked doc free of the claim that a missed week is unrecoverable', () => {
    const root = join(__dirname, '../../../../../..');
    const files = [
      'CLAUDE.md',
      ...['docs/tech', 'docs/integrations'].flatMap((d) =>
        readdirSync(join(root, d), { recursive: true })
          .map(String)
          .filter((f) => f.endsWith('.md'))
          .map((f) => join(d, f))
      ),
      // 2026-10-21: workflow comments too. "cannot be fetched again" reached
      // the weekly workflow in a comment this guard could not see.
      ...readdirSync(join(root, '.github/workflows'))
        .filter((f) => /\.ya?ml$/.test(f))
        .map((f) => join('.github/workflows', f)),
    ];
    const hits = files.filter((f) =>
      /cannot be back-?filled|non-backfillable|can never be re-?fetched|cannot be (?:re-?)?fetched again/i.test(
        readFileSync(join(root, f), 'utf8')
      )
    );
    expect(hits).toEqual([]);
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

// 2026-10-18 compliance pass: `simulate-next-week.mjs` says it runs "the
// workflow's own blocking command, verbatim" — a copy nothing compared. If the
// workflow's test scope changes and the simulator's does not, the rehearsal
// passes a gate that Monday's run no longer has (or misses one it does).
describe('the simulator rehearses the weekly blocking test command verbatim', () => {
  it('should run exactly the vitest command of the blocking workflow step', () => {
    const step = stepText(weekly, 'Reconcile + jargon gate + market tests');
    const command = step
      .replace(/\\\n\s*/g, ' ')
      .split('\n')
      .map((l) => l.trim())
      .find((l) => l.startsWith('pnpm --filter web exec vitest run'));
    expect(command, 'blocking vitest command not found in the workflow step').toBeDefined();
    const normalise = (c: string) => c.replace(/'/g, '').replace(/\s+/g, ' ').trim();
    expect(normalise(command as string)).toBe(
      normalise(`pnpm ${WEEKLY_BLOCKING_VITEST_ARGS.join(' ')}`)
    );
  });
});

// 2026-10-18 compliance pass: the workflow's fail-open snapshot step runs
// `run.mjs --etf-snapshot` on its own. When the flag fell through into the full
// pipeline, a core failure AFTER the snapshot was saved made the step report
// "snapshot FAILED" in the PR body for a snapshot that existed.
describe('run.mjs --etf-snapshot is snapshot-only', () => {
  const run = readFileSync(join(ROOT, 'apps/web/scripts/market-refresh/run.mjs'), 'utf8');
  it('should return from the snapshot branch before the core fetch', () => {
    const branch = run.indexOf("process.argv.includes('--etf-snapshot')");
    const fetchCall = run.indexOf('await fetchMarketSources()');
    expect(branch, 'snapshot branch not found').toBeGreaterThan(-1);
    expect(fetchCall, 'core fetch not found').toBeGreaterThan(-1);
    expect(branch).toBeLessThan(fetchCall);
    const body = run.slice(branch, run.indexOf('}', branch));
    expect(body).toMatch(/await maybeSnapshotEtfShares\(\);\s*return;/);
  });

  it('should run the snapshot step without the core flags', () => {
    expect(stepText(weekly, 'ETF-01 weekly snapshot')).not.toContain('--append-btc');
  });
});

// 2026-10-20: a failed append can leave part of a row in a ledger, and the ETF
// leg is fail-open, so the run can still reach the PR. The fragment must be
// reported in the PR, never committed silently and never repaired.
describe('weekly refresh — the PR reports a ledger that was not only appended to', () => {
  const STEP = 'Ledger append check (reported)';

  it('should run the ledger check after the last writing step and before the PR is opened', () => {
    const at = weekly.indexOf(`- name: ${STEP}`);
    expect(at).toBeGreaterThan(weekly.indexOf('- name: Generate editorial copy from templates'));
    expect(at).toBeGreaterThan(weekly.indexOf('- name: Tools monthlies'));
    expect(at).toBeLessThan(weekly.indexOf('- name: Compose PR body'));
    expect(at).toBeLessThan(weekly.indexOf('- name: Open refresh PR'));
  });

  it('should report, never block: a crashed check still opens the PR, flagged', () => {
    const step = stepText(weekly, STEP);
    expect(step).toContain('id: ledgers');
    expect(step).toContain('continue-on-error: true');
    expect(step).toContain('check-ledgers.mjs');
    // The status reaches the outputs only after the check finished.
    expect(step).toMatch(/--status "\$RUNNER_TEMP\/ledger-status"/);
    expect(step).toContain('echo "status=$(cat "$RUNNER_TEMP/ledger-status")" >> "$GITHUB_OUTPUT"');
  });

  it('should put anything but ok in the PR title, ahead of the memo status', () => {
    const title = weekly.slice(weekly.indexOf('title: >-'), weekly.indexOf('body-path:'));
    expect(title).toContain(
      "steps.ledgers.outputs.status != 'ok'\n            && 'data(market): weekly refresh — LEDGER CHECK FAILED, do not merge as is'"
    );
    expect(title.indexOf('steps.ledgers')).toBeLessThan(title.indexOf('steps.memo'));
  });

  it('should explain the problem in the PR body, or say the ledgers are unverified', () => {
    const body = stepText(weekly, 'Compose PR body');
    expect(body).toContain('LEDGER_STATUS: ${{ steps.ledgers.outputs.status }}');
    expect(body).toContain(`if [ "$LEDGER_STATUS" = 'ok' ]; then`);
    expect(body).toContain('cat "$RUNNER_TEMP/ledger-note.md"');
    expect(body).toContain('the ledgers are unverified');
  });
});

// 2026-10-21 (12-principle review gate of the market lane).
describe('weekly refresh — supply chain and a recorded ETF week that a later failure would lose', () => {
  it('should pin every action to a full commit SHA, never a movable tag', () => {
    const uses = [...weekly.matchAll(/^\s*(?:- )?uses: ([^\s#]+)/gm)].map((m) => m[1]);
    expect(uses.length).toBeGreaterThan(0);
    expect(uses.filter((u) => !/@[0-9a-f]{40}$/.test(u))).toEqual([]);
  });

  it('should keep the ETF files as a run artifact whenever the run fails after the ETF leg wrote them', () => {
    const step = stepText(weekly, 'Keep the ETF ledger files when the run fails after the ETF leg');
    expect(weekly.indexOf('- name: Keep the ETF ledger files')).toBeGreaterThan(
      weekly.indexOf('- name: Open refresh PR')
    );
    expect(step).toContain('failure()');
    for (const outcome of ['ok', 'recorded', 'refused', 'error']) {
      expect(step).toContain(`steps.etf.outputs.outcome == '${outcome}'`);
    }
    // The paths come from the pipeline's own constants (this test never reads them).
    for (const ledger of [ETF_SHARES_ARCHIVE, ETF_SNAPSHOT_ATTEMPTS]) {
      expect(step).toContain(relative(ROOT, ledger));
    }
    expect(step).toMatch(/retention-days: \d+/);
  });

  it('should not claim the ETF record "stands" before the PR exists', () => {
    expect(weekly).not.toContain('the ledger record stands');
  });
});
