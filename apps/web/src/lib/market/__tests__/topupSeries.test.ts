/**
 * TOPUP-1 · the Tuesday top-up (plan MP-3b; decision B-2, answer 13).
 * Requirement: before the refresh reads the store, the series published on Monday and any
 * series Saturday blocked are collected again; the refresh carries on whatever the top-up
 * concludes, and its PR says what happened. Fixtures only; no network.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { SERIES } from '../../../../scripts/market-data/catalogue.mjs';
import {
  behindSeries,
  blockedInLatestReport,
  lastFriday,
  topupSeries,
} from '../../../../scripts/market-data/topup-series.mjs';

const roots: string[] = [];
afterEach(() => {
  for (const r of roots.splice(0)) fs.rmSync(r, { recursive: true, force: true });
});

function store(reports: Record<string, { id: string; blocked: string[] }[]>) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'topup-'));
  roots.push(root);
  const checks = path.join(root, 'checks');
  fs.mkdirSync(path.join(checks, 'reviews'), { recursive: true });
  for (const [name, series] of Object.entries(reports))
    fs.writeFileSync(path.join(checks, name), JSON.stringify({ run_at: name, series }));
  return root;
}

const LATE = ['dollar_broad', 'us10y', 'nasdaq_composite', 'fx_eur', 'fx_brl'];
const WREPO = (f: string) =>
  fs.readFileSync(path.resolve(__dirname, '../../../../../../.github/workflows', f), 'utf8');

describe('TOPUP-1: which series the top-up collects', () => {
  it('should mark the series published on Monday, and only series that exist', () => {
    const marked = (SERIES as { id: string; topUp?: boolean }[])
      .filter((s) => s.topUp)
      .map((s) => s.id);
    for (const id of LATE) expect(marked, id).toContain(id);
    // Bitcoin trades every day: Saturday's collection ends on Friday, past the 3-day limit by Tuesday
    expect(marked).toContain('btc');
    // gold's 5-day limit: Saturday's Friday close is past it by Wednesday's retry
    expect(marked).toContain('gold_spot');
    expect(marked).not.toContain('us_m2'); // monthly, revised: never a weekly top-up
  });

  it('should add the series the LATEST check report blocked, once, in catalogue order', () => {
    const root = store({
      '20261031T150000Z.json': [{ id: 'ibovespa', blocked: ['old'] }],
      '20261107T154734Z.json': [
        { id: 'qqq', blocked: ['check stooq failed: timeout'] },
        { id: 'us10y', blocked: ['check x failed'] },
        { id: 'dax', blocked: [] },
      ],
    });
    expect(blockedInLatestReport(root)).toEqual(['qqq', 'us10y']);
    const ids = topupSeries(root).map(String);
    expect(ids).toContain('qqq');
    expect(ids).not.toContain('ibovespa'); // blocked only in an older report
    expect(ids.filter((i) => i === 'us10y')).toHaveLength(1);
    const order = (SERIES as { id: string }[]).map((s) => s.id);
    expect([...ids].sort((a, b) => order.indexOf(a) - order.indexOf(b))).toEqual(ids);
    expect(ids.join(',')).toMatch(/^[a-z0-9_]+(,[a-z0-9_]+)*$/); // the collector's --series format
  });

  it('should ignore a blocked series the catalogue no longer has', () => {
    const root = store({ '20261107T154734Z.json': [{ id: 'retired_series', blocked: ['x'] }] });
    expect(topupSeries(root)).not.toContain('retired_series');
  });

  it('should still top up the late series when the store has no check report', () => {
    expect(topupSeries(store({}))).toEqual(
      (SERIES as { id: string; topUp?: boolean }[]).filter((s) => s.topUp).map((s) => s.id)
    );
  });
});

describe('TOPUP-1: a partial report, and series a week behind (answer 13)', () => {
  it('should count every series a failed run never reached as blocked', () => {
    const root = store({});
    fs.writeFileSync(
      path.join(root, 'checks', '20261107T154734Z.json'),
      JSON.stringify({ series: [{ id: 'qqq', blocked: [] }], failed: 'network down' })
    );
    const ids = blockedInLatestReport(root);
    expect(ids).not.toContain('qqq');
    expect(ids).toContain('gold_spot');
    expect(ids.length).toBe((SERIES as unknown[]).length - 1);
  });

  it('should find the Friday before a day', () => {
    expect(lastFriday(new Date('2026-11-17T06:17:00Z'))).toBe('2026-11-13'); // Tuesday
    expect(lastFriday(new Date('2026-11-13T10:00:00Z'))).toBe('2026-11-06'); // a Friday: the one before
    expect(lastFriday(new Date('2026-11-14T10:00:00Z'))).toBe('2026-11-13'); // Saturday
  });

  it('should name a weekday top-up series only when it is a full week behind', () => {
    const root = store({});
    fs.mkdirSync(path.join(root, 'daily'));
    const row = (d: string) => `date,open,high,low,close,source\n${d},,,,1,t\n`;
    fs.writeFileSync(path.join(root, 'daily', 'dollar_broad.csv'), row('2026-11-06')); // a week behind
    fs.writeFileSync(path.join(root, 'daily', 'us10y.csv'), row('2026-11-12')); // one day short
    fs.writeFileSync(path.join(root, 'daily', 'btc.csv'), row('2026-11-01')); // every-day: not judged here
    const behind = behindSeries(root, new Date('2026-11-17T06:17:00Z'));
    expect(behind).toContain('dollar_broad');
    expect(behind).not.toContain('us10y');
    expect(behind).not.toContain('btc');
    expect(behind).toContain('fx_eur'); // no file at all
  });
});

describe('TOPUP-1 wiring', () => {
  const weekly = WREPO('market-refresh-weekly.yml');
  const collect = WREPO('market-data-collect.yml');

  it('should call the collection workflow before the refresh, only on the schedule from main', () => {
    const job = weekly.slice(weekly.indexOf('\n  topup:'), weekly.indexOf('\n  refresh:'));
    expect(job).toMatch(/uses: \.\/\.github\/workflows\/market-data-collect\.yml/);
    expect(job).toMatch(/topup: true/);
    // only on the schedule (decision A-5): never a rehearsal, never a manual dispatch
    expect(job).toMatch(/github\.event_name == 'schedule'/);
    expect(job).toMatch(/github\.ref == 'refs\/heads\/main'/);
    expect(job).toMatch(/vars\.MARKET_TOPUP != 'off'/);
  });

  it('should refresh whatever the top-up concludes (fail-open) and say so in the PR', () => {
    expect(weekly).toMatch(/needs: \[decide, topup\]/);
    expect(weekly).toMatch(
      /if: \$\{\{ !cancelled\(\) && needs\.decide\.outputs\.run == 'true' \}\}/
    );
    expect(weekly).toMatch(/TOPUP_RESULT: \$\{\{ needs\.topup\.result \}\}/);
    expect(weekly).toMatch(/## Market data store top-up/);
  });

  it('should keep one collection writing the store at a time (job-level concurrency)', () => {
    expect(collect).toMatch(/workflow_call:\n\s+inputs:\n\s+topup:/);
    expect(collect).toMatch(
      /collect:\n(?:.*\n){0,6}\s+concurrency:\n\s+group: market-data-collect\n\s+cancel-in-progress: false/
    );
    expect(collect).toMatch(
      /node apps\/web\/scripts\/market-data\/topup-series\.mjs --store analytics\/market/
    );
    expect(collect).toMatch(
      /SERIES: \$\{\{ steps\.plan\.outputs\.series \|\| steps\.target\.outputs\.series \}\}/
    );
  });

  it('should never put the store token in a URL or on disk', () => {
    expect(collect).not.toMatch(/x-access-token:\$\{TOKEN\}@/);
    // every git call in both git steps is authenticated through the one helper
    expect(collect.match(/source apps\/web\/scripts\/market-data\/git-auth\.sh/g)).toHaveLength(2);
    expect(
      fs.readFileSync(path.join(REPO, 'apps/web/scripts/market-data/git-auth.sh'), 'utf8')
    ).toMatch(/export GIT_CONFIG_KEY_0=http\.extraHeader/);
    expect(collect).toMatch(
      /- name: Delete the store clone\n\s+if: always\(\)\n\s+run: rm -rf analytics/
    );
  });
});

/** The `run:` script of a named step, dedented (the #827 pattern: steps run as on Actions). */
function stepScript(wf: string, name: string): string {
  const start = wf.indexOf(`- name: ${name}`);
  expect(start, `step "${name}" not found`).toBeGreaterThan(-1);
  const rest = wf.slice(start);
  const next = rest.slice(1).search(/\n {6}- (name|uses):/);
  const lines = (next === -1 ? rest : rest.slice(0, next + 1)).split('\n');
  const at = lines.findIndex((l) => /^\s*run: \|/.test(l));
  const indent = lines[at].search(/\S/) + 2;
  return lines
    .slice(at + 1)
    .filter((l) => l.trim() === '' || l.search(/\S/) >= indent)
    .map((l) => l.slice(indent))
    .join('\n');
}

const REPO = path.resolve(__dirname, '../../../../../..');

function runStep(script: string, env: Record<string, string>, reports = {}) {
  const root = store(reports); // a store at <root>/checks; the step reads analytics/market
  const ws = fs.mkdtempSync(path.join(os.tmpdir(), 'topup-ws-'));
  roots.push(ws);
  fs.mkdirSync(path.join(ws, 'apps/web'), { recursive: true });
  fs.symlinkSync(path.join(REPO, 'apps/web/scripts'), path.join(ws, 'apps/web/scripts'));
  fs.mkdirSync(path.join(ws, 'analytics'));
  fs.symlinkSync(root, path.join(ws, 'analytics/market'));
  const out = path.join(ws, 'out');
  fs.writeFileSync(out, '');
  const r = spawnSync('bash', ['-e', '-o', 'pipefail', '-c', script], {
    cwd: ws,
    encoding: 'utf8',
    env: {
      NODE_ENV: 'test',
      PATH: process.env.PATH,
      GITHUB_OUTPUT: out,
      ...env,
    } as NodeJS.ProcessEnv,
  });
  const outputs = Object.fromEntries(
    fs
      .readFileSync(out, 'utf8')
      .split('\n')
      .filter(Boolean)
      .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)])
  );
  return { status: r.status, outputs, stdout: r.stdout };
}

describe('TOPUP-1: the top-up reports to the refresh, as run on Actions', () => {
  const collect = WREPO('market-data-collect.yml');
  const report = stepScript(collect, 'Report the top-up to the weekly refresh');
  const ok = { OUTCOME: 'success', COMMIT: 'success', SERIES: 'dollar_broad,us10y' };

  it('should report complete with the series it collected', () => {
    const r = runStep(report, { ...ok, CODE: '0' });
    expect(r.status).toBe(0);
    expect(r.outputs).toMatchObject({
      status: 'complete',
      series: 'dollar_broad,us10y',
      blocked: '',
    });
  }, 30_000);

  it('should name the series still blocked after the top-up', () => {
    const r = runStep(
      report,
      { ...ok, CODE: '1' },
      { '20261110T150000Z.json': [{ id: 'us10y', blocked: ['check failed'] }] }
    );
    expect(r.outputs).toMatchObject({ status: 'blocked', blocked: 'us10y' });
  }, 30_000);

  it('should report failed when the collection or its push did not finish', () => {
    expect(runStep(report, { ...ok, CODE: '3' }).outputs.status).toBe('failed');
    expect(runStep(report, { ...ok, CODE: '0', COMMIT: 'failure' }).outputs.status).toBe('failed');
    expect(runStep(report, { ...ok, CODE: '', OUTCOME: 'cancelled' }).outputs.status).toBe(
      'failed'
    );
  }, 30_000);

  it('should never write a second output line from an injected value', () => {
    const r = runStep(report, { ...ok, CODE: '0', SERIES: 'us10y\nstatus=complete' });
    expect(r.outputs.series).toBe('');
    expect(Object.keys(r.outputs).sort()).toEqual(['behind', 'blocked', 'series', 'status']);
  }, 30_000);

  it('should keep a top-up failure from failing the weekly run (fail-open)', () => {
    expect(collect).toMatch(/continue-on-error: \$\{\{ inputs\.topup == true \}\}/);
  });
});

describe('TOPUP-1: the refresh PR names what the top-up did', () => {
  const weekly = WREPO('market-refresh-weekly.yml');
  const compose = stepScript(weekly, 'Compose PR body');
  const start = compose.indexOf('if [ -n "${TOPUP_RESULT:-}" ]; then');
  const block = compose.slice(start, compose.indexOf('\nfi\n', start) + 4);
  const body = (env: Record<string, string>) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'topup-body-'));
    roots.push(dir);
    const file = path.join(dir, 'body.md');
    fs.writeFileSync(file, '');
    spawnSync('bash', ['-c', block], {
      encoding: 'utf8',
      env: { NODE_ENV: 'test', PATH: process.env.PATH, BODY: file, ...env } as NodeJS.ProcessEnv,
    });
    return fs.readFileSync(file, 'utf8');
  };

  it('should say each outcome in plain words, naming the series', () => {
    expect(start).toBeGreaterThan(-1);
    const ok = { TOPUP_RESULT: 'success' };
    expect(body({ ...ok, TOPUP_STATUS: 'complete', TOPUP_SERIES: 'dollar_broad,us10y' })).toMatch(
      /## Market data store top-up\n\nThe store top-up ran for dollar_broad, us10y before .*; no series was blocked/
    );
    const blocked = body({ ...ok, TOPUP_STATUS: 'blocked', TOPUP_BLOCKED: 'fx_brl' });
    expect(blocked).toMatch(/still blocked .*: fx_brl\./);
    expect(blocked).toMatch(/Money Tools series published from the store/); // which surface
    expect(body({ ...ok, TOPUP_STATUS: 'blocked', TOPUP_BLOCKED: '' })).toMatch(
      /without naming it/
    );
    expect(body({ ...ok, TOPUP_STATUS: 'failed', TOPUP_SERIES: 'us10y' })).toMatch(
      /The store top-up failed; it was to collect: us10y\./
    );
    expect(body({ TOPUP_RESULT: 'cancelled', TOPUP_STATUS: '' })).toMatch(
      /ended without a report \(cancelled\)/
    );
    expect(body({ TOPUP_RESULT: 'skipped' })).toMatch(/The store top-up was not run/);
    // answer 13: a series still a week behind is named, whatever the status
    expect(
      body({
        ...ok,
        TOPUP_STATUS: 'complete',
        TOPUP_SERIES: 'dollar_broad',
        TOPUP_BEHIND: 'dollar_broad,fx_eur',
      })
    ).toMatch(/Still a week behind after the top-up .*: dollar_broad, fx_eur\./);
  }, 30_000);

  it('should print nothing when no top-up result was supplied (never a guess)', () => {
    expect(body({})).toBe('');
  }, 30_000);

  it("should never reuse the ETF lines' wording", () => {
    expect(block).not.toMatch(/did not (finish|run)/);
  });
});
